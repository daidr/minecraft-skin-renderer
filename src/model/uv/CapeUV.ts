/**
 * Minecraft cape and elytra UV coordinates (64x32 format)
 *
 * Cape texture layout (64x32):
 * - Cape: starts at (0, 0), size 10x16x1
 * - Elytra: starts at (22, 0), size 10x20x2
 *
 * Reference: skinview3d implementation and Minecraft wiki
 */

import type { BoxUV } from "../types";

/** Cape texture dimensions */
export const CAPE_TEXTURE_WIDTH = 64;
export const CAPE_TEXTURE_HEIGHT = 32;

/**
 * Create BoxUV from top-left corner and dimensions for cape texture (64x32)
 *
 * Cape texture layout (from Minecraft wiki):
 * - The OUTER side of cape (visible when viewing player from behind) is the "front" area in texture
 * - The INNER side (facing player's back) is the "back" area in texture
 *
 * Since cape geometry's -Z face should show the outer side (facing away from player),
 * we swap front/back so the geometry's back face uses the texture's "front" UV.
 */
function createCapeBoxUV(x: number, y: number, width: number, height: number, depth: number): BoxUV {
  return {
    // Right face (side): starts at x, spans depth wide
    right: {
      u1: x,
      v1: y + depth,
      u2: x + depth,
      v2: y + depth + height,
    },
    // Front face (geometry +Z, facing player): uses texture's "back" area
    front: {
      u1: x + depth + width + depth,
      v1: y + depth,
      u2: x + depth + width + depth + width,
      v2: y + depth + height,
    },
    // Left face: starts after texture front, spans depth wide
    left: {
      u1: x + depth + width,
      v1: y + depth,
      u2: x + depth + width + depth,
      v2: y + depth + height,
    },
    // Back face (geometry -Z, facing away): uses texture's "front" area (the visible outer side)
    back: {
      u1: x + depth,
      v1: y + depth,
      u2: x + depth + width,
      v2: y + depth + height,
    },
    // Top face: above texture front area
    top: {
      u1: x + depth,
      v1: y,
      u2: x + depth + width,
      v2: y + depth,
    },
    // Bottom face: above texture back face area
    bottom: {
      u1: x + depth + width,
      v1: y,
      u2: x + depth + width + width,
      v2: y + depth,
    },
  };
}

/**
 * Get UV mapping for cape
 * Cape geometry: 10 wide, 16 tall, 1 deep
 * UV starts at (0, 0) in the 64x32 texture
 */
export function getCapeUV(): BoxUV {
  return createCapeBoxUV(0, 0, 10, 16, 1);
}

/**
 * Create BoxUV for elytra matching skinview3d's setUVs layout
 * Texture layout (left to right): left side, front+top, right side+bottom, back
 *
 * Note: u1 and u2 are swapped compared to standard layout because
 * createCapeBoxGeometry uses u1 for right side and u2 for left side.
 * This swap compensates for that behavior to produce correct texture mapping.
 *
 * skinview3d face-to-texture mapping:
 * - Left:   (u, v+depth) to (u+depth, v+depth+height)
 * - Front:  (u+depth, v+depth) to (u+depth+width, v+depth+height)
 * - Right:  (u+width+depth, v+depth) to (u+width+depth*2, v+depth+height)
 * - Back:   (u+width+depth*2, v+depth) to (u+width*2+depth*2, v+depth+height)
 * - Top:    (u+depth, v) to (u+depth+width, v+depth)
 * - Bottom: (u+width+depth, v) to (u+width*2+depth, v+depth)
 */
function createElytraBoxUV(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): BoxUV {
  return {
    // Left face: starts at x, spans depth wide (u1/u2 swapped)
    left: {
      u1: x + depth,
      v1: y + depth,
      u2: x,
      v2: y + depth + height,
    },
    // Front face: after left, spans width wide (u1/u2 swapped)
    front: {
      u1: x + depth + width,
      v1: y + depth,
      u2: x + depth,
      v2: y + depth + height,
    },
    // Right face: after front, spans depth wide (u1/u2 swapped)
    right: {
      u1: x + depth + width + depth,
      v1: y + depth,
      u2: x + depth + width,
      v2: y + depth + height,
    },
    // Back face: after right, spans width wide (u1/u2 swapped)
    back: {
      u1: x + depth + width + depth + width,
      v1: y + depth,
      u2: x + depth + width + depth,
      v2: y + depth + height,
    },
    // Top face: above front area (NOT swapped - top has different UV mapping like bottom)
    top: {
      u1: x + depth,
      v1: y,
      u2: x + depth + width,
      v2: y + depth,
    },
    // Bottom face: above right area (NOT swapped - bottom has different UV mapping)
    bottom: {
      u1: x + depth + width,
      v1: y,
      u2: x + depth + width + width,
      v2: y + depth,
    },
  };
}

/**
 * Get UV mapping for elytra wing
 * UV dimensions: 10 wide, 20 tall, 2 deep (texture layout)
 * UV starts at (22, 0) in the 64x32 texture
 * Both wings use the same UV (right wing is mirrored via geometry)
 */
export function getElytraUV(): BoxUV {
  return createElytraBoxUV(22, 0, 10, 20, 2);
}
