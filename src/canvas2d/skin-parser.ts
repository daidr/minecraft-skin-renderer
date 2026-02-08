/**
 * Skin texture parser - extracts face textures from Minecraft skin textures.
 * Supports standard (64x64) and high-resolution skins (128x128, 256x256, etc.)
 */

import { loadImage, getImageData } from "../texture/TextureLoader";
import { isOldSkinFormat, convertOldSkinFormat, getSkinUV } from "../model/uv/SkinUV";
import type { FaceUV, BoxUV, SkinUVMap } from "../model/types";
import type { TextureSource, ModelVariant, ParsedSkin, PartFaces, SixFaces } from "./types";

/**
 * Parse a skin texture into individual face images for all body parts
 */
export async function parseSkin(source: TextureSource, slim?: boolean): Promise<ParsedSkin> {
  const image = await loadImage(source);
  let imageData = getImageData(image);

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
  imageData: ImageData,
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
function extractSixFaces(imageData: ImageData, uv: BoxUV, scale: number): SixFaces {
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
function extractFace(imageData: ImageData, faceUV: FaceUV, scale: number): ImageData {
  const { u1, v1, u2, v2 } = faceUV;

  // UV coords are in 64x64 space, scale to actual image size
  const sx = Math.round(u1 * scale);
  const sy = Math.round(v1 * scale);
  const sw = Math.round((u2 - u1) * scale);
  const sh = Math.round((v2 - v1) * scale);

  // Output at full texture resolution
  const output = new ImageData(sw, sh);
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
