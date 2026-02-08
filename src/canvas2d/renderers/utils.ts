/**
 * Shared Canvas 2D rendering utilities
 */

/**
 * Get a 2D context with nearest-neighbor (pixelated) rendering
 */
export function getPixelatedContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/**
 * Draw an ImageData onto a canvas context at a specified position and scale.
 * Uses nearest-neighbor interpolation via an intermediate canvas.
 */
export function drawScaledFace(
  ctx: CanvasRenderingContext2D,
  face: ImageData,
  x: number,
  y: number,
  scale: number,
): void {
  const tmp = document.createElement("canvas");
  tmp.width = face.width;
  tmp.height = face.height;
  const tmpCtx = tmp.getContext("2d")!;
  tmpCtx.putImageData(face, 0, 0);

  ctx.drawImage(tmp, 0, 0, face.width, face.height, x, y, face.width * scale, face.height * scale);
}

/**
 * Draw a face with overlay support.
 * When inflated=true, the overlay is rendered 0.5 MC pixels larger on each side.
 */
export function drawFaceWithOverlay(
  ctx: CanvasRenderingContext2D,
  inner: ImageData,
  outer: ImageData | null,
  x: number,
  y: number,
  scale: number,
  inflated: boolean = false,
): void {
  drawScaledFace(ctx, inner, x, y, scale);
  if (outer) {
    if (inflated) {
      const inflate = scale * 0.5;
      const tmp = document.createElement("canvas");
      tmp.width = outer.width;
      tmp.height = outer.height;
      tmp.getContext("2d")!.putImageData(outer, 0, 0);
      const dw = (outer.width + 1) * scale;
      const dh = (outer.height + 1) * scale;
      ctx.drawImage(tmp, 0, 0, outer.width, outer.height, x - inflate, y - inflate, dw, dh);
    } else {
      drawScaledFace(ctx, outer, x, y, scale);
    }
  }
}
