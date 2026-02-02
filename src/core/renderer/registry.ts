/**
 * Renderer Registry
 *
 * Provides a registration system for renderers to enable tree shaking.
 * Users must explicitly import and register the renderer they want to use.
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'
 *
 * use(WebGLRendererPlugin)
 * ```
 */

import type { BackendType, IRenderer, RendererOptions } from "./types";

/** Renderer factory function type */
export type RendererFactory = (options: RendererOptions) => IRenderer | Promise<IRenderer>;

/** Shader sources for a renderer backend */
export interface ShaderSources {
  vertex: string;
  fragment: string;
}

/** Renderer plugin definition */
export interface RendererPlugin {
  /** Backend type identifier */
  backend: BackendType;
  /** Factory function to create the renderer */
  createRenderer: RendererFactory;
  /** Shader sources for this backend */
  shaders: ShaderSources;
}

/** Registry state */
const registry: Map<BackendType, RendererPlugin> = new Map();

/**
 * Register a renderer plugin
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'
 *
 * use(WebGLRendererPlugin)
 * ```
 */
export function use(plugin: RendererPlugin): void {
  registry.set(plugin.backend, plugin);
}

/**
 * Get a registered renderer plugin by backend type
 * @internal
 */
export function getRendererPlugin(backend: BackendType): RendererPlugin | undefined {
  return registry.get(backend);
}

/**
 * Get all registered backend types
 * @internal
 */
export function getRegisteredBackends(): BackendType[] {
  return Array.from(registry.keys());
}

/**
 * Check if a backend is registered
 * @internal
 */
export function isBackendRegistered(backend: BackendType): boolean {
  return registry.has(backend);
}
