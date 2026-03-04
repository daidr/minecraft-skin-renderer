<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRender2D } from "../composables/useRender2D";
import { useRender2dStore } from "../stores/render2d";

const render2d = useRender2dStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const { render } = useRender2D(canvasRef);

onMounted(() => {
  render2d.canvasRef = canvasRef.value;
  void render();
});

onBeforeUnmount(() => {
  render2d.canvasRef = null;
});
</script>

<template>
  <div class="canvas-container canvas-container-2d">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.canvas-container {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-container-2d {
  background: var(--background);
}

.canvas-container-2d canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  max-width: 90%;
  max-height: 90%;
  background-image:
    linear-gradient(45deg, var(--checkerboard) 25%, transparent 25%),
    linear-gradient(-45deg, var(--checkerboard) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--checkerboard) 75%),
    linear-gradient(-45deg, transparent 75%, var(--checkerboard) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
}

@media (max-width: 768px) {
  .canvas-container {
    min-height: 50vh;
  }
}
</style>
