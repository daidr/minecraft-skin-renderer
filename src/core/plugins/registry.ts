/**
 * Feature Plugin Registry
 *
 * Manages registration and retrieval of feature plugins (background).
 * This is separate from the renderer registry to maintain clean separation of concerns.
 *
 * @example
 * ```ts
 * import { use } from 'minecraft-skin-renderer'
 * import { PanoramaPlugin } from 'minecraft-skin-renderer/panorama'
 *
 * use(PanoramaPlugin)
 * ```
 */

import type { PluginType, FeaturePlugin, BackgroundPlugin } from "./types";

/** Feature plugin registry state */
const featureRegistry: Map<string, FeaturePlugin> = new Map();

/**
 * Register a feature plugin
 * @internal Used by the main `use()` function
 */
export function registerFeaturePlugin(plugin: FeaturePlugin): void {
  featureRegistry.set(plugin.name, plugin);
}

/**
 * Get a registered feature plugin by name
 * @internal
 */
export function getFeaturePlugin<T extends FeaturePlugin>(name: string): T | undefined {
  return featureRegistry.get(name) as T | undefined;
}

/**
 * Get all registered feature plugins of a specific type
 * @internal
 */
export function getFeaturePluginsByType<T extends FeaturePlugin>(type: PluginType): T[] {
  return Array.from(featureRegistry.values()).filter((p) => p.type === type) as T[];
}

/**
 * Get the background plugin if registered
 * @internal
 */
export function getBackgroundPlugin(name: string): BackgroundPlugin | undefined {
  const plugin = getFeaturePlugin<BackgroundPlugin>(name);
  return plugin?.type === "background" ? plugin : undefined;
}

/**
 * Check if a feature plugin is registered
 * @internal
 */
export function isFeaturePluginRegistered(name: string): boolean {
  return featureRegistry.has(name);
}

/**
 * Get all registered feature plugin names
 * @internal
 */
export function getRegisteredFeaturePlugins(): string[] {
  return Array.from(featureRegistry.keys());
}
