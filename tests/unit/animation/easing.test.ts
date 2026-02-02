/**
 * Easing functions unit tests
 */

import { describe, it, expect } from "vitest";
import {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  sineWave,
  halfSine,
  bounce,
  elastic,
} from "@/animation/easing";

describe("Easing Functions", () => {
  describe("linear", () => {
    it("should return t unchanged", () => {
      expect(linear(0)).toBe(0);
      expect(linear(0.5)).toBe(0.5);
      expect(linear(1)).toBe(1);
    });
  });

  describe("easeInQuad", () => {
    it("should ease in with quadratic curve", () => {
      expect(easeInQuad(0)).toBe(0);
      expect(easeInQuad(0.5)).toBe(0.25);
      expect(easeInQuad(1)).toBe(1);
    });
  });

  describe("easeOutQuad", () => {
    it("should ease out with quadratic curve", () => {
      expect(easeOutQuad(0)).toBe(0);
      expect(easeOutQuad(0.5)).toBe(0.75);
      expect(easeOutQuad(1)).toBe(1);
    });
  });

  describe("easeInOutQuad", () => {
    it("should ease in and out with quadratic curve", () => {
      expect(easeInOutQuad(0)).toBe(0);
      expect(easeInOutQuad(0.25)).toBe(0.125);
      expect(easeInOutQuad(0.5)).toBe(0.5);
      expect(easeInOutQuad(0.75)).toBe(0.875);
      expect(easeInOutQuad(1)).toBe(1);
    });
  });

  describe("easeInCubic", () => {
    it("should ease in with cubic curve", () => {
      expect(easeInCubic(0)).toBe(0);
      expect(easeInCubic(0.5)).toBe(0.125);
      expect(easeInCubic(1)).toBe(1);
    });
  });

  describe("easeOutCubic", () => {
    it("should ease out with cubic curve", () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(0.5)).toBe(0.875);
      expect(easeOutCubic(1)).toBe(1);
    });
  });

  describe("easeInOutCubic", () => {
    it("should ease in and out with cubic curve", () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(0.5)).toBe(0.5);
      expect(easeInOutCubic(1)).toBe(1);
    });

    it("should be symmetric around 0.5", () => {
      const at25 = easeInOutCubic(0.25);
      const at75 = easeInOutCubic(0.75);
      expect(at25 + at75).toBeCloseTo(1);
    });
  });

  describe("easeInSine", () => {
    it("should ease in with sine curve", () => {
      expect(easeInSine(0)).toBeCloseTo(0);
      expect(easeInSine(1)).toBeCloseTo(1);
    });
  });

  describe("easeOutSine", () => {
    it("should ease out with sine curve", () => {
      expect(easeOutSine(0)).toBeCloseTo(0);
      expect(easeOutSine(1)).toBeCloseTo(1);
    });
  });

  describe("easeInOutSine", () => {
    it("should ease in and out with sine curve", () => {
      expect(easeInOutSine(0)).toBeCloseTo(0);
      expect(easeInOutSine(0.5)).toBeCloseTo(0.5);
      expect(easeInOutSine(1)).toBeCloseTo(1);
    });
  });

  describe("sineWave", () => {
    it("should complete full sine wave cycle", () => {
      expect(sineWave(0)).toBeCloseTo(0);
      expect(sineWave(0.25)).toBeCloseTo(1);
      expect(sineWave(0.5)).toBeCloseTo(0);
      expect(sineWave(0.75)).toBeCloseTo(-1);
      expect(sineWave(1)).toBeCloseTo(0);
    });
  });

  describe("halfSine", () => {
    it("should complete half sine wave (0 to 1 to 0)", () => {
      expect(halfSine(0)).toBeCloseTo(0);
      expect(halfSine(0.5)).toBeCloseTo(1);
      expect(halfSine(1)).toBeCloseTo(0);
    });
  });

  describe("bounce", () => {
    it("should start at 0 and end at 1", () => {
      expect(bounce(0)).toBeCloseTo(0);
      expect(bounce(1)).toBeCloseTo(1);
    });

    it("should cover all bounce branches", () => {
      // First bounce (t < 1/2.75)
      expect(bounce(0.1)).toBeGreaterThan(0);

      // Second bounce (1/2.75 <= t < 2/2.75)
      expect(bounce(0.5)).toBeGreaterThan(0);

      // Third bounce (2/2.75 <= t < 2.5/2.75)
      expect(bounce(0.8)).toBeGreaterThan(0);

      // Fourth bounce (t >= 2.5/2.75)
      expect(bounce(0.95)).toBeGreaterThan(0);
    });
  });

  describe("elastic", () => {
    it("should start at 0 and end at 1", () => {
      expect(elastic(0)).toBe(0);
      expect(elastic(1)).toBe(1);
    });

    it("should have elastic overshoot beyond 1", () => {
      // Elastic easing should overshoot past the target value (1.0)
      // Check multiple points to find the overshoot
      let hasOvershoot = false;
      for (let t = 0.5; t <= 1; t += 0.05) {
        if (elastic(t) > 1.0) {
          hasOvershoot = true;
          break;
        }
      }
      expect(hasOvershoot).toBe(true);
    });

    it("should approach 1 smoothly near the end", () => {
      // Values near t=1 should be close to 1
      expect(elastic(0.9)).toBeCloseTo(1, 0);
      expect(elastic(0.95)).toBeCloseTo(1, 1);
    });
  });
});
