/**
 * PlayerModel unit tests
 */

import { describe, it, expect } from "vitest";
import {
  createPlayerSkeleton,
  setBoneRotation,
  setBonePositionOffset,
  resetSkeleton,
  cloneSkeleton,
} from "@/model/PlayerModel";
import { BoneIndex } from "@/model/types";
import { quatFromEuler, quatIdentity } from "@/core/math/quat";

describe("PlayerModel", () => {
  describe("createPlayerSkeleton", () => {
    it("should create classic skeleton", () => {
      const skeleton = createPlayerSkeleton("classic");

      expect(skeleton.variant).toBe("classic");
      expect(skeleton.bones.size).toBeGreaterThan(0);
      expect(skeleton.bones.has(BoneIndex.Head)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.Body)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.LeftArm)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.RightArm)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.LeftLeg)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.RightLeg)).toBe(true);
    });

    it("should create slim skeleton", () => {
      const skeleton = createPlayerSkeleton("slim");

      expect(skeleton.variant).toBe("slim");

      // Check arm width is 3 for slim
      const leftArm = skeleton.bones.get(BoneIndex.LeftArm);
      expect(leftArm?.size[0]).toBe(3);
    });

    it("should have correct bone hierarchy", () => {
      const skeleton = createPlayerSkeleton("classic");

      const head = skeleton.bones.get(BoneIndex.Head);
      const body = skeleton.bones.get(BoneIndex.Body);
      const root = skeleton.bones.get(BoneIndex.Root);

      expect(head?.parentIndex).toBe(BoneIndex.Body);
      expect(body?.parentIndex).toBe(BoneIndex.Root);
      expect(root?.parentIndex).toBeNull();
    });

    it("should include overlay bones", () => {
      const skeleton = createPlayerSkeleton("classic");

      expect(skeleton.bones.has(BoneIndex.HeadOverlay)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.BodyOverlay)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.LeftArmOverlay)).toBe(true);
      expect(skeleton.bones.has(BoneIndex.RightArmOverlay)).toBe(true);
    });
  });

  describe("setBoneRotation", () => {
    it("should set bone rotation", () => {
      const skeleton = createPlayerSkeleton("classic");
      const rotation = quatFromEuler(0.5, 0, 0);

      setBoneRotation(skeleton, BoneIndex.Head, rotation);

      const head = skeleton.bones.get(BoneIndex.Head);
      expect(head?.rotation).toEqual(rotation);
    });

    it("should handle invalid bone index", () => {
      const skeleton = createPlayerSkeleton("classic");

      // Should not throw
      setBoneRotation(skeleton, 999 as BoneIndex, quatIdentity());
    });
  });

  describe("setBonePositionOffset", () => {
    it("should set bone position offset", () => {
      const skeleton = createPlayerSkeleton("classic");
      const offset: [number, number, number] = [1, 2, 3];

      setBonePositionOffset(skeleton, BoneIndex.Head, offset);

      const head = skeleton.bones.get(BoneIndex.Head);
      expect(head?.positionOffset).toEqual([1, 2, 3]);
    });

    it("should handle invalid bone index", () => {
      const skeleton = createPlayerSkeleton("classic");

      // Should not throw
      setBonePositionOffset(skeleton, 999 as BoneIndex, [1, 2, 3]);
    });

    it("should allow negative offsets", () => {
      const skeleton = createPlayerSkeleton("classic");
      const offset: [number, number, number] = [-5, -10, -15];

      setBonePositionOffset(skeleton, BoneIndex.Body, offset);

      const body = skeleton.bones.get(BoneIndex.Body);
      expect(body?.positionOffset).toEqual([-5, -10, -15]);
    });
  });

  describe("resetSkeleton", () => {
    it("should reset all bone rotations to identity (except elytra wings)", () => {
      const skeleton = createPlayerSkeleton("classic");

      // Set some rotations
      setBoneRotation(skeleton, BoneIndex.Head, quatFromEuler(1, 0, 0));
      setBoneRotation(skeleton, BoneIndex.LeftArm, quatFromEuler(0, 1, 0));

      // Reset
      resetSkeleton(skeleton);

      // Check all bones have identity rotation (except wings which have default rotation)
      for (const [index, bone] of skeleton.bones) {
        if (index === BoneIndex.LeftWing || index === BoneIndex.RightWing) {
          // Elytra wings have a default non-identity rotation (idle closed position)
          expect(bone.rotation).not.toEqual(quatIdentity());
        } else {
          expect(bone.rotation).toEqual(quatIdentity());
        }
      }
    });

    it("should reset all position offsets to zero", () => {
      const skeleton = createPlayerSkeleton("classic");

      // Set some position offsets
      setBonePositionOffset(skeleton, BoneIndex.Head, [1, 2, 3]);
      setBonePositionOffset(skeleton, BoneIndex.Body, [4, 5, 6]);

      // Reset
      resetSkeleton(skeleton);

      // Check all bones have zero position offset
      for (const [, bone] of skeleton.bones) {
        expect(bone.positionOffset).toEqual([0, 0, 0]);
      }
    });
  });

  describe("cloneSkeleton", () => {
    it("should create a deep copy", () => {
      const original = createPlayerSkeleton("classic");
      setBoneRotation(original, BoneIndex.Head, quatFromEuler(1, 0, 0));

      const cloned = cloneSkeleton(original);

      // Modify original
      setBoneRotation(original, BoneIndex.Head, quatFromEuler(0, 0, 0));

      // Cloned should not be affected
      const clonedHead = cloned.bones.get(BoneIndex.Head);
      expect(clonedHead?.rotation[0]).not.toBe(0);
    });

    it("should preserve variant", () => {
      const original = createPlayerSkeleton("slim");
      const cloned = cloneSkeleton(original);

      expect(cloned.variant).toBe("slim");
    });
  });
});
