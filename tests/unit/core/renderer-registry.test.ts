/**
 * Renderer registry unit tests
 */

import { afterEach, describe, it, expect, vi } from "vitest";
import {
  use,
  getRendererPlugin,
  getRegisteredBackends,
  isBackendRegistered,
} from "@/core/renderer/registry";
import { isWebGPUSupported } from "@/core/renderer/types";
import type { RendererPlugin } from "@/core/renderer/registry";

function createMockRendererPlugin(backend: "webgl" | "webgpu"): RendererPlugin {
  return {
    type: "renderer",
    backend,
    createRenderer: () => ({}) as any,
    shaders: {
      vertex: "void main() {}",
      fragment: "void main() {}",
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Renderer Registry", () => {
  describe("use() with renderer plugins", () => {
    it("should register a WebGL renderer plugin", () => {
      const plugin = createMockRendererPlugin("webgl");
      use(plugin);
      expect(isBackendRegistered("webgl")).toBe(true);
    });

    it("should register a WebGPU renderer plugin", () => {
      const plugin = createMockRendererPlugin("webgpu");
      use(plugin);
      expect(isBackendRegistered("webgpu")).toBe(true);
    });
  });

  describe("use() with feature plugins", () => {
    it("should route feature plugins to feature registry", () => {
      const featurePlugin = {
        type: "background" as const,
        name: "test-feature-via-use",
        createRenderer: () => ({
          setSource: async () => {},
          render: () => {},
          dispose: () => {},
        }),
      };
      // Should not throw
      use(featurePlugin);
    });
  });

  describe("getRendererPlugin", () => {
    it("should retrieve registered renderer plugin", () => {
      const plugin = createMockRendererPlugin("webgl");
      use(plugin);
      const retrieved = getRendererPlugin("webgl");
      expect(retrieved).toBe(plugin);
    });
  });

  describe("getRegisteredBackends", () => {
    it("should return list of registered backends", () => {
      use(createMockRendererPlugin("webgl"));
      const backends = getRegisteredBackends();
      expect(backends).toContain("webgl");
      expect(Array.isArray(backends)).toBe(true);
    });
  });

  describe("isBackendRegistered", () => {
    it("should return true for registered backend", () => {
      use(createMockRendererPlugin("webgl"));
      expect(isBackendRegistered("webgl")).toBe(true);
    });
  });

  describe("environment support checks", () => {
    it("should return false without throwing when navigator is unavailable", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isWebGPUSupported()).toBe(false);
    });
  });
});
