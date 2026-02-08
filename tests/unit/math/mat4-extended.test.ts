/**
 * Mat4 extended tests - covers functions missed by existing tests
 */

import { describe, it, expect } from "vitest";
import {
  mat4Identity,
  mat4Zero,
  mat4Clone,
  mat4Copy,
  mat4FromTranslation,
  mat4FromScaling,
  mat4Translate,
  mat4Scale,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Ortho,
  mat4Transpose,
  mat4GetTranslation,
  mat4GetScaling,
  mat4IdentityMut,
  mat4MultiplyMut,
  mat4TranslateMut,
  mat4ScaleMut,
  mat4FromTranslationMut,
} from "@/core/math/mat4";
import { vec3 } from "@/core/math/vec3";

describe("mat4 extended", () => {
  describe("mat4Zero", () => {
    it("should create an all-zero matrix", () => {
      const m = mat4Zero();
      for (let i = 0; i < 16; i++) {
        expect(m[i]).toBe(0);
      }
    });
  });

  describe("mat4Clone", () => {
    it("should create an independent copy", () => {
      const original = mat4FromTranslation(vec3(1, 2, 3));
      const cloned = mat4Clone(original);

      expect(Array.from(cloned)).toEqual(Array.from(original));

      // Mutating clone should not affect original
      cloned[12] = 99;
      expect(original[12]).toBe(1);
    });
  });

  describe("mat4Copy", () => {
    it("should copy matrix a into out", () => {
      const a = mat4FromTranslation(vec3(5, 6, 7));
      const out = mat4Zero();
      const result = mat4Copy(out, a);

      expect(result).toBe(out);
      expect(Array.from(out)).toEqual(Array.from(a));
    });
  });

  describe("mat4Translate", () => {
    it("should translate an identity matrix", () => {
      const m = mat4Identity();
      const result = mat4Translate(m, vec3(3, 4, 5));
      const t = mat4GetTranslation(result);
      expect(t[0]).toBeCloseTo(3);
      expect(t[1]).toBeCloseTo(4);
      expect(t[2]).toBeCloseTo(5);
    });

    it("should accumulate translations", () => {
      const m = mat4FromTranslation(vec3(1, 0, 0));
      const result = mat4Translate(m, vec3(2, 0, 0));
      const t = mat4GetTranslation(result);
      expect(t[0]).toBeCloseTo(3);
    });
  });

  describe("mat4Scale", () => {
    it("should scale an identity matrix", () => {
      const m = mat4Identity();
      const result = mat4Scale(m, vec3(2, 3, 4));
      const s = mat4GetScaling(result);
      expect(s[0]).toBeCloseTo(2);
      expect(s[1]).toBeCloseTo(3);
      expect(s[2]).toBeCloseTo(4);
    });
  });

  describe("mat4RotateX/Y/Z", () => {
    it("mat4RotateX should rotate a matrix around X", () => {
      const m = mat4Identity();
      const rotated = mat4RotateX(m, Math.PI / 2);
      // Y axis should become Z axis after 90° X rotation
      expect(rotated[5]).toBeCloseTo(0);
      expect(rotated[6]).toBeCloseTo(1);
    });

    it("mat4RotateY should rotate a matrix around Y", () => {
      const m = mat4Identity();
      const rotated = mat4RotateY(m, Math.PI / 2);
      expect(rotated[0]).toBeCloseTo(0);
      expect(rotated[8]).toBeCloseTo(1);
    });

    it("mat4RotateZ should rotate a matrix around Z", () => {
      const m = mat4Identity();
      const rotated = mat4RotateZ(m, Math.PI / 2);
      expect(rotated[0]).toBeCloseTo(0);
      expect(rotated[1]).toBeCloseTo(1);
    });
  });

  describe("mat4Ortho", () => {
    it("should create an orthographic projection matrix", () => {
      const m = mat4Ortho(-1, 1, -1, 1, 0.1, 100);
      // Check that it maps the center of the frustum to origin
      expect(m[0]).toBeCloseTo(1); // 2 / (right - left) = 2/2 = 1
      expect(m[5]).toBeCloseTo(1); // 2 / (top - bottom) = 2/2 = 1
      expect(m[15]).toBe(1); // Orthographic projection w = 1
    });

    it("should handle asymmetric bounds", () => {
      const m = mat4Ortho(0, 800, 0, 600, -1, 1);
      expect(m[0]).toBeCloseTo(2 / 800);
      expect(m[5]).toBeCloseTo(2 / 600);
    });
  });

  describe("mat4Transpose", () => {
    it("should transpose a matrix", () => {
      const m = mat4FromTranslation(vec3(1, 2, 3));
      const t = mat4Transpose(m);
      // Translation (m[12], m[13], m[14]) should move to (t[3], t[7], t[11])
      expect(t[3]).toBe(1);
      expect(t[7]).toBe(2);
      expect(t[11]).toBe(3);
    });

    it("should be its own inverse (transpose(transpose(m)) == m)", () => {
      const m = mat4FromScaling(vec3(2, 3, 4));
      m[1] = 0.5; // Make asymmetric
      const result = mat4Transpose(mat4Transpose(m));
      for (let i = 0; i < 16; i++) {
        expect(result[i]).toBeCloseTo(m[i]!);
      }
    });
  });

  describe("mat4GetScaling", () => {
    it("should extract scaling from a scaling matrix", () => {
      const m = mat4FromScaling(vec3(2, 3, 4));
      const s = mat4GetScaling(m);
      expect(s[0]).toBeCloseTo(2);
      expect(s[1]).toBeCloseTo(3);
      expect(s[2]).toBeCloseTo(4);
    });

    it("should return [1,1,1] for identity", () => {
      const s = mat4GetScaling(mat4Identity());
      expect(s[0]).toBeCloseTo(1);
      expect(s[1]).toBeCloseTo(1);
      expect(s[2]).toBeCloseTo(1);
    });
  });

  describe("mutable operations", () => {
    it("mat4IdentityMut should set matrix to identity in-place", () => {
      const m = mat4FromScaling(vec3(5, 5, 5));
      const result = mat4IdentityMut(m);
      expect(result).toBe(m);
      expect(m[0]).toBe(1);
      expect(m[5]).toBe(1);
      expect(m[10]).toBe(1);
      expect(m[15]).toBe(1);
      expect(m[1]).toBe(0);
    });

    it("mat4MultiplyMut should write to output buffer", () => {
      const out = new Float32Array(16);
      const a = mat4Identity();
      const b = mat4FromTranslation(vec3(1, 2, 3));
      const result = mat4MultiplyMut(out, a, b);
      expect(result).toBe(out);
      expect(out[12]).toBeCloseTo(1);
      expect(out[13]).toBeCloseTo(2);
      expect(out[14]).toBeCloseTo(3);
    });

    it("mat4TranslateMut should translate in-place when out === m", () => {
      const m = mat4Identity();
      const result = mat4TranslateMut(m, m, vec3(10, 20, 30));
      expect(result).toBe(m);
      expect(m[12]).toBeCloseTo(10);
      expect(m[13]).toBeCloseTo(20);
      expect(m[14]).toBeCloseTo(30);
    });

    it("mat4TranslateMut should work with separate output", () => {
      const m = mat4Identity();
      const out = new Float32Array(16);
      mat4TranslateMut(out, m, vec3(5, 6, 7));
      expect(out[12]).toBeCloseTo(5);
      expect(out[13]).toBeCloseTo(6);
      expect(out[14]).toBeCloseTo(7);
    });

    it("mat4ScaleMut should scale in output buffer", () => {
      const out = new Float32Array(16);
      const m = mat4Identity();
      mat4ScaleMut(out, m, vec3(2, 3, 4));
      expect(out[0]).toBeCloseTo(2);
      expect(out[5]).toBeCloseTo(3);
      expect(out[10]).toBeCloseTo(4);
    });

    it("mat4FromTranslationMut should create translation in output buffer", () => {
      const out = new Float32Array(16);
      mat4FromTranslationMut(out, vec3(1, 2, 3));
      expect(out[0]).toBe(1);
      expect(out[5]).toBe(1);
      expect(out[10]).toBe(1);
      expect(out[15]).toBe(1);
      expect(out[12]).toBe(1);
      expect(out[13]).toBe(2);
      expect(out[14]).toBe(3);
    });
  });
});
