/**
 * Model system types
 */

import type { Mat4, Quat, Vec3 } from "../core/math";

/** Model variant (arm width) */
export type ModelVariant = "classic" | "slim";

/** Bone index constants */
export enum BoneIndex {
  Root = 0,
  Head = 1,
  Body = 2,
  LeftArm = 3,
  RightArm = 4,
  LeftLeg = 5,
  RightLeg = 6,
  // Overlay layers (same transform as parent)
  HeadOverlay = 7,
  BodyOverlay = 8,
  LeftArmOverlay = 9,
  RightArmOverlay = 10,
  LeftLegOverlay = 11,
  RightLegOverlay = 12,
  // Cape and elytra
  Cape = 13,
  LeftWing = 14,
  RightWing = 15,
}

/** Bone definition */
export interface Bone {
  index: BoneIndex;
  name: string;
  parentIndex: BoneIndex | null;
  position: Vec3; // Local position relative to parent
  pivot: Vec3; // Pivot point for rotation
  rotation: Quat; // Current rotation
  size: Vec3; // Size of the associated geometry
}

/** Player skeleton with all bones */
export interface PlayerSkeleton {
  variant: ModelVariant;
  bones: Map<BoneIndex, Bone>;
}

/** Box geometry data */
export interface BoxGeometry {
  vertices: Float32Array; // position + uv + normal + boneIndex
  indices: Uint16Array;
  vertexCount: number;
  indexCount: number;
}

/** UV coordinates for a face */
export interface FaceUV {
  u1: number; // Left U (0-64)
  v1: number; // Top V (0-64)
  u2: number; // Right U (0-64)
  v2: number; // Bottom V (0-64)
}

/** UV mapping for a box (6 faces) */
export interface BoxUV {
  front: FaceUV;
  back: FaceUV;
  left: FaceUV;
  right: FaceUV;
  top: FaceUV;
  bottom: FaceUV;
}

/** Part UV mapping with inner and outer layer */
export interface PartUV {
  inner: BoxUV;
  outer: BoxUV;
}

/** Complete skin UV mapping */
export interface SkinUVMap {
  head: PartUV;
  body: PartUV;
  leftArm: PartUV;
  rightArm: PartUV;
  leftLeg: PartUV;
  rightLeg: PartUV;
}

/** Vertex data stride (floats per vertex) */
export const VERTEX_STRIDE = 10; // 3 pos + 2 uv + 3 normal + 1 boneIndex + 1 padding

/** Get bone matrix from bone state */
export function getBoneLocalMatrix(bone: Bone): Mat4 {
  // Import dynamically to avoid circular dependency
  const { mat4Identity, mat4Translate, mat4Multiply } = require("../core/math");
  const { quatToMat4 } = require("../core/math");

  // Translate to pivot, rotate, translate back, then apply position
  let matrix = mat4Identity();

  // Apply position offset
  matrix = mat4Translate(matrix, bone.position);

  // Move to pivot point
  matrix = mat4Translate(matrix, bone.pivot);

  // Apply rotation
  const rotMatrix = quatToMat4(bone.rotation);
  matrix = mat4Multiply(matrix, rotMatrix);

  // Move back from pivot
  matrix = mat4Translate(matrix, [-bone.pivot[0], -bone.pivot[1], -bone.pivot[2]]);

  return matrix;
}
