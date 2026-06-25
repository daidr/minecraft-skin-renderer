/**
 * WebGL2 Renderer implementation
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
import { WebGLBuffer } from "./WebGLBuffer";
import { WebGLPipeline } from "./WebGLPipeline";
import { WebGLTextureImpl } from "./WebGLTexture";

export class WebGLRenderer implements IRenderer {
  readonly backend = "webgl" as const;
  readonly canvas: HTMLCanvasElement;
  readonly pixelRatio: number;

  private gl: WebGL2RenderingContext;
  private disposed = false;
  private _width: number;
  private _height: number;

  // State cache for reducing redundant WebGL calls
  private lastPipelineId = -1;
  private lastVAO: WebGLVertexArrayObject | null = null;
  private vaoCache: Map<string, WebGLVertexArrayObject> = new Map();
  private vaoBufferIds: Map<string, Set<number>> = new Map();

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.pixelRatio = options.pixelRatio ?? globalThis.devicePixelRatio ?? 1;

    // Get WebGL2 context
    const contextOptions: WebGLContextAttributes = {
      antialias: options.antialias ?? true,
      alpha: true,
      depth: true,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: "high-performance",
    };

    const gl = this.canvas.getContext("webgl2", contextOptions);
    if (!gl) {
      throw new Error("WebGL2 is not supported");
    }

    this.gl = gl;
    this._width = this.canvas.width;
    this._height = this.canvas.height;

    // Initial setup
    this.setupGL();
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /** Initial WebGL setup */
  private setupGL(): void {
    const gl = this.gl;

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    // Enable backface culling
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Set viewport
    gl.viewport(0, 0, this._width, this._height);
  }

  /** Create a buffer */
  createBuffer(usage: BufferUsage, data: ArrayBufferView): IBuffer {
    return new WebGLBuffer(this.gl, usage, data, (id) => this.deleteVAOsUsingBuffer(id));
  }

  /** Create a texture */
  async createTexture(source: TexImageSource, options?: TextureOptions): Promise<ITexture> {
    return new WebGLTextureImpl(this.gl, source, options);
  }

  /** Create a pipeline (shader program) */
  createPipeline(config: PipelineConfig): IPipeline {
    return new WebGLPipeline(this.gl, config);
  }

  /** Begin a new frame */
  beginFrame(): void {
    // Reset state cache at frame start
    this.lastPipelineId = -1;
    this.lastVAO = null;
  }

  /** Clear the framebuffer */
  clear(r: number, g: number, b: number, a: number): void {
    const gl = this.gl;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /** Draw with the given parameters */
  draw(params: DrawParams): void {
    const gl = this.gl;
    const pipeline = params.pipeline as WebGLPipeline;
    const program = pipeline.getNativeProgram();

    if (!program) return;

    // Only switch program and apply state if pipeline changed
    if (this.lastPipelineId !== pipeline.id) {
      gl.useProgram(program);
      pipeline.applyState();
      this.lastPipelineId = pipeline.id;
    }

    // Bind VAO only if changed. VAOs cache vertex/index buffer layout per draw shape.
    const vao = this.getOrCreateVAO(pipeline, params);
    if (this.lastVAO !== vao) {
      gl.bindVertexArray(vao);
      this.lastVAO = vao;
    }

    // Set uniforms
    let textureUnit = 0;
    const { uniforms, textures } = params.bindGroup;

    for (const [name, value] of Object.entries(uniforms)) {
      pipeline.setUniform(name, value);
    }

    // Bind textures
    for (const [name, texture] of Object.entries(textures)) {
      const tex = texture as WebGLTextureImpl;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, tex.getNativeTexture());
      pipeline.setUniformInt(name, textureUnit);
      textureUnit++;
    }

    // Draw
    const primitive = pipeline.getGLPrimitive();

    if (params.indexBuffer && params.indexCount) {
      gl.drawElements(primitive, params.indexCount, gl.UNSIGNED_SHORT, 0);
    } else if (params.vertexCount) {
      gl.drawArrays(primitive, 0, params.vertexCount);
    }
  }

  /** End the current frame */
  endFrame(): void {
    // Frame complete
  }

  /** Resize the renderer */
  resize(width: number, height: number): void {
    this._width = Math.floor(width * this.pixelRatio);
    this._height = Math.floor(height * this.pixelRatio);

    this.canvas.width = this._width;
    this.canvas.height = this._height;

    this.gl.viewport(0, 0, this._width, this._height);
  }

  private getOrCreateVAO(
    pipeline: WebGLPipeline,
    params: DrawParams,
  ): WebGLVertexArrayObject | null {
    const vertexIds = params.vertexBuffers.map((buffer) => buffer.id).join(",");
    const indexId = params.indexBuffer?.id ?? "none";
    const key = `${pipeline.id}|${vertexIds}|${indexId}`;
    const cached = this.vaoCache.get(key);
    if (cached) return cached;

    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) return null;

    gl.bindVertexArray(vao);

    const layout = pipeline.vertexLayout;
    for (const vertexBuffer of params.vertexBuffers) {
      const buffer = vertexBuffer as WebGLBuffer;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.getNativeBuffer());

      for (const attr of layout.attributes) {
        gl.enableVertexAttribArray(attr.location);
        gl.vertexAttribPointer(
          attr.location,
          WebGLPipeline.getFormatSize(attr.format),
          WebGLPipeline.getFormatType(gl, attr.format),
          WebGLPipeline.isFormatNormalized(attr.format),
          layout.stride,
          attr.offset,
        );
      }
    }

    if (params.indexBuffer) {
      const indexBuffer = params.indexBuffer as WebGLBuffer;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.getNativeBuffer());
    }

    this.vaoCache.set(key, vao);
    this.vaoBufferIds.set(
      key,
      new Set([
        ...params.vertexBuffers.map((buffer) => buffer.id),
        ...(params.indexBuffer ? [params.indexBuffer.id] : []),
      ]),
    );
    return vao;
  }

  private deleteVAOsUsingBuffer(bufferId: number): void {
    for (const [key, vao] of this.vaoCache) {
      if (this.vaoBufferIds.get(key)?.has(bufferId)) {
        this.gl.deleteVertexArray(vao);
        this.vaoCache.delete(key);
        this.vaoBufferIds.delete(key);
        if (this.lastVAO === vao) {
          this.lastVAO = null;
        }
      }
    }
  }

  /** Dispose the renderer */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    for (const vao of this.vaoCache.values()) {
      this.gl.deleteVertexArray(vao);
    }
    this.vaoCache.clear();
    this.vaoBufferIds.clear();
    this.lastVAO = null;

    // Explicitly lose the WebGL context to release GPU resources.
    // Individual textures, buffers, and pipelines are disposed by the caller (SkinViewer.dispose).
    const loseContext = this.gl.getExtension("WEBGL_lose_context");
    if (loseContext) {
      loseContext.loseContext();
    }
  }
}

/** Create a WebGL renderer */
export function createWebGLRenderer(options: RendererOptions): WebGLRenderer {
  return new WebGLRenderer(options);
}
