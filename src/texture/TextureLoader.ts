/**
 * Texture loading utilities
 */

import { isOldSkinFormat, convertOldSkinFormat } from "../model/uv/SkinUV";

/** Texture source types */
export type TextureSource = string | Blob | HTMLImageElement | ImageBitmap;

function isImageElement(obj: any): obj is HTMLImageElement {
  return typeof obj === 'object' && obj !== null && 'width' in obj && 'height' in obj && 'complete' in obj;
}

/**
 * Load an image from various sources
 */
export async function loadImage(source: TextureSource): Promise<HTMLImageElement> {
  if (isImageElement(source)) {
    if (source.complete) {
      return source;
    }
    return new Promise((resolve, reject) => {
      source.addEventListener("load", () => resolve(source));
      source.addEventListener("error", reject);
    });
  }

  if (source instanceof ImageBitmap) {
    // Convert ImageBitmap to HTMLImageElement via canvas
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source, 0, 0);
    const dataUrl = canvas.toDataURL();
    return loadImage(dataUrl);
  }

  const url = source instanceof Blob ? URL.createObjectURL(source) : source;
  const image = new Image();

  // Handle CORS for external URLs
  if (typeof source === "string" && !source.startsWith("data:")) {
    image.crossOrigin = "anonymous";
  }

  return new Promise((resolve, reject) => {
    image.addEventListener("load", () => {
      // Revoke blob URL after loading
      if (source instanceof Blob) {
        URL.revokeObjectURL(url);
      }
      resolve(image);
    });
    image.addEventListener("error", (e) => {
      if (source instanceof Blob) {
        URL.revokeObjectURL(url);
      }
      reject(new Error(`Failed to load image: ${e.type}`));
    });
    image.src = url;
  });
}

/**
 * Load an image and return as ImageBitmap
 */
export async function loadImageBitmap(source: TextureSource): Promise<ImageBitmap> {
  if (source instanceof ImageBitmap) {
    return source;
  }

  if (source instanceof Blob) {
    return createImageBitmap(source);
  }

  const image = await loadImage(source);
  return createImageBitmap(image);
}

/**
 * Generic texture loader (alias for loadImageBitmap)
 */
export const loadTexture: (source: TextureSource) => Promise<ImageBitmap> = loadImageBitmap;

/**
 * Get image data from an image source
 */
export function getImageData(
  source: HTMLImageElement | ImageBitmap | HTMLCanvasElement,
): ImageData {
  const canvas = document.createElement("canvas");
  const width = source instanceof HTMLCanvasElement ? source.width : source.width;
  const height = source instanceof HTMLCanvasElement ? source.height : source.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0);

  return ctx.getImageData(0, 0, width, height);
}

/**
 * Load and process a skin texture
 * Handles old 64x32 format conversion
 */
export async function loadSkinTexture(source: TextureSource): Promise<ImageBitmap> {
  const image = await loadImage(source);
  const width = image.width;
  const height = image.height;

  // Check if it's old format and needs conversion
  if (isOldSkinFormat(width, height)) {
    const imageData = getImageData(image);
    const convertedData = convertOldSkinFormat(imageData);

    // Create square canvas with converted data
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = width;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(convertedData, 0, 0);

    return createImageBitmap(canvas);
  }

  return createImageBitmap(image);
}

/**
 * Load a cape texture
 */
export async function loadCapeTexture(source: TextureSource): Promise<ImageBitmap> {
  return loadImageBitmap(source);
}

/**
 * Load an elytra texture (uses cape texture format)
 */
export async function loadElytraTexture(source: TextureSource): Promise<ImageBitmap> {
  return loadImageBitmap(source);
}

/**
 * Detect if a skin uses slim (3-pixel) arms
 * This checks if the specific pixel areas for slim arms are transparent
 */
export function detectSlimModel(imageData: ImageData): boolean {
  // Check the rightmost column of the right arm area
  // If it's fully transparent, it's likely a slim skin
  const data = imageData.data;
  const scale = imageData.width / 64;

  // Check pixels at x=46, y=52 (right arm overlay area) scaled to actual resolution
  // In classic skins, this would have content; in slim, it's transparent
  const startY = Math.round(52 * scale);
  const endY = Math.round(64 * scale);
  const checkX = Math.round(46 * scale);

  for (let y = startY; y < endY; y++) {
    const idx = (y * imageData.width + checkX) * 4;
    if (data[idx + 3] > 0) {
      return false; // Has content, likely classic
    }
  }

  return true; // Transparent, likely slim
}

/**
 * Create a placeholder texture (magenta/black checkerboard)
 */
export async function createPlaceholderTexture(width = 64, height = 64): Promise<ImageBitmap> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  const size = 8;

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const isEven = (x / size + y / size) % 2 === 0;
      ctx.fillStyle = isEven ? "#ff00ff" : "#000000";
      ctx.fillRect(x, y, size, size);
    }
  }

  return createImageBitmap(canvas);
}

/**
 * Create a solid color texture
 */
export async function createSolidTexture(
  color: string,
  width = 64,
  height = 64,
): Promise<ImageBitmap> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  return createImageBitmap(canvas);
}
