/**
 * Model constants
 *
 * Centralized constants for texture dimensions, UV processing, and geometry generation.
 */

/** Skin texture dimensions (64x64 format) */
export const SKIN_TEXTURE_WIDTH = 64;
export const SKIN_TEXTURE_HEIGHT = 64;

/** Cape texture dimensions (64x32 format) */
export const CAPE_TEXTURE_WIDTH = 64;
export const CAPE_TEXTURE_HEIGHT = 32;

/** UV inset to prevent texture edge bleeding */
export const UV_EDGE_INSET = 0.001;

/** Bone overlay scale factor */
export const BONE_OVERLAY_SCALE = 0.5;

/** Arm width for different model variants */
export const ARM_WIDTH = {
  CLASSIC: 4,
  SLIM: 3,
} as const;
