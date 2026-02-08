/**
 * Canvas 2D static rendering types
 */

import type { IImageData } from "./canvas-env";

/**
 * A drawable image-like object with width/height dimensions.
 *
 * Any object implementing this interface can be drawn onto a canvas via
 * `ctx.drawImage()`. This covers browser types (HTMLImageElement, ImageBitmap)
 * as well as Node.js canvas libraries (@napi-rs/canvas Image, node-canvas Image, etc.)
 */
export interface IImage {
  readonly width: number;
  readonly height: number;
}

/**
 * Texture source types for canvas2d renderers.
 *
 * - `IImageData` — universal, works in all environments
 * - `IImage` — any drawable image object (browser or Node.js canvas libraries)
 * - `string` — URL (browser only)
 * - `Blob` — binary data (browser only)
 */
export type TextureSource = IImageData | IImage | string | Blob;

/** Model variant (arm width) */
export type ModelVariant = "classic" | "slim";

/** Face name */
export type FaceName = "front" | "back" | "left" | "right" | "top" | "bottom";

/** Base render options shared by all renderers */
export interface BaseRenderOptions {
  /** Skin texture source (IImageData, drawable image, URL string, or Blob) */
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
  front: IImageData;
  back: IImageData;
  left: IImageData;
  right: IImageData;
  top: IImageData;
  bottom: IImageData;
}

/** Inner and outer layer faces for a body part */
export interface PartFaces {
  inner: SixFaces;
  outer: SixFaces;
}

/** Fully parsed skin with all body parts */
export interface ParsedSkin {
  variant: ModelVariant;
  /** Texture scale factor (1 for 64x64, 2 for 128x128, etc.) */
  textureScale: number;
  head: PartFaces;
  body: PartFaces;
  leftArm: PartFaces;
  rightArm: PartFaces;
  leftLeg: PartFaces;
  rightLeg: PartFaces;
}
