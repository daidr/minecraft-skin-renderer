/**
 * WebGL Pipeline (Shader Program) implementation
 */

import { BlendMode, CullMode, DepthCompare, PrimitiveTopology, VertexFormat } from "../types";
import type { IPipeline, PipelineConfig, UniformValue, VertexBufferLayout } from "../types";

let nextPipelineId = 0;

/** Format information for vertex attributes */
interface FormatInfo {
  size: number;
  type: number;
  normalized: boolean;
}

/** Lookup table for vertex format properties */
const FORMAT_INFO: Record<VertexFormat, FormatInfo> = {
  [VertexFormat.Float32]: { size: 1, type: WebGL2RenderingContext.FLOAT, normalized: false },
  [VertexFormat.Float32x2]: { size: 2, type: WebGL2RenderingContext.FLOAT, normalized: false },
  [VertexFormat.Float32x3]: { size: 3, type: WebGL2RenderingContext.FLOAT, normalized: false },
  [VertexFormat.Float32x4]: { size: 4, type: WebGL2RenderingContext.FLOAT, normalized: false },
  [VertexFormat.Uint8x4]: { size: 4, type: WebGL2RenderingContext.UNSIGNED_BYTE, normalized: true },
  [VertexFormat.Uint32]: { size: 1, type: WebGL2RenderingContext.UNSIGNED_INT, normalized: false },
};

export interface UniformInfo {
  location: WebGLUniformLocation;
  type: number;
}

export class WebGLPipeline implements IPipeline {
  readonly id: number;

  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null;
  private vertexShader: WebGLShader | null;
  private fragmentShader: WebGLShader | null;
  private uniformCache: Map<string, UniformInfo> = new Map();
  private vao: WebGLVertexArrayObject | null = null;
  private disposed = false;

  // Pipeline state
  readonly cullMode: CullMode;
  readonly blendMode: BlendMode;
  readonly depthWrite: boolean;
  readonly depthCompare: DepthCompare;
  readonly primitive: PrimitiveTopology;
  readonly vertexLayout: VertexBufferLayout;

  constructor(gl: WebGL2RenderingContext, config: PipelineConfig) {
    this.id = nextPipelineId++;
    this.gl = gl;

    // Store pipeline state
    this.cullMode = config.cullMode ?? CullMode.Back;
    this.blendMode = config.blendMode ?? BlendMode.None;
    this.depthWrite = config.depthWrite ?? true;
    this.depthCompare = config.depthCompare ?? DepthCompare.Less;
    this.primitive = config.primitive ?? PrimitiveTopology.TriangleList;
    this.vertexLayout = config.vertexLayout;

    // Compile shaders
    this.vertexShader = this.compileShader(gl.VERTEX_SHADER, config.vertexShader);
    this.fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, config.fragmentShader);

    // Link program
    this.program = gl.createProgram();
    if (!this.program) {
      throw new Error("Failed to create WebGL program");
    }

    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this.program);
      throw new Error(`Failed to link shader program: ${info}`);
    }

    // Create VAO
    this.vao = gl.createVertexArray();
  }

  /** Compile a shader */
  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(
        `Failed to compile ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader: ${info}`,
      );
    }

    return shader;
  }

  /** Get native WebGL program */
  getNativeProgram(): WebGLProgram | null {
    return this.program;
  }

  /** Get VAO */
  getVAO(): WebGLVertexArrayObject | null {
    return this.vao;
  }

  /** Get uniform location (cached) */
  getUniformLocation(name: string): UniformInfo | null {
    if (!this.program) return null;

    let info = this.uniformCache.get(name);
    if (info !== undefined) return info;

    const location = this.gl.getUniformLocation(this.program, name);
    if (!location) return null;

    // Get uniform type
    const numUniforms = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
    let type: number = this.gl.FLOAT;

    for (let i = 0; i < numUniforms; i++) {
      const uniformInfo = this.gl.getActiveUniform(this.program, i);
      if (uniformInfo && uniformInfo.name === name) {
        type = uniformInfo.type;
        break;
      }
    }

    info = { location, type };
    this.uniformCache.set(name, info);
    return info;
  }

  /** Set a uniform value */
  setUniform(name: string, value: UniformValue): void {
    if (!this.program) return;

    const gl = this.gl;
    const location = gl.getUniformLocation(this.program, name);
    if (!location) return;

    // Infer type from value rather than querying shader
    if (typeof value === "number") {
      // Check if it's likely an integer (sampler) or float
      if (Number.isInteger(value) && value >= 0 && value < 32) {
        // Could be a sampler, but uniform1f works for both
        gl.uniform1f(location, value);
      } else {
        gl.uniform1f(location, value);
      }
    } else if (value instanceof Float32Array) {
      const len = value.length;
      if (len === 2) {
        gl.uniform2fv(location, value);
      } else if (len === 3) {
        gl.uniform3fv(location, value);
      } else if (len === 4) {
        gl.uniform4fv(location, value);
      } else if (len === 16) {
        // Single mat4
        gl.uniformMatrix4fv(location, false, value);
      } else if (len % 16 === 0) {
        // Array of mat4 (like bone matrices)
        gl.uniformMatrix4fv(location, false, value);
      } else {
        // Generic float array
        gl.uniform1fv(location, value);
      }
    } else if (Array.isArray(value)) {
      const len = value.length;
      if (len === 2) {
        gl.uniform2f(location, value[0], value[1]);
      } else if (len === 3) {
        gl.uniform3f(location, value[0], value[1], value[2]);
      } else if (len === 4) {
        gl.uniform4f(location, value[0], value[1], value[2], value[3]);
      }
    }
  }

  /** Set an integer uniform (for samplers) */
  setUniformInt(name: string, value: number): void {
    if (!this.program) return;

    const gl = this.gl;
    const location = gl.getUniformLocation(this.program, name);
    if (!location) return;

    gl.uniform1i(location, value);
  }

  /** Get GL primitive mode */
  getGLPrimitive(): number {
    const gl = this.gl;
    switch (this.primitive) {
      case PrimitiveTopology.TriangleStrip:
        return gl.TRIANGLE_STRIP;
      case PrimitiveTopology.LineList:
        return gl.LINES;
      case PrimitiveTopology.LineStrip:
        return gl.LINE_STRIP;
      case PrimitiveTopology.PointList:
        return gl.POINTS;
      default:
        return gl.TRIANGLES;
    }
  }

  /** Get format info (size, type, normalized) */
  static getFormatInfo(format: VertexFormat): FormatInfo {
    return FORMAT_INFO[format];
  }

  /** Get vertex attribute size from format */
  static getFormatSize(format: VertexFormat): number {
    return FORMAT_INFO[format].size;
  }

  /** Get GL type from format */
  static getFormatType(_gl: WebGL2RenderingContext, format: VertexFormat): number {
    return FORMAT_INFO[format].type;
  }

  /** Check if format should be normalized */
  static isFormatNormalized(format: VertexFormat): boolean {
    return FORMAT_INFO[format].normalized;
  }

  /** Apply pipeline state */
  applyState(): void {
    const gl = this.gl;

    // Cull mode
    if (this.cullMode === CullMode.None) {
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(this.cullMode === CullMode.Front ? gl.FRONT : gl.BACK);
    }

    // Blend mode
    if (this.blendMode === BlendMode.None) {
      gl.disable(gl.BLEND);
    } else {
      gl.enable(gl.BLEND);
      switch (this.blendMode) {
        case BlendMode.Alpha:
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          break;
        case BlendMode.Additive:
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          break;
        case BlendMode.Multiply:
          gl.blendFunc(gl.DST_COLOR, gl.ZERO);
          break;
      }
    }

    // Depth
    gl.depthMask(this.depthWrite);

    switch (this.depthCompare) {
      case DepthCompare.Never:
        gl.depthFunc(gl.NEVER);
        break;
      case DepthCompare.Less:
        gl.depthFunc(gl.LESS);
        break;
      case DepthCompare.Equal:
        gl.depthFunc(gl.EQUAL);
        break;
      case DepthCompare.LessEqual:
        gl.depthFunc(gl.LEQUAL);
        break;
      case DepthCompare.Greater:
        gl.depthFunc(gl.GREATER);
        break;
      case DepthCompare.NotEqual:
        gl.depthFunc(gl.NOTEQUAL);
        break;
      case DepthCompare.GreaterEqual:
        gl.depthFunc(gl.GEQUAL);
        break;
      case DepthCompare.Always:
        gl.depthFunc(gl.ALWAYS);
        break;
    }
  }

  /** Dispose the pipeline */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    const gl = this.gl;

    if (this.vao) {
      gl.deleteVertexArray(this.vao);
      this.vao = null;
    }

    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }

    if (this.vertexShader) {
      gl.deleteShader(this.vertexShader);
      this.vertexShader = null;
    }

    if (this.fragmentShader) {
      gl.deleteShader(this.fragmentShader);
      this.fragmentShader = null;
    }

    this.uniformCache.clear();
  }
}
