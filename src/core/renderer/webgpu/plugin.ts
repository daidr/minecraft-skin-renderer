/**
 * WebGPU Renderer Plugin
 *
 * Import and register this plugin to use WebGPU rendering:
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { WebGPURendererPlugin } from 'minecraft-skin-renderer/webgpu'
 *
 * use(WebGPURendererPlugin)
 * ```
 */

import type { RendererPlugin } from "../registry";
import { createWebGPURenderer } from "./WebGPURenderer";
import { SKIN_SHADER_WGSL } from "./shaders";

/** WebGPU renderer plugin for registration */
export const WebGPURendererPlugin: RendererPlugin = {
  backend: "webgpu",
  createRenderer: createWebGPURenderer,
  shaders: {
    vertex: SKIN_SHADER_WGSL,
    fragment: SKIN_SHADER_WGSL,
  },
};
