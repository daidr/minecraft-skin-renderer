/**
 * Big Head (Q-version) renderer
 */

import { parseSkin } from "../skin-parser";
import type { BigHeadOptions } from "../types";
import { getPixelatedContext } from "./utils";

const DEFAULT_BORDER = 2;

/**
 * Merge inner and outer face ImageData via alpha compositing
 */
function mergeFaces(inner: ImageData, outer: ImageData): ImageData {
  const result = new ImageData(inner.width, inner.height);
  result.data.set(inner.data);
  const src = outer.data;
  const dst = result.data;
  for (let i = 0; i < src.length; i += 4) {
    const alpha = src[i + 3];
    if (alpha > 0) {
      const a = alpha / 255;
      const invA = 1 - a;
      dst[i] = Math.round(src[i] * a + dst[i] * invA);
      dst[i + 1] = Math.round(src[i + 1] * a + dst[i + 1] * invA);
      dst[i + 2] = Math.round(src[i + 2] * a + dst[i + 2] * invA);
      dst[i + 3] = Math.min(255, alpha + Math.round(dst[i + 3] * invA));
    }
  }
  return result;
}

/**
 * Create a canvas from ImageData
 */
function imageDataToCanvas(data: ImageData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = data.width;
  c.height = data.height;
  c.getContext("2d")!.putImageData(data, 0, 0);
  return c;
}

/**
 * Scale a canvas to target dimensions using nearest-neighbor
 */
function scaleCanvas(source: HTMLCanvasElement, tw: number, th: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, tw, th);
  return c;
}

/**
 * Find the most frequent opaque color in a sub-region of an ImageData buffer.
 * Operates directly on the raw pixel array to avoid canvas API round-trips.
 *
 * @param data - The Uint8ClampedArray from ImageData
 * @param offsetX - Region start column (pixels)
 * @param offsetY - Region start row (pixels)
 * @param w - Region width (pixels)
 * @param h - Region height (pixels)
 * @param stride - Full image width in pixels (for row stepping)
 */
function getDominantColorFromData(
  data: Uint8ClampedArray,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
  stride: number,
): { r: number; g: number; b: number } {
  const colorFrequency = new Map<number, number>();
  let maxCount = 0;
  let dominantR = 0;
  let dominantG = 0;
  let dominantB = 0;

  for (let row = 0; row < h; row++) {
    const rowStart = ((offsetY + row) * stride + offsetX) * 4;
    for (let col = 0; col < w; col++) {
      const i = rowStart + col * 4;
      if (data[i + 3] <= 128) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = (r << 16) | (g << 8) | b;
      const count = (colorFrequency.get(key) ?? 0) + 1;
      colorFrequency.set(key, count);
      if (count > maxCount) {
        maxCount = count;
        dominantR = r;
        dominantG = g;
        dominantB = b;
      }
    }
  }
  return { r: dominantR, g: dominantG, b: dominantB };
}

/**
 * Fill opaque pixels in a sub-region of an ImageData buffer with a solid color.
 * Operates directly on the raw pixel array to avoid canvas API round-trips.
 */
function fillRegionInData(
  data: Uint8ClampedArray,
  color: { r: number; g: number; b: number },
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
  stride: number,
): void {
  for (let row = 0; row < h; row++) {
    const rowStart = ((offsetY + row) * stride + offsetX) * 4;
    for (let col = 0; col < w; col++) {
      const i = rowStart + col * 4;
      if (data[i + 3] > 128) {
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
      }
    }
  }
}

/**
 * Process torso: divide into 3x2 grid, fill each cell with its dominant color.
 * Uses a single getImageData/putImageData pair for the entire canvas.
 */
function processTorso(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const stride = canvas.width;

  const rowCount = 3;
  const colCount = 2;
  const partW = Math.floor(canvas.width / colCount);
  const partH = Math.floor(canvas.height / rowCount);
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const x = col * partW;
      const y = row * partH;
      const w = col === colCount - 1 ? canvas.width - partW : partW;
      const h = row === rowCount - 1 ? canvas.height - 2 * partH : partH;
      const color = getDominantColorFromData(data, x, y, w, h, stride);
      fillRegionInData(data, color, x, y, w, h, stride);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Process arm: upper half filled with dominant color of top 75%,
 * lower half filled with dominant color of bottom 25%.
 * Uses a single getImageData/putImageData pair.
 */
function processArm(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const stride = canvas.width;
  const h = canvas.height;

  const upperExtractH = Math.floor(h * 0.75);
  const lowerExtractH = h - upperExtractH;
  const halfH = Math.floor(h * 0.5);
  const upperColor = getDominantColorFromData(data, 0, 0, canvas.width, upperExtractH, stride);
  const lowerColor = getDominantColorFromData(
    data,
    0,
    upperExtractH,
    canvas.width,
    lowerExtractH,
    stride,
  );
  fillRegionInData(data, upperColor, 0, 0, canvas.width, halfH, stride);
  fillRegionInData(data, lowerColor, 0, halfH, canvas.width, h - halfH, stride);

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Process leg: fill entirely with dominant color.
 * Uses a single getImageData/putImageData pair.
 */
function processLeg(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const stride = canvas.width;

  const color = getDominantColorFromData(data, 0, 0, canvas.width, canvas.height, stride);
  fillRegionInData(data, color, 0, 0, canvas.width, canvas.height, stride);

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Draw a border around a rectangular region
 */
function drawBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  borderWidth: number,
  borderColor: string,
): void {
  if (borderWidth <= 0) return;
  ctx.fillStyle = borderColor;
  // Top
  ctx.fillRect(x - borderWidth, y - borderWidth, w + 2 * borderWidth, borderWidth);
  // Bottom
  ctx.fillRect(x - borderWidth, y + h, w + 2 * borderWidth, borderWidth);
  // Left
  ctx.fillRect(x - borderWidth, y - borderWidth, borderWidth, h + 2 * borderWidth);
  // Right
  ctx.fillRect(x + w, y - borderWidth, borderWidth, h + 2 * borderWidth);
}

/**
 * Render a big head (Q-version) character.
 *
 * Canvas size = character size + border, no background.
 */
export async function renderBigHead(
  canvas: HTMLCanvasElement,
  options: BigHeadOptions,
): Promise<void> {
  const border = options.border ?? DEFAULT_BORDER;
  const borderColor = options.borderColor ?? "black";
  const showOverlay = options.showOverlay ?? true;
  const scale = options.scale ?? 20;

  const skin = await parseSkin(options.skin, options.slim);

  // 1. Merge inner + outer layers for each body part's front face
  const headFace = showOverlay
    ? mergeFaces(skin.head.inner.front, skin.head.outer.front)
    : skin.head.inner.front;
  const torsoFace = showOverlay
    ? mergeFaces(skin.body.inner.front, skin.body.outer.front)
    : skin.body.inner.front;
  const leftArmFace = showOverlay
    ? mergeFaces(skin.leftArm.inner.front, skin.leftArm.outer.front)
    : skin.leftArm.inner.front;
  const rightArmFace = showOverlay
    ? mergeFaces(skin.rightArm.inner.front, skin.rightArm.outer.front)
    : skin.rightArm.inner.front;
  const leftLegFace = showOverlay
    ? mergeFaces(skin.leftLeg.inner.front, skin.leftLeg.outer.front)
    : skin.leftLeg.inner.front;
  const rightLegFace = showOverlay
    ? mergeFaces(skin.rightLeg.inner.front, skin.rightLeg.outer.front)
    : skin.rightLeg.inner.front;

  // 2. Scale head to 16x16 (keeps original pixel detail)
  const headScaled = scaleCanvas(imageDataToCanvas(headFace), 16, 16);

  // 3. Process body parts with dominant color sampling, then scale
  const torsoCanvas = imageDataToCanvas(torsoFace);
  processTorso(torsoCanvas);
  const torso = scaleCanvas(torsoCanvas, 4, 6);

  const leftArmCanvas = imageDataToCanvas(leftArmFace);
  processArm(leftArmCanvas);
  const leftArm = scaleCanvas(leftArmCanvas, 2, 4);

  const rightArmCanvas = imageDataToCanvas(rightArmFace);
  processArm(rightArmCanvas);
  const rightArm = scaleCanvas(rightArmCanvas, 2, 4);

  const leftLegCanvas = imageDataToCanvas(leftLegFace);
  processLeg(leftLegCanvas);
  const leftLeg = scaleCanvas(leftLegCanvas, 2, 2);

  const rightLegCanvas = imageDataToCanvas(rightLegFace);
  processLeg(rightLegCanvas);
  const rightLeg = scaleCanvas(rightLegCanvas, 2, 2);

  // 4. Combine legs into one canvas (4x2)
  const legs = document.createElement("canvas");
  legs.width = 4;
  legs.height = 2;
  const legsCtx = legs.getContext("2d")!;
  legsCtx.imageSmoothingEnabled = false;
  legsCtx.drawImage(leftLeg, 0, 0);
  legsCtx.drawImage(rightLeg, 2, 0);

  // 5. Calculate layout dimensions (in virtual pixels)
  const headWidth = headScaled.width; // 16
  const headHeight = headScaled.height; // 16
  const torsoWidth = torso.width; // 4
  const torsoHeight = torso.height; // 6
  const armHeight = Math.max(leftArm.height, rightArm.height); // 4
  const legsWidth = legs.width; // 4
  const legsHeight = legs.height; // 2

  const totalWidth = Math.max(
    headWidth + 2 * border,
    leftArm.width + torsoWidth + rightArm.width + 4 * border,
    legsWidth + 2 * border,
  );
  const totalHeight = headHeight + Math.max(torsoHeight, armHeight) + legsHeight + 4 * border;

  // 6. Set canvas size = character + border, scaled up
  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;
  const ctx = getPixelatedContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 7. Draw character onto a temp canvas at virtual pixel size, then scale to output
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = totalWidth;
  tempCanvas.height = totalHeight;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.imageSmoothingEnabled = false;

  let currentY = border;

  // Head
  const headX = (totalWidth - headWidth) / 2;
  drawBorder(tempCtx, headX, currentY, headWidth, headHeight, border, borderColor);
  tempCtx.drawImage(headScaled, headX, currentY);
  currentY += headHeight + border;

  // Body row (left arm + torso + right arm)
  const bodyRowY = currentY;
  const bodyRowWidth = leftArm.width + torsoWidth + rightArm.width + 2 * border;
  const bodyRowStartX = (totalWidth - bodyRowWidth) / 2;

  const leftArmX = bodyRowStartX;
  drawBorder(tempCtx, leftArmX, bodyRowY, leftArm.width, leftArm.height, border, borderColor);
  tempCtx.drawImage(leftArm, leftArmX, bodyRowY);

  const torsoX = leftArmX + leftArm.width + border;
  drawBorder(tempCtx, torsoX, bodyRowY, torsoWidth, torsoHeight, border, borderColor);
  tempCtx.drawImage(torso, torsoX, bodyRowY);

  const rightArmX = torsoX + torsoWidth + border;
  drawBorder(tempCtx, rightArmX, bodyRowY, rightArm.width, rightArm.height, border, borderColor);
  tempCtx.drawImage(rightArm, rightArmX, bodyRowY);

  currentY += Math.max(torsoHeight, armHeight) + border;

  // Legs
  const legsX = (totalWidth - legsWidth) / 2;
  drawBorder(tempCtx, legsX, currentY, legsWidth, legsHeight, border, borderColor);
  tempCtx.drawImage(legs, legsX, currentY);

  // 8. Scale temp canvas to output
  ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
}
