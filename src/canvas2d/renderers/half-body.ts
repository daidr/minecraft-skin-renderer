/**
 * Half-body renderer - renders head + body + arms (upper half)
 */

import type { ICanvas } from "../canvas-env";
import { parseSkin } from "../skin-parser";
import type { HalfBodyOptions } from "../types";
import { getPixelatedContext, drawFlatBodyParts } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's upper half (head + body + arms) front view onto the given canvas.
 *
 * Classic layout (16x20 MC pixels):
 *   Head:     (4, 0)   8x8
 *   Body:     (4, 8)   8x12
 *   LeftArm:  (0, 8)   4x12
 *   RightArm: (12, 8)  4x12
 *
 * Slim layout (14x20 MC pixels):
 *   Head:     (3, 0)   8x8
 *   Body:     (3, 8)   8x12
 *   LeftArm:  (0, 8)   3x12
 *   RightArm: (11, 8)  3x12
 */
export async function renderHalfBody(canvas: ICanvas, options: HalfBodyOptions): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);
  const isSlim = skin.variant === "slim";

  const armWidth = isSlim ? 3 : 4;
  const totalWidth = armWidth * 2 + 8;
  const totalHeight = 20; // head(8) + body(12)

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  const w = totalWidth * scale + 2 * pad;
  const h = totalHeight * scale + 2 * pad;

  canvas.width = w;
  canvas.height = h;
  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, w, h);

  const bodyX = armWidth;

  drawFlatBodyParts(ctx, skin, [
    { partName: "body", face: "front", x: bodyX, y: 8 },
    { partName: "rightArm", face: "front", x: 0, y: 8 },
    { partName: "leftArm", face: "front", x: bodyX + 8, y: 8 },
    { partName: "head", face: "front", x: bodyX, y: 0 },
  ], showOverlay, scale, inflated, pad, skin.textureScale);
}
