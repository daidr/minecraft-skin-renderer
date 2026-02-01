/**
 * Cape UV coordinates
 *
 * Cape texture is 64x32 pixels
 * Cape dimensions: 10x16x1
 */

import type { BoxUV } from "../types";

/**
 * Get UV mapping for cape
 * Cape layout: similar to body but different dimensions
 */
export function getCapeUV(): BoxUV {
  // Cape is 10 wide, 16 tall, 1 deep
  const width = 10;
  const height = 16;
  const depth = 1;

  return {
    // Front of cape (facing away from player)
    front: {
      u1: depth,
      v1: depth,
      u2: depth + width,
      v2: depth + height,
    },
    // Back of cape (facing player)
    back: {
      u1: depth + width + depth,
      v1: depth,
      u2: depth + width + depth + width,
      v2: depth + height,
    },
    // Left side
    left: {
      u1: 0,
      v1: depth,
      u2: depth,
      v2: depth + height,
    },
    // Right side
    right: {
      u1: depth + width,
      v1: depth,
      u2: depth + width + depth,
      v2: depth + height,
    },
    // Top
    top: {
      u1: depth,
      v1: 0,
      u2: depth + width,
      v2: depth,
    },
    // Bottom
    bottom: {
      u1: depth + width,
      v1: 0,
      u2: depth + width + width,
      v2: depth,
    },
  };
}

/**
 * Normalize cape UV to 0-1 range (64x32 texture)
 */
export function normalizeCapeUV(uv: BoxUV): BoxUV {
  const normalize = (face: { u1: number; v1: number; u2: number; v2: number }) => ({
    u1: face.u1 / 64,
    v1: face.v1 / 32,
    u2: face.u2 / 64,
    v2: face.v2 / 32,
  });

  return {
    front: normalize(uv.front),
    back: normalize(uv.back),
    left: normalize(uv.left),
    right: normalize(uv.right),
    top: normalize(uv.top),
    bottom: normalize(uv.bottom),
  };
}
