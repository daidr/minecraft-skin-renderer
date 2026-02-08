<script setup lang="ts">
import { useViewerStore } from "../../stores/viewer";
import { useSettingsStore } from "../../stores/settings";

const viewerStore = useViewerStore();
const settingsStore = useSettingsStore();

function play() {
  viewerStore.viewer?.resumeAnimation();
}

function pause() {
  viewerStore.viewer?.pauseAnimation();
}

function stop() {
  viewerStore.viewer?.stopAnimation();
  settingsStore.settings.animation = "";
}
</script>

<template>
  <section class="control-section">
    <h2>Animation</h2>
    <div class="control-group">
      <label for="animationSelect">Animation</label>
      <select id="animationSelect" v-model="settingsStore.settings.animation">
        <option value="">None</option>
        <option value="idle">Idle</option>
        <option value="walk">Walk</option>
        <option value="run">Run</option>
        <option value="fly">Fly</option>
      </select>
    </div>
    <div class="control-group">
      <label for="speedSlider">
        Speed: <span>{{ settingsStore.settings.animationSpeed }}x</span>
      </label>
      <input
        type="range"
        id="speedSlider"
        min="0.1"
        max="3"
        step="0.1"
        v-model.number="settingsStore.settings.animationSpeed"
      />
    </div>
    <div class="control-group">
      <label for="amplitudeSlider">
        Amplitude: <span>{{ settingsStore.settings.animationAmplitude }}x</span>
      </label>
      <input
        type="range"
        id="amplitudeSlider"
        min="0.1"
        max="2"
        step="0.1"
        v-model.number="settingsStore.settings.animationAmplitude"
      />
    </div>
    <div class="button-group">
      <button @click="play">Play</button>
      <button @click="pause">Pause</button>
      <button @click="stop">Stop</button>
    </div>
  </section>
</template>
