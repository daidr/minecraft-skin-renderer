/**
 * Canvas2D renderer unit tests
 *
 * Tests that renderers correctly set canvas dimensions and call through to drawing.
 * Uses a minimal 64x64 IImageData as skin source.
 */

import { describe, it, expect } from "vitest";
import { renderAvatar } from "@/canvas2d/renderers/avatar";
import { renderSkinFront } from "@/canvas2d/renderers/front";
import { renderSkinBack } from "@/canvas2d/renderers/back";
import { renderSkinSide } from "@/canvas2d/renderers/side";
import { renderHalfBody } from "@/canvas2d/renderers/half-body";

/**
 * Create a minimal 64x64 skin texture (all opaque magenta for visibility).
 */
function createMockSkin(): ImageData {
  const data = new ImageData(64, 64);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 255; // R
    data.data[i + 1] = 0; // G
    data.data[i + 2] = 255; // B
    data.data[i + 3] = 255; // A
  }
  return data;
}

function createTestCanvas(): HTMLCanvasElement {
  return document.createElement("canvas");
}

describe("Canvas2D Renderers", () => {
  describe("renderAvatar", () => {
    it("should set canvas size to 8*scale x 8*scale (default scale=8)", async () => {
      const canvas = createTestCanvas();
      await renderAvatar(canvas, { skin: createMockSkin() });
      expect(canvas.width).toBe(64); // 8 * 8
      expect(canvas.height).toBe(64);
    });

    it("should set canvas size with custom scale", async () => {
      const canvas = createTestCanvas();
      await renderAvatar(canvas, { skin: createMockSkin(), scale: 4 });
      expect(canvas.width).toBe(32); // 8 * 4
      expect(canvas.height).toBe(32);
    });

    it("should add padding when inflated", async () => {
      const canvas = createTestCanvas();
      const scale = 8;
      await renderAvatar(canvas, {
        skin: createMockSkin(),
        scale,
        showOverlay: true,
        overlayInflated: true,
      });
      const pad = scale * 0.5;
      expect(canvas.width).toBe(8 * scale + 2 * pad);
      expect(canvas.height).toBe(8 * scale + 2 * pad);
    });
  });

  describe("renderSkinFront", () => {
    it("should set correct canvas dimensions for classic", async () => {
      const canvas = createTestCanvas();
      await renderSkinFront(canvas, { skin: createMockSkin(), scale: 8 });
      // Classic: (4+8+4) * 8 = 128 wide, 32 * 8 = 256 tall
      expect(canvas.width).toBe(128);
      expect(canvas.height).toBe(256);
    });

    it("should set correct canvas dimensions for slim", async () => {
      const canvas = createTestCanvas();
      await renderSkinFront(canvas, { skin: createMockSkin(), slim: true, scale: 8 });
      // Slim: (3+8+3) * 8 = 112 wide
      expect(canvas.width).toBe(112);
      expect(canvas.height).toBe(256);
    });
  });

  describe("renderSkinBack", () => {
    it("should have same dimensions as front view", async () => {
      const frontCanvas = createTestCanvas();
      const backCanvas = createTestCanvas();
      const skin = createMockSkin();
      await renderSkinFront(frontCanvas, { skin, scale: 8 });
      await renderSkinBack(backCanvas, { skin, scale: 8 });
      expect(backCanvas.width).toBe(frontCanvas.width);
      expect(backCanvas.height).toBe(frontCanvas.height);
    });
  });

  describe("renderSkinSide", () => {
    it("should set correct canvas dimensions (8 wide, 32 tall)", async () => {
      const canvas = createTestCanvas();
      await renderSkinSide(canvas, { skin: createMockSkin(), scale: 8 });
      expect(canvas.width).toBe(64); // 8 * 8
      expect(canvas.height).toBe(256); // 32 * 8
    });
  });

  describe("renderHalfBody", () => {
    it("should set correct canvas dimensions for classic", async () => {
      const canvas = createTestCanvas();
      await renderHalfBody(canvas, { skin: createMockSkin(), scale: 8 });
      // Classic: 16 wide * 8 = 128, 20 tall * 8 = 160
      expect(canvas.width).toBe(128);
      expect(canvas.height).toBe(160);
    });

    it("should set correct canvas dimensions for slim", async () => {
      const canvas = createTestCanvas();
      await renderHalfBody(canvas, { skin: createMockSkin(), slim: true, scale: 8 });
      // Slim: 14 wide * 8 = 112
      expect(canvas.width).toBe(112);
      expect(canvas.height).toBe(160);
    });
  });

  describe("overlay behavior", () => {
    it("should not add padding when overlay is shown but not inflated", async () => {
      const canvas = createTestCanvas();
      await renderSkinFront(canvas, {
        skin: createMockSkin(),
        scale: 8,
        showOverlay: true,
        overlayInflated: false,
      });
      // No padding: 16 * 8 = 128
      expect(canvas.width).toBe(128);
    });

    it("should not add padding when overlay is hidden", async () => {
      const canvas = createTestCanvas();
      await renderSkinFront(canvas, {
        skin: createMockSkin(),
        scale: 8,
        showOverlay: false,
        overlayInflated: true,
      });
      expect(canvas.width).toBe(128);
    });
  });
});
