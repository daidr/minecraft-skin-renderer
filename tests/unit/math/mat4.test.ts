/**
 * Mat4 unit tests
 */

import { describe, it, expect } from "vitest";
import {
  mat4Identity,
  mat4Multiply,
  mat4FromTranslation,
  mat4FromScaling,
  mat4FromRotationX,
  mat4FromRotationY,
  mat4FromRotationZ,
  mat4Perspective,
  mat4LookAt,
  mat4Invert,
  mat4GetTranslation,
} from "@/core/math/mat4";
import { vec3 } from "@/core/math/vec3";

describe("mat4", () => {
  describe("mat4Identity", () => {
    it("should create an identity matrix", () => {
      const m = mat4Identity();
      expect(m[0]).toBe(1);
      expect(m[5]).toBe(1);
      expect(m[10]).toBe(1);
      expect(m[15]).toBe(1);
      expect(m[1]).toBe(0);
      expect(m[4]).toBe(0);
    });
  });

  describe("mat4Multiply", () => {
    it("should return same matrix when multiplied by identity", () => {
      const a = mat4FromTranslation(vec3(1, 2, 3));
      const identity = mat4Identity();
      const result = mat4Multiply(a, identity);

      for (let i = 0; i < 16; i++) {
        expect(result[i]).toBeCloseTo(a[i]!);
      }
    });

    it("should combine transformations", () => {
      const translate = mat4FromTranslation(vec3(10, 0, 0));
      const scale = mat4FromScaling(vec3(2, 2, 2));
      const result = mat4Multiply(translate, scale);

      // The translation should be applied after scaling
      const translation = mat4GetTranslation(result);
      expect(translation[0]).toBeCloseTo(10);
    });
  });

  describe("mat4FromTranslation", () => {
    it("should create a translation matrix", () => {
      const m = mat4FromTranslation(vec3(1, 2, 3));
      expect(m[12]).toBe(1);
      expect(m[13]).toBe(2);
      expect(m[14]).toBe(3);
    });
  });

  describe("mat4FromScaling", () => {
    it("should create a scaling matrix", () => {
      const m = mat4FromScaling(vec3(2, 3, 4));
      expect(m[0]).toBe(2);
      expect(m[5]).toBe(3);
      expect(m[10]).toBe(4);
    });
  });

  describe("mat4FromRotationX", () => {
    it("should create a rotation matrix around X axis", () => {
      const m = mat4FromRotationX(Math.PI / 2);
      // After 90 degree rotation, Y should become Z
      expect(m[5]).toBeCloseTo(0);
      expect(m[6]).toBeCloseTo(1);
      expect(m[9]).toBeCloseTo(-1);
      expect(m[10]).toBeCloseTo(0);
    });
  });

  describe("mat4FromRotationY", () => {
    it("should create a rotation matrix around Y axis", () => {
      const m = mat4FromRotationY(Math.PI / 2);
      // After 90 degree rotation, X should become -Z
      expect(m[0]).toBeCloseTo(0);
      expect(m[2]).toBeCloseTo(-1);
      expect(m[8]).toBeCloseTo(1);
      expect(m[10]).toBeCloseTo(0);
    });
  });

  describe("mat4FromRotationZ", () => {
    it("should create a rotation matrix around Z axis", () => {
      const m = mat4FromRotationZ(Math.PI / 2);
      // After 90 degree rotation, X should become Y
      expect(m[0]).toBeCloseTo(0);
      expect(m[1]).toBeCloseTo(1);
      expect(m[4]).toBeCloseTo(-1);
      expect(m[5]).toBeCloseTo(0);
    });
  });

  describe("mat4Perspective", () => {
    it("should create a perspective projection matrix", () => {
      const m = mat4Perspective(Math.PI / 4, 1.0, 0.1, 100);
      expect(m[11]).toBe(-1); // Perspective divide indicator
      expect(m[0]).toBeGreaterThan(0);
      expect(m[5]).toBeGreaterThan(0);
    });
  });

  describe("mat4LookAt", () => {
    it("should create a view matrix", () => {
      const eye = vec3(0, 0, 10);
      const center = vec3(0, 0, 0);
      const up = vec3(0, 1, 0);
      const m = mat4LookAt(eye, center, up);

      // Should move camera to origin looking down -Z
      expect(m[14]).toBeCloseTo(-10);
    });
  });

  describe("mat4Invert", () => {
    it("should invert a matrix", () => {
      const m = mat4FromTranslation(vec3(5, 10, 15));
      const inv = mat4Invert(m);

      expect(inv).not.toBeNull();
      if (inv) {
        const identity = mat4Multiply(m, inv);
        expect(identity[0]).toBeCloseTo(1);
        expect(identity[5]).toBeCloseTo(1);
        expect(identity[10]).toBeCloseTo(1);
        expect(identity[15]).toBeCloseTo(1);
        expect(identity[12]).toBeCloseTo(0);
        expect(identity[13]).toBeCloseTo(0);
        expect(identity[14]).toBeCloseTo(0);
      }
    });

    it("should return null for singular matrix", () => {
      const m = new Float32Array(16); // All zeros
      const inv = mat4Invert(m);
      expect(inv).toBeNull();
    });
  });
});
