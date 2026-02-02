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

/** Face indices for a cube */
enum Face {
  Front = 0, // +Z
  Back = 1, // -Z
  Left = 2, // -X
  Right = 3, // +X
  Top = 4, // +Y
  Bottom = 5, // -Y
}

/** Normal vectors for each face */
const FACE_NORMALS: Vec3[] = [
  [0, 0, 1], // Front
  [0, 0, -1], // Back
  [-1, 0, 0], // Left
  [1, 0, 0], // Right
  [0, 1, 0], // Top
  [0, -1, 0], // Bottom
];

/** UV inset constant (imported from constants) */
const UV_INSET = UV_EDGE_INSET;

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

  const ox = offset[0];
  const oy = offset[1];
  const oz = offset[2];

  // 6 faces, 4 vertices each
  const vertexCount = 24;
  const indexCount = 36;

  const vertices = new Float32Array(vertexCount * VERTEX_STRIDE);
  const indices = new Uint16Array(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;
  let baseVertex = 0;

  // Mirror factor for X coordinates
  const mx = mirrorX ? -1 : 1;

  const addVertex = (
    x: number,
    y: number,
    z: number,
    u: number,
    v: number,
    nx: number,
    ny: number,
    nz: number,
  ) => {
    vertices[vertexOffset++] = x * mx;
    vertices[vertexOffset++] = y;
    vertices[vertexOffset++] = z;
    vertices[vertexOffset++] = u;
    vertices[vertexOffset++] = v;
    vertices[vertexOffset++] = nx * mx;
    vertices[vertexOffset++] = ny;
    vertices[vertexOffset++] = nz;
    vertices[vertexOffset++] = boneIndex;
    vertices[vertexOffset++] = 0; // padding
  };

  // When mirrored, reverse winding order to maintain correct face culling
  const addFaceIndices = () => {
    if (mirrorX) {
      indices[indexOffset++] = baseVertex + 2;
      indices[indexOffset++] = baseVertex + 1;
      indices[indexOffset++] = baseVertex;
      indices[indexOffset++] = baseVertex;
      indices[indexOffset++] = baseVertex + 3;
      indices[indexOffset++] = baseVertex + 2;
    } else {
      indices[indexOffset++] = baseVertex;
      indices[indexOffset++] = baseVertex + 1;
      indices[indexOffset++] = baseVertex + 2;
      indices[indexOffset++] = baseVertex + 2;
      indices[indexOffset++] = baseVertex + 3;
      indices[indexOffset++] = baseVertex;
    }
    baseVertex += 4;
  };

  // Convert UV from pixel coordinates to 0-1 range
  // Applies UV_INSET towards the center to prevent edge bleeding
  const normalizeUV = (faceUV: {
    u1: number;
    v1: number;
    u2: number;
    v2: number;
  }): [number, number, number, number] => {
    let u1 = faceUV.u1 / textureWidth;
    let u2 = faceUV.u2 / textureWidth;
    let v1 = faceUV.v1 / textureHeight;
    let v2 = faceUV.v2 / textureHeight;

    // Inset towards the center of the UV region
    // When u1 < u2 (normal), shrink inward: u1 increases, u2 decreases
    // When u1 > u2 (flipped), shrink inward: u1 decreases, u2 increases
    if (u1 < u2) {
      u1 += UV_INSET;
      u2 -= UV_INSET;
    } else {
      u1 -= UV_INSET;
      u2 += UV_INSET;
    }

    if (v1 < v2) {
      v1 += UV_INSET;
      v2 -= UV_INSET;
    } else {
      v1 -= UV_INSET;
      v2 += UV_INSET;
    }

    return [u1, v1, u2, v2];
  };

  if (capeUVMode) {
    // Cape/Elytra UV mapping mode
    // Front face (+Z)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.front);
      const [nx, ny, nz] = FACE_NORMALS[Face.Front];
      addVertex(ox - hw, oy - hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz + hd, u1, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz + hd, u1, v1, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz + hd, u2, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Back face (-Z)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.back);
      const [nx, ny, nz] = FACE_NORMALS[Face.Back];
      addVertex(ox + hw, oy - hh, oz - hd, u2, v2, nx, ny, nz);
      addVertex(ox - hw, oy - hh, oz - hd, u1, v2, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz - hd, u1, v1, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz - hd, u2, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Left face (-X)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.left);
      const [nx, ny, nz] = FACE_NORMALS[Face.Left];
      addVertex(ox - hw, oy - hh, oz - hd, u2, v2, nx, ny, nz);
      addVertex(ox - hw, oy - hh, oz + hd, u1, v2, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz + hd, u1, v1, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz - hd, u2, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Right face (+X)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.right);
      const [nx, ny, nz] = FACE_NORMALS[Face.Right];
      addVertex(ox + hw, oy - hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz - hd, u1, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz - hd, u1, v1, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz + hd, u2, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Top face (+Y)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.top);
      const [nx, ny, nz] = FACE_NORMALS[Face.Top];
      addVertex(ox - hw, oy + hh, oz + hd, u1, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz - hd, u2, v1, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz - hd, u1, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Bottom face (-Y)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.bottom);
      const [nx, ny, nz] = FACE_NORMALS[Face.Bottom];
      addVertex(ox - hw, oy - hh, oz - hd, u1, v1, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz - hd, u2, v1, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox - hw, oy - hh, oz + hd, u1, v2, nx, ny, nz);
      addFaceIndices();
    }
  } else {
    // Standard skin UV mapping mode
    // Front face (+Z)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.front);
      const [nx, ny, nz] = FACE_NORMALS[Face.Front];
      addVertex(ox - hw, oy - hh, oz + hd, u1, v2, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz + hd, u2, v1, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz + hd, u1, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Back face (-Z)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.back);
      const [nx, ny, nz] = FACE_NORMALS[Face.Back];
      addVertex(ox + hw, oy - hh, oz - hd, u1, v2, nx, ny, nz);
      addVertex(ox - hw, oy - hh, oz - hd, u2, v2, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz - hd, u2, v1, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz - hd, u1, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Left face (-X) - uses uv.right (character's right side)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.right);
      const [nx, ny, nz] = FACE_NORMALS[Face.Left];
      addVertex(ox - hw, oy - hh, oz - hd, u1, v2, nx, ny, nz);
      addVertex(ox - hw, oy - hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz + hd, u2, v1, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz - hd, u1, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Right face (+X) - uses uv.left (character's left side)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.left);
      const [nx, ny, nz] = FACE_NORMALS[Face.Right];
      addVertex(ox + hw, oy - hh, oz + hd, u1, v2, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz - hd, u2, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz - hd, u2, v1, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz + hd, u1, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Top face (+Y)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.top);
      const [nx, ny, nz] = FACE_NORMALS[Face.Top];
      addVertex(ox - hw, oy + hh, oz + hd, u1, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox + hw, oy + hh, oz - hd, u2, v1, nx, ny, nz);
      addVertex(ox - hw, oy + hh, oz - hd, u1, v1, nx, ny, nz);
      addFaceIndices();
    }

    // Bottom face (-Y)
    {
      const [u1, v1, u2, v2] = normalizeUV(uv.bottom);
      const [nx, ny, nz] = FACE_NORMALS[Face.Bottom];
      addVertex(ox - hw, oy - hh, oz - hd, u1, v1, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz - hd, u2, v1, nx, ny, nz);
      addVertex(ox + hw, oy - hh, oz + hd, u2, v2, nx, ny, nz);
      addVertex(ox - hw, oy - hh, oz + hd, u1, v2, nx, ny, nz);
      addFaceIndices();
    }
  }

  return {
    vertices,
    indices,
    vertexCount,
    indexCount,
  };
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
