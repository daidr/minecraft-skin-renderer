<script setup lang="ts">
import { useViewerStore } from "../../stores/viewer";
import { useSettingsStore } from "../../stores/settings";

const viewerStore = useViewerStore();
const settingsStore = useSettingsStore();

function resetCamera() {
  viewerStore.viewer?.resetCamera();
  settingsStore.settings.zoom = 50;
  settingsStore.settings.rotationTheta = 0;
  settingsStore.settings.rotationPhi = 90;
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
      <label for="thetaSlider">
        Horizontal: <span>{{ settingsStore.settings.rotationTheta }}°</span>
      </label>
      <input
        type="range"
        id="thetaSlider"
        min="-180"
        max="180"
        step="1"
        v-model.number="settingsStore.settings.rotationTheta"
      />
    </div>
    <div class="control-group">
      <label for="phiSlider">
        Vertical: <span>{{ settingsStore.settings.rotationPhi }}°</span>
      </label>
      <input
        type="range"
        id="phiSlider"
        min="10"
        max="170"
        step="1"
        v-model.number="settingsStore.settings.rotationPhi"
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
