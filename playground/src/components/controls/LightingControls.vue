<script setup lang="ts">
import { useSettingsStore } from "../../stores/settings";

const settingsStore = useSettingsStore();
</script>

<template>
  <section class="control-section">
    <h2>Lighting</h2>
    <div class="control-group">
      <label>
        <input type="checkbox" v-model="settingsStore.settings.enableLighting" />
        Enable lighting
      </label>
    </div>
    <template v-if="settingsStore.settings.enableLighting">
      <div class="control-group">
        <label for="ambientSlider">
          Ambient: <span>{{ settingsStore.settings.ambientLight.toFixed(2) }}</span>
        </label>
        <input
          type="range"
          id="ambientSlider"
          min="0"
          max="1"
          step="0.01"
          v-model.number="settingsStore.settings.ambientLight"
        />
      </div>
      <div class="control-group">
        <label for="directSlider">
          Direct: <span>{{ settingsStore.settings.directLight.toFixed(2) }}</span>
        </label>
        <input
          type="range"
          id="directSlider"
          min="0"
          max="1"
          step="0.01"
          v-model.number="settingsStore.settings.directLight"
        />
      </div>
    </template>
  </section>
</template>
