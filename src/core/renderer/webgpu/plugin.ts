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

import type { RendererPlugin, ShaderSources } from "../registry";
import { createWebGPURenderer } from "./WebGPURenderer";
import { SKIN_SHADER_WGSL } from "./shaders";

/**
 * Compose WGSL shader with plugin injection points cleaned up.
 * WGSL uses a single module with multiple entry points, so we return the same source
 * for both vertex and fragment.
 *
 * Note: Plugin shader injection for WGSL would need to inject code before the
 * closing brace of the main functions. This is a placeholder for future extension.
 */
function composeWGSLShader(baseShader: string): string {
  // Currently WGSL shaders don't have plugin markers, but this function
  // provides a consistent interface with WebGL for future extension
  return baseShader;
}

/** WebGPU renderer plugin for registration */
export const WebGPURendererPlugin: RendererPlugin = {
  backend: "webgpu",
  createRenderer: createWebGPURenderer,
  shaders: {
    vertex: SKIN_SHADER_WGSL,
    fragment: SKIN_SHADER_WGSL,
  },
  getComposedShaders(): ShaderSources {
    const composed = composeWGSLShader(SKIN_SHADER_WGSL);
    return {
      vertex: composed,
      fragment: composed,
    };
  },
};
