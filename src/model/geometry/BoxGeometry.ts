/**
 * Box geometry generation for Minecraft model parts
 */

import type { Vec3 } from "../../core/math";
import { BoneIndex, VERTEX_STRIDE } from "../types";
import type { BoxGeometry, BoxUV } from "../types";
import { CAPE_TEXTURE_WIDTH, CAPE_TEXTURE_HEIGHT } from "../uv/CapeUV";

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

/**
 * Create box geometry with UV mapping
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
  const hw = size[0] / 2 + inflate;
  const hh = size[1] / 2 + inflate;
  const hd = size[2] / 2 + inflate;

  const ox = offset[0];
  const oy = offset[1];
  const oz = offset[2];

  // 6 faces, 4 vertices each
  const vertexCount = 24;
  const indexCount = 36;

  // Vertex data: position (3) + uv (2) + normal (3) + boneIndex (1) + padding (1)
  const vertices = new Float32Array(vertexCount * VERTEX_STRIDE);
  const indices = new Uint16Array(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;
  let baseVertex = 0;

  // Helper to add a vertex
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
    vertices[vertexOffset++] = x;
    vertices[vertexOffset++] = y;
    vertices[vertexOffset++] = z;
    vertices[vertexOffset++] = u;
    vertices[vertexOffset++] = v;
    vertices[vertexOffset++] = nx;
    vertices[vertexOffset++] = ny;
    vertices[vertexOffset++] = nz;
    vertices[vertexOffset++] = boneIndex;
    vertices[vertexOffset++] = 0; // padding
  };

  // Helper to add face indices (two triangles)
  const addFaceIndices = () => {
    indices[indexOffset++] = baseVertex;
    indices[indexOffset++] = baseVertex + 1;
    indices[indexOffset++] = baseVertex + 2;
    indices[indexOffset++] = baseVertex + 2;
    indices[indexOffset++] = baseVertex + 3;
    indices[indexOffset++] = baseVertex;
    baseVertex += 4;
  };

  // Convert UV from pixel coordinates to 0-1 range
  const normalizeUV = (faceUV: {
    u1: number;
    v1: number;
    u2: number;
    v2: number;
  }): [number, number, number, number] => {
    return [faceUV.u1 / 64, faceUV.v1 / 64, faceUV.u2 / 64, faceUV.v2 / 64];
  };

  // Front face (+Z)
  {
    const [u1, v1, u2, v2] = normalizeUV(uv.front);
    const [nx, ny, nz] = FACE_NORMALS[Face.Front];
    addVertex(ox - hw, oy - hh, oz + hd, u2, v2, nx, ny, nz); // bottom-left
    addVertex(ox + hw, oy - hh, oz + hd, u1, v2, nx, ny, nz); // bottom-right
    addVertex(ox + hw, oy + hh, oz + hd, u1, v1, nx, ny, nz); // top-right
    addVertex(ox - hw, oy + hh, oz + hd, u2, v1, nx, ny, nz); // top-left
    addFaceIndices();
  }

  // Back face (-Z)
  {
    const [u1, v1, u2, v2] = normalizeUV(uv.back);
    const [nx, ny, nz] = FACE_NORMALS[Face.Back];
    addVertex(ox + hw, oy - hh, oz - hd, u2, v2, nx, ny, nz); // bottom-left
    addVertex(ox - hw, oy - hh, oz - hd, u1, v2, nx, ny, nz); // bottom-right
    addVertex(ox - hw, oy + hh, oz - hd, u1, v1, nx, ny, nz); // top-right
    addVertex(ox + hw, oy + hh, oz - hd, u2, v1, nx, ny, nz); // top-left
    addFaceIndices();
  }

  // Left face (-X)
  {
    const [u1, v1, u2, v2] = normalizeUV(uv.left);
    const [nx, ny, nz] = FACE_NORMALS[Face.Left];
    addVertex(ox - hw, oy - hh, oz - hd, u2, v2, nx, ny, nz); // bottom-left
    addVertex(ox - hw, oy - hh, oz + hd, u1, v2, nx, ny, nz); // bottom-right
    addVertex(ox - hw, oy + hh, oz + hd, u1, v1, nx, ny, nz); // top-right
    addVertex(ox - hw, oy + hh, oz - hd, u2, v1, nx, ny, nz); // top-left
    addFaceIndices();
  }

  // Right face (+X)
  {
    const [u1, v1, u2, v2] = normalizeUV(uv.right);
    const [nx, ny, nz] = FACE_NORMALS[Face.Right];
    addVertex(ox + hw, oy - hh, oz + hd, u2, v2, nx, ny, nz); // bottom-left
    addVertex(ox + hw, oy - hh, oz - hd, u1, v2, nx, ny, nz); // bottom-right
    addVertex(ox + hw, oy + hh, oz - hd, u1, v1, nx, ny, nz); // top-right
    addVertex(ox + hw, oy + hh, oz + hd, u2, v1, nx, ny, nz); // top-left
    addFaceIndices();
  }

  // Top face (+Y)
  {
    const [u1, v1, u2, v2] = normalizeUV(uv.top);
    const [nx, ny, nz] = FACE_NORMALS[Face.Top];
    addVertex(ox - hw, oy + hh, oz + hd, u1, v2, nx, ny, nz); // front-left
    addVertex(ox + hw, oy + hh, oz + hd, u2, v2, nx, ny, nz); // front-right
    addVertex(ox + hw, oy + hh, oz - hd, u2, v1, nx, ny, nz); // back-right
    addVertex(ox - hw, oy + hh, oz - hd, u1, v1, nx, ny, nz); // back-left
    addFaceIndices();
  }

  // Bottom face (-Y)
  {
    const [u1, v1, u2, v2] = normalizeUV(uv.bottom);
    const [nx, ny, nz] = FACE_NORMALS[Face.Bottom];
    addVertex(ox - hw, oy - hh, oz - hd, u1, v1, nx, ny, nz); // back-left
    addVertex(ox + hw, oy - hh, oz - hd, u2, v1, nx, ny, nz); // back-right
    addVertex(ox + hw, oy - hh, oz + hd, u2, v2, nx, ny, nz); // front-right
    addVertex(ox - hw, oy - hh, oz + hd, u1, v2, nx, ny, nz); // front-left
    addFaceIndices();
  }

  return {
    vertices,
    indices,
    vertexCount,
    indexCount,
  };
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

/**
 * Create box geometry for cape/elytra with 64x32 texture
 * Follows the same pattern as createBoxGeometry but for cape texture format
 *
 * @param size - Box dimensions [width, height, depth]
 * @param uv - UV mapping for each face (in pixels, 64x32 texture)
 * @param boneIndex - Bone index for skeletal animation
 * @param offset - Position offset from bone origin
 * @param mirrorX - Mirror the geometry along X axis (for right elytra wing, like skinview3d's scale.x=-1)
 */
export function createCapeBoxGeometry(
  size: Vec3,
  uv: BoxUV,
  boneIndex: BoneIndex,
  offset: Vec3 = [0, 0, 0],
  mirrorX = false,
): BoxGeometry {
  const hw = size[0] / 2;
  const hh = size[1] / 2;
  const hd = size[2] / 2;

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

  // Mirror factor for X coordinates (like skinview3d's scale.x = -1)
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
    vertices[vertexOffset++] = x * mx; // Apply mirror to X
    vertices[vertexOffset++] = y;
    vertices[vertexOffset++] = z;
    vertices[vertexOffset++] = u;
    vertices[vertexOffset++] = v;
    vertices[vertexOffset++] = nx * mx; // Mirror normal too
    vertices[vertexOffset++] = ny;
    vertices[vertexOffset++] = nz;
    vertices[vertexOffset++] = boneIndex;
    vertices[vertexOffset++] = 0;
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

  // Convert UV from pixel coordinates to 0-1 range (64x32 texture)
  const normalizeUV = (faceUV: {
    u1: number;
    v1: number;
    u2: number;
    v2: number;
  }): [number, number, number, number] => {
    return [
      faceUV.u1 / CAPE_TEXTURE_WIDTH,
      faceUV.v1 / CAPE_TEXTURE_HEIGHT,
      faceUV.u2 / CAPE_TEXTURE_WIDTH,
      faceUV.v2 / CAPE_TEXTURE_HEIGHT,
    ];
  };

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

  return {
    vertices,
    indices,
    vertexCount,
    indexCount,
  };
}
