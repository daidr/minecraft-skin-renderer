import { defineConfig } from "tsdown";

export default defineConfig([{
  platform: 'neutral',
  entry: ["src/index.ts", "src/webgl.ts", "src/webgpu.ts", "src/panorama.ts"],
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
}, {
  platform: 'browser',
  entry: { "minecraft-skin-renderer": "src/iife.ts" },
  format: ["iife"],
  globalName: "MSR",
  outputOptions: { entryFileNames: '[name].min.js' },
  dts: false,
  clean: false,
  minify: true,
  sourcemap: true,
  treeshake: true,
}]);
