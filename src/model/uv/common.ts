/**
 * Common UV mapping utilities
 *
 * Provides a unified box UV creation function that supports different
 * texture layouts (skin, cape, elytra) through configuration options.
 */

import type { BoxUV } from "../types";

/** UV layout type for different texture conventions */
export type UVLayout =
  | "standard" // Skin layout: right, front, left, back
  | "cape" // Cape layout: front/back swapped for correct facing
  | "elytra"; // Elytra layout: u1/u2 swapped for side faces

/**
 * Create BoxUV from top-left corner and dimensions
 *
 * Standard Minecraft UV layout (right to left, then down):
 * - Row 1: right side, front, left side, back
 * - Row 0: top (above front), bottom (above back area)
 *
 * @param x - Top-left X coordinate in texture
 * @param y - Top-left Y coordinate in texture
 * @param width - Width of the box (front/back face width)
 * @param height - Height of the box
 * @param depth - Depth of the box (side face width)
 * @param layout - UV layout type (default: "standard")
 */
export function createBoxUV(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  layout: UVLayout = "standard",
): BoxUV {
  // Calculate base UV coordinates
  const rightU1 = x;
  const rightU2 = x + depth;
  const frontU1 = x + depth;
  const frontU2 = x + depth + width;
  const leftU1 = x + depth + width;
  const leftU2 = x + depth + width + depth;
  const backU1 = x + depth + width + depth;
  const backU2 = x + depth + width + depth + width;

  const sideV1 = y + depth;
  const sideV2 = y + depth + height;
  const topV1 = y;
  const topV2 = y + depth;

  if (layout === "cape") {
    // Cape: swap front/back for correct texture facing
    return {
      right: { u1: rightU1, v1: sideV1, u2: rightU2, v2: sideV2 },
      front: { u1: backU1, v1: sideV1, u2: backU2, v2: sideV2 },
      left: { u1: leftU1, v1: sideV1, u2: leftU2, v2: sideV2 },
      back: { u1: frontU1, v1: sideV1, u2: frontU2, v2: sideV2 },
      top: { u1: frontU1, v1: topV1, u2: frontU2, v2: topV2 },
      bottom: { u1: leftU1, v1: topV1, u2: leftU1 + width, v2: topV2 },
    };
  }

  if (layout === "elytra") {
    // Elytra: swap u1/u2 for side faces to match skinview3d's setUVs behavior
    // This compensates for createCapeBoxGeometry using u1 for right side and u2 for left side
    return {
      left: { u1: rightU2, v1: sideV1, u2: rightU1, v2: sideV2 },
      front: { u1: frontU2, v1: sideV1, u2: frontU1, v2: sideV2 },
      right: { u1: leftU2, v1: sideV1, u2: leftU1, v2: sideV2 },
      back: { u1: backU2, v1: sideV1, u2: backU1, v2: sideV2 },
      top: { u1: frontU1, v1: topV1, u2: frontU2, v2: topV2 },
      bottom: { u1: leftU1, v1: topV1, u2: leftU1 + width, v2: topV2 },
    };
  }

  // Standard skin layout
  return {
    right: { u1: rightU1, v1: sideV1, u2: rightU2, v2: sideV2 },
    front: { u1: frontU1, v1: sideV1, u2: frontU2, v2: sideV2 },
    left: { u1: leftU1, v1: sideV1, u2: leftU2, v2: sideV2 },
    back: { u1: backU1, v1: sideV1, u2: backU2, v2: sideV2 },
    top: { u1: frontU1, v1: topV1, u2: frontU2, v2: topV2 },
    bottom: { u1: leftU1, v1: topV1, u2: leftU1 + width, v2: topV2 },
  };
}
