/**
 * A high-performance, browser-based 3D Minecraft skin renderer with WebGL and WebGPU support.
 *
 * This module provides the main API for creating and controlling skin viewers.
 * Use the {@link use} function to register renderer plugins, then {@link createSkinViewer}
 * to create viewer instances.
 *
 * @example Basic Usage
 * ```ts
 * import { use, createSkinViewer } from '@daidr/minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
 *
 * // Register the renderer plugin (required before creating viewer)
 * use(WebGLRendererPlugin)
 *
 * // Create and start the viewer
 * const viewer = await createSkinViewer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   skin: 'https://example.com/skin.png',
 * })
 *
 * viewer.playAnimation('walk')
 * viewer.startRenderLoop()
 * ```
 *
 * @example With Cape and Panorama Background
 * ```ts
 * import { use, createSkinViewer } from '@daidr/minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
 * import { PanoramaPlugin } from '@daidr/minecraft-skin-renderer/panorama'
 *
 * use(WebGLRendererPlugin)
 * use(PanoramaPlugin)
 *
 * const viewer = await createSkinViewer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   skin: 'https://example.com/skin.png',
 *   cape: 'https://example.com/cape.png',
 *   backEquipment: 'cape',
 *   panorama: 'https://example.com/panorama.jpg',
 * })
 * ```
 *
 * @module minecraft-skin-renderer
 */

// Renderer registration
export { use } from "./core/renderer/registry";
export type { RendererPlugin, ShaderSources } from "./core/renderer/registry";

// Main API
export {
  createSkinViewer,
  type SkinViewer,
  type SkinViewerOptions,
  type BackEquipment,
} from "./viewer";

// Types
export type { BackendType, RendererOptions } from "./core/renderer/types";
export type { Animation, AnimationConfig, AnimationController } from "./animation/types";
export type { ModelVariant, PartName, LayerVisibility, PartsVisibility } from "./model/types";
export { PART_NAMES, createDefaultVisibility } from "./model/types";
export type { TextureSource } from "./texture";

// Plugin types
export type { PluginType } from "./core/plugins/types";

// Utilities
export { isWebGPUSupported, isWebGL2Supported, detectBestBackend } from "./core/renderer/types";
export { loadSkinTexture, loadCapeTexture, loadElytraTexture } from "./texture";

// Animation presets
export { registerAnimation, getAnimation } from "./animation/types";

// Advanced: Direct access to subsystems (for custom implementations)
export * from "./core/math";
export { createCamera, type Camera } from "./core/camera/Camera";
export { createOrbitControls, type OrbitControls } from "./core/camera/OrbitControls";
export { createPlayerSkeleton, type PlayerSkeleton } from "./model";
export {
  createAnimationController,
  updateAnimationController,
} from "./animation/AnimationController";
