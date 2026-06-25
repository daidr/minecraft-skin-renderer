/**
 * Resource Manager for SkinViewer
 *
 * Manages GPU resources (buffers, textures, pipelines) with proper lifecycle management.
 */

import type { IBuffer, IPipeline, IRenderer } from "../core/renderer/types";
import {
  BufferUsage,
  BlendMode,
  CullMode,
  DepthCompare,
  VertexFormat,
} from "../core/renderer/types";
import { getRendererPlugin } from "../core/renderer/registry";
import type { BoxGeometry, ModelVariant, PartName } from "../model/types";
import { BoneIndex, PART_NAMES, VERTEX_STRIDE } from "../model/types";
import {
  createBoxGeometry,
  createCapeBoxGeometry,
  mergeGeometries,
} from "../model/geometry/BoxGeometry";
import { getSkinUV } from "../model/uv/SkinUV";
import { getCapeUV, getElytraUV } from "../model/uv/CapeUV";

/** Geometry for a single part with inner and outer layers */
export interface PartGeometry {
  inner: BoxGeometry;
  outer: BoxGeometry;
}

/** GPU buffers for a single part */
export interface PartBuffers {
  innerVertexBuffer: IBuffer;
  innerIndexBuffer: IBuffer;
  outerVertexBuffer: IBuffer;
  outerIndexBuffer: IBuffer;
  innerIndexCount: number;
  outerIndexCount: number;
}

/** Shared vertex layout for all skin pipelines */
export const SKIN_VERTEX_LAYOUT: {
  stride: number;
  attributes: {
    name: string;
    location: number;
    format: VertexFormat;
    offset: number;
  }[];
} = {
  stride: VERTEX_STRIDE * 4, // bytes
  attributes: [
    { name: "a_position", location: 0, format: VertexFormat.Float32x3, offset: 0 },
    { name: "a_uv", location: 1, format: VertexFormat.Float32x2, offset: 12 },
    { name: "a_normal", location: 2, format: VertexFormat.Float32x3, offset: 20 },
    { name: "a_boneIndex", location: 3, format: VertexFormat.Float32, offset: 32 },
  ],
};

/**
 * Create geometry for all parts (separated by part and layer)
 */
export function createAllPartGeometries(variant: ModelVariant): Record<PartName, PartGeometry> {
  const uvMap = getSkinUV(variant);
  const armWidth = variant === "slim" ? 3 : 4;

  return {
    head: {
      inner: createBoxGeometry([8, 8, 8], uvMap.head.inner, BoneIndex.Head, [0, 4, 0]),
      outer: createBoxGeometry([8, 8, 8], uvMap.head.outer, BoneIndex.HeadOverlay, [0, 4, 0], 0.5),
    },
    body: {
      inner: createBoxGeometry([8, 12, 4], uvMap.body.inner, BoneIndex.Body, [0, -6, 0]),
      outer: createBoxGeometry(
        [8, 12, 4],
        uvMap.body.outer,
        BoneIndex.BodyOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    rightArm: {
      inner: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.rightArm.inner,
        BoneIndex.RightArm,
        [0, -6, 0],
      ),
      outer: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.rightArm.outer,
        BoneIndex.RightArmOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    leftArm: {
      inner: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.leftArm.inner,
        BoneIndex.LeftArm,
        [0, -6, 0],
      ),
      outer: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.leftArm.outer,
        BoneIndex.LeftArmOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    rightLeg: {
      inner: createBoxGeometry([4, 12, 4], uvMap.rightLeg.inner, BoneIndex.RightLeg, [0, -6, 0]),
      outer: createBoxGeometry(
        [4, 12, 4],
        uvMap.rightLeg.outer,
        BoneIndex.RightLegOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    leftLeg: {
      inner: createBoxGeometry([4, 12, 4], uvMap.leftLeg.inner, BoneIndex.LeftLeg, [0, -6, 0]),
      outer: createBoxGeometry(
        [4, 12, 4],
        uvMap.leftLeg.outer,
        BoneIndex.LeftLegOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
  };
}

/**
 * Create GPU buffers for a part geometry
 */
export function createPartBuffers(renderer: IRenderer, geometry: PartGeometry): PartBuffers {
  return {
    innerVertexBuffer: renderer.createBuffer(BufferUsage.Vertex, geometry.inner.vertices),
    innerIndexBuffer: renderer.createBuffer(BufferUsage.Index, geometry.inner.indices),
    outerVertexBuffer: renderer.createBuffer(BufferUsage.Vertex, geometry.outer.vertices),
    outerIndexBuffer: renderer.createBuffer(BufferUsage.Index, geometry.outer.indices),
    innerIndexCount: geometry.inner.indexCount,
    outerIndexCount: geometry.outer.indexCount,
  };
}

/**
 * Create GPU buffers for all parts
 */
export function createAllPartBuffers(
  renderer: IRenderer,
  geometries: Record<PartName, PartGeometry>,
): Record<PartName, PartBuffers> {
  const result = {} as Record<PartName, PartBuffers>;
  for (const part of PART_NAMES) {
    result[part] = createPartBuffers(renderer, geometries[part]);
  }
  return result;
}

/**
 * Dispose all part buffers
 */
export function disposeAllPartBuffers(buffers: Record<PartName, PartBuffers>): void {
  for (const part of PART_NAMES) {
    const b = buffers[part];
    b.innerVertexBuffer.dispose();
    b.innerIndexBuffer.dispose();
    b.outerVertexBuffer.dispose();
    b.outerIndexBuffer.dispose();
  }
}

/**
 * Create cape geometry
 */
export function createCapeGeometry(): BoxGeometry {
  const capeUV = getCapeUV();
  return createCapeBoxGeometry([10, 16, 1], capeUV, BoneIndex.Cape, [0, -8, -0.5]);
}

/**
 * Create elytra geometry (both wings merged)
 */
export function createElytraGeometry(): BoxGeometry {
  const elytraUV = getElytraUV();

  const leftWing = createCapeBoxGeometry(
    [12, 22, 4],
    elytraUV,
    BoneIndex.LeftWing,
    [-5, -10, -1],
    false,
  );

  const rightWing = createCapeBoxGeometry(
    [12, 22, 4],
    elytraUV,
    BoneIndex.RightWing,
    [-5, -10, -1],
    true,
  );

  return mergeGeometries([leftWing, rightWing]);
}

/**
 * Create all pipelines for skin rendering
 */
export function createPipelines(renderer: IRenderer): {
  skinPipeline: IPipeline;
  overlayPipeline: IPipeline;
  capePipeline: IPipeline;
} {
  const activePlugin = getRendererPlugin(renderer.backend)!;
  const shaders = activePlugin.getComposedShaders?.() ?? activePlugin.shaders;
  const vertexShader = shaders.vertex;
  const fragmentShader = shaders.fragment;

  const skinPipeline = renderer.createPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout: SKIN_VERTEX_LAYOUT,
    cullMode: CullMode.Back,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  const overlayPipeline = renderer.createPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout: SKIN_VERTEX_LAYOUT,
    cullMode: CullMode.None,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  const capePipeline = renderer.createPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout: SKIN_VERTEX_LAYOUT,
    cullMode: CullMode.None,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  return { skinPipeline, overlayPipeline, capePipeline };
}
