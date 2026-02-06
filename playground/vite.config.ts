import { defineConfig } from "vite";
import { resolve } from "node:path";
import { getShaderDefines } from "../scripts/minify-shaders";

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      "@": resolve(__dirname, "../src"),
    },
  },
  define: getShaderDefines(),
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, "../dist-playground"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "perf-test": resolve(__dirname, "perf-test.html"),
      },
    },
  },
});
