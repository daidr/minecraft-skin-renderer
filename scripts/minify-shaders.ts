/**
 * Build-time shader minification script.
 *
 * Imports raw shader source strings, minifies them with shaderkit,
 * and exports a define map for build tool integration (tsdown / Vite / Vitest).
 *
 * Usage:
 *   - Imported by tsdown.config.ts / vite.config.ts / vitest.config.ts
 *   - Standalone: bun scripts/minify-shaders.ts
 */

import { minify } from "shaderkit";

import {
  SKIN_VERTEX_SHADER_RAW,
  SKIN_FRAGMENT_SHADER_RAW,
  SIMPLE_VERTEX_SHADER_RAW,
  SIMPLE_FRAGMENT_SHADER_RAW,
} from "../src/core/renderer/webgl/shaders/raw.ts";
import {
  SKIN_SHADER_WGSL_RAW,
  SIMPLE_SHADER_WGSL_RAW,
} from "../src/core/renderer/webgpu/shaders/raw.ts";
import {
  PANORAMA_VERTEX_SHADER_RAW,
  PANORAMA_FRAGMENT_SHADER_RAW,
} from "../src/plugins/panorama/shaders/webgl.raw.ts";
import { PANORAMA_WGSL_SHADER_RAW } from "../src/plugins/panorama/shaders/webgpu.raw.ts";

// ---- Placeholder encoding/decoding ----
// Plugin markers are `// line comments` that shaderkit strips.
// We encode them as dummy GLSL declarations before minification,
// then decode them back to newline-padded line comments afterward.

const PLACEHOLDER_PAIRS: { marker: string; sentinel: string }[] = [
  {
    marker: "// [PLUGIN_VERTEX_DECLARATIONS]",
    sentinel: "float __PH_VERT_DECL__;",
  },
  {
    marker: "// [PLUGIN_VERTEX_MAIN]",
    sentinel: "float __PH_VERT_MAIN__;",
  },
  {
    marker: "// [PLUGIN_FRAGMENT_DECLARATIONS]",
    sentinel: "float __PH_FRAG_DECL__;",
  },
  {
    marker: "// [PLUGIN_FRAGMENT_OUTPUT]",
    sentinel: "float __PH_FRAG_OUT__;",
  },
];

function encodePlaceholders(glsl: string): string {
  let result = glsl;
  for (const { marker, sentinel } of PLACEHOLDER_PAIRS) {
    result = result.replace(marker, sentinel);
  }
  return result;
}

function decodePlaceholders(minified: string): string {
  let result = minified;
  for (const { marker, sentinel } of PLACEHOLDER_PAIRS) {
    // Handle possible whitespace variations after minification
    result = result.replace(
      new RegExp(`float\\s+${sentinel.match(/(__PH_\w+__)/)![1]}\\s*;`),
      `\n${marker}\n`,
    );
  }
  return result;
}

// ---- Minification ----

function minifyGLSL(source: string, hasPlaceholders: boolean): string {
  let code = source;
  if (hasPlaceholders) {
    code = encodePlaceholders(code);
  }

  const result = minify(code);

  if (hasPlaceholders) {
    return decodePlaceholders(result);
  }
  return result;
}

function minifyWGSL(source: string): string {
  try {
    const result = minify(source);
    if (result.trim().length === 0) {
      console.warn("[shader-minify] WGSL minification produced empty output, using raw source");
      return source;
    }
    return result;
  } catch (e) {
    console.warn("[shader-minify] WGSL minification failed, using raw source:", e);
    return source;
  }
}

// ---- Demo: getXXXShader() functions ----

/** Get minified GLSL skin vertex shader (demo) */
export function getGlslSkinVertexShader(): string {
  return minifyGLSL(SKIN_VERTEX_SHADER_RAW, true);
}

/** Get minified GLSL skin fragment shader (demo) */
export function getGlslSkinFragmentShader(): string {
  return minifyGLSL(SKIN_FRAGMENT_SHADER_RAW, true);
}

/** Get minified GLSL simple vertex shader (demo) */
export function getGlslSimpleVertexShader(): string {
  return minifyGLSL(SIMPLE_VERTEX_SHADER_RAW, false);
}

/** Get minified GLSL simple fragment shader (demo) */
export function getGlslSimpleFragmentShader(): string {
  return minifyGLSL(SIMPLE_FRAGMENT_SHADER_RAW, false);
}

/** Get minified WGSL skin shader (demo) */
export function getWgslSkinShader(): string {
  return minifyWGSL(SKIN_SHADER_WGSL_RAW);
}

/** Get minified WGSL simple shader (demo) */
export function getWgslSimpleShader(): string {
  return minifyWGSL(SIMPLE_SHADER_WGSL_RAW);
}

/** Get minified GLSL panorama vertex shader (demo) */
export function getGlslPanoramaVertexShader(): string {
  return minifyGLSL(PANORAMA_VERTEX_SHADER_RAW, false);
}

/** Get minified GLSL panorama fragment shader (demo) */
export function getGlslPanoramaFragmentShader(): string {
  return minifyGLSL(PANORAMA_FRAGMENT_SHADER_RAW, false);
}

/** Get minified WGSL panorama shader (demo) */
export function getWgslPanoramaShader(): string {
  return minifyWGSL(PANORAMA_WGSL_SHADER_RAW);
}

// ---- Build integration: define map ----

/**
 * Returns a Record suitable for the `define` option in tsdown/Vite/Vitest.
 * Each key is a global identifier; each value is a JSON-stringified shader string.
 */
export function getShaderDefines(): Record<string, string> {
  return {
    __GLSL_SKIN_VERTEX_SHADER__: JSON.stringify(minifyGLSL(SKIN_VERTEX_SHADER_RAW, true)),
    __GLSL_SKIN_FRAGMENT_SHADER__: JSON.stringify(minifyGLSL(SKIN_FRAGMENT_SHADER_RAW, true)),
    __GLSL_SIMPLE_VERTEX_SHADER__: JSON.stringify(minifyGLSL(SIMPLE_VERTEX_SHADER_RAW, false)),
    __GLSL_SIMPLE_FRAGMENT_SHADER__: JSON.stringify(minifyGLSL(SIMPLE_FRAGMENT_SHADER_RAW, false)),
    __WGSL_SKIN_SHADER__: JSON.stringify(minifyWGSL(SKIN_SHADER_WGSL_RAW)),
    __WGSL_SIMPLE_SHADER__: JSON.stringify(minifyWGSL(SIMPLE_SHADER_WGSL_RAW)),
    __GLSL_PANORAMA_VERTEX_SHADER__: JSON.stringify(minifyGLSL(PANORAMA_VERTEX_SHADER_RAW, false)),
    __GLSL_PANORAMA_FRAGMENT_SHADER__: JSON.stringify(
      minifyGLSL(PANORAMA_FRAGMENT_SHADER_RAW, false),
    ),
    __WGSL_PANORAMA_SHADER__: JSON.stringify(minifyWGSL(PANORAMA_WGSL_SHADER_RAW)),
  };
}
