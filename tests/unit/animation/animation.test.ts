/**
 * Animation system unit tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPlayerSkeleton } from "@/model/PlayerModel";
import { BoneIndex } from "@/model/types";
import type { PlayerSkeleton } from "@/model/types";
import {
  createAnimationController,
  updateAnimationController,
} from "@/animation/AnimationController";
import { registerAnimation, getAnimation } from "@/animation/types";
import { quatFromEuler, quatIdentity } from "@/core/math/quat";

// Register a test animation
registerAnimation({
  name: "test",
  duration: 1.0,
  loop: true,
  tracks: [
    {
      boneIndex: BoneIndex.Head,
      keyframes: [
        { time: 0, rotation: quatIdentity() },
        { time: 0.5, rotation: quatFromEuler(0.5, 0, 0) },
        { time: 1, rotation: quatIdentity() },
      ],
    },
  ],
});

describe("Animation", () => {
  let skeleton: PlayerSkeleton;

  beforeEach(() => {
    skeleton = createPlayerSkeleton("classic");
  });

  describe("Animation registration", () => {
    it("should register animation", () => {
      const animation = getAnimation("test");
      expect(animation).toBeDefined();
      expect(animation?.name).toBe("test");
    });

    it("should return undefined for non-existent animation", () => {
      const animation = getAnimation("nonexistent");
      expect(animation).toBeUndefined();
    });
  });

  describe("AnimationController", () => {
    it("should create controller", () => {
      const controller = createAnimationController(skeleton);

      expect(controller.isPlaying).toBe(false);
      expect(controller.currentAnimation).toBeNull();
      expect(controller.progress).toBe(0);
    });

    it("should play animation", () => {
      const controller = createAnimationController(skeleton);

      controller.play("test");

      expect(controller.isPlaying).toBe(true);
      expect(controller.currentAnimation).toBe("test");
    });

    it("should pause and resume", () => {
      const controller = createAnimationController(skeleton);

      controller.play("test");
      controller.pause();

      expect(controller.isPaused).toBe(true);
      expect(controller.isPlaying).toBe(true);

      controller.resume();

      expect(controller.isPaused).toBe(false);
    });

    it("should stop animation", () => {
      const controller = createAnimationController(skeleton);

      controller.play("test");
      controller.stop();

      expect(controller.isPlaying).toBe(false);
      expect(controller.currentAnimation).toBeNull();
    });

    it("should update skeleton on animation update", () => {
      const controller = createAnimationController(skeleton);

      controller.play("test");

      // Update for half a second (t=0.5 in our test animation)
      updateAnimationController(controller, 0.5);

      // Check that the head bone has been rotated
      const head = skeleton.bones.get(BoneIndex.Head);
      expect(head?.rotation).not.toEqual(quatIdentity());
    });

    it("should respect speed config", () => {
      const controller = createAnimationController(skeleton);

      controller.play("test", { speed: 2.0 });

      // Update for 0.25 seconds at 2x speed = 0.5 normalized time
      updateAnimationController(controller, 0.25);

      expect(controller.progress).toBeCloseTo(0.5, 1);
    });

    it("should loop animation", () => {
      const controller = createAnimationController(skeleton);

      controller.play("test");

      // Update past the duration
      updateAnimationController(controller, 1.5);

      // Should still be playing
      expect(controller.isPlaying).toBe(true);
      expect(controller.progress).toBeLessThan(1);
    });

    it("should warn for non-existent animation", () => {
      const controller = createAnimationController(skeleton);
      const warnSpy = vi.spyOn(console, "warn");

      controller.play("nonexistent");

      expect(warnSpy).toHaveBeenCalled();
      expect(controller.isPlaying).toBe(false);
    });
  });
});
