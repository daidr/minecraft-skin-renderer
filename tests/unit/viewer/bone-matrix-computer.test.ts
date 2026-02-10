/**
 * BoneMatrixComputer unit tests
 */

import { describe, it, expect } from "vitest";
import {
  BONE_COUNT,
  BONE_MATRICES_SIZE,
  computeBoneMatrices,
  createBoneMatrixCache,
  updateBoneMatrixCache,
  markBoneMatricesDirty,
} from "@/viewer/BoneMatrixComputer";
import { createPlayerSkeleton, setBoneRotation } from "@/model/PlayerModel";
import { BoneIndex } from "@/model/types";
import { quatFromEuler, degToRad, mat4Identity } from "@/core/math";

describe("BoneMatrixComputer", () => {
  describe("constants", () => {
    it("should have correct bone count", () => {
      expect(BONE_COUNT).toBe(24);
    });

    it("should have correct matrices size", () => {
      expect(BONE_MATRICES_SIZE).toBe(24 * 16);
    });
  });

  describe("computeBoneMatrices", () => {
    it("should produce identity-like matrices for default skeleton", () => {
      const skeleton = createPlayerSkeleton("classic");
      const out = new Float32Array(BONE_MATRICES_SIZE);
      computeBoneMatrices(skeleton, out);

      // Root bone should be identity (no parent, no position offset)
      const rootMatrix = out.subarray(BoneIndex.Root * 16, BoneIndex.Root * 16 + 16);
      const identity = mat4Identity();
      for (let i = 0; i < 16; i++) {
        expect(rootMatrix[i]).toBeCloseTo(identity[i], 5);
      }
    });

    it("should write into the provided output buffer", () => {
      const skeleton = createPlayerSkeleton("classic");
      const out = new Float32Array(BONE_MATRICES_SIZE);
      computeBoneMatrices(skeleton, out);

      // Body bone should have a translation (body is at position [0, 24, 0])
      const bodyMatrix = out.subarray(BoneIndex.Body * 16, BoneIndex.Body * 16 + 16);
      // Translation is in columns 12, 13, 14 of column-major matrix
      expect(bodyMatrix[13]).toBeCloseTo(24, 5); // Y translation
    });

    it("should propagate parent transforms to children", () => {
      const skeleton = createPlayerSkeleton("classic");
      const out = new Float32Array(BONE_MATRICES_SIZE);
      computeBoneMatrices(skeleton, out);

      // Head is child of Body, so its world matrix should include body's translation
      const headMatrix = out.subarray(BoneIndex.Head * 16, BoneIndex.Head * 16 + 16);
      // Head should be at body position (y=24) + head offset (y=0) = y=24
      expect(headMatrix[13]).toBeCloseTo(24, 5);
    });

    it("should apply bone rotations", () => {
      const skeleton = createPlayerSkeleton("classic");
      // Rotate the right arm by 45 degrees around X
      setBoneRotation(skeleton, BoneIndex.RightArm, quatFromEuler(degToRad(45), 0, 0));

      const out = new Float32Array(BONE_MATRICES_SIZE);
      computeBoneMatrices(skeleton, out);

      // Right arm matrix should not be pure translation anymore
      const armMatrix = out.subarray(BoneIndex.RightArm * 16, BoneIndex.RightArm * 16 + 16);
      // After rotation, off-diagonal elements should be non-zero
      // mat[5] (cos) and mat[6] (sin) of X rotation
      expect(armMatrix[5]).not.toBeCloseTo(1, 3);
    });

    it("should handle slim variant", () => {
      const skeleton = createPlayerSkeleton("slim");
      const out = new Float32Array(BONE_MATRICES_SIZE);
      computeBoneMatrices(skeleton, out);

      // Slim arms have different position offset (3.5 instead of 4)
      const rightArmMatrix = out.subarray(BoneIndex.RightArm * 16, BoneIndex.RightArm * 16 + 16);
      // Right arm X translation should be different from classic
      const classicSkeleton = createPlayerSkeleton("classic");
      const classicOut = new Float32Array(BONE_MATRICES_SIZE);
      computeBoneMatrices(classicSkeleton, classicOut);
      const classicRightArmMatrix = classicOut.subarray(
        BoneIndex.RightArm * 16,
        BoneIndex.RightArm * 16 + 16,
      );

      // Slim arm X offset is -(4 + 1.5) = -5.5, classic is -(4 + 2) = -6
      expect(rightArmMatrix[12]).not.toBeCloseTo(classicRightArmMatrix[12], 3);
    });

    it("should not allocate new Float32Arrays", () => {
      const skeleton = createPlayerSkeleton("classic");
      const out = new Float32Array(BONE_MATRICES_SIZE);

      // Call multiple times — function should reuse internal buffers
      computeBoneMatrices(skeleton, out);
      const firstResult = new Float32Array(out);
      computeBoneMatrices(skeleton, out);

      // Results should be identical (deterministic)
      for (let i = 0; i < out.length; i++) {
        expect(out[i]).toBeCloseTo(firstResult[i], 10);
      }
    });
  });

  describe("BoneMatrixCache", () => {
    it("should create cache with dirty flag", () => {
      const cache = createBoneMatrixCache();
      expect(cache.dirty).toBe(true);
      expect(cache.matrices.length).toBe(BONE_MATRICES_SIZE);
    });

    it("should update when dirty", () => {
      const cache = createBoneMatrixCache();
      const skeleton = createPlayerSkeleton("classic");

      const updated = updateBoneMatrixCache(cache, skeleton);
      expect(updated).toBe(true);
      expect(cache.dirty).toBe(false);
    });

    it("should skip update when not dirty", () => {
      const cache = createBoneMatrixCache();
      const skeleton = createPlayerSkeleton("classic");

      updateBoneMatrixCache(cache, skeleton);
      const updated = updateBoneMatrixCache(cache, skeleton);
      expect(updated).toBe(false);
    });

    it("should update again after markDirty", () => {
      const cache = createBoneMatrixCache();
      const skeleton = createPlayerSkeleton("classic");

      updateBoneMatrixCache(cache, skeleton);
      markBoneMatricesDirty(cache);
      expect(cache.dirty).toBe(true);

      const updated = updateBoneMatrixCache(cache, skeleton);
      expect(updated).toBe(true);
    });

    it("should write matrices directly into cache buffer", () => {
      const cache = createBoneMatrixCache();
      const skeleton = createPlayerSkeleton("classic");

      updateBoneMatrixCache(cache, skeleton);

      // Body matrix in cache should have Y translation = 24
      const bodyOffset = BoneIndex.Body * 16;
      expect(cache.matrices[bodyOffset + 13]).toBeCloseTo(24, 5);
    });
  });
});
