/**
 * Quat extended tests - covers uncovered branches (slerp near-identical, normalize zero)
 */

import { describe, it, expect } from "vitest";
import {
  quatIdentity,
  quatNormalize,
  quatNormalizeMut,
  quatSlerp,
  quatInvert,
} from "@/core/math/quat";

describe("quat extended", () => {
  describe("quatNormalize zero-length quaternion", () => {
    it("should return identity for zero-length quaternion", () => {
      const result = quatNormalize([0, 0, 0, 0]);
      expect(result).toEqual([0, 0, 0, 1]);
    });

    it("quatNormalizeMut should return identity for zero-length quaternion", () => {
      const out: [number, number, number, number] = [0, 0, 0, 0];
      quatNormalizeMut(out, [0, 0, 0, 0]);
      expect(out).toEqual([0, 0, 0, 1]);
    });
  });

  describe("quatSlerp near-identical quaternions", () => {
    it("should fallback to linear interpolation for nearly identical quaternions", () => {
      const a = quatIdentity();
      // b is extremely close to a (differs by less than 0.000001)
      const b: [number, number, number, number] = [0, 0, 0.0000001, 0.99999999999];
      const result = quatSlerp(a, b, 0.5);
      // Should be roughly halfway between a and b
      expect(result[3]).toBeCloseTo(1, 5);
    });
  });

  describe("quatSlerp negative dot product", () => {
    it("should handle quaternions in opposite hemispheres", () => {
      const a: [number, number, number, number] = [0, 0, 0, 1];
      // Negated identity represents same rotation but negative dot product
      const b: [number, number, number, number] = [0, 0, 0, -1];
      const result = quatSlerp(a, b, 0.5);
      // After sign flip, these represent the same rotation
      expect(Math.abs(result[3])).toBeCloseTo(1, 5);
    });
  });

  describe("quatInvert zero quaternion", () => {
    it("should return zero quaternion for zero input", () => {
      const result = quatInvert([0, 0, 0, 0]);
      expect(result).toEqual([0, 0, 0, 0]);
    });
  });
});
