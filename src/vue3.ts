/**
 * Vue 3 integration for minecraft-skin-renderer.
 *
 * Provides a props-driven `SkinViewer` component, a low-level `useSkinViewer` composable
 * for 3D rendering, and individual composables for each 2D render type.
 *
 * @example 3D Viewer Component
 * ```vue
 * <script setup lang="ts">
 * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
 * import { SkinViewer } from '@daidr/minecraft-skin-renderer/vue3'
 *
 * const plugins = [WebGLRendererPlugin]
 * </script>
 *
 * <template>
 *   <SkinViewer :plugins="plugins" skin="https://example.com/skin.png" animation="walk" />
 * </template>
 * ```
 *
 * @example 3D Viewer Composable
 * ```vue
 * <script setup lang="ts">
 * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
 * import { useSkinViewer } from '@daidr/minecraft-skin-renderer/vue3'
 *
 * const { containerRef, viewer, isReady } = useSkinViewer(() => ({
 *   plugins: [WebGLRendererPlugin],
 *   skin: 'https://example.com/skin.png',
 *   animation: 'walk',
 * }))
 * </script>
 *
 * <template>
 *   <div ref="containerRef" style="width: 400px; height: 600px" />
 * </template>
 * ```
 *
 * @example 2D Avatar Composable
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { useRenderAvatar } from '@daidr/minecraft-skin-renderer/vue3'
 *
 * const canvasRef = ref<HTMLCanvasElement | null>(null)
 * const { isRendering } = useRenderAvatar(canvasRef, () => ({
 *   skin: 'https://example.com/skin.png',
 *   scale: 8,
 * }))
 * </script>
 *
 * <template>
 *   <canvas ref="canvasRef" />
 * </template>
 * ```
 *
 * @module minecraft-skin-renderer/vue3
 */

// Component
export { SkinViewer } from "./vue3/SkinViewer";

// 3D Composable
export { useSkinViewer } from "./vue3/useSkinViewer";

// 2D Composables
export {
  useRenderAvatar,
  useRenderSkinFront,
  useRenderSkinBack,
  useRenderSkinSide,
  useRenderSkinIsometric,
  useRenderHalfBody,
  useRenderBigHead,
} from "./vue3/useRender2D";
export type { UseRender2DReturn } from "./vue3/useRender2D";

// Types
export type { UseSkinViewerOptions, UseSkinViewerReturn } from "./vue3/types";
