/**
 * Skin texture parser - extracts face textures from a 64x64 Minecraft skin
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
 * Extract a single face from the skin texture using UV coordinates
 */
function extractFace(imageData: ImageData, faceUV: FaceUV, scale: number): ImageData {
  const { u1, v1, u2, v2 } = faceUV;

  // UV coords are in 64x64 space, scale to actual image size
  const sx = Math.round(u1 * scale);
  const sy = Math.round(v1 * scale);
  const sw = Math.round((u2 - u1) * scale);
  const sh = Math.round((v2 - v1) * scale);

  // Output is in standard MC pixel space (no HD scaling)
  const ow = Math.round(u2 - u1);
  const oh = Math.round(v2 - v1);

  const output = new ImageData(ow, oh);
  const src = imageData.data;
  const dst = output.data;
  const srcWidth = imageData.width;

  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      // Sample from the center of each scaled pixel
      const srcX = sx + Math.floor((x * sw) / ow);
      const srcY = sy + Math.floor((y * sh) / oh);
      const srcIdx = (srcY * srcWidth + srcX) * 4;
      const dstIdx = (y * ow + x) * 4;

      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
      dst[dstIdx + 3] = src[srcIdx + 3];
    }
  }

  return output;
}
