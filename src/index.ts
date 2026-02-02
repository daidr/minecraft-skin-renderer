/**
 * Minecraft Skin Renderer
 *
 * A browser-based library for rendering Minecraft skins with WebGL and WebGPU support.
 *
 * @example
 * ```ts
 * import { createSkinViewer } from 'minecraft-skin-renderer'
 *
 * const viewer = await createSkinViewer({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   skin: 'https://example.com/skin.png',
 * })
 *
 * viewer.playAnimation('walk')
 * viewer.startRenderLoop()
 * ```
 */

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
