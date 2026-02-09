/**
 * Avatar renderer - renders the head front face
 */

import type { ICanvas } from "../canvas-env";
import { parseSkin } from "../skin-parser";
import type { AvatarOptions } from "../types";
import { getPixelatedContext, drawFaceWithOverlay } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's head (front face) onto the given canvas.
 * Canvas is resized to 8 * scale × 8 * scale pixels (plus padding if inflated).
 */
export async function renderAvatar(canvas: ICanvas, options: AvatarOptions): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  const w = 8 * scale + 2 * pad;
  const h = 8 * scale + 2 * pad;

  canvas.width = w;
  canvas.height = h;
  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, w, h);

  drawFaceWithOverlay(
    ctx,
    skin.head.inner.front,
    showOverlay ? skin.head.outer.front : null,
    pad,
    pad,
    scale,
    inflated,
    skin.textureScale,
  );
}
