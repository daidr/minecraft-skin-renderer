/**
 * Math utility functions unit tests
 */

import { describe, it, expect } from "vitest";
import {
  degToRad,
  radToDeg,
  clamp,
  lerp,
  smoothstep,
  isZero,
  approxEquals,
  mapRange,
  wrap,
  isPowerOfTwo,
  nextPowerOfTwo,
  sign,
  fract,
  seededRandom,
  PI,
  TWO_PI,
  HALF_PI,
  EPSILON,
} from "@/core/math/utils";

describe("Math Utils", () => {
  describe("degToRad", () => {
    it("should convert degrees to radians", () => {
      expect(degToRad(0)).toBe(0);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(degToRad(180)).toBeCloseTo(Math.PI);
      expect(degToRad(360)).toBeCloseTo(Math.PI * 2);
    });
  });

  describe("radToDeg", () => {
    it("should convert radians to degrees", () => {
      expect(radToDeg(0)).toBe(0);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
      expect(radToDeg(Math.PI * 2)).toBeCloseTo(360);
    });
  });

  describe("clamp", () => {
    it("should clamp value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("should handle edge cases", () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe("lerp", () => {
    it("should linearly interpolate between values", () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it("should handle negative ranges", () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe("smoothstep", () => {
    it("should smoothly interpolate between edges", () => {
      expect(smoothstep(0, 1, 0)).toBe(0);
      expect(smoothstep(0, 1, 0.5)).toBe(0.5);
      expect(smoothstep(0, 1, 1)).toBe(1);
    });

    it("should clamp values outside range", () => {
      expect(smoothstep(0, 1, -1)).toBe(0);
      expect(smoothstep(0, 1, 2)).toBe(1);
    });
  });

  describe("isZero", () => {
    it("should detect zero values", () => {
      expect(isZero(0)).toBe(true);
      expect(isZero(0.0000001)).toBe(true);
      expect(isZero(0.001)).toBe(false);
    });

    it("should respect custom epsilon", () => {
      expect(isZero(0.01, 0.1)).toBe(true);
      expect(isZero(0.01, 0.001)).toBe(false);
    });
  });

  describe("approxEquals", () => {
    it("should compare values with tolerance", () => {
      expect(approxEquals(1, 1)).toBe(true);
      expect(approxEquals(1, 1.0000001)).toBe(true);
      expect(approxEquals(1, 1.1)).toBe(false);
    });

    it("should respect custom epsilon", () => {
      expect(approxEquals(1, 1.05, 0.1)).toBe(true);
      expect(approxEquals(1, 1.05, 0.01)).toBe(false);
    });
  });

  describe("mapRange", () => {
    it("should map value from one range to another", () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    });

    it("should handle inverted ranges", () => {
      expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
    });
  });

  describe("wrap", () => {
    it("should wrap value within range", () => {
      expect(wrap(5, 0, 10)).toBe(5);
      expect(wrap(15, 0, 10)).toBe(5);
      expect(wrap(-5, 0, 10)).toBe(5);
    });

    it("should handle negative values correctly", () => {
      expect(wrap(-1, 0, 4)).toBe(3);
      expect(wrap(-5, 0, 4)).toBe(3);
    });
  });

  describe("isPowerOfTwo", () => {
    it("should detect powers of two", () => {
      expect(isPowerOfTwo(1)).toBe(true);
      expect(isPowerOfTwo(2)).toBe(true);
      expect(isPowerOfTwo(4)).toBe(true);
      expect(isPowerOfTwo(1024)).toBe(true);
    });

    it("should reject non-powers of two", () => {
      expect(isPowerOfTwo(0)).toBe(false);
      expect(isPowerOfTwo(3)).toBe(false);
      expect(isPowerOfTwo(5)).toBe(false);
      expect(isPowerOfTwo(-2)).toBe(false);
    });
  });

  describe("nextPowerOfTwo", () => {
    it("should return next power of two", () => {
      expect(nextPowerOfTwo(1)).toBe(1);
      expect(nextPowerOfTwo(2)).toBe(2);
      expect(nextPowerOfTwo(3)).toBe(4);
      expect(nextPowerOfTwo(5)).toBe(8);
      expect(nextPowerOfTwo(100)).toBe(128);
    });

    it("should handle edge cases", () => {
      expect(nextPowerOfTwo(0)).toBe(1);
      expect(nextPowerOfTwo(-5)).toBe(1);
    });
  });

  describe("sign", () => {
    it("should return sign of number", () => {
      expect(sign(5)).toBe(1);
      expect(sign(-5)).toBe(-1);
      expect(sign(0)).toBe(0);
    });
  });

  describe("fract", () => {
    it("should return fractional part", () => {
      expect(fract(1.5)).toBeCloseTo(0.5);
      expect(fract(2.75)).toBeCloseTo(0.75);
      expect(fract(3)).toBe(0);
    });

    it("should handle negative values", () => {
      expect(fract(-1.5)).toBeCloseTo(0.5);
    });
  });

  describe("seededRandom", () => {
    it("should generate deterministic sequence", () => {
      const rng1 = seededRandom(12345);
      const rng2 = seededRandom(12345);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it("should generate values between 0 and 1", () => {
      const rng = seededRandom(42);
      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe("Constants", () => {
    it("should export correct PI values", () => {
      expect(PI).toBe(Math.PI);
      expect(TWO_PI).toBeCloseTo(Math.PI * 2);
      expect(HALF_PI).toBeCloseTo(Math.PI / 2);
    });

    it("should export EPSILON", () => {
      expect(EPSILON).toBe(0.000001);
    });
  });
});
