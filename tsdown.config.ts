import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/webgl.ts", "src/webgpu.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  unbundle: true,
  minify: false,
  sourcemap: true,
  exports: true,
});
