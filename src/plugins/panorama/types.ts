/**
 * Panorama plugin types
 */

import type { TextureSource } from "../../texture";

/** Panorama configuration options */
export interface PanoramaOptions {
  /** Panorama texture source (URL or ImageBitmap/HTMLImageElement) */
  source: TextureSource;
}
