/**
 * Model system types
 */

import type { Quat, Vec3 } from "../core/math";

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
  positionOffset: Vec3; // Animation-driven position offset
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

/** Part name type */
export type PartName = "head" | "body" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

/** Layer visibility for a single part */
export interface LayerVisibility {
  inner: boolean;
  outer: boolean;
}

/** Layer mask for quick visibility checks (internal use) */
export enum LayerMask {
  None = 0,
  Inner = 1 << 0,
  Outer = 1 << 1,
  Both = Inner | Outer,
}

/** Convert LayerVisibility to LayerMask */
export function visibilityToMask(visibility: LayerVisibility): LayerMask {
  return (visibility.inner ? LayerMask.Inner : 0) | (visibility.outer ? LayerMask.Outer : 0);
}

/** Convert LayerMask to LayerVisibility */
export function maskToVisibility(mask: LayerMask): LayerVisibility {
  return {
    inner: (mask & LayerMask.Inner) !== 0,
    outer: (mask & LayerMask.Outer) !== 0,
  };
}

/** Visibility settings for all skin parts */
export interface PartsVisibility {
  head: LayerVisibility;
  body: LayerVisibility;
  leftArm: LayerVisibility;
  rightArm: LayerVisibility;
  leftLeg: LayerVisibility;
  rightLeg: LayerVisibility;
}

/** All part names */
export const PART_NAMES: PartName[] = [
  "head",
  "body",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/** Create default visibility (all visible) */
export function createDefaultVisibility(): PartsVisibility {
  return {
    head: { inner: true, outer: true },
    body: { inner: true, outer: true },
    leftArm: { inner: true, outer: true },
    rightArm: { inner: true, outer: true },
    leftLeg: { inner: true, outer: true },
    rightLeg: { inner: true, outer: true },
  };
}

/** Vertex data stride (floats per vertex) */
export const VERTEX_STRIDE = 10; // 3 pos + 2 uv + 3 normal + 1 boneIndex + 1 padding

// Re-export getBoneLocalMatrix from bone-utils to maintain backwards compatibility
// This avoids circular dependency between model/types and core/math
export { getBoneLocalMatrix } from "./bone-utils";
