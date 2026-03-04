/**
 * Extended Canvas2D renderer tests — renderBigHead and renderSkinIsometric
 */

import { describe, it, expect } from "vitest";
import { renderSkinIsometric } from "@/canvas2d/renderers/isometric";
import { renderBigHead } from "@/canvas2d/renderers/big-head";

/**
 * Create a minimal 64x64 skin texture (all opaque magenta).
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

describe("renderSkinIsometric", () => {
  it("should set canvas dimensions for classic model (default scale=8)", async () => {
    const canvas = createTestCanvas();
    await renderSkinIsometric(canvas, { skin: createMockSkin() });
    // Canvas should have non-zero dimensions
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it("should produce larger canvas with larger scale", async () => {
    const canvas4 = createTestCanvas();
    const canvas8 = createTestCanvas();
    await renderSkinIsometric(canvas4, { skin: createMockSkin(), scale: 4 });
    await renderSkinIsometric(canvas8, { skin: createMockSkin(), scale: 8 });
    expect(canvas8.width).toBeGreaterThan(canvas4.width);
    expect(canvas8.height).toBeGreaterThan(canvas4.height);
  });

  it("should produce different width for slim vs classic", async () => {
    const classic = createTestCanvas();
    const slim = createTestCanvas();
    await renderSkinIsometric(classic, { skin: createMockSkin(), scale: 8 });
    await renderSkinIsometric(slim, { skin: createMockSkin(), slim: true, scale: 8 });
    // Slim arms are 3px wide vs classic 4px, so canvas width differs
    expect(slim.width).not.toBe(classic.width);
  });

  it("should produce larger canvas when overlay is inflated", async () => {
    const normal = createTestCanvas();
    const inflated = createTestCanvas();
    await renderSkinIsometric(normal, { skin: createMockSkin(), scale: 8 });
    await renderSkinIsometric(inflated, {
      skin: createMockSkin(),
      scale: 8,
      showOverlay: true,
      overlayInflated: true,
    });
    expect(inflated.width).toBeGreaterThan(normal.width);
  });

  it("should handle showOverlay=false", async () => {
    const canvas = createTestCanvas();
    await renderSkinIsometric(canvas, {
      skin: createMockSkin(),
      scale: 4,
      showOverlay: false,
    });
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });
});

describe("renderBigHead", () => {
  it("should set canvas dimensions (default scale=20, border=2)", async () => {
    const canvas = createTestCanvas();
    await renderBigHead(canvas, { skin: createMockSkin() });
    // Big head layout: max width = head(16) + 2*border(2) = 20
    // totalHeight = head(16) + max(torso(6), arm(4)) + legs(2) + 4*border(2) = 32
    // scaled by 20
    expect(canvas.width).toBe(20 * 20); // 400
    expect(canvas.height).toBe(32 * 20); // 640
  });

  it("should scale with custom scale factor", async () => {
    const canvas = createTestCanvas();
    await renderBigHead(canvas, { skin: createMockSkin(), scale: 10 });
    expect(canvas.width).toBe(20 * 10); // 200
    expect(canvas.height).toBe(32 * 10); // 320
  });

  it("should adjust size with custom border", async () => {
    const canvas0 = createTestCanvas();
    const canvas4 = createTestCanvas();
    await renderBigHead(canvas0, { skin: createMockSkin(), scale: 10, border: 0 });
    await renderBigHead(canvas4, { skin: createMockSkin(), scale: 10, border: 4 });
    // Larger border = larger canvas
    expect(canvas4.width).toBeGreaterThan(canvas0.width);
    expect(canvas4.height).toBeGreaterThan(canvas0.height);
  });

  it("should handle border=0", async () => {
    const canvas = createTestCanvas();
    await renderBigHead(canvas, { skin: createMockSkin(), scale: 10, border: 0 });
    // No border: max width = head(16), height = 16+6+2 = 24
    expect(canvas.width).toBe(16 * 10);
    expect(canvas.height).toBe(24 * 10);
  });

  it("should handle showOverlay=false", async () => {
    const canvas = createTestCanvas();
    await renderBigHead(canvas, {
      skin: createMockSkin(),
      scale: 10,
      showOverlay: false,
    });
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it("should produce same dimensions for slim and classic", async () => {
    const classic = createTestCanvas();
    const slim = createTestCanvas();
    await renderBigHead(classic, { skin: createMockSkin(), scale: 10 });
    await renderBigHead(slim, { skin: createMockSkin(), slim: true, scale: 10 });
    // Big head processes body parts into fixed virtual pixel sizes,
    // so slim vs classic should produce the same output dimensions
    expect(slim.width).toBe(classic.width);
    expect(slim.height).toBe(classic.height);
  });
});
