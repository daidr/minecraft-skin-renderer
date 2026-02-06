/**
 * Box geometry generation for Minecraft model parts
 */

import type { Vec3 } from "../../core/math";
import { BoneIndex, VERTEX_STRIDE } from "../types";
import type { BoxGeometry, BoxUV } from "../types";
import {
  SKIN_TEXTURE_WIDTH,
  SKIN_TEXTURE_HEIGHT,
  CAPE_TEXTURE_WIDTH,
  CAPE_TEXTURE_HEIGHT,
  UV_EDGE_INSET,
} from "../constants";

/**
 * Face vertex position signs (6 faces × 4 vertices × 3 components)
 * Each vertex: [sx, sy, sz] where position = offset + sign * halfSize
 * Faces: Front(+Z), Back(-Z), Left(-X), Right(+X), Top(+Y), Bottom(-Y)
 */
// prettier-ignore
const FP = [
  -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,       // Front (+Z)
  1,-1,-1, -1,-1,-1, -1,1,-1, 1,1,-1,    // Back (-Z)
  -1,-1,-1, -1,-1,1, -1,1,1, -1,1,-1,    // Left (-X)
  1,-1,1, 1,-1,-1, 1,1,-1, 1,1,1,        // Right (+X)
  -1,1,1, 1,1,1, 1,1,-1, -1,1,-1,        // Top (+Y)
  -1,-1,-1, 1,-1,-1, 1,-1,1, -1,-1,1,    // Bottom (-Y)
];

/** Face normals (6 faces × 3 components) */
// prettier-ignore
const FN = [0,0,1, 0,0,-1, -1,0,0, 1,0,0, 0,1,0, 0,-1,0];

/** UV face key order: skin mode swaps left/right geometry faces */
const UV_SKIN: (keyof BoxUV)[] = ["front", "back", "right", "left", "top", "bottom"];
const UV_CAPE: (keyof BoxUV)[] = ["front", "back", "left", "right", "top", "bottom"];

/** Options for box geometry creation */
interface BoxGeometryOptions {
  /** Inflation amount (for overlay layers) */
  inflate?: number;
  /** Mirror the geometry along X axis */
  mirrorX?: boolean;
  /** Texture width for UV normalization */
  textureWidth?: number;
  /** Texture height for UV normalization */
  textureHeight?: number;
  /** Use cape UV mapping mode (different u1/u2 assignment) */
  capeUVMode?: boolean;
}

/**
 * Core function for creating box geometry with various options
 */
function createBoxGeometryCore(
  size: Vec3,
  uv: BoxUV,
  boneIndex: BoneIndex,
  offset: Vec3,
  options: BoxGeometryOptions,
): BoxGeometry {
  const {
    inflate = 0,
    mirrorX = false,
    textureWidth = 64,
    textureHeight = 64,
    capeUVMode = false,
  } = options;

  const hw = size[0] / 2 + inflate;
  const hh = size[1] / 2 + inflate;
  const hd = size[2] / 2 + inflate;
  const ox = offset[0], oy = offset[1], oz = offset[2];
  const mx = mirrorX ? -1 : 1;

  // 6 faces, 4 vertices each
  const vertices = new Float32Array(24 * VERTEX_STRIDE);
  const indices = new Uint16Array(36);
  let vi = 0, ii = 0;

  const uvKeys = capeUVMode ? UV_CAPE : UV_SKIN;

  for (let f = 0; f < 6; f++) {
    const faceUV = uv[uvKeys[f]];
    let u1 = faceUV.u1 / textureWidth;
    let u2 = faceUV.u2 / textureWidth;
    let v1 = faceUV.v1 / textureHeight;
    let v2 = faceUV.v2 / textureHeight;

    // Inset UVs towards center to prevent edge bleeding
    if (u1 < u2) { u1 += UV_EDGE_INSET; u2 -= UV_EDGE_INSET; }
    else { u1 -= UV_EDGE_INSET; u2 += UV_EDGE_INSET; }
    if (v1 < v2) { v1 += UV_EDGE_INSET; v2 -= UV_EDGE_INSET; }
    else { v1 -= UV_EDGE_INSET; v2 += UV_EDGE_INSET; }

    // Cape mode swaps u1/u2 for front/back/left/right; bottom always swaps v1/v2
    const su = capeUVMode && f < 4;
    const ua = su ? u2 : u1, ub = su ? u1 : u2;
    const va = f === 5 ? v1 : v2, vb = f === 5 ? v2 : v1;

    const ni = f * 3;
    const nx = FN[ni], ny = FN[ni + 1], nz = FN[ni + 2];
    const bv = f * 4;

    // Write 4 vertices: position, UV (ua/ub,va/vb pattern), normal, bone index
    for (let v = 0; v < 4; v++) {
      const pi = f * 12 + v * 3;
      vertices[vi++] = (ox + FP[pi] * hw) * mx;
      vertices[vi++] = oy + FP[pi + 1] * hh;
      vertices[vi++] = oz + FP[pi + 2] * hd;
      vertices[vi++] = (v === 0 || v === 3) ? ua : ub;
      vertices[vi++] = v < 2 ? va : vb;
      vertices[vi++] = nx * mx;
      vertices[vi++] = ny;
      vertices[vi++] = nz;
      vertices[vi++] = boneIndex;
      vertices[vi++] = 0; // padding
    }

    // When mirrored, reverse winding order to maintain correct face culling
    if (mirrorX) {
      indices[ii++] = bv + 2; indices[ii++] = bv + 1; indices[ii++] = bv;
      indices[ii++] = bv; indices[ii++] = bv + 3; indices[ii++] = bv + 2;
    } else {
      indices[ii++] = bv; indices[ii++] = bv + 1; indices[ii++] = bv + 2;
      indices[ii++] = bv + 2; indices[ii++] = bv + 3; indices[ii++] = bv;
    }
  }

  return { vertices, indices, vertexCount: 24, indexCount: 36 };
}

/**
 * Create box geometry with UV mapping for skin parts
 *
 * @param size - Box dimensions [width, height, depth]
 * @param uv - UV mapping for each face (in pixels, 64x64 texture)
 * @param boneIndex - Bone index for skeletal animation
 * @param offset - Position offset from bone origin
 * @param inflate - Inflation amount (for overlay layers)
 */
export function createBoxGeometry(
  size: Vec3,
  uv: BoxUV,
  boneIndex: BoneIndex,
  offset: Vec3 = [0, 0, 0],
  inflate = 0,
): BoxGeometry {
  return createBoxGeometryCore(size, uv, boneIndex, offset, {
    inflate,
    textureWidth: SKIN_TEXTURE_WIDTH,
    textureHeight: SKIN_TEXTURE_HEIGHT,
    capeUVMode: false,
  });
}

/**
 * Create box geometry for cape/elytra with 64x32 texture
 *
 * @param size - Box dimensions [width, height, depth]
 * @param uv - UV mapping for each face (in pixels, 64x32 texture)
 * @param boneIndex - Bone index for skeletal animation
 * @param offset - Position offset from bone origin
 * @param mirrorX - Mirror the geometry along X axis (for right elytra wing)
 */
export function createCapeBoxGeometry(
  size: Vec3,
  uv: BoxUV,
  boneIndex: BoneIndex,
  offset: Vec3 = [0, 0, 0],
  mirrorX = false,
): BoxGeometry {
  return createBoxGeometryCore(size, uv, boneIndex, offset, {
    mirrorX,
    textureWidth: CAPE_TEXTURE_WIDTH,
    textureHeight: CAPE_TEXTURE_HEIGHT,
    capeUVMode: true,
  });
}

/**
 * Merge multiple box geometries into one
 */
export function mergeGeometries(geometries: BoxGeometry[]): BoxGeometry {
  let totalVertices = 0;
  let totalIndices = 0;

  for (const geo of geometries) {
    totalVertices += geo.vertexCount;
    totalIndices += geo.indexCount;
  }

  const vertices = new Float32Array(totalVertices * VERTEX_STRIDE);
  const indices = new Uint16Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;
  let baseVertex = 0;

  for (const geo of geometries) {
    // Copy vertices
    vertices.set(geo.vertices, vertexOffset);
    vertexOffset += geo.vertices.length;

    // Copy indices with offset
    for (let i = 0; i < geo.indexCount; i++) {
      indices[indexOffset++] = geo.indices[i] + baseVertex;
    }
    baseVertex += geo.vertexCount;
  }

  return {
    vertices,
    indices,
    vertexCount: totalVertices,
    indexCount: totalIndices,
  };
}
