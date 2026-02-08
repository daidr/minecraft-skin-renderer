/**
 * Half-body renderer - renders head + body + arms (upper half)
 */

import { parseSkin } from "../skin-parser";
import type { HalfBodyOptions } from "../types";
import { getPixelatedContext, drawFaceWithOverlay } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's upper half (head + body + arms) front view onto a canvas.
 *
 * Classic layout (16×20 MC pixels):
 *   Head:     (4, 0)   8×8
 *   Body:     (4, 8)   8×12
 *   LeftArm:  (0, 8)   4×12
 *   RightArm: (12, 8)  4×12
 *
 * Slim layout (14×20 MC pixels):
 *   Head:     (3, 0)   8×8
 *   Body:     (3, 8)   8×12
 *   LeftArm:  (0, 8)   3×12
 *   RightArm: (11, 8)  3×12
 */
export async function renderHalfBody(
  canvas: HTMLCanvasElement,
  options: HalfBodyOptions,
): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);
  const isSlim = skin.variant === "slim";

  const armWidth = isSlim ? 3 : 4;
  const totalWidth = armWidth * 2 + 8;
  const totalHeight = 20; // head(8) + body(12)

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  canvas.width = totalWidth * scale + 2 * pad;
  canvas.height = totalHeight * scale + 2 * pad;

  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bodyX = armWidth;
  const overlay = showOverlay;

  // Body
  drawFaceWithOverlay(
    ctx,
    skin.body.inner.front,
    overlay ? skin.body.outer.front : null,
    pad + bodyX * scale,
    pad + 8 * scale,
    scale,
    inflated,
  );

  // Right Arm (player's right, left side of front view)
  drawFaceWithOverlay(
    ctx,
    skin.rightArm.inner.front,
    overlay ? skin.rightArm.outer.front : null,
    pad,
    pad + 8 * scale,
    scale,
    inflated,
  );

  // Left Arm (player's left, right side of front view)
  drawFaceWithOverlay(
    ctx,
    skin.leftArm.inner.front,
    overlay ? skin.leftArm.outer.front : null,
    pad + (bodyX + 8) * scale,
    pad + 8 * scale,
    scale,
    inflated,
  );

  // Head
  drawFaceWithOverlay(
    ctx,
    skin.head.inner.front,
    overlay ? skin.head.outer.front : null,
    pad + bodyX * scale,
    pad,
    scale,
    inflated,
  );
}
