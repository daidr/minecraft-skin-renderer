/**
 * WebGL Renderer Plugin
 *
 * Import and register this plugin to use WebGL rendering:
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'
 *
 * use(WebGLRendererPlugin)
 * ```
 */

import type { RendererPlugin } from "../registry";
import { createWebGLRenderer } from "./WebGLRenderer";
import { SKIN_VERTEX_SHADER, SKIN_FRAGMENT_SHADER } from "./shaders";

/** WebGL renderer plugin for registration */
export const WebGLRendererPlugin: RendererPlugin = {
  backend: "webgl",
  createRenderer: createWebGLRenderer,
  shaders: {
    vertex: SKIN_VERTEX_SHADER,
    fragment: SKIN_FRAGMENT_SHADER,
  },
};
