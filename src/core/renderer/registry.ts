/**
 * Renderer Registry
 *
 * Provides a registration system for renderers and feature plugins to enable tree shaking.
 * Users must explicitly import and register the plugins they want to use.
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'
 * import { LightingPlugin } from 'minecraft-skin-renderer/lighting'
 *
 * use(WebGLRendererPlugin)
 * use(LightingPlugin)
 * ```
 */

import type { BackendType, IRenderer, RendererOptions } from "./types";
import type { FeaturePlugin } from "../plugins/types";
import { registerFeaturePlugin } from "../plugins/registry";

/** Renderer factory function type */
export type RendererFactory = (options: RendererOptions) => IRenderer | Promise<IRenderer>;

/** Shader sources for a renderer backend */
export interface ShaderSources {
  vertex: string;
  fragment: string;
}

/** Renderer plugin definition */
export interface RendererPlugin {
  /** Type identifier - always 'renderer' for renderer plugins */
  readonly type?: "renderer";
  /** Backend type identifier */
  backend: BackendType;
  /** Factory function to create the renderer */
  createRenderer: RendererFactory;
  /** Shader sources for this backend (static or dynamic via function) */
  shaders: ShaderSources;
  /**
   * Get composed shaders with plugin chunks injected.
   * If not provided, shaders are used as-is.
   */
  getComposedShaders?(): ShaderSources;
}

/** Union type for all plugins that can be registered with use() */
export type AnyRegistrablePlugin = RendererPlugin | FeaturePlugin;

/** Registry state */
const registry: Map<BackendType, RendererPlugin> = new Map();

/**
 * Check if a plugin is a renderer plugin
 */
function isRendererPlugin(plugin: AnyRegistrablePlugin): plugin is RendererPlugin {
  return "backend" in plugin && "createRenderer" in plugin;
}

/**
 * Register a plugin (renderer or feature plugin)
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'
 * import { LightingPlugin } from 'minecraft-skin-renderer/lighting'
 *
 * use(WebGLRendererPlugin)  // Register renderer
 * use(LightingPlugin)       // Register feature plugin
 * ```
 */
export function use(plugin: AnyRegistrablePlugin): void {
  if (isRendererPlugin(plugin)) {
    registry.set(plugin.backend, plugin);
  } else {
    registerFeaturePlugin(plugin);
  }
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
