/**
 * Bone Matrix Computer
 *
 * Computes world matrices for all bones in the skeleton hierarchy.
 * Separated from SkinViewer for better modularity and testability.
 */

import { mat4IdentityMut, mat4MultiplyMut, mat4TranslateMut, quatToMat4Mut } from "../core/math";
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

// Pre-allocated working matrices to avoid per-frame allocations
const _localMatrix: Mat4 = new Float32Array(16);
const _rotMatrix: Mat4 = new Float32Array(16);
const _tempMatrix: Mat4 = new Float32Array(16);
const _identityMatrix: Mat4 = new Float32Array(16);
mat4IdentityMut(_identityMatrix);

// Pre-allocated world matrices for each bone in BONE_ORDER
const _worldMatrices: Mat4[] = BONE_ORDER.map(() => new Float32Array(16));
// Map from BoneIndex to pre-allocated world matrix
const _worldMatrixIndex = new Map<BoneIndex, number>();
for (let i = 0; i < BONE_ORDER.length; i++) {
  _worldMatrixIndex.set(BONE_ORDER[i], i);
}

// Pre-allocated Vec3 to avoid temporary array creation
const _translateVec: [number, number, number] = [0, 0, 0];

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
 * Compute bone matrices for the skeleton, writing directly into the output buffer.
 *
 * This computes the world-space transformation matrix for each bone,
 * taking into account the bone hierarchy (parent transforms propagate to children).
 *
 * @param skeleton - The player skeleton with bone transforms
 * @param out - Pre-allocated Float32Array to write results into (24 bones * 16 floats)
 */
export function computeBoneMatrices(skeleton: PlayerSkeleton, out: Float32Array): void {
  // Initialize all matrices to identity
  out.fill(0);
  for (let i = 0; i < BONE_COUNT; i++) {
    const offset = i * 16;
    out[offset] = out[offset + 5] = out[offset + 10] = out[offset + 15] = 1;
  }

  // Process bones in parent-first order
  for (let bi = 0; bi < BONE_ORDER.length; bi++) {
    const boneIndex = BONE_ORDER[bi];
    const bone = skeleton.bones.get(boneIndex);
    if (!bone) continue;

    // Get parent world matrix (identity if root)
    let parentMatrix: Mat4 = _identityMatrix;
    if (bone.parentIndex !== null) {
      const parentIdx = _worldMatrixIndex.get(bone.parentIndex);
      if (parentIdx !== undefined) {
        parentMatrix = _worldMatrices[parentIdx];
      }
    }

    // Build local transform: translate to position, then rotate around pivot
    const pos = bone.position;
    const offset = bone.positionOffset;
    const pivot = bone.pivot;

    // Start with identity
    mat4IdentityMut(_localMatrix);

    // Translate to bone position + animation offset
    _translateVec[0] = pos[0] + offset[0];
    _translateVec[1] = pos[1] + offset[1];
    _translateVec[2] = pos[2] + offset[2];
    mat4TranslateMut(_localMatrix, _localMatrix, _translateVec);

    // Translate to pivot
    mat4TranslateMut(_localMatrix, _localMatrix, pivot);

    // Rotate
    quatToMat4Mut(_rotMatrix, bone.rotation);
    mat4MultiplyMut(_tempMatrix, _localMatrix, _rotMatrix);

    // Translate back from pivot
    _translateVec[0] = -pivot[0];
    _translateVec[1] = -pivot[1];
    _translateVec[2] = -pivot[2];
    mat4TranslateMut(_localMatrix, _tempMatrix, _translateVec);

    // Compute world matrix: parent * local
    const worldMatrix = _worldMatrices[bi];
    mat4MultiplyMut(worldMatrix, parentMatrix, _localMatrix);

    // Store in output buffer
    out.set(worldMatrix, boneIndex * 16);
  }
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

  computeBoneMatrices(skeleton, cache.matrices);
  cache.dirty = false;

  return true;
}

/**
 * Mark the bone matrix cache as dirty (needs recomputation).
 */
export function markBoneMatricesDirty(cache: BoneMatrixCache): void {
  cache.dirty = true;
}
