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
 * - modelMatrix:          64 bytes  (offset 0)
 * - viewProjectionMatrix: 64 bytes  (offset 64)
 * - boneMatrices:         1536 bytes (offset 128, 24 * 64)
 * - alphaTest:            4 bytes   (offset 1664)
 * - padding:              12 bytes  (offset 1668, align to 16)
 * Total: 1680 bytes
 */
const UNIFORM_BUFFER_SIZE = 1680;
const OFFSET_MODEL_MATRIX = 0;
const OFFSET_VIEW_PROJECTION_MATRIX = 64;
const OFFSET_BONE_MATRICES = 128;
const OFFSET_ALPHA_TEST = 1664;

/** Pool size for per-draw-call uniform buffers */
const UNIFORM_POOL_SIZE = 32;

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

  // MSAA
  readonly sampleCount: number;
  private msaaTexture: GPUTexture | null = null;
  private msaaTextureView: GPUTextureView | null = null;

  // Depth buffer
  private depthTexture: GPUTexture | null = null;
  private depthTextureView: GPUTextureView | null = null;

  // Frame state
  private commandEncoder: GPUCommandEncoder | null = null;
  private renderPassEncoder: GPURenderPassEncoder | null = null;
  private currentTextureView: GPUTextureView | null = null;

  // Uniform buffer management (pool for per-draw-call isolation)
  private uniformBuffers: GPUBuffer[] = [];
  private uniformBindGroupLayout: GPUBindGroupLayout;
  private uniformBindGroups: GPUBindGroup[] = [];
  private uniformData: ArrayBuffer;
  private uniformDataView: DataView;

  // Pre-allocated typed array view to avoid per-draw allocation
  private uniformFloat32View: Float32Array;

  // Per-frame draw call index into the uniform pool
  private currentDrawIndex = 0;

  // Flag to warn once per frame when pool is exhausted
  private poolExhaustedWarned = false;

  // State cache
  private lastPipelineId = -1;

  // Texture BindGroup cache: Map<textureId, { bindGroup, pipelineId }>
  private textureBindGroupCache: Map<number, { bindGroup: GPUBindGroup; pipelineId: number }> =
    new Map();

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
    this.sampleCount = (options.antialias ?? true) ? 4 : 1;

    this._width = this.canvas.width;
    this._height = this.canvas.height;

    // Create uniform staging area (CPU-side)
    this.uniformData = new ArrayBuffer(UNIFORM_BUFFER_SIZE);
    this.uniformDataView = new DataView(this.uniformData);
    this.uniformFloat32View = new Float32Array(this.uniformData);

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

    // Create pool of uniform buffers + bind groups (one per draw call)
    // Each draw call gets its own buffer so writeBuffer doesn't conflict
    for (let i = 0; i < UNIFORM_POOL_SIZE; i++) {
      const buffer = device.createBuffer({
        size: UNIFORM_BUFFER_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      this.uniformBuffers.push(buffer);
      this.uniformBindGroups.push(
        device.createBindGroup({
          layout: this.uniformBindGroupLayout,
          entries: [{ binding: 0, resource: { buffer } }],
        }),
      );
    }

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

    try {
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
    } catch (error) {
      device.destroy();
      throw error;
    }
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /** Create or recreate depth texture and MSAA texture */
  private createDepthTexture(): void {
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }
    if (this.msaaTexture) {
      this.msaaTexture.destroy();
    }

    this.depthTexture = this.device.createTexture({
      size: { width: this._width, height: this._height },
      format: "depth24plus",
      sampleCount: this.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthTextureView = this.depthTexture.createView();

    if (this.sampleCount > 1) {
      this.msaaTexture = this.device.createTexture({
        size: { width: this._width, height: this._height },
        format: this.format,
        sampleCount: this.sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.msaaTextureView = this.msaaTexture.createView();
    }
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
    return new WebGPUPipeline(
      this.device,
      config,
      this.format,
      this.uniformBindGroupLayout,
      this.sampleCount,
    );
  }

  /** Begin a new frame */
  beginFrame(): void {
    // Reset state cache
    this.lastPipelineId = -1;
    this.currentDrawIndex = 0;
    this.poolExhaustedWarned = false;

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
    // When MSAA is enabled, render to msaaTextureView and resolve to canvas texture
    const colorAttachment: GPURenderPassColorAttachment = this.msaaTextureView
      ? {
          view: this.msaaTextureView,
          resolveTarget: this.currentTextureView,
          clearValue: { r, g, b, a },
          loadOp: "clear",
          storeOp: "discard",
        }
      : {
          view: this.currentTextureView,
          clearValue: { r, g, b, a },
          loadOp: "clear",
          storeOp: "store",
        };

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [colorAttachment],
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

    // Update uniform buffer with bind group data (using partial updates)
    const { uniforms } = params.bindGroup;
    const float32View = this.uniformFloat32View;

    // Track dirty range for partial upload
    let minOffset = UNIFORM_BUFFER_SIZE;
    let maxOffset = 0;

    // Model matrix (offset 0)
    if (uniforms.u_modelMatrix) {
      float32View.set(uniforms.u_modelMatrix as Float32Array, OFFSET_MODEL_MATRIX / 4);
      minOffset = Math.min(minOffset, OFFSET_MODEL_MATRIX);
      maxOffset = Math.max(maxOffset, OFFSET_MODEL_MATRIX + 64);
    }

    // ViewProjection matrix (offset 64) - precomputed on CPU
    if (uniforms.u_viewProjectionMatrix) {
      float32View.set(
        uniforms.u_viewProjectionMatrix as Float32Array,
        OFFSET_VIEW_PROJECTION_MATRIX / 4,
      );
      minOffset = Math.min(minOffset, OFFSET_VIEW_PROJECTION_MATRIX);
      maxOffset = Math.max(maxOffset, OFFSET_VIEW_PROJECTION_MATRIX + 64);
    }

    // Bone matrices (offset 192) - always update since content may change in-place
    const boneMatrices = uniforms["u_boneMatrices[0]"] || uniforms.u_boneMatrices;
    if (boneMatrices) {
      float32View.set(boneMatrices as Float32Array, OFFSET_BONE_MATRICES / 4);
      minOffset = Math.min(minOffset, OFFSET_BONE_MATRICES);
      maxOffset = Math.max(maxOffset, OFFSET_BONE_MATRICES + 1536);
    }

    // Alpha test (offset 1728)
    if (uniforms.u_alphaTest !== undefined) {
      this.uniformDataView.setFloat32(OFFSET_ALPHA_TEST, uniforms.u_alphaTest as number, true);
      minOffset = Math.min(minOffset, OFFSET_ALPHA_TEST);
      maxOffset = Math.max(maxOffset, OFFSET_ALPHA_TEST + 16); // Aligned to 16 bytes
    }

    // Upload full uniform data to this draw call's dedicated buffer
    // Each draw call uses its own buffer to avoid writeBuffer race conditions
    const drawIdx = this.currentDrawIndex;
    if (drawIdx >= UNIFORM_POOL_SIZE) {
      if (!this.poolExhaustedWarned) {
        console.warn(
          `WebGPU uniform pool exhausted (max ${UNIFORM_POOL_SIZE} draw calls per frame). ` +
            `Extra draw calls will be skipped.`,
        );
        this.poolExhaustedWarned = true;
      }
      return;
    }
    if (maxOffset > minOffset) {
      this.device.queue.writeBuffer(
        this.uniformBuffers[drawIdx],
        0,
        this.uniformData,
        0,
        UNIFORM_BUFFER_SIZE,
      );
      this.renderPassEncoder.setBindGroup(0, this.uniformBindGroups[drawIdx]);
      this.currentDrawIndex++;
    }

    // Create and set texture bind group (group 1) with caching
    const { textures } = params.bindGroup;
    const firstTextureKey = Object.keys(textures)[0];
    if (firstTextureKey) {
      const tex = textures[firstTextureKey] as WebGPUTextureImpl;

      // Check cache for existing bind group
      const cacheKey = tex.id;
      let cached = this.textureBindGroupCache.get(cacheKey);

      // Invalidate cache if pipeline changed (different layout)
      if (cached && cached.pipelineId !== pipeline.id) {
        cached = undefined;
      }

      if (!cached) {
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
        cached = { bindGroup: textureBindGroup, pipelineId: pipeline.id };
        this.textureBindGroupCache.set(cacheKey, cached);
      }

      this.renderPassEncoder.setBindGroup(1, cached.bindGroup);
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

    // Recreate depth texture and MSAA texture
    this.createDepthTexture();
  }

  /**
   * Invalidate texture bind group cache for a specific texture.
   * Call this when a texture is updated or disposed.
   */
  invalidateTextureCache(textureId: number): void {
    this.textureBindGroupCache.delete(textureId);
  }

  /** Dispose the renderer */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // End any in-progress render pass
    if (this.renderPassEncoder) {
      this.renderPassEncoder.end();
      this.renderPassEncoder = null;
    }

    // Submit any pending commands before cleanup
    if (this.commandEncoder) {
      this.device.queue.submit([this.commandEncoder.finish()]);
      this.commandEncoder = null;
    }

    // Clear bind group cache (GPUBindGroup objects are not explicitly destroyed)
    this.textureBindGroupCache.clear();

    // Clean up MSAA texture
    this.msaaTextureView = null;
    if (this.msaaTexture) {
      this.msaaTexture.destroy();
      this.msaaTexture = null;
    }

    // Clean up depth texture and view
    this.depthTextureView = null;
    if (this.depthTexture) {
      this.depthTexture.destroy();
      this.depthTexture = null;
    }

    // Clean up current texture view reference
    this.currentTextureView = null;

    // Destroy uniform buffer pool
    for (const buffer of this.uniformBuffers) {
      buffer.destroy();
    }
    this.uniformBuffers.length = 0;
    this.uniformBindGroups.length = 0;

    // Note: uniformBindGroupLayout and uniformBindGroup are managed by the device
    // and will be cleaned up when the device is lost/destroyed
  }
}

/** Create a WebGPU renderer (async) */
export async function createWebGPURenderer(options: RendererOptions): Promise<WebGPURenderer> {
  return WebGPURenderer.create(options);
}
