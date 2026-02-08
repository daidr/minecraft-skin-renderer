/**
 * Side view renderer - renders the character from the right side
 */

import { parseSkin } from "../skin-parser";
import type { SkinViewOptions } from "../types";
import { getPixelatedContext, drawFaceWithOverlay } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's right side view onto a canvas.
 *
 * Layout (8×32 MC pixels):
 *   Head:     (0, 0)   8×8  (head depth = 8)
 *   Body:     (2, 8)   4×12 (body depth = 4, centered in head width)
 *   RightArm: (2, 8)   4×12 (overlapping body, drawn on top)
 *   RightLeg: (2, 20)  4×12
 */
export async function renderSkinSide(
  canvas: HTMLCanvasElement,
  options: SkinViewOptions,
): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);

  const totalWidth = 8; // head depth is widest
  const totalHeight = 32;

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  canvas.width = totalWidth * scale + 2 * pad;
  canvas.height = totalHeight * scale + 2 * pad;

  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const overlay = showOverlay;
  const bodyOffsetX = 2; // center body (4px wide) in head (8px wide)

  // Right Leg (right face)
  drawFaceWithOverlay(
    ctx,
    skin.rightLeg.inner.right,
    overlay ? skin.rightLeg.outer.right : null,
    pad + bodyOffsetX * scale,
    pad + 20 * scale,
    scale,
    inflated,
  );

  // Left Leg (right face) - hidden behind right leg in side view, skip

  // Body (right face)
  drawFaceWithOverlay(
    ctx,
    skin.body.inner.right,
    overlay ? skin.body.outer.right : null,
    pad + bodyOffsetX * scale,
    pad + 8 * scale,
    scale,
    inflated,
  );

  // Right Arm (right face) - drawn on top of body
  drawFaceWithOverlay(
    ctx,
    skin.rightArm.inner.right,
    overlay ? skin.rightArm.outer.right : null,
    pad + bodyOffsetX * scale,
    pad + 8 * scale,
    scale,
    inflated,
  );

  // Head (right face)
  drawFaceWithOverlay(
    ctx,
    skin.head.inner.right,
    overlay ? skin.head.outer.right : null,
    pad,
    pad,
    scale,
    inflated,
  );
}
