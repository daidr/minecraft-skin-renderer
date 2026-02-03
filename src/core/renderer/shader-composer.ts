/**
 * Shader Composer
 *
 * Cleans up shader marker placeholders.
 * This module can be extended in the future to support plugin-based shader injection.
 */

import type { BackendType } from "./types";

/** Markers for shader injection points */
const MARKERS = {
  VERTEX_DECLARATIONS: "// [PLUGIN_VERTEX_DECLARATIONS]",
  VERTEX_MAIN: "// [PLUGIN_VERTEX_MAIN]",
  FRAGMENT_DECLARATIONS: "// [PLUGIN_FRAGMENT_DECLARATIONS]",
  FRAGMENT_OUTPUT: "// [PLUGIN_FRAGMENT_OUTPUT]",
};

/**
 * Compose vertex shader (cleans up markers)
 */
export function composeVertexShader(baseShader: string, _backend: BackendType): string {
  let shader = baseShader;

  // Clean up markers
  shader = shader.replace(MARKERS.VERTEX_DECLARATIONS, "");
  shader = shader.replace(MARKERS.VERTEX_MAIN, "");

  return shader;
}

/**
 * Compose fragment shader (cleans up markers)
 */
export function composeFragmentShader(baseShader: string, _backend: BackendType): string {
  let shader = baseShader;

  // Clean up markers
  shader = shader.replace(MARKERS.FRAGMENT_DECLARATIONS, "");
  shader = shader.replace(MARKERS.FRAGMENT_OUTPUT, "");

  return shader;
}
