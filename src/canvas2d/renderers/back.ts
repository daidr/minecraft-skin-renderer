/**
 * Back view renderer - renders the full character from behind
 */

import type { ICanvas } from "../canvas-env";
import { parseSkin } from "../skin-parser";
import type { SkinViewOptions } from "../types";
import { getPixelatedContext, drawFlatBodyParts } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's full body back view onto the given canvas.
 * Mirror of front view: left/right arms and legs swap positions.
 */
export async function renderSkinBack(canvas: ICanvas, options: SkinViewOptions): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);
  const isSlim = skin.variant === "slim";

  const armWidth = isSlim ? 3 : 4;
  const totalWidth = armWidth * 2 + 8;
  const totalHeight = 32;

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  const w = totalWidth * scale + 2 * pad;
  const h = totalHeight * scale + 2 * pad;

  canvas.width = w;
  canvas.height = h;
  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, w, h);

  const bodyX = armWidth;

  // Back view: arms/legs are mirrored horizontally
  drawFlatBodyParts(ctx, skin, [
    { partName: "rightLeg", face: "back", x: bodyX + 4, y: 20 },
    { partName: "leftLeg", face: "back", x: bodyX, y: 20 },
    { partName: "body", face: "back", x: bodyX, y: 8 },
    { partName: "leftArm", face: "back", x: 0, y: 8 },
    { partName: "rightArm", face: "back", x: bodyX + 8, y: 8 },
    { partName: "head", face: "back", x: bodyX, y: 0 },
  ], showOverlay, scale, inflated, pad, skin.textureScale);
}
