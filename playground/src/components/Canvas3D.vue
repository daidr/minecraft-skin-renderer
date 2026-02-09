<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useViewerStore } from "../stores/viewer";
import { useSettingsStore } from "../stores/settings";
import { useViewerSync } from "../composables/useViewerSync";
import StatsOverlay from "./StatsOverlay.vue";

const viewerStore = useViewerStore();
const settingsStore = useSettingsStore();
useViewerSync();

const containerRef = ref<HTMLElement>();
let resizeObserver: ResizeObserver | null = null;
let canvas: HTMLCanvasElement | null = null;

async function initViewer() {
  if (!containerRef.value) return;
  canvas = await viewerStore.createViewer(containerRef.value);
  if (canvas) {
    attachWheelListener();
  }
}

async function recreateViewer() {
  if (!containerRef.value) return;
  canvas = await viewerStore.createViewer(containerRef.value);
  if (canvas) {
    attachWheelListener();
  }
}

function attachWheelListener() {
  if (!canvas) return;
  canvas.addEventListener("wheel", () => {
    if (!viewerStore.viewer) return;
    const zoom = viewerStore.viewer.getZoom();
    settingsStore.settings.zoom = Math.round(zoom);
  });
}

onMounted(async () => {
  await initViewer();

  // Resize observer
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      if (canvas) {
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
      }
      viewerStore.resize(width, height);
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  viewerStore.dispose();
});

defineExpose({ recreateViewer });
</script>

<template>
  <div class="canvas-3d-wrapper">
    <div ref="containerRef" class="canvas-container" />
    <StatsOverlay />
  </div>
</template>

<style scoped>
.canvas-3d-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}

.canvas-container {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(ellipse at center, var(--canvas-gradient) 0%, var(--background) 100%);
}

.canvas-container :deep(canvas) {
  width: 100%;
  height: 100%;
  touch-action: none;
}

@media (max-width: 768px) {
  .canvas-3d-wrapper {
    min-height: 50vh;
  }
}
</style>
