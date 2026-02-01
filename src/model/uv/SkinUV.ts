/**
 * Minecraft skin UV coordinates (64x64 format)
 *
 * Reference: https://minecraft.wiki/w/Skin
 * The skin texture is laid out in a specific pattern where each body part
 * has designated regions for both the inner layer and outer (overlay) layer.
 */

import type { BoxUV, ModelVariant, SkinUVMap } from "../types";

/**
 * Create BoxUV from top-left corner and dimensions
 * Minecraft UV layout follows: right, front, left, back (horizontal)
 * and top, bottom (vertical) arrangement
 */
function createBoxUV(x: number, y: number, width: number, height: number, depth: number): BoxUV {
  return {
    // Right face (side): starts at x, spans depth wide
    right: {
      u1: x,
      v1: y + depth,
      u2: x + depth,
      v2: y + depth + height,
    },
    // Front face: starts after right, spans width wide
    front: {
      u1: x + depth,
      v1: y + depth,
      u2: x + depth + width,
      v2: y + depth + height,
    },
    // Left face: starts after front, spans depth wide
    left: {
      u1: x + depth + width,
      v1: y + depth,
      u2: x + depth + width + depth,
      v2: y + depth + height,
    },
    // Back face: starts after left, spans width wide
    back: {
      u1: x + depth + width + depth,
      v1: y + depth,
      u2: x + depth + width + depth + width,
      v2: y + depth + height,
    },
    // Top face: above front face
    top: {
      u1: x + depth,
      v1: y,
      u2: x + depth + width,
      v2: y + depth,
    },
    // Bottom face: above back face area
    bottom: {
      u1: x + depth + width,
      v1: y,
      u2: x + depth + width + width,
      v2: y + depth,
    },
  };
}

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
 * Check if skin is old format (64x32) or new format (64x64)
 */
export function isOldSkinFormat(width: number, height: number): boolean {
  return width === 64 && height === 32;
}

/**
 * Convert old 64x32 skin to 64x64 format
 * The old format only has right arm/leg textures, which are mirrored for left
 */
export function convertOldSkinFormat(imageData: ImageData): ImageData {
  if (imageData.height === 64) {
    return imageData; // Already new format
  }

  // Create new 64x64 image
  const newData = new ImageData(64, 64);
  const src = imageData.data;
  const dst = newData.data;

  // Copy top half (0-31) as-is
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      const srcIdx = (y * 64 + x) * 4;
      const dstIdx = (y * 64 + x) * 4;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
      dst[dstIdx + 3] = src[srcIdx + 3];
    }
  }

  // Mirror right arm to left arm position (32, 48)
  // Right arm is at (40, 16) with size 4x12x4
  copyAndMirror(src, dst, 64, 40, 16, 32, 48, 16, 16);

  // Mirror right leg to left leg position (16, 48)
  // Right leg is at (0, 16) with size 4x12x4
  copyAndMirror(src, dst, 64, 0, 16, 16, 48, 16, 16);

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
