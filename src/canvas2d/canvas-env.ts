/**
 * Canvas environment abstraction for Node.js / browser portability.
 */

/**
 * Minimal ImageData interface without browser-specific properties like `colorSpace`.
 * Compatible with both DOM ImageData and Node.js canvas library equivalents.
 */
export interface IImageData {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/**
 * Minimal canvas interface that both HTMLCanvasElement and
 * Node.js canvas libraries (node-canvas, @napi-rs/canvas, skia-canvas) satisfy.
 */
export interface ICanvas {
  width: number;
  height: number;
  getContext(contextId: "2d"): ICanvasRenderingContext2D | null;
}

/**
 * Minimal 2D context interface covering the subset used by canvas2d renderers.
 */
export interface ICanvasRenderingContext2D {
  canvas: any;
  imageSmoothingEnabled: boolean;
  fillStyle: any;

  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage(image: any, ...args: any[]): void;
  putImageData(imageData: IImageData, dx: number, dy: number): void;
  getImageData(sx: number, sy: number, sw: number, sh: number): IImageData;
  createImageData(sw: number, sh: number): IImageData;

  save(): void;
  restore(): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
}

type CreateCanvasFn = (width: number, height: number) => ICanvas;

let _createCanvas: CreateCanvasFn | null = null;

/**
 * Configure the canvas factory for non-browser environments.
 * Must be called before any render function in Node.js.
 *
 * @example
 * ```ts
 * import { createCanvas } from '@napi-rs/canvas'
 * import { setCreateCanvas } from '@daidr/minecraft-skin-renderer/canvas2d'
 * setCreateCanvas((w, h) => createCanvas(w, h) as any)
 * ```
 */
export function setCreateCanvas(fn: CreateCanvasFn): void {
  _createCanvas = fn;
}

/**
 * Create a blank ImageData. Auto-detects browser environment.
 * Falls back to canvas context in Node.js.
 * @internal
 */
export function createImageData(width: number, height: number): IImageData {
  if (typeof ImageData !== "undefined") {
    return new ImageData(width, height);
  }
  // Fallback for environments without global ImageData (Bun, older Node.js)
  const canvas = createCanvas(1, 1);
  const ctx = canvas.getContext("2d")!;
  return ctx.createImageData(width, height);
}

/**
 * Create a canvas. Auto-detects browser environment.
 * Throws in Node.js if setCreateCanvas() was not called.
 * @internal
 */
export function createCanvas(width: number, height: number): ICanvas {
  if (_createCanvas) {
    return _createCanvas(width, height);
  }
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c as unknown as ICanvas;
  }
  throw new Error(
    "No canvas environment detected. " +
      "Call setCreateCanvas() with your canvas library before using render functions. " +
      "Example: setCreateCanvas((w, h) => createCanvas(w, h))",
  );
}
