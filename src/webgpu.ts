/**
 * WebGPU renderer plugin for minecraft-skin-renderer.
 *
 * This module provides the WebGPU rendering backend. Register it using {@link use}
 * before creating a skin viewer. WebGPU offers modern performance on supported browsers.
 *
 * @example
 * ```ts
 * import { use, createSkinViewer } from '@daidr/minecraft-skin-renderer'
 * import { WebGPURendererPlugin } from '@daidr/minecraft-skin-renderer/webgpu'
 *
 * // Register WebGPU renderer
 * use(WebGPURendererPlugin)
 *
 * // Create viewer (will use WebGPU backend)
 * const viewer = await createSkinViewer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   skin: 'https://example.com/skin.png',
 * })
 * ```
 *
 * @module
 */

export { WebGPURendererPlugin } from "./core/renderer/webgpu/plugin";
