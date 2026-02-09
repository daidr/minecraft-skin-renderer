<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Stats from "stats.js";

const containerRef = ref<HTMLElement>();
let stats: Stats | null = null;
let rafId = 0;

onMounted(() => {
  stats = new Stats();
  stats.showPanel(0);
  stats.dom.style.position = "absolute";
  stats.dom.style.top = "8px";
  stats.dom.style.left = "8px";

  containerRef.value?.appendChild(stats.dom);

  const animate = () => {
    stats!.begin();
    stats!.end();
    rafId = requestAnimationFrame(animate);
  };
  animate();
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (stats) {
    stats.dom.remove();
    stats = null;
  }
});

defineExpose({ containerRef });
</script>

<template>
  <div ref="containerRef" class="stats-overlay" />
</template>

<style scoped>
.stats-overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}
</style>
