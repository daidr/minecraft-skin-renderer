<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { SkinViewer as SkinViewerComponent } from "@daidr/minecraft-skin-renderer/vue3";
import type {
  SkinViewer,
  BackEquipment,
  PartsVisibility,
  BackendType,
} from "@daidr/minecraft-skin-renderer";
import { useViewerStore } from "../stores/viewer";
import { useSettingsStore } from "../stores/settings";
import { useTexturesStore } from "../stores/textures";
import StatsOverlay from "./StatsOverlay.vue";

const viewerStore = useViewerStore();
const settingsStore = useSettingsStore();
const textures = useTexturesStore();
const skinViewerRef = ref<InstanceType<typeof SkinViewerComponent>>();

const preferredBackend = computed(() => settingsStore.settings.backend as BackendType | "auto");
const backEquipment = computed(() => settingsStore.settings.backEquipment as BackEquipment);
const partsVisibility = computed(
  () => settingsStore.settings.partsVisibility as unknown as PartsVisibility,
);

const skinSource = computed(() => textures.skinSource ?? textures.DEFAULT_SKIN_URL);
const capeSource = computed(() => {
  if (textures.capeSource === null) return null;
  return textures.capeSource ?? textures.DEFAULT_CAPE_URL;
});
const animationName = computed(() => settingsStore.settings.animation || null);

function normalizeDeg(deg: number): number {
  deg = deg % 360;
  if (deg > 180) deg -= 360;
  if (deg <= -180) deg += 360;
  return deg;
}

const zoomModel = computed({
  get: () => settingsStore.settings.zoom,
  set: (v: number) => {
    settingsStore.settings.zoom = Math.round(v);
  },
});

const rotationModel = computed({
  get: () => ({
    theta: (settingsStore.settings.rotationTheta * Math.PI) / 180,
    phi: (settingsStore.settings.rotationPhi * Math.PI) / 180,
  }),
  set: (v: { theta: number; phi: number }) => {
    settingsStore.settings.rotationTheta = Math.round(normalizeDeg((v.theta * 180) / Math.PI));
    settingsStore.settings.rotationPhi = Math.round((v.phi * 180) / Math.PI);
  },
});

function onReady(viewer: SkinViewer) {
  viewerStore.setViewer(viewer);
  console.log(`Minecraft Skin Renderer initialized with ${viewer.backend.toUpperCase()} backend`);
}

function onError(error: Error) {
  console.error("Failed to initialize viewer:", error);
  alert(
    "Failed to initialize the skin viewer. Please make sure your browser supports WebGL or WebGPU.",
  );
}

async function recreateViewer() {
  await (skinViewerRef.value as any)?.recreate();
}

onUnmounted(() => {
  viewerStore.clearViewer();
});

defineExpose({ recreateViewer });
</script>

<template>
  <div class="canvas-3d-wrapper">
    <SkinViewerComponent
      ref="skinViewerRef"
      :preferred-backend="preferredBackend"
      :skin="skinSource"
      :cape="capeSource"
      :slim="settingsStore.settings.slimModel"
      :back-equipment="backEquipment"
      :animation="animationName"
      :animation-speed="settingsStore.settings.animationSpeed"
      :animation-amplitude="settingsStore.settings.animationAmplitude"
      v-model:zoom="zoomModel"
      v-model:rotation="rotationModel"
      :auto-rotate="settingsStore.settings.autoRotate"
      :parts-visibility="partsVisibility"
      :panorama="textures.panoramaSource"
      @ready="onReady"
      @error="onError"
      class="skin-viewer"
    />
    <StatsOverlay />
  </div>
</template>

<style scoped>
.canvas-3d-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}

.skin-viewer {
  flex: 1;
  min-width: 0;
  background: radial-gradient(ellipse at center, var(--canvas-gradient) 0%, var(--background) 100%);
}

.skin-viewer :deep(canvas) {
  width: 100%;
  height: 100%;
  touch-action: none;
}

@media (max-width: 768px) {
  .canvas-3d-wrapper {
    min-height: 50vh;
  }
}
</style>
