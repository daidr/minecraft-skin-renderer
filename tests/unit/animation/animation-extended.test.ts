/**
 * AnimationController extended tests - covers uncovered branches
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

// Register animation with position keyframes to cover position interpolation
registerAnimation({
  name: "test-position",
  duration: 1.0,
  loop: true,
  tracks: [
    {
      boneIndex: BoneIndex.Head,
      keyframes: [
        { time: 0, rotation: quatIdentity(), position: [0, 0, 0] },
        { time: 0.5, rotation: quatFromEuler(0.3, 0, 0), position: [0, 2, 0] },
        { time: 1, rotation: quatIdentity(), position: [0, 0, 0] },
      ],
    },
  ],
});

// Register single-keyframe animation
registerAnimation({
  name: "test-single-keyframe",
  duration: 1.0,
  loop: false,
  tracks: [
    {
      boneIndex: BoneIndex.Head,
      keyframes: [{ time: 0.5, rotation: quatFromEuler(0.5, 0, 0), position: [0, 1, 0] }],
    },
  ],
});

// Register animation with empty tracks
registerAnimation({
  name: "test-empty-keyframes",
  duration: 1.0,
  loop: false,
  tracks: [
    {
      boneIndex: BoneIndex.Head,
      keyframes: [],
    },
  ],
});

describe("AnimationController extended", () => {
  let skeleton: PlayerSkeleton;

  beforeEach(() => {
    skeleton = createPlayerSkeleton("classic");
  });

  describe("pause/resume edge cases", () => {
    it("should not change state when pausing a non-playing controller", () => {
      const controller = createAnimationController(skeleton);
      // Not playing, pause should be no-op
      controller.pause();
      expect(controller.isPlaying).toBe(false);
      expect(controller.isPaused).toBe(false);
    });

    it("should not change state when resuming a non-paused controller", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-position");
      // Playing but not paused, resume should be no-op
      controller.resume();
      expect(controller.isPlaying).toBe(true);
    });

    it("should not update when paused", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-position");
      controller.pause();

      const progressBefore = controller.progress;
      updateAnimationController(controller, 0.5);
      expect(controller.progress).toBe(progressBefore);
    });
  });

  describe("position interpolation", () => {
    it("should interpolate bone position between keyframes", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-position");
      updateAnimationController(controller, 0.5);

      const head = skeleton.bones.get(BoneIndex.Head);
      // At t=0.5, position should be [0, 2, 0]
      expect(head!.positionOffset[1]).toBeCloseTo(2, 1);
    });

    it("should apply amplitude to position", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-position", { amplitude: 0.5 });
      updateAnimationController(controller, 0.5);

      const head = skeleton.bones.get(BoneIndex.Head);
      // At amplitude 0.5, position should be roughly half
      expect(head!.positionOffset[1]).toBeLessThan(2);
      expect(head!.positionOffset[1]).toBeGreaterThan(0);
    });
  });

  describe("single keyframe animation", () => {
    it("should use single keyframe value with full amplitude", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-single-keyframe");
      updateAnimationController(controller, 0.5);

      const head = skeleton.bones.get(BoneIndex.Head);
      // Single keyframe should apply its values
      expect(head!.positionOffset[1]).toBeCloseTo(1);
    });

    it("should scale single keyframe value with amplitude", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-single-keyframe", { amplitude: 0.5 });
      updateAnimationController(controller, 0.5);

      const head = skeleton.bones.get(BoneIndex.Head);
      // With amplitude 0.5, position should be scaled
      expect(head!.positionOffset[1]).toBeCloseTo(0.5, 1);
    });
  });

  describe("empty keyframes", () => {
    it("should handle empty keyframes without crashing", () => {
      const controller = createAnimationController(skeleton);
      controller.play("test-empty-keyframes");
      expect(() => updateAnimationController(controller, 0.5)).not.toThrow();
    });
  });

  describe("updateAnimationController with no state", () => {
    it("should be safe to call update on a stopped controller", () => {
      const controller = createAnimationController(skeleton);
      expect(() => updateAnimationController(controller, 0.1)).not.toThrow();
    });
  });
});
