/**
 * Quaternion unit tests
 */

import { describe, it, expect } from "vitest";
import {
  quatIdentity,
  quat,
  quatClone,
  quatFromAxisAngle,
  quatFromEuler,
  quatMultiply,
  quatRotateX,
  quatRotateY,
  quatRotateZ,
  quatNormalize,
  quatInvert,
  quatSlerp,
  quatToMat4,
  quatRotateVec3,
  quatGetAxisAngle,
  quatEquals,
  quatDot,
  quatLength,
  quatToFloat32Array,
  quatCopyMut,
  quatIdentityMut,
  quatMultiplyMut,
  quatNormalizeMut,
  quatSlerpMut,
  quatToMat4Mut,
} from "@/core/math/quat";
import { vec3 } from "@/core/math/vec3";
import { mat4Identity } from "@/core/math/mat4";

describe("quat", () => {
  describe("quatIdentity", () => {
    it("should create an identity quaternion", () => {
      const q = quatIdentity();
      expect(q).toEqual([0, 0, 0, 1]);
    });
  });

  describe("quatFromAxisAngle", () => {
    it("should create quaternion from axis and angle", () => {
      const axis = vec3(0, 1, 0);
      const angle = Math.PI / 2; // 90 degrees

      const q = quatFromAxisAngle(axis, angle);

      // For 90 degree rotation around Y: [0, sin(45°), 0, cos(45°)]
      expect(q[0]).toBeCloseTo(0);
      expect(q[1]).toBeCloseTo(Math.sin(Math.PI / 4));
      expect(q[2]).toBeCloseTo(0);
      expect(q[3]).toBeCloseTo(Math.cos(Math.PI / 4));
    });

    it("should create identity for zero angle", () => {
      const axis = vec3(1, 0, 0);
      const q = quatFromAxisAngle(axis, 0);

      expect(q[0]).toBeCloseTo(0);
      expect(q[1]).toBeCloseTo(0);
      expect(q[2]).toBeCloseTo(0);
      expect(q[3]).toBeCloseTo(1);
    });
  });

  describe("quatFromEuler", () => {
    it("should create quaternion from Euler angles", () => {
      const q = quatFromEuler(0, 0, 0);
      expect(quatEquals(q, quatIdentity())).toBe(true);
    });

    it("should handle 90 degree rotation", () => {
      const q = quatFromEuler(Math.PI / 2, 0, 0);
      // Should rotate 90 degrees around X
      expect(q[0]).toBeCloseTo(Math.sin(Math.PI / 4));
      expect(q[3]).toBeCloseTo(Math.cos(Math.PI / 4));
    });
  });

  describe("quatMultiply", () => {
    it("should return same quaternion when multiplied by identity", () => {
      const q = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 4);
      const identity = quatIdentity();
      const result = quatMultiply(q, identity);

      expect(quatEquals(result, q)).toBe(true);
    });

    it("should combine rotations", () => {
      const q1 = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
      const q2 = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
      const combined = quatMultiply(q1, q2);

      // Two 90 degree rotations = 180 degrees
      const expected = quatFromAxisAngle(vec3(0, 1, 0), Math.PI);
      expect(quatEquals(combined, expected, 0.0001)).toBe(true);
    });
  });

  describe("quatNormalize", () => {
    it("should normalize a quaternion", () => {
      const q: [number, number, number, number] = [1, 1, 1, 1];
      const normalized = quatNormalize(q);

      const length = Math.sqrt(
        normalized[0] ** 2 + normalized[1] ** 2 + normalized[2] ** 2 + normalized[3] ** 2,
      );

      expect(length).toBeCloseTo(1);
    });

    it("should return identity for zero quaternion", () => {
      const q: [number, number, number, number] = [0, 0, 0, 0];
      const normalized = quatNormalize(q);
      expect(normalized).toEqual([0, 0, 0, 1]);
    });
  });

  describe("quatSlerp", () => {
    it("should return first quaternion at t=0", () => {
      const a = quatIdentity();
      const b = quatFromAxisAngle(vec3(0, 1, 0), Math.PI);
      const result = quatSlerp(a, b, 0);

      expect(quatEquals(result, a)).toBe(true);
    });

    it("should return second quaternion at t=1", () => {
      const a = quatIdentity();
      const b = quatFromAxisAngle(vec3(0, 1, 0), Math.PI);
      const result = quatSlerp(a, b, 1);

      // Note: quaternions q and -q represent the same rotation
      const match =
        quatEquals(result, b, 0.0001) || quatEquals(result, [-b[0], -b[1], -b[2], -b[3]], 0.0001);

      expect(match).toBe(true);
    });

    it("should interpolate at t=0.5", () => {
      const a = quatIdentity();
      const b = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
      const result = quatSlerp(a, b, 0.5);

      // At t=0.5, should be 45 degree rotation
      const expected = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 4);
      expect(quatEquals(result, expected, 0.0001)).toBe(true);
    });
  });

  describe("quatRotateVec3", () => {
    it("should not change vector with identity quaternion", () => {
      const q = quatIdentity();
      const v = vec3(1, 2, 3);
      const result = quatRotateVec3(q, v);

      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(2);
      expect(result[2]).toBeCloseTo(3);
    });

    it("should rotate vector around Y axis", () => {
      const q = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
      const v = vec3(1, 0, 0);
      const result = quatRotateVec3(q, v);

      // 90 degree rotation around Y: X -> Z
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(-1);
    });
  });

  describe("quat", () => {
    it("should create quaternion from components", () => {
      const q = quat(1, 2, 3, 4);
      expect(q).toEqual([1, 2, 3, 4]);
    });
  });

  describe("quatClone", () => {
    it("should clone quaternion", () => {
      const q = quat(1, 2, 3, 4);
      const cloned = quatClone(q);
      expect(cloned).toEqual([1, 2, 3, 4]);
      expect(cloned).not.toBe(q);
    });
  });

  describe("quatRotateX", () => {
    it("should rotate around X axis", () => {
      const q = quatIdentity();
      const rotated = quatRotateX(q, Math.PI / 2);
      expect(rotated[0]).toBeCloseTo(Math.sin(Math.PI / 4));
      expect(rotated[3]).toBeCloseTo(Math.cos(Math.PI / 4));
    });
  });

  describe("quatRotateY", () => {
    it("should rotate around Y axis", () => {
      const q = quatIdentity();
      const rotated = quatRotateY(q, Math.PI / 2);
      expect(rotated[1]).toBeCloseTo(Math.sin(Math.PI / 4));
      expect(rotated[3]).toBeCloseTo(Math.cos(Math.PI / 4));
    });
  });

  describe("quatRotateZ", () => {
    it("should rotate around Z axis", () => {
      const q = quatIdentity();
      const rotated = quatRotateZ(q, Math.PI / 2);
      expect(rotated[2]).toBeCloseTo(Math.sin(Math.PI / 4));
      expect(rotated[3]).toBeCloseTo(Math.cos(Math.PI / 4));
    });
  });

  describe("quatInvert", () => {
    it("should invert quaternion", () => {
      const q = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 4);
      const inv = quatInvert(q);
      const product = quatMultiply(q, inv);
      expect(quatEquals(product, quatIdentity(), 0.0001)).toBe(true);
    });

    it("should handle zero quaternion", () => {
      const q: [number, number, number, number] = [0, 0, 0, 0];
      const inv = quatInvert(q);
      expect(inv).toEqual([0, 0, 0, 0]);
    });
  });

  describe("quatToMat4", () => {
    it("should convert identity quaternion to identity matrix", () => {
      const q = quatIdentity();
      const m = quatToMat4(q);
      const identity = mat4Identity();
      for (let i = 0; i < 16; i++) {
        expect(m[i]).toBeCloseTo(identity[i]!);
      }
    });
  });

  describe("quatGetAxisAngle", () => {
    it("should extract axis and angle", () => {
      const axis = vec3(0, 1, 0);
      const angle = Math.PI / 4;
      const q = quatFromAxisAngle(axis, angle);
      const result = quatGetAxisAngle(q);

      expect(result.angle).toBeCloseTo(angle);
      expect(result.axis[1]).toBeCloseTo(1);
    });

    it("should handle identity quaternion", () => {
      const q = quatIdentity();
      const result = quatGetAxisAngle(q);
      expect(result.angle).toBeCloseTo(0);
    });
  });

  describe("quatDot", () => {
    it("should compute dot product", () => {
      const a = quat(1, 2, 3, 4);
      const b = quat(5, 6, 7, 8);
      expect(quatDot(a, b)).toBe(70); // 1*5 + 2*6 + 3*7 + 4*8
    });
  });

  describe("quatLength", () => {
    it("should compute length", () => {
      const q = quat(0, 0, 0, 1);
      expect(quatLength(q)).toBe(1);
    });
  });

  describe("quatToFloat32Array", () => {
    it("should convert to Float32Array", () => {
      const q = quat(1, 2, 3, 4);
      const arr = quatToFloat32Array(q);
      expect(arr).toBeInstanceOf(Float32Array);
      expect(arr[0]).toBe(1);
      expect(arr[3]).toBe(4);
    });
  });

  describe("Mutable operations", () => {
    it("quatCopyMut should copy quaternion", () => {
      const out: [number, number, number, number] = [0, 0, 0, 0];
      const q = quat(1, 2, 3, 4);
      quatCopyMut(out, q);
      expect(out).toEqual([1, 2, 3, 4]);
    });

    it("quatIdentityMut should set to identity", () => {
      const out: [number, number, number, number] = [1, 2, 3, 4];
      quatIdentityMut(out);
      expect(out).toEqual([0, 0, 0, 1]);
    });

    it("quatMultiplyMut should multiply in place", () => {
      const out: [number, number, number, number] = [0, 0, 0, 0];
      const a = quatIdentity();
      const b = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 4);
      quatMultiplyMut(out, a, b);
      expect(quatEquals(out, b)).toBe(true);
    });

    it("quatNormalizeMut should normalize in place", () => {
      const out: [number, number, number, number] = [0, 0, 0, 0];
      const q: [number, number, number, number] = [1, 1, 1, 1];
      quatNormalizeMut(out, q);
      expect(quatLength(out)).toBeCloseTo(1);
    });

    it("quatNormalizeMut should handle zero quaternion", () => {
      const out: [number, number, number, number] = [1, 1, 1, 1];
      const q: [number, number, number, number] = [0, 0, 0, 0];
      quatNormalizeMut(out, q);
      expect(out).toEqual([0, 0, 0, 1]);
    });

    it("quatSlerpMut should slerp in place", () => {
      const out: [number, number, number, number] = [0, 0, 0, 0];
      const a = quatIdentity();
      const b = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
      quatSlerpMut(out, a, b, 0.5);
      const expected = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 4);
      expect(quatEquals(out, expected, 0.0001)).toBe(true);
    });

    it("quatToMat4Mut should convert in place", () => {
      const out = new Float32Array(16);
      const q = quatIdentity();
      quatToMat4Mut(out, q);
      expect(out[0]).toBeCloseTo(1);
      expect(out[5]).toBeCloseTo(1);
      expect(out[10]).toBeCloseTo(1);
      expect(out[15]).toBeCloseTo(1);
    });
  });
});
