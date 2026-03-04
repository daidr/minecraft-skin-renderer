<script setup lang="ts">
import { ref } from "vue";
import { useTexturesStore } from "../../stores/textures";

const textures = useTexturesStore();

const panoramaUrl = ref("");

function loadDefault() {
  textures.panoramaSource = textures.DEFAULT_PANORAMA_URL;
  panoramaUrl.value = "";
}

function loadFromUrl() {
  const url = panoramaUrl.value.trim();
  if (!url) return;
  textures.panoramaSource = url;
}

function loadFromFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  textures.panoramaSource = file;
  input.value = "";
}

function clearPanorama() {
  textures.clearPanorama();
  panoramaUrl.value = "";
}
</script>

<template>
  <section class="control-section">
    <h2>Background</h2>
    <div class="control-group">
      <button class="primary-btn" @click="loadDefault">Load Default Panorama</button>
    </div>
    <div class="control-group">
      <label for="panoramaUrl">Panorama URL</label>
      <input
        v-model="panoramaUrl"
        type="text"
        id="panoramaUrl"
        placeholder="https://example.com/panorama.jpg"
      />
      <button @click="loadFromUrl">Load</button>
    </div>
    <div class="control-group">
      <label for="panoramaFile">Or upload file</label>
      <input type="file" id="panoramaFile" accept="image/*" @change="loadFromFile" />
    </div>
    <button @click="clearPanorama">Clear Panorama</button>
  </section>
</template>
