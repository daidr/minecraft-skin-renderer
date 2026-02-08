import type { IImageData } from "./canvas-env";

/**
 * Browser convenience helper to draw ImageData onto an HTMLCanvasElement.
 * Resizes the canvas to match the ImageData dimensions.
 */
export function drawToCanvas(canvas: HTMLCanvasElement, data: IImageData): void {
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(data as ImageData, 0, 0);
}
