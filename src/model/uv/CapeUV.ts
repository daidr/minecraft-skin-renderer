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
import { createBoxUV } from "./common";

// Re-export for backward compatibility
export { CAPE_TEXTURE_WIDTH, CAPE_TEXTURE_HEIGHT } from "../constants";

/**
 * Get UV mapping for cape
 * Cape geometry: 10 wide, 16 tall, 1 deep
 * UV starts at (0, 0) in the 64x32 texture
 */
export function getCapeUV(): BoxUV {
  return createBoxUV(0, 0, 10, 16, 1, "cape");
}

/**
 * Get UV mapping for elytra wing
 * UV dimensions: 10 wide, 20 tall, 2 deep (texture layout)
 * UV starts at (22, 0) in the 64x32 texture
 * Both wings use the same UV (right wing is mirrored via geometry)
 */
export function getElytraUV(): BoxUV {
  return createBoxUV(22, 0, 10, 20, 2, "elytra");
}
