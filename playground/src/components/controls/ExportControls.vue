<script setup lang="ts">
import { useViewerStore } from "../../stores/viewer";
import { useRender2dStore } from "../../stores/render2d";
import { useSettingsStore } from "../../stores/settings";

const viewerStore = useViewerStore();
const render2d = useRender2dStore();
const settingsStore = useSettingsStore();

function screenshot3D() {
  const dataUrl = viewerStore.screenshot();
  if (!dataUrl) return;

  const link = document.createElement("a");
  link.download = "minecraft-skin.png";
  link.href = dataUrl;
  link.click();
}

function screenshot2D() {
  const canvas = document.querySelector(".canvas-container-2d canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `minecraft-skin-2d-${render2d.renderType}.png`;
  link.href = dataUrl;
  link.click();
}
</script>

<template>
  <section class="control-section">
    <h2>Export</h2>
    <button v-if="settingsStore.settings.mode === '3d'" @click="screenshot3D">
      Take Screenshot
    </button>
    <button v-else @click="screenshot2D">Download Image</button>
  </section>
</template>
