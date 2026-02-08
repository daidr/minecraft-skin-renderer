import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@daidr/minecraft-skin-renderer/canvas2d": resolve(__dirname, "../src/canvas2d.ts"),
      "@daidr/minecraft-skin-renderer/webgl": resolve(__dirname, "../src/webgl.ts"),
      "@daidr/minecraft-skin-renderer/webgpu": resolve(__dirname, "../src/webgpu.ts"),
      "@daidr/minecraft-skin-renderer/panorama": resolve(__dirname, "../src/panorama.ts"),
      "@daidr/minecraft-skin-renderer": resolve(__dirname, "../src/index.ts"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, "../dist-playground"),
    emptyOutDir: true,
  },
});
