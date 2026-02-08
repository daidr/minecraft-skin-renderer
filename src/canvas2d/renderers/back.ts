/**
 * Back view renderer - renders the full character from behind
 */

import type { ICanvas } from "../canvas-env";
import { parseSkin } from "../skin-parser";
import type { SkinViewOptions } from "../types";
import { getPixelatedContext, drawFaceWithOverlay } from "./utils";

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
  const overlay = showOverlay;
  const ts = skin.textureScale;

  // Back view: arms/legs are mirrored horizontally
  // Player's left arm appears on left side, right arm on right side

  // Right Leg (back face) - appears on right side in back view
  drawFaceWithOverlay(
    ctx,
    skin.rightLeg.inner.back,
    overlay ? skin.rightLeg.outer.back : null,
    pad + (bodyX + 4) * scale,
    pad + 20 * scale,
    scale,
    inflated,
    ts,
  );

  // Left Leg (back face) - appears on left side in back view
  drawFaceWithOverlay(
    ctx,
    skin.leftLeg.inner.back,
    overlay ? skin.leftLeg.outer.back : null,
    pad + bodyX * scale,
    pad + 20 * scale,
    scale,
    inflated,
    ts,
  );

  // Body
  drawFaceWithOverlay(
    ctx,
    skin.body.inner.back,
    overlay ? skin.body.outer.back : null,
    pad + bodyX * scale,
    pad + 8 * scale,
    scale,
    inflated,
    ts,
  );

  // Left Arm (back face) - appears on left side in back view
  drawFaceWithOverlay(
    ctx,
    skin.leftArm.inner.back,
    overlay ? skin.leftArm.outer.back : null,
    pad,
    pad + 8 * scale,
    scale,
    inflated,
    ts,
  );

  // Right Arm (back face) - appears on right side in back view
  drawFaceWithOverlay(
    ctx,
    skin.rightArm.inner.back,
    overlay ? skin.rightArm.outer.back : null,
    pad + (bodyX + 8) * scale,
    pad + 8 * scale,
    scale,
    inflated,
    ts,
  );

  // Head
  drawFaceWithOverlay(
    ctx,
    skin.head.inner.back,
    overlay ? skin.head.outer.back : null,
    pad + bodyX * scale,
    pad,
    scale,
    inflated,
    ts,
  );
}
