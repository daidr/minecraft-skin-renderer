/**
 * Minecraft skin UV coordinates (64x64 format)
 *
 * Reference: https://minecraft.wiki/w/Skin
 * The skin texture is laid out in a specific pattern where each body part
 * has designated regions for both the inner layer and outer (overlay) layer.
 */

import type { ModelVariant, SkinUVMap } from "../types";
import { createBoxUV } from "./common";

/**
 * Get UV mapping for classic (4-pixel wide arms) model
 */
export function getClassicSkinUV(): SkinUVMap {
  return {
    // Head: 8x8x8, starts at (0, 0)
    head: {
      inner: createBoxUV(0, 0, 8, 8, 8),
      outer: createBoxUV(32, 0, 8, 8, 8),
    },

    // Body: 8x12x4, starts at (16, 16)
    body: {
      inner: createBoxUV(16, 16, 8, 12, 4),
      outer: createBoxUV(16, 32, 8, 12, 4),
    },

    // Right Arm: 4x12x4, starts at (40, 16)
    rightArm: {
      inner: createBoxUV(40, 16, 4, 12, 4),
      outer: createBoxUV(40, 32, 4, 12, 4),
    },

    // Left Arm: 4x12x4, starts at (32, 48)
    leftArm: {
      inner: createBoxUV(32, 48, 4, 12, 4),
      outer: createBoxUV(48, 48, 4, 12, 4),
    },

    // Right Leg: 4x12x4, starts at (0, 16)
    rightLeg: {
      inner: createBoxUV(0, 16, 4, 12, 4),
      outer: createBoxUV(0, 32, 4, 12, 4),
    },

    // Left Leg: 4x12x4, starts at (16, 48)
    leftLeg: {
      inner: createBoxUV(16, 48, 4, 12, 4),
      outer: createBoxUV(0, 48, 4, 12, 4),
    },
  };
}

/**
 * Get UV mapping for slim (3-pixel wide arms) model
 */
export function getSlimSkinUV(): SkinUVMap {
  const classic = getClassicSkinUV();

  return {
    head: classic.head,
    body: classic.body,
    rightLeg: classic.rightLeg,
    leftLeg: classic.leftLeg,

    // Right Arm: 3x12x4, starts at (40, 16)
    rightArm: {
      inner: createBoxUV(40, 16, 3, 12, 4),
      outer: createBoxUV(40, 32, 3, 12, 4),
    },

    // Left Arm: 3x12x4, starts at (32, 48)
    leftArm: {
      inner: createBoxUV(32, 48, 3, 12, 4),
      outer: createBoxUV(48, 48, 3, 12, 4),
    },
  };
}

/**
 * Get UV mapping based on model variant
 */
export function getSkinUV(variant: ModelVariant): SkinUVMap {
  return variant === "slim" ? getSlimSkinUV() : getClassicSkinUV();
}

/**
 * Check if skin is old format (2:1 ratio, e.g. 64x32, 128x64)
 */
export function isOldSkinFormat(width: number, height: number): boolean {
  return width === height * 2;
}

/**
 * Convert old format skin (2:1 ratio) to square format.
 * Supports any resolution (64x32, 128x64, 256x128, etc.)
 * The old format only has right arm/leg textures, which are mirrored for left.
 */
export function convertOldSkinFormat(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;

  if (width === height) {
    return imageData; // Already square (new format)
  }

  const scale = width / 64;

  // Create new square image (width × width)
  const newData = new ImageData(width, width);
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

  // Mirror right arm to left arm position (32, 48) in 64x64 space
  // Right arm is at (40, 16) with region size 16x16
  const s = scale;
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
  // Right leg is at (0, 16) with region size 16x16
  copyAndMirror(
    src,
    dst,
    width,
    Math.round(0),
    Math.round(16 * s),
    Math.round(16 * s),
    Math.round(48 * s),
    Math.round(16 * s),
    Math.round(16 * s),
  );

  return newData;
}

/**
 * Copy and horizontally mirror a region
 */
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
