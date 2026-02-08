/**
 * Canvas 2D static rendering types
 */

/** Texture source types */
export type TextureSource = string | Blob | HTMLImageElement | ImageBitmap;

/** Model variant (arm width) */
export type ModelVariant = "classic" | "slim";

/** Face name */
export type FaceName = "front" | "back" | "left" | "right" | "top" | "bottom";

/** Base render options shared by all renderers */
export interface BaseRenderOptions {
  /** Skin texture source (URL, Blob, HTMLImageElement, or ImageBitmap) */
  skin: TextureSource;
  /** Whether to use slim (3-pixel) arm model, default false */
  slim?: boolean;
  /** Whether to show the outer overlay layer, default true */
  showOverlay?: boolean;
  /** Pixel scale factor (1 MC pixel = scale screen pixels), default 8 */
  scale?: number;
  /** Whether the overlay layer should be rendered slightly larger (like in 3D), default false */
  overlayInflated?: boolean;
}

/** Avatar render options */
export interface AvatarOptions extends BaseRenderOptions {}

/** Full body view render options (front/back/side) */
export interface SkinViewOptions extends BaseRenderOptions {}

/** Isometric (2.5D) view render options */
export interface IsometricOptions extends BaseRenderOptions {}

/** Half body render options */
export interface HalfBodyOptions extends BaseRenderOptions {}

/** Big head (Q-version) render options */
export interface BigHeadOptions extends BaseRenderOptions {
  /** Border width around each body part in virtual pixels, default 2 */
  border?: number;
  /** Border color, default 'black' */
  borderColor?: string;
}

/** Six faces of a box part */
export interface SixFaces {
  front: ImageData;
  back: ImageData;
  left: ImageData;
  right: ImageData;
  top: ImageData;
  bottom: ImageData;
}

/** Inner and outer layer faces for a body part */
export interface PartFaces {
  inner: SixFaces;
  outer: SixFaces;
}

/** Fully parsed skin with all body parts */
export interface ParsedSkin {
  variant: ModelVariant;
  head: PartFaces;
  body: PartFaces;
  leftArm: PartFaces;
  rightArm: PartFaces;
  leftLeg: PartFaces;
  rightLeg: PartFaces;
}
