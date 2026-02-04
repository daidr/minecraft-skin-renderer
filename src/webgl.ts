/**
 * WebGL2 renderer plugin for minecraft-skin-renderer.
 *
 * This module provides the WebGL2 rendering backend. Register it using {@link use}
 * before creating a skin viewer. WebGL2 offers broad browser compatibility.
 *
 * @example
 * ```ts
 * import { use, createSkinViewer } from '@daidr/minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
 *
 * // Register WebGL renderer
 * use(WebGLRendererPlugin)
 *
 * // Create viewer (will use WebGL backend)
 * const viewer = await createSkinViewer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   skin: 'https://example.com/skin.png',
 * })
 * ```
 *
 * @module
 */

export { WebGLRendererPlugin } from "./core/renderer/webgl/plugin";
