/**
 * Vec3 unit tests
 */

import { describe, it, expect } from "vitest";
import {
  vec3,
  vec3Zero,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3Normalize,
  vec3Lerp,
  vec3Equals,
} from "@/core/math/vec3";

describe("vec3", () => {
  describe("vec3Zero", () => {
    it("should create a zero vector", () => {
      const v = vec3Zero();
      expect(v).toEqual([0, 0, 0]);
    });
  });

  describe("vec3", () => {
    it("should create a vector with given components", () => {
      const v = vec3(1, 2, 3);
      expect(v).toEqual([1, 2, 3]);
    });
  });

  describe("vec3Add", () => {
    it("should add two vectors", () => {
      const a = vec3(1, 2, 3);
      const b = vec3(4, 5, 6);
      const result = vec3Add(a, b);
      expect(result).toEqual([5, 7, 9]);
    });
  });

  describe("vec3Sub", () => {
    it("should subtract two vectors", () => {
      const a = vec3(4, 5, 6);
      const b = vec3(1, 2, 3);
      const result = vec3Sub(a, b);
      expect(result).toEqual([3, 3, 3]);
    });
  });

  describe("vec3Scale", () => {
    it("should scale a vector by scalar", () => {
      const v = vec3(1, 2, 3);
      const result = vec3Scale(v, 2);
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe("vec3Dot", () => {
    it("should compute dot product", () => {
      const a = vec3(1, 2, 3);
      const b = vec3(4, 5, 6);
      const result = vec3Dot(a, b);
      expect(result).toBe(32); // 1*4 + 2*5 + 3*6 = 32
    });

    it("should return 0 for perpendicular vectors", () => {
      const a = vec3(1, 0, 0);
      const b = vec3(0, 1, 0);
      const result = vec3Dot(a, b);
      expect(result).toBe(0);
    });
  });

  describe("vec3Cross", () => {
    it("should compute cross product", () => {
      const a = vec3(1, 0, 0);
      const b = vec3(0, 1, 0);
      const result = vec3Cross(a, b);
      expect(result).toEqual([0, 0, 1]);
    });

    it("should return zero for parallel vectors", () => {
      const a = vec3(1, 0, 0);
      const b = vec3(2, 0, 0);
      const result = vec3Cross(a, b);
      expect(result).toEqual([0, 0, 0]);
    });
  });

  describe("vec3Length", () => {
    it("should compute vector length", () => {
      const v = vec3(3, 4, 0);
      const result = vec3Length(v);
      expect(result).toBe(5);
    });

    it("should return 0 for zero vector", () => {
      const v = vec3Zero();
      const result = vec3Length(v);
      expect(result).toBe(0);
    });
  });

  describe("vec3Normalize", () => {
    it("should normalize a vector", () => {
      const v = vec3(3, 0, 0);
      const result = vec3Normalize(v);
      expect(result).toEqual([1, 0, 0]);
    });

    it("should handle zero vector", () => {
      const v = vec3Zero();
      const result = vec3Normalize(v);
      expect(result).toEqual([0, 0, 0]);
    });
  });

  describe("vec3Lerp", () => {
    it("should interpolate at t=0", () => {
      const a = vec3(0, 0, 0);
      const b = vec3(10, 10, 10);
      const result = vec3Lerp(a, b, 0);
      expect(result).toEqual([0, 0, 0]);
    });

    it("should interpolate at t=1", () => {
      const a = vec3(0, 0, 0);
      const b = vec3(10, 10, 10);
      const result = vec3Lerp(a, b, 1);
      expect(result).toEqual([10, 10, 10]);
    });

    it("should interpolate at t=0.5", () => {
      const a = vec3(0, 0, 0);
      const b = vec3(10, 10, 10);
      const result = vec3Lerp(a, b, 0.5);
      expect(result).toEqual([5, 5, 5]);
    });
  });

  describe("vec3Equals", () => {
    it("should return true for equal vectors", () => {
      const a = vec3(1, 2, 3);
      const b = vec3(1, 2, 3);
      expect(vec3Equals(a, b)).toBe(true);
    });

    it("should return false for different vectors", () => {
      const a = vec3(1, 2, 3);
      const b = vec3(1, 2, 4);
      expect(vec3Equals(a, b)).toBe(false);
    });

    it("should handle epsilon tolerance", () => {
      const a = vec3(1, 2, 3);
      const b = vec3(1.0000001, 2, 3);
      expect(vec3Equals(a, b)).toBe(true);
    });
  });
});
