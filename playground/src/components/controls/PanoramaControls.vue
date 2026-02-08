<script setup lang="ts">
import { ref } from "vue";
import { useViewerStore } from "../../stores/viewer";
import { useTexturesStore } from "../../stores/textures";

const viewerStore = useViewerStore();
const textures = useTexturesStore();

const panoramaUrl = ref("");

async function loadDefault() {
  if (!viewerStore.viewer) return;
  try {
    await viewerStore.viewer.setPanorama(textures.DEFAULT_PANORAMA_URL);
    textures.panoramaSource = textures.DEFAULT_PANORAMA_URL;
    panoramaUrl.value = "";
  } catch (error) {
    console.error("Failed to load default panorama:", error);
    alert("Failed to load default panorama");
  }
}

async function loadFromUrl() {
  const url = panoramaUrl.value.trim();
  if (!url || !viewerStore.viewer) return;
  try {
    await viewerStore.viewer.setPanorama(url);
    textures.panoramaSource = url;
  } catch (error) {
    console.error("Failed to load panorama:", error);
    alert("Failed to load panorama from URL");
  }
}

async function loadFromFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !viewerStore.viewer) return;
  try {
    await viewerStore.viewer.setPanorama(file);
    textures.panoramaSource = file;
  } catch (error) {
    console.error("Failed to load panorama:", error);
    alert("Failed to load panorama from file");
  }
}

async function clearPanorama() {
  if (!viewerStore.viewer) return;
  await viewerStore.viewer.setPanorama(null);
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
