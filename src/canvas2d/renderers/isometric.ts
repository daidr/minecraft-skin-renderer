/**
 * Isometric (2.5D) view renderer - renders the character with front + left side visible
 *
 * Uses canvas transforms to create a pseudo-3D isometric projection.
 * Each body part is rendered as a box with front face, left face, and top face visible.
 * The depth (left side) extends to the upper right of the image.
 *
 * Faces are rendered in phases to handle correct depth ordering
 * between overlapping faces of different body parts:
 *   Phase 0: Overlay hidden faces (back, right, bottom) — visible through transparent overlay pixels
 *   Phase 1: All side (left) faces
 *   Phase 2: All top faces — above side faces, behind front faces
 *   Phase 3: All front faces — closest to viewer, drawn last
 *            (overlay: limbs first, then body, so body overlay covers limb overlays)
 */

import { createCanvas } from "../canvas-env";
import type { ICanvas, ICanvasRenderingContext2D, IImageData } from "../canvas-env";
import { parseSkin } from "../skin-parser";
import type { IsometricOptions, SixFaces } from "../types";
import { getPixelatedContext } from "./utils";

const DEFAULT_SCALE = 8;

/**
 * Depth foreshortening ratio - controls how wide the side faces appear.
 * 1.0 = full depth (side faces same scale as front),
 * 0.5 = half depth for a more balanced look.
 */
const DEPTH_RATIO = 0.5;

/**
 * Head forward offset in MC pixels.
 * Body is 4 deep, head is 8 deep, both centered → head extends 2px in front of body.
 */
const HEAD_FORWARD = 2;

/**
 * Helper: create a temporary canvas from IImageData
 */
function imageDataToCanvas(data: IImageData): ICanvas {
  const c = createCanvas(data.width, data.height);
  c.getContext("2d")!.putImageData(data, 0, 0);
  return c;
}

// ── Individual face drawing ─────────────────────────────────────────

function drawBackFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  d: number,
  scale: number,
): void {
  const sw = w * scale;
  const sh = h * scale;
  const sd = d * scale * DEPTH_RATIO;
  const canvas = imageDataToCanvas(face);
  // Back face is offset by depth in the isometric direction (upper-right)
  ctx.drawImage(canvas, 0, 0, face.width, face.height, x + sd, y - 0.5 * sd, sw, sh);
}

function drawRightFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  _w: number,
  h: number,
  d: number,
  scale: number,
): void {
  const sh = h * scale;
  const sd = d * scale * DEPTH_RATIO;
  const canvas = imageDataToCanvas(face);
  ctx.save();
  // Same shear as side/left face but anchored at left edge (x) instead of right edge (x + sw)
  ctx.setTransform(1, -0.5, 0, 1, x, y);
  ctx.drawImage(canvas, 0, 0, face.width, face.height, 0, 0, sd, sh);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function drawBottomFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  d: number,
  scale: number,
): void {
  const sw = w * scale;
  const sh = h * scale;
  const sd = d * scale * DEPTH_RATIO;
  const canvas = imageDataToCanvas(face);
  ctx.save();
  // Same transform as top face but anchored at bottom edge (y + sh)
  ctx.setTransform(1, 0, -1, 0.5, x + sd, y + sh - 0.5 * sd);
  ctx.drawImage(canvas, 0, 0, face.width, face.height, 0, 0, sw, sd);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function drawSideFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  d: number,
  scale: number,
): void {
  const sw = w * scale;
  const sh = h * scale;
  const sd = d * scale * DEPTH_RATIO;
  const canvas = imageDataToCanvas(face);
  ctx.save();
  ctx.setTransform(1, -0.5, 0, 1, x + sw, y);
  ctx.drawImage(canvas, 0, 0, face.width, face.height, 0, 0, sd, sh);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function drawFrontFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
): void {
  const sw = w * scale;
  const sh = h * scale;
  const canvas = imageDataToCanvas(face);
  ctx.drawImage(canvas, 0, 0, face.width, face.height, x, y, sw, sh);
}

function drawTopFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  w: number,
  d: number,
  scale: number,
): void {
  const sw = w * scale;
  const sd = d * scale * DEPTH_RATIO;
  const canvas = imageDataToCanvas(face);
  ctx.save();
  ctx.setTransform(1, 0, -1, 0.5, x + sd, y - 0.5 * sd);
  ctx.drawImage(canvas, 0, 0, face.width, face.height, 0, 0, sw, sd);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

// ── Part descriptor for batch rendering ─────────────────────────────

interface PartDrawInfo {
  inner: SixFaces;
  outer: SixFaces | null;
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
}

/**
 * Phase 0: Draw overlay hidden faces (back, right, bottom).
 * These faces are normally occluded by the front/top/side faces,
 * but can be visible through transparent overlay pixels when inflated.
 */
function drawAllHiddenFaces(
  ctx: ICanvasRenderingContext2D,
  parts: PartDrawInfo[],
  scale: number,
  inflated: boolean,
): void {
  for (const p of parts) {
    if (p.outer) {
      if (inflated) {
        const inf = scale * 0.5;
        drawBackFace(ctx, p.outer.back, p.x - inf, p.y - inf, p.w + 1, p.h + 1, p.d + 1, scale);
        drawRightFace(ctx, p.outer.right, p.x - inf, p.y - inf, p.w + 1, p.h + 1, p.d + 1, scale);
        drawBottomFace(ctx, p.outer.bottom, p.x - inf, p.y - inf, p.w + 1, p.h + 1, p.d + 1, scale);
      } else {
        drawBackFace(ctx, p.outer.back, p.x, p.y, p.w, p.h, p.d, scale);
        drawRightFace(ctx, p.outer.right, p.x, p.y, p.w, p.h, p.d, scale);
        drawBottomFace(ctx, p.outer.bottom, p.x, p.y, p.w, p.h, p.d, scale);
      }
    }
  }
}

/**
 * Phase 1: Draw all side (left) faces, back to front.
 */
function drawAllSideFaces(
  ctx: ICanvasRenderingContext2D,
  parts: PartDrawInfo[],
  scale: number,
  inflated: boolean,
): void {
  for (const p of parts) {
    drawSideFace(ctx, p.inner.left, p.x, p.y, p.w, p.h, p.d, scale);
    if (p.outer) {
      if (inflated) {
        const inf = scale * 0.5;
        drawSideFace(ctx, p.outer.left, p.x - inf, p.y - inf, p.w + 1, p.h + 1, p.d + 1, scale);
      } else {
        drawSideFace(ctx, p.outer.left, p.x, p.y, p.w, p.h, p.d, scale);
      }
    }
  }
}

/**
 * Phase 2: Draw all top faces, back to front.
 */
function drawAllTopFaces(
  ctx: ICanvasRenderingContext2D,
  parts: PartDrawInfo[],
  scale: number,
  inflated: boolean,
): void {
  for (const p of parts) {
    drawTopFace(ctx, p.inner.top, p.x, p.y, p.w, p.d, scale);
    if (p.outer) {
      if (inflated) {
        const inf = scale * 0.5;
        drawTopFace(ctx, p.outer.top, p.x - inf, p.y - inf, p.w + 1, p.d + 1, scale);
      } else {
        drawTopFace(ctx, p.outer.top, p.x, p.y, p.w, p.d, scale);
      }
    }
  }
}

/**
 * Draw inner front faces only.
 */
function drawInnerFrontFaces(
  ctx: ICanvasRenderingContext2D,
  parts: PartDrawInfo[],
  scale: number,
): void {
  for (const p of parts) {
    drawFrontFace(ctx, p.inner.front, p.x, p.y, p.w, p.h, scale);
  }
}

/**
 * Draw overlay front faces only.
 */
function drawOuterFrontFaces(
  ctx: ICanvasRenderingContext2D,
  parts: PartDrawInfo[],
  scale: number,
  inflated: boolean,
): void {
  for (const p of parts) {
    if (p.outer) {
      if (inflated) {
        const inf = scale * 0.5;
        drawFrontFace(ctx, p.outer.front, p.x - inf, p.y - inf, p.w + 1, p.h + 1, scale);
      } else {
        drawFrontFace(ctx, p.outer.front, p.x, p.y, p.w, p.h, scale);
      }
    }
  }
}

// ── Main render function ────────────────────────────────────────────

/**
 * Render the player in isometric (2.5D) projection.
 *
 * The view shows the front and left side of the character simultaneously,
 * with the depth extending to the upper right.
 */
export async function renderSkinIsometric(
  canvas: ICanvas,
  options: IsometricOptions,
): Promise<void> {
  const scale = options.scale ?? DEFAULT_SCALE;
  const showOverlay = options.showOverlay ?? true;
  const overlayInflated = options.overlayInflated ?? false;
  const skin = await parseSkin(options.skin, options.slim);
  const isSlim = skin.variant === "slim";

  const armWidth = isSlim ? 3 : 4;
  const armDepth = 4;
  const bodyWidth = 8;
  const bodyDepth = 4;
  const headSize = 8;
  const legWidth = 4;
  const legDepth = 4;

  // Inflation padding
  const inflate = showOverlay && overlayInflated ? 1 : 0;
  const padX = inflate * 0.5 * scale;

  // Head forward offset in screen coordinates
  // "Forward" (toward viewer) = lower-left in isometric
  const headOffsetX = -HEAD_FORWARD * DEPTH_RATIO * scale;
  const headOffsetY = HEAD_FORWARD * DEPTH_RATIO * 0.5 * scale;

  // Canvas bounds
  const headRightEdge = armWidth + headSize + (headSize - HEAD_FORWARD) * DEPTH_RATIO;
  const leftArmRightEdge = 2 * armWidth + 8 + armDepth * DEPTH_RATIO;
  const canvasWidth = (Math.max(headRightEdge, leftArmRightEdge) + 2 * inflate) * scale;

  // Room at top for the head's top face shear (accounting for forward offset)
  const shearHeight = (headSize - HEAD_FORWARD) * DEPTH_RATIO * 0.5 + inflate;
  const canvasHeight = Math.ceil((32 + shearHeight + inflate * 0.5) * scale);

  const w = Math.ceil(canvasWidth);
  const h = Math.ceil(canvasHeight);

  canvas.width = w;
  canvas.height = h;
  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, w, h);

  const baseY = Math.ceil(shearHeight * scale);
  const bodyX = armWidth * scale + padX;

  const overlay = showOverlay;
  const inflated = overlayInflated;

  // Individual part definitions
  const leftArm: PartDrawInfo = {
    inner: skin.leftArm.inner,
    outer: overlay ? skin.leftArm.outer : null,
    x: bodyX + bodyWidth * scale,
    y: baseY + 8 * scale,
    w: armWidth,
    h: 12,
    d: armDepth,
  };

  const leftLeg: PartDrawInfo = {
    inner: skin.leftLeg.inner,
    outer: overlay ? skin.leftLeg.outer : null,
    x: bodyX + 4 * scale,
    y: baseY + 20 * scale,
    w: legWidth,
    h: 12,
    d: legDepth,
  };

  const bodyPart: PartDrawInfo = {
    inner: skin.body.inner,
    outer: overlay ? skin.body.outer : null,
    x: bodyX,
    y: baseY + 8 * scale,
    w: bodyWidth,
    h: 12,
    d: bodyDepth,
  };

  const rightLeg: PartDrawInfo = {
    inner: skin.rightLeg.inner,
    outer: overlay ? skin.rightLeg.outer : null,
    x: bodyX,
    y: baseY + 20 * scale,
    w: legWidth,
    h: 12,
    d: legDepth,
  };

  const rightArm: PartDrawInfo = {
    inner: skin.rightArm.inner,
    outer: overlay ? skin.rightArm.outer : null,
    x: padX,
    y: baseY + 8 * scale,
    w: armWidth,
    h: 12,
    d: armDepth,
  };

  const head: PartDrawInfo = {
    inner: skin.head.inner,
    outer: overlay ? skin.head.outer : null,
    x: bodyX + headOffsetX,
    y: baseY + headOffsetY,
    w: headSize,
    h: headSize,
    d: headSize,
  };

  // All body parts in back-to-front order (for back/side/top phases)
  const allBodyParts = [leftArm, leftLeg, bodyPart, rightLeg, rightArm];

  // Limb parts only (for front face overlay — drawn before body overlay)
  const limbParts = [leftArm, leftLeg, rightLeg, rightArm];

  // ── Body part rendering ──

  // Phase 0: Overlay hidden faces (back, right, bottom — visible through transparent pixels)
  drawAllHiddenFaces(ctx, allBodyParts, scale, inflated);

  // Phase 1: Side faces
  drawAllSideFaces(ctx, allBodyParts, scale, inflated);

  // Phase 2: Top faces
  drawAllTopFaces(ctx, allBodyParts, scale, inflated);

  // Phase 3: Front faces
  drawInnerFrontFaces(ctx, allBodyParts, scale);
  // Overlay fronts: limbs first, then body (body overlay covers limb overlays)
  drawOuterFrontFaces(ctx, limbParts, scale, inflated);
  drawOuterFrontFaces(ctx, [bodyPart], scale, inflated);

  // ── Head rendering (always on top of body parts) ──
  drawAllHiddenFaces(ctx, [head], scale, inflated);
  drawAllSideFaces(ctx, [head], scale, inflated);
  drawAllTopFaces(ctx, [head], scale, inflated);
  drawInnerFrontFaces(ctx, [head], scale);
  drawOuterFrontFaces(ctx, [head], scale, inflated);
}
