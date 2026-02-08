<script setup lang="ts">
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
</script>

<template>
  <div class="mode-toggle">
    <button
      class="mode-btn"
      :class="{ active: settingsStore.settings.mode === '3d' }"
      @click="settingsStore.settings.mode = '3d'"
    >
      3D Viewer
    </button>
    <button
      class="mode-btn"
      :class="{ active: settingsStore.settings.mode === '2d' }"
      @click="settingsStore.settings.mode = '2d'"
    >
      2D Canvas
    </button>
  </div>
</template>

<style scoped>
.mode-toggle {
  display: flex;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.mode-btn {
  height: 1.75rem;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: transparent;
  color: var(--muted-foreground);
  border: none;
  border-radius: 0;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.mode-btn:hover {
  color: var(--foreground);
  opacity: 1;
}

.mode-btn.active {
  background: var(--foreground);
  color: var(--background);
}
</style>
