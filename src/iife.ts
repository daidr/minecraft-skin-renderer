/**
 * IIFE bundle entry point for minecraft-skin-renderer.
 *
 * This entry automatically registers all renderer plugins (WebGL, WebGPU)
 * and the Panorama plugin, so consumers can use the library directly via
 * a script tag without manual plugin registration.
 *
 * @example
 * ```html
 * <script src="minecraft-skin-renderer.global.js"></script>
 * <script>
 *   const viewer = await MSR.createSkinViewer({
 *     canvas: document.getElementById('canvas'),
 *     skin: 'https://example.com/skin.png',
 *   })
 * </script>
 * ```
 *
 * @module
 */

import { use } from "./core/renderer/registry";
import { WebGLRendererPlugin } from "./core/renderer/webgl/plugin";
import { WebGPURendererPlugin } from "./core/renderer/webgpu/plugin";
import { PanoramaPlugin } from "./plugins/panorama/plugin";

// Auto-register all plugins
use(WebGLRendererPlugin);
use(WebGPURendererPlugin);
use(PanoramaPlugin);

// Re-export everything from main entry
export * from "./index";

// Re-export plugin symbols for advanced usage
export { WebGLRendererPlugin } from "./core/renderer/webgl/plugin";
export { WebGPURendererPlugin } from "./core/renderer/webgpu/plugin";
export { PanoramaPlugin } from "./plugins/panorama/plugin";
