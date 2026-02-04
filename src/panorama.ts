/**
 * Panorama background plugin for minecraft-skin-renderer.
 *
 * This module adds equirectangular panorama background support to the skin viewer.
 * Register it using {@link use} before creating a viewer, then use the `panorama`
 * option or `setPanorama()` method.
 *
 * @example
 * ```ts
 * import { use, createSkinViewer } from '@daidr/minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
 * import { PanoramaPlugin } from '@daidr/minecraft-skin-renderer/panorama'
 *
 * // Register plugins
 * use(WebGLRendererPlugin)
 * use(PanoramaPlugin)
 *
 * // Create viewer with panorama background
 * const viewer = await createSkinViewer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   skin: 'https://example.com/skin.png',
 *   panorama: 'https://example.com/panorama.jpg',
 * })
 *
 * // Or set panorama later
 * await viewer.setPanorama('https://example.com/other-panorama.jpg')
 * ```
 *
 * @module
 */

export { PanoramaPlugin } from "./plugins/panorama/plugin";
