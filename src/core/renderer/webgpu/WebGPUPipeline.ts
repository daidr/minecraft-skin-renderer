/**
 * WebGPU Pipeline implementation
 */

import { BlendMode, CullMode, DepthCompare, PrimitiveTopology, VertexFormat } from "../types";
import type { IPipeline, PipelineConfig, VertexBufferLayout } from "../types";
import { pipelineId } from "../utils";

/** Convert VertexFormat to GPUVertexFormat */
function convertVertexFormat(format: VertexFormat): GPUVertexFormat {
  switch (format) {
    case VertexFormat.Float32:
      return "float32";
    case VertexFormat.Float32x2:
      return "float32x2";
    case VertexFormat.Float32x3:
      return "float32x3";
    case VertexFormat.Float32x4:
      return "float32x4";
    case VertexFormat.Uint8x4:
      return "uint8x4";
    case VertexFormat.Uint32:
      return "uint32";
    default:
      return "float32x3";
  }
}

/** Convert PrimitiveTopology to GPUPrimitiveTopology */
function convertTopology(
  topology: PrimitiveTopology = PrimitiveTopology.TriangleList,
): GPUPrimitiveTopology {
  switch (topology) {
    case PrimitiveTopology.TriangleStrip:
      return "triangle-strip";
    case PrimitiveTopology.LineList:
      return "line-list";
    case PrimitiveTopology.LineStrip:
      return "line-strip";
    case PrimitiveTopology.PointList:
      return "point-list";
    default:
      return "triangle-list";
  }
}

/** Convert CullMode to GPUCullMode */
function convertCullMode(mode: CullMode = CullMode.Back): GPUCullMode {
  switch (mode) {
    case CullMode.None:
      return "none";
    case CullMode.Front:
      return "front";
    case CullMode.Back:
      return "back";
    default:
      return "back";
  }
}

/** Convert DepthCompare to GPUCompareFunction */
function convertDepthCompare(compare: DepthCompare = DepthCompare.Less): GPUCompareFunction {
  switch (compare) {
    case DepthCompare.Never:
      return "never";
    case DepthCompare.Less:
      return "less";
    case DepthCompare.Equal:
      return "equal";
    case DepthCompare.LessEqual:
      return "less-equal";
    case DepthCompare.Greater:
      return "greater";
    case DepthCompare.NotEqual:
      return "not-equal";
    case DepthCompare.GreaterEqual:
      return "greater-equal";
    case DepthCompare.Always:
      return "always";
    default:
      return "less";
  }
}

/** Get blend state for a blend mode */
function getBlendState(mode: BlendMode = BlendMode.None): GPUBlendState | undefined {
  switch (mode) {
    case BlendMode.None:
      return undefined;
    case BlendMode.Alpha:
      return {
        color: {
          srcFactor: "src-alpha",
          dstFactor: "one-minus-src-alpha",
          operation: "add",
        },
        alpha: {
          srcFactor: "one",
          dstFactor: "one-minus-src-alpha",
          operation: "add",
        },
      };
    case BlendMode.Additive:
      return {
        color: {
          srcFactor: "src-alpha",
          dstFactor: "one",
          operation: "add",
        },
        alpha: {
          srcFactor: "one",
          dstFactor: "one",
          operation: "add",
        },
      };
    case BlendMode.Multiply:
      return {
        color: {
          srcFactor: "dst",
          dstFactor: "zero",
          operation: "add",
        },
        alpha: {
          srcFactor: "dst-alpha",
          dstFactor: "zero",
          operation: "add",
        },
      };
    default:
      return undefined;
  }
}

export class WebGPUPipeline implements IPipeline {
  readonly id: number;
  readonly vertexLayout: VertexBufferLayout;

  private pipeline: GPURenderPipeline;
  private textureBindGroupLayout: GPUBindGroupLayout;
  private disposed = false;

  constructor(
    device: GPUDevice,
    config: PipelineConfig,
    format: GPUTextureFormat,
    uniformBindGroupLayout: GPUBindGroupLayout,
    sampleCount: number = 1,
  ) {
    this.id = pipelineId();
    this.vertexLayout = config.vertexLayout;

    // Create shader module from WGSL
    // Note: For WebGPU, vertexShader contains the full WGSL module
    const shaderModule = device.createShaderModule({
      code: config.vertexShader,
    });

    // Define vertex buffer layout
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: config.vertexLayout.stride,
      attributes: config.vertexLayout.attributes.map((attr) => ({
        shaderLocation: attr.location,
        offset: attr.offset,
        format: convertVertexFormat(attr.format),
      })),
    };

    // Create bind group layout for textures (group 1)
    this.textureBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
      ],
    });

    // Create pipeline layout with both bind group layouts
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [uniformBindGroupLayout, this.textureBindGroupLayout],
    });

    // Create render pipeline with all state pre-compiled
    this.pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format,
            blend: getBlendState(config.blendMode),
          },
        ],
      },
      primitive: {
        topology: convertTopology(config.primitive),
        cullMode: convertCullMode(config.cullMode),
      },
      depthStencil: {
        depthWriteEnabled: config.depthWrite ?? true,
        depthCompare: convertDepthCompare(config.depthCompare),
        format: "depth24plus",
      },
      multisample: {
        count: sampleCount,
      },
    });
  }

  /** Get the native WebGPU render pipeline */
  getNativePipeline(): GPURenderPipeline {
    return this.pipeline;
  }

  /** Get the texture bind group layout (for creating bind groups) */
  getTextureBindGroupLayout(): GPUBindGroupLayout {
    return this.textureBindGroupLayout;
  }

  /** Dispose the pipeline */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    // WebGPU pipelines don't need explicit destruction
    // They will be garbage collected when no longer referenced
  }
}
