<script setup lang="ts">
import SkinControls from "./controls/SkinControls.vue";
import CapeControls from "./controls/CapeControls.vue";
import PartsVisibility from "./controls/PartsVisibility.vue";
import AnimationControls from "./controls/AnimationControls.vue";
import CameraControls from "./controls/CameraControls.vue";
import PanoramaControls from "./controls/PanoramaControls.vue";
import RenderTypeControls from "./controls/RenderTypeControls.vue";
import RenderOptionsControls from "./controls/RenderOptionsControls.vue";
import BigHeadOptions from "./controls/BigHeadOptions.vue";
import ExportControls from "./controls/ExportControls.vue";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
</script>

<template>
  <aside class="controls">
    <!-- Shared: Skin loading -->
    <SkinControls />

    <!-- 3D-only controls -->
    <template v-if="settingsStore.settings.mode === '3d'">
      <CapeControls />
      <PartsVisibility />
      <AnimationControls />
      <CameraControls />
      <PanoramaControls />
    </template>

    <!-- 2D-only controls -->
    <template v-if="settingsStore.settings.mode === '2d'">
      <RenderTypeControls />
      <RenderOptionsControls />
      <BigHeadOptions />
    </template>

    <!-- Export (both modes) -->
    <ExportControls />
  </aside>
</template>

<style scoped>
.controls {
  flex: 0 0 320px;
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 1rem;
}

.controls::-webkit-scrollbar {
  width: 8px;
}

.controls::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .controls {
    width: 100%;
    max-height: 40vh;
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
</style>
