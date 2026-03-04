/**
 * Animation preset tests
 *
 * Verifies that built-in animation presets (idle, walk, run, fly) are
 * correctly defined and registered.
 */

import { describe, it, expect } from "vitest";
import { createIdleAnimation } from "@/animation/presets/idle";
import { createWalkAnimation } from "@/animation/presets/walk";
import { createRunAnimation } from "@/animation/presets/run";
import { createFlyAnimation } from "@/animation/presets/fly";
import { getAnimation, getRegisteredAnimations } from "@/animation/types";
import type { Animation } from "@/animation/types";
import { BoneIndex } from "@/model/types";

/** Valid bone indices (0 through max) */
const VALID_BONE_INDICES = new Set(Object.values(BoneIndex).filter((v) => typeof v === "number"));

/** Validate common animation structure */
function validateAnimation(anim: Animation) {
  expect(anim.name).toBeTruthy();
  expect(anim.duration).toBeGreaterThan(0);
  expect(typeof anim.loop).toBe("boolean");
  expect(anim.tracks.length).toBeGreaterThan(0);

  for (const track of anim.tracks) {
    // Bone index must be a valid BoneIndex value
    expect(VALID_BONE_INDICES.has(track.boneIndex)).toBe(true);

    // Must have at least 1 keyframe
    expect(track.keyframes.length).toBeGreaterThan(0);

    for (const kf of track.keyframes) {
      // Keyframe time must be in [0, 1]
      expect(kf.time).toBeGreaterThanOrEqual(0);
      expect(kf.time).toBeLessThanOrEqual(1);

      // Must have at least rotation or position
      expect(kf.rotation || kf.position).toBeTruthy();

      // Rotation quaternion has 4 components
      if (kf.rotation) {
        expect(kf.rotation).toHaveLength(4);
      }

      // Position vector has 3 components
      if (kf.position) {
        expect(kf.position).toHaveLength(3);
      }
    }

    // First keyframe should start at t=0
    expect(track.keyframes[0].time).toBe(0);

    // Last keyframe should be at t=1 (unless single-keyframe constant track)
    if (track.keyframes.length > 1) {
      expect(track.keyframes[track.keyframes.length - 1].time).toBe(1);
    }
  }
}

describe("Animation Presets", () => {
  describe("idle", () => {
    it("should create a valid animation", () => {
      const anim = createIdleAnimation();
      validateAnimation(anim);
    });

    it("should have correct name and duration", () => {
      const anim = createIdleAnimation();
      expect(anim.name).toBe("idle");
      expect(anim.duration).toBe(3.0);
      expect(anim.loop).toBe(true);
    });

    it("should animate head and arms", () => {
      const anim = createIdleAnimation();
      const boneIndices = anim.tracks.map((t) => t.boneIndex);
      expect(boneIndices).toContain(BoneIndex.Head);
      expect(boneIndices).toContain(BoneIndex.RightArm);
      expect(boneIndices).toContain(BoneIndex.LeftArm);
    });

    it("should include cape and wing tracks", () => {
      const anim = createIdleAnimation();
      const boneIndices = anim.tracks.map((t) => t.boneIndex);
      expect(boneIndices).toContain(BoneIndex.Cape);
      expect(boneIndices).toContain(BoneIndex.LeftWing);
      expect(boneIndices).toContain(BoneIndex.RightWing);
    });
  });

  describe("walk", () => {
    it("should create a valid animation", () => {
      const anim = createWalkAnimation();
      validateAnimation(anim);
    });

    it("should have correct name and duration", () => {
      const anim = createWalkAnimation();
      expect(anim.name).toBe("walk");
      expect(anim.duration).toBe(1.2);
      expect(anim.loop).toBe(true);
    });

    it("should animate all four limbs", () => {
      const anim = createWalkAnimation();
      const boneIndices = anim.tracks.map((t) => t.boneIndex);
      expect(boneIndices).toContain(BoneIndex.RightArm);
      expect(boneIndices).toContain(BoneIndex.LeftArm);
      expect(boneIndices).toContain(BoneIndex.RightLeg);
      expect(boneIndices).toContain(BoneIndex.LeftLeg);
    });
  });

  describe("run", () => {
    it("should create a valid animation", () => {
      const anim = createRunAnimation();
      validateAnimation(anim);
    });

    it("should have correct name and duration", () => {
      const anim = createRunAnimation();
      expect(anim.name).toBe("run");
      expect(anim.duration).toBe(0.5);
      expect(anim.loop).toBe(true);
    });

    it("should be faster than walk (shorter duration)", () => {
      const walk = createWalkAnimation();
      const run = createRunAnimation();
      expect(run.duration).toBeLessThan(walk.duration);
    });

    it("should include root bobbing (position keyframes)", () => {
      const anim = createRunAnimation();
      const rootTrack = anim.tracks.find((t) => t.boneIndex === BoneIndex.Root);
      expect(rootTrack).toBeDefined();
      // Root track should have position keyframes for bobbing
      const hasPosition = rootTrack!.keyframes.some((kf) => kf.position !== undefined);
      expect(hasPosition).toBe(true);
    });
  });

  describe("fly", () => {
    it("should create a valid animation", () => {
      const anim = createFlyAnimation();
      validateAnimation(anim);
    });

    it("should have correct name and duration", () => {
      const anim = createFlyAnimation();
      expect(anim.name).toBe("fly");
      expect(anim.duration).toBe(1.5);
      expect(anim.loop).toBe(true);
    });

    it("should animate body, head, all limbs, cape, and wings", () => {
      const anim = createFlyAnimation();
      const boneIndices = new Set(anim.tracks.map((t) => t.boneIndex));
      expect(boneIndices.has(BoneIndex.Root)).toBe(true);
      expect(boneIndices.has(BoneIndex.Body)).toBe(true);
      expect(boneIndices.has(BoneIndex.Head)).toBe(true);
      expect(boneIndices.has(BoneIndex.RightArm)).toBe(true);
      expect(boneIndices.has(BoneIndex.LeftArm)).toBe(true);
      expect(boneIndices.has(BoneIndex.RightLeg)).toBe(true);
      expect(boneIndices.has(BoneIndex.LeftLeg)).toBe(true);
      expect(boneIndices.has(BoneIndex.Cape)).toBe(true);
      expect(boneIndices.has(BoneIndex.LeftWing)).toBe(true);
      expect(boneIndices.has(BoneIndex.RightWing)).toBe(true);
    });

    it("should include root offset for centering pitched model", () => {
      const anim = createFlyAnimation();
      const rootTrack = anim.tracks.find((t) => t.boneIndex === BoneIndex.Root);
      expect(rootTrack).toBeDefined();
      const rootPos = rootTrack!.keyframes[0].position;
      expect(rootPos).toBeDefined();
      // Y offset should be negative (shift down to compensate for pitch)
      expect(rootPos![1]).toBeLessThan(0);
    });
  });

  describe("registration", () => {
    it("should register all four preset animations", () => {
      // Importing the modules triggers registerAnimation() side effects
      const names = getRegisteredAnimations();
      expect(names).toContain("idle");
      expect(names).toContain("walk");
      expect(names).toContain("run");
      expect(names).toContain("fly");
    });

    it("should retrieve registered animations by name", () => {
      expect(getAnimation("idle")).toBeDefined();
      expect(getAnimation("walk")).toBeDefined();
      expect(getAnimation("run")).toBeDefined();
      expect(getAnimation("fly")).toBeDefined();
    });

    it("should return undefined for unregistered names", () => {
      expect(getAnimation("nonexistent")).toBeUndefined();
    });
  });

  describe("no duplicate bone tracks", () => {
    for (const [name, factory] of [
      ["idle", createIdleAnimation],
      ["walk", createWalkAnimation],
      ["run", createRunAnimation],
      ["fly", createFlyAnimation],
    ] as const) {
      it(`${name} should not have duplicate bone indices`, () => {
        const anim = factory();
        const indices = anim.tracks.map((t) => t.boneIndex);
        const uniqueIndices = new Set(indices);
        expect(uniqueIndices.size).toBe(indices.length);
      });
    }
  });
});
