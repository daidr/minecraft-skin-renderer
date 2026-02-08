<script setup lang="ts">
import { ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import CanvasArea from "./components/CanvasArea.vue";
import ControlsSidebar from "./components/ControlsSidebar.vue";

const canvasAreaRef = ref<InstanceType<typeof CanvasArea>>();

function onBackendChange() {
  canvasAreaRef.value?.onBackendChange();
}
</script>

<template>
  <div class="app">
    <AppHeader @backend-change="onBackendChange" />
    <main class="main">
      <CanvasArea ref="canvasAreaRef" />
      <ControlsSidebar />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
}
</style>
