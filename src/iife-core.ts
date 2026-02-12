/**
 * IIFE bundle entry point for minecraft-skin-renderer.
 *
 * This is a self-contained bundle including the 3D viewer, all renderer plugins
 * (WebGL, WebGPU, Panorama), and 2D canvas rendering functions.
 * Plugins are automatically registered.
 *
 * @example
 * ```html
 * <script src="minecraft-skin-renderer.min.js"></script>
 * <script>
 *   // 3D viewer
 *   const viewer = await MSR.createSkinViewer({
 *     canvas: document.getElementById('canvas'),
 *     skin: 'https://example.com/skin.png',
 *   })
 *   viewer.playAnimation('walk')
 *   viewer.startRenderLoop()
 *
 *   // 2D rendering
 *   const canvas2d = document.getElementById('avatar')
 *   await MSR.renderAvatar(canvas2d, { skin: 'https://example.com/skin.png', scale: 8 })
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

// Re-export everything from main entry (3D)
export * from "./index";

// Re-export plugin symbols for advanced usage
export { WebGLRendererPlugin } from "./core/renderer/webgl/plugin";
export { WebGPURendererPlugin } from "./core/renderer/webgpu/plugin";
export { PanoramaPlugin } from "./plugins/panorama/plugin";

// Re-export 2D canvas rendering
export {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
  setCreateCanvas,
  drawToCanvas,
} from "./canvas2d/index";
