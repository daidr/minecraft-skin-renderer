/**
 * Bone Matrix Computer
 *
 * Computes world matrices for all bones in the skeleton hierarchy.
 * Separated from SkinViewer for better modularity and testability.
 */

import { mat4Identity, mat4Multiply, mat4Translate, quatToMat4 } from "../core/math";
import type { Mat4 } from "../core/math";
import { BoneIndex } from "../model/types";
import type { PlayerSkeleton } from "../model/types";

/** Bone processing order (parent-first) */
const BONE_ORDER = [
  BoneIndex.Root,
  BoneIndex.Body,
  BoneIndex.Head,
  BoneIndex.RightArm,
  BoneIndex.LeftArm,
  BoneIndex.RightLeg,
  BoneIndex.LeftLeg,
  BoneIndex.HeadOverlay,
  BoneIndex.BodyOverlay,
  BoneIndex.RightArmOverlay,
  BoneIndex.LeftArmOverlay,
  BoneIndex.RightLegOverlay,
  BoneIndex.LeftLegOverlay,
  BoneIndex.Cape,
  BoneIndex.LeftWing,
  BoneIndex.RightWing,
];

/** Number of bones in the skeleton */
export const BONE_COUNT = 24;

/** Size of bone matrix data in floats */
export const BONE_MATRICES_SIZE: number = BONE_COUNT * 16;

/**
 * Bone matrix cache for efficient updates.
 * Maintains a dirty flag to avoid unnecessary recalculations.
 */
export interface BoneMatrixCache {
  /** Pre-allocated Float32Array for all bone matrices */
  matrices: Float32Array;
  /** Whether the matrices need to be recomputed */
  dirty: boolean;
}

/**
 * Create a new bone matrix cache
 */
export function createBoneMatrixCache(): BoneMatrixCache {
  return {
    matrices: new Float32Array(BONE_MATRICES_SIZE),
    dirty: true,
  };
}

/**
 * Compute bone matrices for the skeleton.
 *
 * This computes the world-space transformation matrix for each bone,
 * taking into account the bone hierarchy (parent transforms propagate to children).
 *
 * @param skeleton - The player skeleton with bone transforms
 * @returns Float32Array containing all bone matrices (24 bones * 16 floats each)
 */
export function computeBoneMatrices(skeleton: PlayerSkeleton): Float32Array {
  const matrices = new Float32Array(BONE_MATRICES_SIZE);

  // Helper to set matrix for bone index
  const setMatrix = (index: number, matrix: Mat4) => {
    matrices.set(matrix, index * 16);
  };

  // Initialize all matrices to identity
  for (let i = 0; i < BONE_COUNT; i++) {
    setMatrix(i, mat4Identity());
  }

  // Compute world matrices for each bone
  const worldMatrices = new Map<BoneIndex, Mat4>();

  // Process bones in parent-first order
  for (const boneIndex of BONE_ORDER) {
    const bone = skeleton.bones.get(boneIndex);
    if (!bone) continue;

    // Get parent matrix
    let parentMatrix = mat4Identity();
    if (bone.parentIndex !== null) {
      parentMatrix = worldMatrices.get(bone.parentIndex) ?? mat4Identity();
    }

    // Compute local matrix:
    // 1. Translate to bone position (relative to parent) + animation offset
    // 2. Apply rotation around pivot point
    const pos = bone.position;
    const offset = bone.positionOffset;
    const pivot = bone.pivot;

    // Local transform: translate to position, then rotate around pivot
    let localMatrix = mat4Identity();

    // Translate to bone position + animation offset
    localMatrix = mat4Translate(localMatrix, [
      pos[0] + offset[0],
      pos[1] + offset[1],
      pos[2] + offset[2],
    ]);

    // Translate to pivot, rotate, translate back
    localMatrix = mat4Translate(localMatrix, pivot);
    localMatrix = mat4Multiply(localMatrix, quatToMat4(bone.rotation));
    localMatrix = mat4Translate(localMatrix, [-pivot[0], -pivot[1], -pivot[2]]);

    // Compute world matrix
    const worldMatrix = mat4Multiply(parentMatrix, localMatrix);
    worldMatrices.set(boneIndex, worldMatrix);

    // Store in uniform buffer
    setMatrix(boneIndex, worldMatrix);
  }

  return matrices;
}

/**
 * Update bone matrix cache if dirty.
 *
 * @param cache - The bone matrix cache to update
 * @param skeleton - The player skeleton
 * @returns true if matrices were recomputed, false if cache was valid
 */
export function updateBoneMatrixCache(cache: BoneMatrixCache, skeleton: PlayerSkeleton): boolean {
  if (!cache.dirty) {
    return false;
  }

  const newMatrices = computeBoneMatrices(skeleton);
  cache.matrices.set(newMatrices);
  cache.dirty = false;

  return true;
}

/**
 * Mark the bone matrix cache as dirty (needs recomputation).
 */
export function markBoneMatricesDirty(cache: BoneMatrixCache): void {
  cache.dirty = true;
}
