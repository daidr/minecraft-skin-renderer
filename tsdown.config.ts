import { defineConfig } from "tsdown";

/**
 * Plugin that externalizes all non-vue3-local imports from vue3/ source files
 * to the "minecraft-skin-renderer" external, mapped to the MSR global.
 */
function externalizeForVue3Plugin() {
  return {
    name: "externalize-for-vue3",
    resolveId(source: string, importer: string | undefined) {
      if (!importer) return null;
      const norm = importer.replace(/\\/g, "/");
      if (!norm.includes("/src/vue3/")) return null;
      if (source.startsWith("./") || source === "vue") return null;
      if (source.startsWith("..")) {
        return { id: "minecraft-skin-renderer", external: true };
      }
      return null;
    },
  };
}

export default defineConfig([
  // ESM (tree-shakable, unbundled)
  {
    platform: "neutral",
    entry: [
      "src/index.ts",
      "src/webgl.ts",
      "src/webgpu.ts",
      "src/panorama.ts",
      "src/canvas2d.ts",
      "src/vue3.ts",
    ],
    format: ["esm"],
    dts: {
      sourcemap: true,
    },
    clean: true,
    unbundle: true,
    minify: false,
    sourcemap: true,
    exports: true,
    treeshake: true,
  },
  // IIFE: All-in-one (3D + 2D + plugins)
  {
    platform: "browser",
    entry: { "minecraft-skin-renderer": "src/iife-core.ts" },
    format: ["iife"],
    globalName: "MSR",
    outputOptions: { entryFileNames: "[name].min.js" },
    dts: false,
    clean: false,
    minify: true,
    sourcemap: true,
    treeshake: true,
  },
  // IIFE: Vue 3 integration (depends on Vue + MSR)
  {
    platform: "browser",
    entry: { "minecraft-skin-renderer-vue3": "src/iife-vue3.ts" },
    format: ["iife"],
    globalName: "MSRVue3",
    external: ["vue"],
    plugins: [externalizeForVue3Plugin()],
    outputOptions: {
      entryFileNames: "[name].min.js",
      globals: {
        vue: "Vue",
        "minecraft-skin-renderer": "MSR",
      },
    },
    dts: false,
    clean: false,
    minify: true,
    sourcemap: true,
    treeshake: true,
  },
]);
