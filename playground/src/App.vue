<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
import CanvasArea from "./components/CanvasArea.vue";
import ControlsSidebar from "./components/ControlsSidebar.vue";
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="main">
      <CanvasArea />
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
