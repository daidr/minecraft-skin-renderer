/**
 * Tests for AnimationController setSpeed/setAmplitude methods
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createPlayerSkeleton } from "@/model/PlayerModel";
import { BoneIndex } from "@/model/types";
import type { PlayerSkeleton } from "@/model/types";
import {
  createAnimationController,
  updateAnimationController,
} from "@/animation/AnimationController";
import { registerAnimation } from "@/animation/types";
import { quatFromEuler, quatIdentity } from "@/core/math/quat";

registerAnimation({
  name: "setter-test",
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

describe("AnimationController setSpeed/setAmplitude", () => {
  let skeleton: PlayerSkeleton;

  beforeEach(() => {
    skeleton = createPlayerSkeleton("classic");
  });

  describe("setSpeed", () => {
    it("should change speed without restarting animation", () => {
      const controller = createAnimationController(skeleton);
      controller.play("setter-test", { speed: 1.0 });

      // Advance to t=0.25
      updateAnimationController(controller, 0.25);
      const progressBefore = controller.progress;
      expect(progressBefore).toBeCloseTo(0.25, 2);

      // Change speed to 2x — should NOT reset progress
      controller.setSpeed(2.0);
      expect(controller.progress).toBeCloseTo(progressBefore, 2);
      expect(controller.isPlaying).toBe(true);
      expect(controller.currentAnimation).toBe("setter-test");

      // Advance 0.1s at 2x speed → should move 0.2 in normalized time
      updateAnimationController(controller, 0.1);
      expect(controller.progress).toBeCloseTo(0.45, 2);
    });

    it("should be a no-op when no animation is playing", () => {
      const controller = createAnimationController(skeleton);
      // Should not throw
      controller.setSpeed(2.0);
      expect(controller.isPlaying).toBe(false);
    });
  });

  describe("setAmplitude", () => {
    it("should change amplitude without restarting animation", () => {
      const controller = createAnimationController(skeleton);
      controller.play("setter-test", { amplitude: 1.0 });

      // Advance to peak (t=0.5)
      updateAnimationController(controller, 0.5);
      const head = skeleton.bones.get(BoneIndex.Head)!;
      const fullRotationX = head.rotation[0];

      // Reset and play again, this time change amplitude mid-play
      controller.play("setter-test", { amplitude: 1.0 });
      updateAnimationController(controller, 0.25);

      const progressBefore = controller.progress;
      controller.setAmplitude(0.5);
      // Progress should not change
      expect(controller.progress).toBeCloseTo(progressBefore, 2);

      // Continue to t=0.5
      updateAnimationController(controller, 0.25);
      const headAfter = skeleton.bones.get(BoneIndex.Head)!;
      // With half amplitude, the rotation should be smaller
      expect(Math.abs(headAfter.rotation[0])).toBeLessThan(Math.abs(fullRotationX));
    });

    it("should be a no-op when no animation is playing", () => {
      const controller = createAnimationController(skeleton);
      controller.setAmplitude(0.5);
      expect(controller.isPlaying).toBe(false);
    });
  });
});
