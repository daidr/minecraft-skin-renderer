/**
 * Skin texture parser - extracts face textures from Minecraft skin textures.
 * Supports standard (64x64) and high-resolution skins (128x128, 256x256, etc.)
 */

import { createCanvas, createImageData } from "./canvas-env";
import type { IImageData } from "./canvas-env";
import { loadImage } from "../texture/TextureLoader";
import { isOldSkinFormat, getSkinUV } from "../model/uv/SkinUV";
import type { FaceUV, BoxUV, SkinUVMap } from "../model/types";
import type { TextureSource, IImage, ModelVariant, ParsedSkin, PartFaces, SixFaces } from "./types";

function isImageData(obj: unknown): obj is IImageData {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "data" in obj &&
    "width" in obj &&
    "height" in obj &&
    (obj as IImageData).data instanceof Uint8ClampedArray
  );
}

function isDrawableImage(obj: unknown): obj is IImage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as IImage).width === "number" &&
    typeof (obj as IImage).height === "number"
  );
}

/**
 * Convert a drawable image to IImageData using the canvas factory.
 * Works in both browser (HTMLImageElement, ImageBitmap) and Node.js
 * (e.g., @napi-rs/canvas Image) environments.
 */
function drawableToImageData(image: IImage): IImageData {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

/**
 * Convert old format skin (2:1 ratio) to square format.
 * Local version using IImageData/createImageData for Node.js compatibility.
 */
function convertOldSkinFormat(imageData: IImageData): IImageData {
  const width = imageData.width;
  const height = imageData.height;

  if (width === height) {
    return imageData;
  }

  const scale = width / 64;
  const newData = createImageData(width, width);
  const src = imageData.data;
  const dst = newData.data;

  // Copy top half (original data) as-is
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      dst[idx] = src[idx];
      dst[idx + 1] = src[idx + 1];
      dst[idx + 2] = src[idx + 2];
      dst[idx + 3] = src[idx + 3];
    }
  }

  const s = scale;
  // Mirror right arm to left arm position (32, 48) in 64x64 space
  copyAndMirror(
    src,
    dst,
    width,
    Math.round(40 * s),
    Math.round(16 * s),
    Math.round(32 * s),
    Math.round(48 * s),
    Math.round(16 * s),
    Math.round(16 * s),
  );
  // Mirror right leg to left leg position (16, 48) in 64x64 space
  copyAndMirror(
    src,
    dst,
    width,
    0,
    Math.round(16 * s),
    Math.round(16 * s),
    Math.round(48 * s),
    Math.round(16 * s),
    Math.round(16 * s),
  );

  return newData;
}

function copyAndMirror(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  srcX: number,
  srcY: number,
  dstX: number,
  dstY: number,
  regionW: number,
  regionH: number,
): void {
  for (let y = 0; y < regionH; y++) {
    for (let x = 0; x < regionW; x++) {
      const srcIdx = ((srcY + y) * width + (srcX + regionW - 1 - x)) * 4;
      const dstIdx = ((dstY + y) * width + (dstX + x)) * 4;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
      dst[dstIdx + 3] = src[srcIdx + 3];
    }
  }
}

/**
 * Parse a skin texture into individual face images for all body parts
 */
export async function parseSkin(source: TextureSource, slim?: boolean): Promise<ParsedSkin> {
  let imageData: IImageData;

  if (isImageData(source)) {
    imageData = source;
  } else if (typeof source === "string" || source instanceof Blob) {
    // Browser only: load from URL or Blob via DOM Image
    const image = await loadImage(source);
    imageData = drawableToImageData(image);
  } else if (isDrawableImage(source)) {
    // Any drawable image object (HTMLImageElement, ImageBitmap, @napi-rs/canvas Image, etc.)
    imageData = drawableToImageData(source);
  } else {
    throw new Error("Unsupported texture source type");
  }

  // Handle old 64x32 format
  if (isOldSkinFormat(imageData.width, imageData.height)) {
    imageData = convertOldSkinFormat(imageData);
  }

  const scale = imageData.width / 64;
  const variant: ModelVariant = slim ? "slim" : "classic";
  const uvMap: SkinUVMap = getSkinUV(variant);

  return {
    variant,
    textureScale: scale,
    head: extractPartFaces(imageData, uvMap.head.inner, uvMap.head.outer, scale),
    body: extractPartFaces(imageData, uvMap.body.inner, uvMap.body.outer, scale),
    leftArm: extractPartFaces(imageData, uvMap.leftArm.inner, uvMap.leftArm.outer, scale),
    rightArm: extractPartFaces(imageData, uvMap.rightArm.inner, uvMap.rightArm.outer, scale),
    leftLeg: extractPartFaces(imageData, uvMap.leftLeg.inner, uvMap.leftLeg.outer, scale),
    rightLeg: extractPartFaces(imageData, uvMap.rightLeg.inner, uvMap.rightLeg.outer, scale),
  };
}

/**
 * Extract inner and outer layer faces for a single body part
 */
function extractPartFaces(
  imageData: IImageData,
  innerUV: BoxUV,
  outerUV: BoxUV,
  scale: number,
): PartFaces {
  return {
    inner: extractSixFaces(imageData, innerUV, scale),
    outer: extractSixFaces(imageData, outerUV, scale),
  };
}

/**
 * Extract all 6 faces from a BoxUV definition
 */
function extractSixFaces(imageData: IImageData, uv: BoxUV, scale: number): SixFaces {
  return {
    front: extractFace(imageData, uv.front, scale),
    back: extractFace(imageData, uv.back, scale),
    left: extractFace(imageData, uv.left, scale),
    right: extractFace(imageData, uv.right, scale),
    top: extractFace(imageData, uv.top, scale),
    bottom: extractFace(imageData, uv.bottom, scale),
  };
}

/**
 * Extract a single face from the skin texture using UV coordinates.
 * Output preserves the full resolution of the source texture.
 */
function extractFace(imageData: IImageData, faceUV: FaceUV, scale: number): IImageData {
  const { u1, v1, u2, v2 } = faceUV;

  // UV coords are in 64x64 space, scale to actual image size
  const sx = Math.round(u1 * scale);
  const sy = Math.round(v1 * scale);
  const sw = Math.round((u2 - u1) * scale);
  const sh = Math.round((v2 - v1) * scale);

  // Output at full texture resolution
  const output = createImageData(sw, sh);
  const src = imageData.data;
  const dst = output.data;
  const srcWidth = imageData.width;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcIdx = ((sy + y) * srcWidth + (sx + x)) * 4;
      const dstIdx = (y * sw + x) * 4;

      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
      dst[dstIdx + 3] = src[srcIdx + 3];
    }
  }

  return output;
}
