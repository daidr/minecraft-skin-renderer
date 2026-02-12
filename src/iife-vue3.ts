/**
 * IIFE bundle entry point for Vue 3 integration.
 *
 * This is a lightweight bundle containing only Vue 3 components and composables.
 * It requires Vue 3 and the main library (MSR) to be loaded separately.
 *
 * Load order:
 * 1. Vue 3 as global `Vue`
 * 2. minecraft-skin-renderer.min.js as global `MSR`
 * 3. This file as global `MSRVue3`
 *
 * @example
 * ```html
 * <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
 * <script src="minecraft-skin-renderer.min.js"></script>
 * <script src="minecraft-skin-renderer-vue3.min.js"></script>
 * <script>
 *   const app = Vue.createApp({
 *     setup() {
 *       const { containerRef, viewer } = MSRVue3.useSkinViewer(() => ({
 *         skin: 'https://example.com/skin.png',
 *         animation: 'walk',
 *       }))
 *       return { containerRef }
 *     },
 *     template: '<div ref="containerRef" style="width:400px;height:600px" />',
 *   })
 *   app.mount('#app')
 * </script>
 * ```
 *
 * @module
 */

// Re-export Vue 3 integration (components + composables)
export { SkinViewer } from "./vue3/SkinViewer";
export { useSkinViewer } from "./vue3/useSkinViewer";
export {
  useRenderAvatar,
  useRenderSkinFront,
  useRenderSkinBack,
  useRenderSkinSide,
  useRenderSkinIsometric,
  useRenderHalfBody,
  useRenderBigHead,
} from "./vue3/useRender2D";
