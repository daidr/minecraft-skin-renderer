<script setup lang="ts">
import { useViewerStore } from "../../stores/viewer";
import { useSettingsStore } from "../../stores/settings";

const viewerStore = useViewerStore();
const settingsStore = useSettingsStore();

function resetCamera() {
  if (!viewerStore.viewer) return;
  viewerStore.viewer.resetCamera();
  settingsStore.settings.zoom = 50;
}
</script>

<template>
  <section class="control-section">
    <h2>Camera</h2>
    <div class="control-group">
      <label for="zoomSlider">
        Distance: <span>{{ settingsStore.settings.zoom }}</span>
      </label>
      <input
        type="range"
        id="zoomSlider"
        min="20"
        max="150"
        step="1"
        v-model.number="settingsStore.settings.zoom"
      />
    </div>
    <div class="control-group">
      <label>
        <input type="checkbox" v-model="settingsStore.settings.autoRotate" />
        Auto rotate
      </label>
    </div>
    <button @click="resetCamera">Reset Camera</button>
  </section>
</template>
