/**
 * Renderer abstraction types
 * Defines interfaces for WebGL and WebGPU backends
 */

import type { Mat4 } from "../math";

/** Supported rendering backends */
export type BackendType = "webgpu" | "webgl";

/** Buffer usage hints */
export enum BufferUsage {
  Vertex = 1,
  Index = 2,
  Uniform = 4,
}

/** Texture format */
export enum TextureFormat {
  RGBA8 = "rgba8unorm",
  RGBA8_SRGB = "rgba8unorm-srgb",
}

/** Texture filtering mode */
export enum TextureFilter {
  Nearest = "nearest",
  Linear = "linear",
}

/** Texture wrapping mode */
export enum TextureWrap {
  Repeat = "repeat",
  ClampToEdge = "clamp-to-edge",
  MirrorRepeat = "mirror-repeat",
}

/** Vertex attribute format */
export enum VertexFormat {
  Float32 = "float32",
  Float32x2 = "float32x2",
  Float32x3 = "float32x3",
  Float32x4 = "float32x4",
  Uint8x4 = "uint8x4",
  Uint32 = "uint32",
}

/** Primitive topology */
export enum PrimitiveTopology {
  TriangleList = "triangle-list",
  TriangleStrip = "triangle-strip",
  LineList = "line-list",
  LineStrip = "line-strip",
  PointList = "point-list",
}

/** Cull mode */
export enum CullMode {
  None = "none",
  Front = "front",
  Back = "back",
}

/** Blend mode presets */
export enum BlendMode {
  None = "none",
  Alpha = "alpha",
  Additive = "additive",
  Multiply = "multiply",
}

/** Depth compare function */
export enum DepthCompare {
  Never = "never",
  Less = "less",
  Equal = "equal",
  LessEqual = "less-equal",
  Greater = "greater",
  NotEqual = "not-equal",
  GreaterEqual = "greater-equal",
  Always = "always",
}

/** Renderer configuration */
export interface RendererOptions {
  canvas: HTMLCanvasElement;
  preferredBackend?: BackendType;
  antialias?: boolean;
  pixelRatio?: number;
  preserveDrawingBuffer?: boolean;
}

/** Texture configuration */
export interface TextureOptions {
  format?: TextureFormat;
  minFilter?: TextureFilter;
  magFilter?: TextureFilter;
  wrapU?: TextureWrap;
  wrapV?: TextureWrap;
  generateMipmaps?: boolean;
}

/** Vertex attribute descriptor */
export interface VertexAttribute {
  name: string;
  location: number;
  format: VertexFormat;
  offset: number;
}

/** Vertex buffer layout */
export interface VertexBufferLayout {
  stride: number;
  attributes: VertexAttribute[];
}

/** Pipeline configuration */
export interface PipelineConfig {
  vertexShader: string;
  fragmentShader: string;
  vertexLayout: VertexBufferLayout;
  primitive?: PrimitiveTopology;
  cullMode?: CullMode;
  blendMode?: BlendMode;
  depthWrite?: boolean;
  depthCompare?: DepthCompare;
}

/** Uniform value types */
export type UniformValue =
  | number
  | Float32Array
  | Mat4
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

/** Buffer interface */
export interface IBuffer {
  readonly id: number;
  readonly size: number;
  readonly usage: BufferUsage;
  update(data: ArrayBufferView, offset?: number): void;
  dispose(): void;
}

/** Texture interface */
export interface ITexture {
  readonly id: number;
  readonly width: number;
  readonly height: number;
  update(source: TexImageSource): void;
  dispose(): void;
}

/** Pipeline interface */
export interface IPipeline {
  readonly id: number;
  dispose(): void;
}

/** Bind group for uniforms and textures */
export interface BindGroup {
  uniforms: Record<string, UniformValue>;
  textures: Record<string, ITexture>;
}

/** Draw call parameters */
export interface DrawParams {
  pipeline: IPipeline;
  vertexBuffers: IBuffer[];
  indexBuffer?: IBuffer;
  indexCount?: number;
  vertexCount?: number;
  instanceCount?: number;
  bindGroup: BindGroup;
}

/** Renderer interface */
export interface IRenderer {
  readonly backend: BackendType;
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;

  // Resource creation
  createBuffer(usage: BufferUsage, data: ArrayBufferView): IBuffer;
  createTexture(source: TexImageSource, options?: TextureOptions): Promise<ITexture>;
  createPipeline(config: PipelineConfig): IPipeline;

  // Frame operations
  beginFrame(): void;
  clear(r: number, g: number, b: number, a: number): void;
  draw(params: DrawParams): void;
  endFrame(): void;

  // Lifecycle
  resize(width: number, height: number): void;
  dispose(): void;
}

/** Renderer factory result */
export interface CreateRendererResult {
  renderer: IRenderer;
  backend: BackendType;
}

/** Check if WebGPU is supported */
export function isWebGPUSupported(): boolean {
  return "gpu" in navigator;
}

/** Check if WebGL2 is supported */
export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/** Detect best available backend */
export function detectBestBackend(): BackendType | null {
  if (isWebGPUSupported()) return "webgpu";
  if (isWebGL2Supported()) return "webgl";
  return null;
}
