/**
 * Vec3 unit tests
 */

import { describe, it, expect } from "vitest";
import {
  vec3,
  vec3Zero,
  vec3Clone,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Mul,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3Normalize,
  vec3Negate,
  vec3Lerp,
  vec3Distance,
  vec3Equals,
  vec3TransformMat4,
  vec3ToFloat32Array,
  vec3AddMut,
  vec3SubMut,
  vec3ScaleMut,
  vec3LerpMut,
  vec3NormalizeMut,
  vec3CrossMut,
  vec3CopyMut,
  vec3ZeroMut,
} from "@/core/math/vec3";
import { mat4Identity, mat4FromTranslation } from "@/core/math/mat4";

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

  describe("vec3Clone", () => {
    it("should create a copy of the vector", () => {
      const v = vec3(1, 2, 3);
      const cloned = vec3Clone(v);
      expect(cloned).toEqual([1, 2, 3]);
      expect(cloned).not.toBe(v);
    });
  });

  describe("vec3Mul", () => {
    it("should multiply vectors component-wise", () => {
      const a = vec3(2, 3, 4);
      const b = vec3(5, 6, 7);
      expect(vec3Mul(a, b)).toEqual([10, 18, 28]);
    });
  });

  describe("vec3LengthSq", () => {
    it("should return squared length", () => {
      const v = vec3(3, 4, 0);
      expect(vec3LengthSq(v)).toBe(25);
    });
  });

  describe("vec3Negate", () => {
    it("should negate vector", () => {
      const v = vec3(1, -2, 3);
      expect(vec3Negate(v)).toEqual([-1, 2, -3]);
    });
  });

  describe("vec3Distance", () => {
    it("should calculate distance between vectors", () => {
      const a = vec3(0, 0, 0);
      const b = vec3(3, 4, 0);
      expect(vec3Distance(a, b)).toBe(5);
    });
  });

  describe("vec3TransformMat4", () => {
    it("should transform vector by identity matrix", () => {
      const v = vec3(1, 2, 3);
      const m = mat4Identity();
      const result = vec3TransformMat4(v, m);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(2);
      expect(result[2]).toBeCloseTo(3);
    });

    it("should transform vector by translation matrix", () => {
      const v = vec3(1, 2, 3);
      const m = mat4FromTranslation(vec3(10, 20, 30));
      const result = vec3TransformMat4(v, m);
      expect(result[0]).toBeCloseTo(11);
      expect(result[1]).toBeCloseTo(22);
      expect(result[2]).toBeCloseTo(33);
    });
  });

  describe("vec3ToFloat32Array", () => {
    it("should convert to Float32Array", () => {
      const v = vec3(1, 2, 3);
      const arr = vec3ToFloat32Array(v);
      expect(arr).toBeInstanceOf(Float32Array);
      expect(arr[0]).toBe(1);
      expect(arr[1]).toBe(2);
      expect(arr[2]).toBe(3);
    });
  });

  describe("Mutable operations", () => {
    it("vec3AddMut should add in place", () => {
      const out: [number, number, number] = [0, 0, 0];
      const a = vec3(1, 2, 3);
      const b = vec3(4, 5, 6);
      vec3AddMut(out, a, b);
      expect(out).toEqual([5, 7, 9]);
    });

    it("vec3SubMut should subtract in place", () => {
      const out: [number, number, number] = [0, 0, 0];
      const a = vec3(4, 5, 6);
      const b = vec3(1, 2, 3);
      vec3SubMut(out, a, b);
      expect(out).toEqual([3, 3, 3]);
    });

    it("vec3ScaleMut should scale in place", () => {
      const out: [number, number, number] = [0, 0, 0];
      const v = vec3(1, 2, 3);
      vec3ScaleMut(out, v, 2);
      expect(out).toEqual([2, 4, 6]);
    });

    it("vec3LerpMut should interpolate in place", () => {
      const out: [number, number, number] = [0, 0, 0];
      const a = vec3(0, 0, 0);
      const b = vec3(10, 10, 10);
      vec3LerpMut(out, a, b, 0.5);
      expect(out).toEqual([5, 5, 5]);
    });

    it("vec3NormalizeMut should normalize in place", () => {
      const out: [number, number, number] = [0, 0, 0];
      const v = vec3(3, 0, 0);
      vec3NormalizeMut(out, v);
      expect(out).toEqual([1, 0, 0]);
    });

    it("vec3NormalizeMut should handle zero vector", () => {
      const out: [number, number, number] = [1, 1, 1];
      vec3NormalizeMut(out, vec3Zero());
      expect(out).toEqual([0, 0, 0]);
    });

    it("vec3CrossMut should compute cross product in place", () => {
      const out: [number, number, number] = [0, 0, 0];
      const a = vec3(1, 0, 0);
      const b = vec3(0, 1, 0);
      vec3CrossMut(out, a, b);
      expect(out).toEqual([0, 0, 1]);
    });

    it("vec3CopyMut should copy vector", () => {
      const out: [number, number, number] = [0, 0, 0];
      const v = vec3(1, 2, 3);
      vec3CopyMut(out, v);
      expect(out).toEqual([1, 2, 3]);
    });

    it("vec3ZeroMut should set to zero", () => {
      const out: [number, number, number] = [1, 2, 3];
      vec3ZeroMut(out);
      expect(out).toEqual([0, 0, 0]);
    });
  });
});
