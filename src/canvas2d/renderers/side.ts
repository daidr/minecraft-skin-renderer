/**
 * Side view renderer - renders the character from the right side
 */

import type { ICanvas } from "../canvas-env";
import { parseSkin } from "../skin-parser";
import type { SkinViewOptions } from "../types";
import { getPixelatedContext, drawFlatBodyParts } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's right side view onto the given canvas.
 *
 * Layout (8x32 MC pixels):
 *   Head:     (0, 0)   8x8  (head depth = 8)
 *   Body:     (2, 8)   4x12 (body depth = 4, centered in head width)
 *   RightArm: (2, 8)   4x12 (overlapping body, drawn on top)
 *   RightLeg: (2, 20)  4x12
 */
export async function renderSkinSide(canvas: ICanvas, options: SkinViewOptions): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);

  const totalWidth = 8; // head depth is widest
  const totalHeight = 32;

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  const w = totalWidth * scale + 2 * pad;
  const h = totalHeight * scale + 2 * pad;

  canvas.width = w;
  canvas.height = h;
  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, w, h);

  const bodyOffsetX = 2; // center body (4px wide) in head (8px wide)

  drawFlatBodyParts(ctx, skin, [
    { partName: "rightLeg", face: "right", x: bodyOffsetX, y: 20 },
    { partName: "body", face: "right", x: bodyOffsetX, y: 8 },
    { partName: "rightArm", face: "right", x: bodyOffsetX, y: 8 },
    { partName: "head", face: "right", x: 0, y: 0 },
  ], showOverlay, scale, inflated, pad, skin.textureScale);
}
