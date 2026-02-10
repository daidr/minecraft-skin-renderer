/**
 * Shared Canvas 2D rendering utilities
 */

import { createCanvas } from "../canvas-env";
import type { ICanvas, ICanvasRenderingContext2D, IImageData } from "../canvas-env";
import type { ParsedSkin, FaceName } from "../types";

/**
 * Get a 2D context with nearest-neighbor (pixelated) rendering
 */
export function getPixelatedContext(canvas: ICanvas): ICanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/**
 * Draw an IImageData onto a canvas context at a specified position and scale.
 * Uses nearest-neighbor interpolation via an intermediate canvas.
 */
export function drawScaledFace(
  ctx: ICanvasRenderingContext2D,
  face: IImageData,
  x: number,
  y: number,
  scale: number,
): void {
  const tmp = createCanvas(face.width, face.height);
  const tmpCtx = tmp.getContext("2d")!;
  tmpCtx.putImageData(face, 0, 0);

  ctx.drawImage(tmp, 0, 0, face.width, face.height, x, y, face.width * scale, face.height * scale);
}

/**
 * Draw a face with overlay support.
 * When inflated=true, the overlay is rendered 0.5 MC pixels larger on each side.
 * textureScale accounts for HD skins (1 for 64x64, 2 for 128x128, etc.)
 */
export function drawFaceWithOverlay(
  ctx: ICanvasRenderingContext2D,
  inner: IImageData,
  outer: IImageData | null,
  x: number,
  y: number,
  scale: number,
  inflated: boolean = false,
  textureScale: number = 1,
): void {
  const renderScale = scale / textureScale;
  drawScaledFace(ctx, inner, x, y, renderScale);
  if (outer) {
    if (inflated) {
      const inflate = scale * 0.5;
      const tmp = createCanvas(outer.width, outer.height);
      tmp.getContext("2d")!.putImageData(outer, 0, 0);
      const dw = (outer.width + textureScale) * renderScale;
      const dh = (outer.height + textureScale) * renderScale;
      ctx.drawImage(tmp, 0, 0, outer.width, outer.height, x - inflate, y - inflate, dw, dh);
    } else {
      drawScaledFace(ctx, outer, x, y, renderScale);
    }
  }
}

/** Part descriptor for flat body drawing */
interface FlatPartDraw {
  partName: "head" | "body" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
  face: FaceName;
  x: number;
  y: number;
}

/**
 * Draw a flat body view (front, back, or half-body) using a part list.
 *
 * Parts are drawn in the given order (back-to-front for proper layering).
 */
export function drawFlatBodyParts(
  ctx: ICanvasRenderingContext2D,
  skin: ParsedSkin,
  parts: FlatPartDraw[],
  showOverlay: boolean,
  scale: number,
  inflated: boolean,
  pad: number,
  textureScale: number,
): void {
  for (const p of parts) {
    const partFaces = skin[p.partName];
    drawFaceWithOverlay(
      ctx,
      partFaces.inner[p.face],
      showOverlay ? partFaces.outer[p.face] : null,
      pad + p.x * scale,
      pad + p.y * scale,
      scale,
      inflated,
      textureScale,
    );
  }
}
