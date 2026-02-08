/**
 * Front view renderer - renders the full character from the front
 */

import { parseSkin } from "../skin-parser";
import type { SkinViewOptions, ParsedSkin } from "../types";
import { getPixelatedContext, drawFaceWithOverlay } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Render the player's full body front view onto a canvas.
 *
 * Classic layout (16×32 MC pixels):
 *   Head:     (4, 0)   8×8
 *   Body:     (4, 8)   8×12
 *   LeftArm:  (0, 8)   4×12
 *   RightArm: (12, 8)  4×12
 *   LeftLeg:  (4, 20)  4×12
 *   RightLeg: (8, 20)  4×12
 *
 * Slim layout (14×32 MC pixels):
 *   Head:     (3, 0)   8×8
 *   Body:     (3, 8)   8×12
 *   LeftArm:  (0, 8)   3×12
 *   RightArm: (11, 8)  3×12
 *   LeftLeg:  (3, 20)  4×12
 *   RightLeg: (7, 20)  4×12
 */
export async function renderSkinFront(
  canvas: HTMLCanvasElement,
  options: SkinViewOptions,
): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const inflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);
  const isSlim = skin.variant === "slim";

  const armWidth = isSlim ? 3 : 4;
  const totalWidth = armWidth * 2 + 8; // 14 or 16
  const totalHeight = 32;

  const pad = showOverlay && inflated ? scale * 0.5 : 0;
  canvas.width = totalWidth * scale + 2 * pad;
  canvas.height = totalHeight * scale + 2 * pad;

  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bodyX = armWidth;

  drawBody(ctx, skin, bodyX, showOverlay, scale, inflated, pad);
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  skin: ParsedSkin,
  bodyX: number,
  showOverlay: boolean,
  scale: number,
  inflated: boolean,
  pad: number,
): void {
  const overlay = showOverlay;

  // Draw back-to-front for proper layering: legs, body, arms, head

  // Left Leg (front face) - player's left leg, on the right side of front view
  drawFaceWithOverlay(
    ctx,
    skin.leftLeg.inner.front,
    overlay ? skin.leftLeg.outer.front : null,
    pad + (bodyX + 4) * scale,
    pad + 20 * scale,
    scale,
    inflated,
  );

  // Right Leg (front face) - player's right leg, on the left side of front view
  drawFaceWithOverlay(
    ctx,
    skin.rightLeg.inner.front,
    overlay ? skin.rightLeg.outer.front : null,
    pad + bodyX * scale,
    pad + 20 * scale,
    scale,
    inflated,
  );

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

  // Right Arm (front face) - player's right arm, on the left side of front view
  drawFaceWithOverlay(
    ctx,
    skin.rightArm.inner.front,
    overlay ? skin.rightArm.outer.front : null,
    pad,
    pad + 8 * scale,
    scale,
    inflated,
  );

  // Left Arm (front face) - player's left arm, on the right side of front view
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
