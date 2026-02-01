/**
 * Elytra (wings) UV coordinates
 *
 * Elytra shares texture with cape (64x32)
 * Each wing is a folded shape when closed, spread out when flying
 */

import type { BoxUV } from "../types";

/**
 * Get UV mapping for left elytra wing
 * Elytra wings are approximated as flat planes
 */
export function getLeftWingUV(): BoxUV {
  // Left wing uses left half of cape texture
  return {
    front: {
      u1: 22,
      v1: 0,
      u2: 32,
      v2: 20,
    },
    back: {
      u1: 22,
      v1: 0,
      u2: 32,
      v2: 20,
    },
    left: {
      u1: 22,
      v1: 0,
      u2: 22,
      v2: 20,
    },
    right: {
      u1: 32,
      v1: 0,
      u2: 32,
      v2: 20,
    },
    top: {
      u1: 22,
      v1: 0,
      u2: 32,
      v2: 0,
    },
    bottom: {
      u1: 22,
      v1: 20,
      u2: 32,
      v2: 20,
    },
  };
}

/**
 * Get UV mapping for right elytra wing
 */
export function getRightWingUV(): BoxUV {
  // Right wing uses right half, mirrored
  return {
    front: {
      u1: 22,
      v1: 0,
      u2: 12,
      v2: 20,
    },
    back: {
      u1: 12,
      v1: 0,
      u2: 22,
      v2: 20,
    },
    left: {
      u1: 12,
      v1: 0,
      u2: 12,
      v2: 20,
    },
    right: {
      u1: 22,
      v1: 0,
      u2: 22,
      v2: 20,
    },
    top: {
      u1: 12,
      v1: 0,
      u2: 22,
      v2: 0,
    },
    bottom: {
      u1: 12,
      v1: 20,
      u2: 22,
      v2: 20,
    },
  };
}

/**
 * Normalize elytra UV to 0-1 range (64x32 texture)
 */
export function normalizeElytraUV(uv: BoxUV): BoxUV {
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
