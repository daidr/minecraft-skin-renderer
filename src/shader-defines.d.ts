/**
 * Build-time shader define globals.
 * These are replaced by tsdown/Vite at build time with minified shader strings.
 * See scripts/minify-shaders.ts for the minification logic.
 */

declare const __GLSL_SKIN_VERTEX_SHADER__: string;
declare const __GLSL_SKIN_FRAGMENT_SHADER__: string;
declare const __GLSL_SIMPLE_VERTEX_SHADER__: string;
declare const __GLSL_SIMPLE_FRAGMENT_SHADER__: string;
declare const __WGSL_SKIN_SHADER__: string;
declare const __WGSL_SIMPLE_SHADER__: string;
declare const __GLSL_PANORAMA_VERTEX_SHADER__: string;
declare const __GLSL_PANORAMA_FRAGMENT_SHADER__: string;
declare const __WGSL_PANORAMA_SHADER__: string;
