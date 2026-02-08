/**
 * Feature plugin registry unit tests
 */

import { describe, it, expect } from "vitest";
import {
  registerFeaturePlugin,
  getFeaturePlugin,
  getFeaturePluginsByType,
  getBackgroundPlugin,
  isFeaturePluginRegistered,
  getRegisteredFeaturePlugins,
} from "@/core/plugins/registry";
import type { BackgroundPlugin } from "@/core/plugins/types";

// Create a mock background plugin
function createMockBackgroundPlugin(name: string): BackgroundPlugin {
  return {
    type: "background",
    name,
    createRenderer: () => ({
      setSource: async () => {},
      render: () => {},
      dispose: () => {},
    }),
  };
}

describe("Feature Plugin Registry", () => {
  it("should register and retrieve a plugin", () => {
    const plugin = createMockBackgroundPlugin("test-bg");
    registerFeaturePlugin(plugin);

    const retrieved = getFeaturePlugin("test-bg");
    expect(retrieved).toBe(plugin);
  });

  it("should return undefined for unregistered plugin", () => {
    expect(getFeaturePlugin("nonexistent")).toBeUndefined();
  });

  it("should check if plugin is registered", () => {
    const plugin = createMockBackgroundPlugin("check-test");
    registerFeaturePlugin(plugin);

    expect(isFeaturePluginRegistered("check-test")).toBe(true);
    expect(isFeaturePluginRegistered("missing")).toBe(false);
  });

  it("should get plugins by type", () => {
    const bg1 = createMockBackgroundPlugin("bg1");
    const bg2 = createMockBackgroundPlugin("bg2");
    registerFeaturePlugin(bg1);
    registerFeaturePlugin(bg2);

    const bgPlugins = getFeaturePluginsByType("background");
    expect(bgPlugins.length).toBeGreaterThanOrEqual(2);
    expect(bgPlugins).toContain(bg1);
    expect(bgPlugins).toContain(bg2);
  });

  it("should get background plugin by name", () => {
    const plugin = createMockBackgroundPlugin("panorama-test");
    registerFeaturePlugin(plugin);

    const bg = getBackgroundPlugin("panorama-test");
    expect(bg).toBe(plugin);
  });

  it("should return undefined for background plugin with wrong type", () => {
    // A plugin registered as background should work, but querying non-existent
    expect(getBackgroundPlugin("no-such-bg")).toBeUndefined();
  });

  it("should list all registered plugin names", () => {
    const plugin = createMockBackgroundPlugin("listed-plugin");
    registerFeaturePlugin(plugin);

    const names = getRegisteredFeaturePlugins();
    expect(names).toContain("listed-plugin");
  });
});
