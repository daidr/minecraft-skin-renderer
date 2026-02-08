/**
 * model/types utility function tests
 */

import { describe, it, expect } from "vitest";
import {
  visibilityToMask,
  maskToVisibility,
  createDefaultVisibility,
  LayerMask,
  PART_NAMES,
} from "@/model/types";

describe("model/types utilities", () => {
  describe("visibilityToMask", () => {
    it("should return None when both layers are hidden", () => {
      expect(visibilityToMask({ inner: false, outer: false })).toBe(LayerMask.None);
    });

    it("should return Inner when only inner is visible", () => {
      expect(visibilityToMask({ inner: true, outer: false })).toBe(LayerMask.Inner);
    });

    it("should return Outer when only outer is visible", () => {
      expect(visibilityToMask({ inner: false, outer: true })).toBe(LayerMask.Outer);
    });

    it("should return Both when both layers are visible", () => {
      expect(visibilityToMask({ inner: true, outer: true })).toBe(LayerMask.Both);
    });
  });

  describe("maskToVisibility", () => {
    it("should convert None mask", () => {
      const v = maskToVisibility(LayerMask.None);
      expect(v.inner).toBe(false);
      expect(v.outer).toBe(false);
    });

    it("should convert Inner mask", () => {
      const v = maskToVisibility(LayerMask.Inner);
      expect(v.inner).toBe(true);
      expect(v.outer).toBe(false);
    });

    it("should convert Outer mask", () => {
      const v = maskToVisibility(LayerMask.Outer);
      expect(v.inner).toBe(false);
      expect(v.outer).toBe(true);
    });

    it("should convert Both mask", () => {
      const v = maskToVisibility(LayerMask.Both);
      expect(v.inner).toBe(true);
      expect(v.outer).toBe(true);
    });
  });

  describe("roundtrip visibilityToMask <-> maskToVisibility", () => {
    it("should roundtrip correctly", () => {
      const original = { inner: true, outer: false };
      const mask = visibilityToMask(original);
      const result = maskToVisibility(mask);
      expect(result).toEqual(original);
    });
  });

  describe("createDefaultVisibility", () => {
    it("should create visibility with all parts visible", () => {
      const v = createDefaultVisibility();
      for (const part of PART_NAMES) {
        expect(v[part].inner).toBe(true);
        expect(v[part].outer).toBe(true);
      }
    });
  });

  describe("PART_NAMES", () => {
    it("should contain all 6 body parts", () => {
      expect(PART_NAMES).toHaveLength(6);
      expect(PART_NAMES).toContain("head");
      expect(PART_NAMES).toContain("body");
      expect(PART_NAMES).toContain("leftArm");
      expect(PART_NAMES).toContain("rightArm");
      expect(PART_NAMES).toContain("leftLeg");
      expect(PART_NAMES).toContain("rightLeg");
    });
  });
});
