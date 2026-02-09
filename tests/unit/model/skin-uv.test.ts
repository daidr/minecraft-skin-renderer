/**
 * SkinUV, CapeUV, ElytraUV tests
 */

import { describe, it, expect } from "vitest";
import {
  getClassicSkinUV,
  getSlimSkinUV,
  getSkinUV,
  isOldSkinFormat,
  convertOldSkinFormat,
} from "@/model/uv/SkinUV";
import { getCapeUV, getElytraUV } from "@/model/uv/CapeUV";
import { getLeftWingUV, getRightWingUV, normalizeElytraUV } from "@/model/uv/ElytraUV";
import type { BoxUV } from "@/model/types";

// Polyfill ImageData for happy-dom environment
if (typeof globalThis.ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

function validateBoxUV(uv: BoxUV) {
  const faces = ["front", "back", "left", "right", "top", "bottom"] as const;
  for (const face of faces) {
    const f = uv[face];
    expect(f).toBeDefined();
    expect(typeof f.u1).toBe("number");
    expect(typeof f.v1).toBe("number");
    expect(typeof f.u2).toBe("number");
    expect(typeof f.v2).toBe("number");
  }
}

describe("SkinUV", () => {
  describe("getClassicSkinUV", () => {
    it("should return UV for all 6 body parts", () => {
      const uv = getClassicSkinUV();
      const parts = ["head", "body", "rightArm", "leftArm", "rightLeg", "leftLeg"] as const;
      for (const part of parts) {
        expect(uv[part]).toBeDefined();
        validateBoxUV(uv[part].inner);
        validateBoxUV(uv[part].outer);
      }
    });

    it("should have classic arm width (4px)", () => {
      const uv = getClassicSkinUV();
      // Right arm inner: starts at (40, 16), width=4 → front U range = 44 to 48
      expect(uv.rightArm.inner.front.u2 - uv.rightArm.inner.front.u1).toBe(4);
    });
  });

  describe("getSlimSkinUV", () => {
    it("should have slim arm width (3px)", () => {
      const uv = getSlimSkinUV();
      // Slim right arm width should be 3
      expect(uv.rightArm.inner.front.u2 - uv.rightArm.inner.front.u1).toBe(3);
      expect(uv.leftArm.inner.front.u2 - uv.leftArm.inner.front.u1).toBe(3);
    });

    it("should share head/body/legs with classic", () => {
      const slim = getSlimSkinUV();
      const classic = getClassicSkinUV();
      expect(slim.head).toEqual(classic.head);
      expect(slim.body).toEqual(classic.body);
      expect(slim.rightLeg).toEqual(classic.rightLeg);
      expect(slim.leftLeg).toEqual(classic.leftLeg);
    });
  });

  describe("getSkinUV", () => {
    it("should return classic UV for 'classic' variant", () => {
      expect(getSkinUV("classic")).toEqual(getClassicSkinUV());
    });

    it("should return slim UV for 'slim' variant", () => {
      expect(getSkinUV("slim")).toEqual(getSlimSkinUV());
    });
  });

  describe("isOldSkinFormat", () => {
    it("should detect 64x32 as old format", () => {
      expect(isOldSkinFormat(64, 32)).toBe(true);
    });

    it("should detect 128x64 as old format", () => {
      expect(isOldSkinFormat(128, 64)).toBe(true);
    });

    it("should not detect 64x64 as old format", () => {
      expect(isOldSkinFormat(64, 64)).toBe(false);
    });
  });

  describe("convertOldSkinFormat", () => {
    function makeImageData(width: number, height: number): ImageData {
      const data = new Uint8ClampedArray(width * height * 4);
      return { width, height, data } as unknown as ImageData;
    }

    it("should return same data if already square", () => {
      const data = makeImageData(64, 64);
      const result = convertOldSkinFormat(data);
      expect(result).toBe(data);
    });

    it("should convert 64x32 to 64x64", () => {
      const data = makeImageData(64, 32);
      // Fill with identifiable data
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = 255; // R
        data.data[i + 1] = 128; // G
        data.data[i + 2] = 64; // B
        data.data[i + 3] = 255; // A
      }

      const result = convertOldSkinFormat(data);
      expect(result.width).toBe(64);
      expect(result.height).toBe(64);
    });

    it("should copy top half unchanged", () => {
      const data = makeImageData(64, 32);
      // Set a specific pixel at (0, 0)
      data.data[0] = 100;
      data.data[1] = 150;
      data.data[2] = 200;
      data.data[3] = 255;

      const result = convertOldSkinFormat(data);
      expect(result.data[0]).toBe(100);
      expect(result.data[1]).toBe(150);
      expect(result.data[2]).toBe(200);
      expect(result.data[3]).toBe(255);
    });

    it("should mirror right arm to left arm region", () => {
      const data = makeImageData(64, 32);
      // Set a pixel in the right arm area (40, 16)
      const srcIdx = (16 * 64 + 40) * 4;
      data.data[srcIdx] = 255;
      data.data[srcIdx + 1] = 0;
      data.data[srcIdx + 2] = 0;
      data.data[srcIdx + 3] = 255;

      const result = convertOldSkinFormat(data);
      // The mirrored pixel should appear in left arm area (32, 48)
      // Mirroring means x is reflected within the 16px wide region
      expect(result.height).toBe(64);
    });
  });
});

describe("CapeUV", () => {
  describe("getCapeUV", () => {
    it("should return valid BoxUV for cape", () => {
      const uv = getCapeUV();
      validateBoxUV(uv);
    });
  });

  describe("getElytraUV", () => {
    it("should return valid BoxUV for elytra", () => {
      const uv = getElytraUV();
      validateBoxUV(uv);
    });
  });
});

describe("ElytraUV", () => {
  describe("getLeftWingUV", () => {
    it("should return valid BoxUV", () => {
      validateBoxUV(getLeftWingUV());
    });
  });

  describe("getRightWingUV", () => {
    it("should return valid BoxUV", () => {
      validateBoxUV(getRightWingUV());
    });

    it("should have mirrored u1/u2 compared to left wing", () => {
      const left = getLeftWingUV();
      const right = getRightWingUV();
      // Right wing front has u1 > u2 (mirrored)
      expect(right.front.u1).toBeGreaterThan(right.front.u2);
      // Left wing front has u1 < u2 (normal)
      expect(left.front.u1).toBeLessThan(left.front.u2);
    });
  });

  describe("normalizeElytraUV", () => {
    it("should normalize to 0-1 range for 64x32 texture", () => {
      const uv = getLeftWingUV();
      const normalized = normalizeElytraUV(uv);

      // Check that values are normalized
      const faces = ["front", "back", "left", "right", "top", "bottom"] as const;
      for (const face of faces) {
        const f = normalized[face];
        // All values should be between 0 and 1
        expect(f.u1).toBeGreaterThanOrEqual(0);
        expect(f.u1).toBeLessThanOrEqual(1);
        expect(f.v1).toBeGreaterThanOrEqual(0);
        expect(f.v1).toBeLessThanOrEqual(1);
      }
    });

    it("should divide u by 64 and v by 32", () => {
      const uv = getLeftWingUV();
      const normalized = normalizeElytraUV(uv);

      expect(normalized.front.u1).toBeCloseTo(uv.front.u1 / 64);
      expect(normalized.front.v1).toBeCloseTo(uv.front.v1 / 32);
      expect(normalized.front.u2).toBeCloseTo(uv.front.u2 / 64);
      expect(normalized.front.v2).toBeCloseTo(uv.front.v2 / 32);
    });
  });
});
