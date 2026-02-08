<script setup lang="ts">
import { ref } from "vue";
import Canvas3D from "./Canvas3D.vue";
import Canvas2D from "./Canvas2D.vue";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
const canvas3dRef = ref<InstanceType<typeof Canvas3D>>();

function onBackendChange() {
  canvas3dRef.value?.recreateViewer();
}

defineExpose({ onBackendChange });
</script>

<template>
  <Canvas3D v-if="settingsStore.settings.mode === '3d'" ref="canvas3dRef" />
  <Canvas2D v-if="settingsStore.settings.mode === '2d'" />
</template>
