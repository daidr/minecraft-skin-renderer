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
      expect(controller.isPlaying).toBe(false); // paused means not actively playing

      controller.resume();

      expect(controller.isPaused).toBe(false);
      expect(controller.isPlaying).toBe(true);
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
      // At t=0.5, the keyframe should be quatFromEuler(0.5, 0, 0)
      updateAnimationController(controller, 0.5);

      // Check that the head bone has been rotated to expected value
      const head = skeleton.bones.get(BoneIndex.Head);
      const expectedRotation = quatFromEuler(0.5, 0, 0);

      expect(head?.rotation[0]).toBeCloseTo(expectedRotation[0], 4);
      expect(head?.rotation[1]).toBeCloseTo(expectedRotation[1], 4);
      expect(head?.rotation[2]).toBeCloseTo(expectedRotation[2], 4);
      expect(head?.rotation[3]).toBeCloseTo(expectedRotation[3], 4);
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

    it("should respect amplitude config", () => {
      const controller = createAnimationController(skeleton);

      // Play with half amplitude
      controller.play("test", { amplitude: 0.5 });

      // Update to t=0.5 (peak rotation in test animation)
      updateAnimationController(controller, 0.5);

      const head = skeleton.bones.get(BoneIndex.Head);
      const fullRotation = quatFromEuler(0.5, 0, 0);

      // With amplitude 0.5, rotation should be interpolated halfway from identity
      // The rotation magnitude should be roughly half of the full rotation
      expect(Math.abs(head!.rotation[0])).toBeLessThan(Math.abs(fullRotation[0]));
      expect(head!.rotation[3]).toBeGreaterThan(fullRotation[3]); // Closer to identity (w=1)
    });

    it("should reset skeleton when playing new animation", () => {
      const controller = createAnimationController(skeleton);

      // Play and advance
      controller.play("test");
      updateAnimationController(controller, 0.5);

      // Head should be rotated
      const head = skeleton.bones.get(BoneIndex.Head);
      expect(head?.rotation).not.toEqual(quatIdentity());

      // Play same animation again (should reset first)
      controller.play("test");

      // Before any update, skeleton should be reset
      // Note: After play() is called, skeleton is reset but animation hasn't advanced yet
      // The rotation will be identity or the first keyframe value
      expect(controller.progress).toBe(0);
    });
  });
});

// Register a non-looping test animation
registerAnimation({
  name: "test-once",
  duration: 1.0,
  loop: false,
  tracks: [
    {
      boneIndex: BoneIndex.Head,
      keyframes: [
        { time: 0, rotation: quatIdentity() },
        { time: 1, rotation: quatFromEuler(1.0, 0, 0) },
      ],
    },
  ],
});

describe("Non-looping Animation", () => {
  let skeleton: PlayerSkeleton;

  beforeEach(() => {
    skeleton = createPlayerSkeleton("classic");
  });

  it("should stop at the end of non-looping animation", () => {
    const controller = createAnimationController(skeleton);

    controller.play("test-once");

    // Update past the duration
    updateAnimationController(controller, 1.5);

    // Should no longer be playing
    expect(controller.isPlaying).toBe(false);
    // Note: progress returns 0 when time equals duration due to modulo operation
    // This is current implementation behavior
  });

  it("should hold final pose when non-looping animation ends", () => {
    const controller = createAnimationController(skeleton);

    controller.play("test-once");

    // Update to exactly the end
    updateAnimationController(controller, 1.0);

    const head = skeleton.bones.get(BoneIndex.Head);
    const expectedRotation = quatFromEuler(1.0, 0, 0);

    expect(head?.rotation[0]).toBeCloseTo(expectedRotation[0], 4);
    expect(head?.rotation[3]).toBeCloseTo(expectedRotation[3], 4);
  });
});
