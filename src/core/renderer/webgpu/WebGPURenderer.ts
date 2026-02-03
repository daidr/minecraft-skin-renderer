/**
 * WebGPU Renderer implementation
 */

import { BufferUsage } from "../types";
import type {
  DrawParams,
  IBuffer,
  IPipeline,
  IRenderer,
  PipelineConfig,
  RendererOptions,
  TextureOptions,
  ITexture,
} from "../types";
import { WebGPUBuffer } from "./WebGPUBuffer";
import { WebGPUPipeline } from "./WebGPUPipeline";
import { WebGPUTextureImpl } from "./WebGPUTexture";

/**
 * Uniform buffer layout (must match WGSL struct):
 * - modelMatrix:      64 bytes  (offset 0)
 * - viewMatrix:       64 bytes  (offset 64)
 * - projectionMatrix: 64 bytes  (offset 128)
 * - boneMatrices:     1536 bytes (offset 192, 24 * 64)
 * - alphaTest:        4 bytes   (offset 1728)
 * - padding:          12 bytes  (offset 1732, align to 16)
 * Total: 1744 bytes
 */
const UNIFORM_BUFFER_SIZE = 1744;
const OFFSET_MODEL_MATRIX = 0;
const OFFSET_VIEW_MATRIX = 64;
const OFFSET_PROJECTION_MATRIX = 128;
const OFFSET_BONE_MATRICES = 192;
const OFFSET_ALPHA_TEST = 1728;

export class WebGPURenderer implements IRenderer {
  readonly backend = "webgpu" as const;
  readonly canvas: HTMLCanvasElement;
  readonly pixelRatio: number;
  readonly supportsRenderTargets = false; // WebGPU render targets not yet implemented

  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;
  private disposed = false;
  private _width: number;
  private _height: number;

  // Depth buffer
  private depthTexture: GPUTexture | null = null;
  private depthTextureView: GPUTextureView | null = null;

  // Frame state
  private commandEncoder: GPUCommandEncoder | null = null;
  private renderPassEncoder: GPURenderPassEncoder | null = null;
  private currentTextureView: GPUTextureView | null = null;

  // Uniform buffer management
  private uniformBuffer: GPUBuffer;
  private uniformBindGroupLayout: GPUBindGroupLayout;
  private uniformBindGroup: GPUBindGroup;
  private uniformData: ArrayBuffer;
  private uniformDataView: DataView;

  // State cache
  private lastPipelineId = -1;

  private constructor(
    options: RendererOptions,
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
  ) {
    this.canvas = options.canvas;
    this.pixelRatio = options.pixelRatio ?? globalThis.devicePixelRatio ?? 1;
    this.device = device;
    this.context = context;
    this.format = format;

    this._width = this.canvas.width;
    this._height = this.canvas.height;

    // Create uniform buffer
    this.uniformData = new ArrayBuffer(UNIFORM_BUFFER_SIZE);
    this.uniformDataView = new DataView(this.uniformData);

    this.uniformBuffer = device.createBuffer({
      size: UNIFORM_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create uniform bind group layout (group 0)
    this.uniformBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });

    // Create uniform bind group
    this.uniformBindGroup = device.createBindGroup({
      layout: this.uniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    });

    // Create depth texture
    this.createDepthTexture();
  }

  /**
   * Async factory method for WebGPU initialization
   */
  static async create(options: RendererOptions): Promise<WebGPURenderer> {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported");
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) {
      throw new Error("Failed to get WebGPU adapter");
    }

    const device = await adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {},
    });

    const context = options.canvas.getContext("webgpu") as GPUCanvasContext;
    if (!context) {
      throw new Error("Failed to get WebGPU context");
    }

    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device,
      format,
      alphaMode: "premultiplied",
    });

    return new WebGPURenderer(options, device, context, format);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /** Create or recreate depth texture */
  private createDepthTexture(): void {
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }

    this.depthTexture = this.device.createTexture({
      size: { width: this._width, height: this._height },
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.depthTextureView = this.depthTexture.createView();
  }

  /** Get the uniform bind group layout for pipeline creation */
  getUniformBindGroupLayout(): GPUBindGroupLayout {
    return this.uniformBindGroupLayout;
  }

  /** Get the canvas format for pipeline creation */
  getFormat(): GPUTextureFormat {
    return this.format;
  }

  /** Create a buffer */
  createBuffer(usage: BufferUsage, data: ArrayBufferView): IBuffer {
    return new WebGPUBuffer(this.device, usage, data);
  }

  /** Create a texture */
  async createTexture(source: TexImageSource, options?: TextureOptions): Promise<ITexture> {
    return WebGPUTextureImpl.create(this.device, source, options);
  }

  /** Create a pipeline */
  createPipeline(config: PipelineConfig): IPipeline {
    return new WebGPUPipeline(this.device, config, this.format, this.uniformBindGroupLayout);
  }

  /** Begin a new frame */
  beginFrame(): void {
    // Reset state cache
    this.lastPipelineId = -1;

    // Get current texture
    this.currentTextureView = this.context.getCurrentTexture().createView();

    // Create command encoder
    this.commandEncoder = this.device.createCommandEncoder();
  }

  /** Clear the framebuffer */
  clear(r: number, g: number, b: number, a: number): void {
    if (!this.commandEncoder || !this.currentTextureView || !this.depthTextureView) {
      return;
    }

    // Start render pass with clear color
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: this.currentTextureView,
          clearValue: { r, g, b, a },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTextureView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };

    this.renderPassEncoder = this.commandEncoder.beginRenderPass(renderPassDescriptor);
  }

  /** Draw with the given parameters */
  draw(params: DrawParams): void {
    if (!this.renderPassEncoder) return;

    const pipeline = params.pipeline as WebGPUPipeline;

    // Set pipeline if changed
    if (this.lastPipelineId !== pipeline.id) {
      this.renderPassEncoder.setPipeline(pipeline.getNativePipeline());
      this.lastPipelineId = pipeline.id;
    }

    // Update uniform buffer with bind group data
    const { uniforms } = params.bindGroup;

    // Write uniforms to buffer
    // Reset uniform data
    const float32View = new Float32Array(this.uniformData);

    // Model matrix (offset 0)
    if (uniforms.u_modelMatrix) {
      const mat = uniforms.u_modelMatrix as Float32Array;
      float32View.set(mat, OFFSET_MODEL_MATRIX / 4);
    }

    // View matrix (offset 64)
    if (uniforms.u_viewMatrix) {
      const mat = uniforms.u_viewMatrix as Float32Array;
      float32View.set(mat, OFFSET_VIEW_MATRIX / 4);
    }

    // Projection matrix (offset 128)
    if (uniforms.u_projectionMatrix) {
      const mat = uniforms.u_projectionMatrix as Float32Array;
      float32View.set(mat, OFFSET_PROJECTION_MATRIX / 4);
    }

    // Bone matrices (offset 192)
    // Handle both array notation and direct array
    const boneMatrices = uniforms["u_boneMatrices[0]"] || uniforms.u_boneMatrices;
    if (boneMatrices) {
      const mat = boneMatrices as Float32Array;
      float32View.set(mat, OFFSET_BONE_MATRICES / 4);
    }

    // Alpha test (offset 1728)
    if (uniforms.u_alphaTest !== undefined) {
      this.uniformDataView.setFloat32(OFFSET_ALPHA_TEST, uniforms.u_alphaTest as number, true);
    }

    // Upload uniform buffer
    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    // Set uniform bind group (group 0)
    this.renderPassEncoder.setBindGroup(0, this.uniformBindGroup);

    // Create and set texture bind group (group 1)
    const { textures } = params.bindGroup;
    const textureEntries = Object.entries(textures);
    if (textureEntries.length > 0) {
      const [, texture] = textureEntries[0];
      const tex = texture as WebGPUTextureImpl;

      const textureBindGroup = this.device.createBindGroup({
        layout: pipeline.getTextureBindGroupLayout(),
        entries: [
          {
            binding: 0,
            resource: tex.getSampler(),
          },
          {
            binding: 1,
            resource: tex.getTextureView(),
          },
        ],
      });

      this.renderPassEncoder.setBindGroup(1, textureBindGroup);
    }

    // Set vertex buffers
    for (let i = 0; i < params.vertexBuffers.length; i++) {
      const buffer = params.vertexBuffers[i] as WebGPUBuffer;
      this.renderPassEncoder.setVertexBuffer(i, buffer.getNativeBuffer());
    }

    // Draw
    if (params.indexBuffer && params.indexCount) {
      const indexBuffer = params.indexBuffer as WebGPUBuffer;
      this.renderPassEncoder.setIndexBuffer(indexBuffer.getNativeBuffer(), "uint16");
      this.renderPassEncoder.drawIndexed(params.indexCount);
    } else if (params.vertexCount) {
      this.renderPassEncoder.draw(params.vertexCount);
    }
  }

  /** End the current frame */
  endFrame(): void {
    if (this.renderPassEncoder) {
      this.renderPassEncoder.end();
      this.renderPassEncoder = null;
    }

    if (this.commandEncoder) {
      this.device.queue.submit([this.commandEncoder.finish()]);
      this.commandEncoder = null;
    }

    this.currentTextureView = null;
  }

  /** Resize the renderer */
  resize(width: number, height: number): void {
    this._width = Math.floor(width * this.pixelRatio);
    this._height = Math.floor(height * this.pixelRatio);

    this.canvas.width = this._width;
    this.canvas.height = this._height;

    // Recreate depth texture
    this.createDepthTexture();
  }

  /** Dispose the renderer */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.depthTexture) {
      this.depthTexture.destroy();
      this.depthTexture = null;
    }

    this.uniformBuffer.destroy();
  }
}

/** Create a WebGPU renderer (async) */
export async function createWebGPURenderer(options: RendererOptions): Promise<WebGPURenderer> {
  return WebGPURenderer.create(options);
}
