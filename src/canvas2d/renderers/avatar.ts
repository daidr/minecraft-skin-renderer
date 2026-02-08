/**
 * Avatar renderer - renders the head front face
 */

import { parseSkin } from "../skin-parser";
import type { AvatarOptions } from "../types";
import { getPixelatedContext, drawFaceWithOverlay } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's head (front face) onto a canvas.
 * Canvas is resized to fit: 8 * scale × 8 * scale pixels.
 */
export async function renderAvatar(
  canvas: HTMLCanvasElement,
  options: AvatarOptions,
): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  canvas.width = 8 * scale + 2 * pad;
  canvas.height = 8 * scale + 2 * pad;

  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawFaceWithOverlay(
    ctx,
    skin.head.inner.front,
    showOverlay ? skin.head.outer.front : null,
    pad,
    pad,
    scale,
    inflated,
  );
}
