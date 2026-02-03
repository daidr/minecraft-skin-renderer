/**
 * Panorama Plugin
 *
 * Adds equirectangular panorama background support to the skin viewer.
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { PanoramaPlugin } from 'minecraft-skin-renderer/panorama'
 *
 * use(PanoramaPlugin)
 *
 * const viewer = await createSkinViewer({
 *   canvas,
 *   skin: '...',
 *   panorama: 'https://example.com/panorama.jpg',
 * })
 * ```
 */

import type { BackgroundPlugin } from "../../core/plugins/types";
import { createPanoramaRenderer } from "./PanoramaRenderer";

/** Panorama plugin instance */
export const PanoramaPlugin: BackgroundPlugin = {
  type: "background",
  name: "panorama",

  createRenderer: createPanoramaRenderer,
};
