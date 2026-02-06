import { defineConfig } from "tsdown";
import { getShaderDefines } from "./scripts/minify-shaders.ts";

export default defineConfig({
  entry: ["src/index.ts", "src/webgl.ts", "src/webgpu.ts", "src/panorama.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  unbundle: true,
  minify: false,
  sourcemap: true,
  exports: true,
  define: getShaderDefines(),
});
