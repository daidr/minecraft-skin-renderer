/**
 * Plugin system types
 *
 * Defines interfaces for various plugin types that can extend the skin viewer functionality.
 * Each plugin type is designed for tree-shaking - only imported plugins will be bundled.
 */

import type { IRenderer } from "../renderer/types";
import type { Camera } from "../camera/Camera";
import type { TextureSource } from "../../texture";

/** Plugin type identifiers */
export type PluginType = "renderer" | "background";

/** Base plugin interface */
export interface BasePlugin {
  /** Plugin type identifier */
  readonly type: PluginType;
  /** Unique plugin name */
  readonly name: string;
}

/** Background renderer interface */
export interface BackgroundRenderer {
  /** Set background source (image/panorama URL or data) */
  setSource(source: TextureSource): Promise<void>;
  /** Render the background */
  render(camera: Camera): void;
  /** Clean up resources */
  dispose(): void;
}

/** Background plugin interface */
export interface BackgroundPlugin extends BasePlugin {
  readonly type: "background";
  /** Create a background renderer for the given renderer */
  createRenderer(renderer: IRenderer): BackgroundRenderer;
}

/** Union type for all feature plugins (non-renderer) */
export type FeaturePlugin = BackgroundPlugin;

/** Union type for all plugins */
export type AnyPlugin = FeaturePlugin;
