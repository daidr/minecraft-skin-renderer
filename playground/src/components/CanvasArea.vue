<script setup lang="ts">
import Canvas3D from "./Canvas3D.vue";
import Canvas2D from "./Canvas2D.vue";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
</script>

<template>
  <Canvas3D v-if="settingsStore.settings.mode === '3d'" />
  <Canvas2D v-else />
</template>
