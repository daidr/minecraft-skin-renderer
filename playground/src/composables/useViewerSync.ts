import { watch } from "vue";
import { PART_NAMES } from "@daidr/minecraft-skin-renderer";
import type { BackEquipment, PartName } from "@daidr/minecraft-skin-renderer";
import { useViewerStore } from "../stores/viewer";
import { useSettingsStore } from "../stores/settings";
import { useTexturesStore } from "../stores/textures";

/**
 * Syncs Pinia store state to the SkinViewer instance reactively.
 * Must be called in Canvas3D's setup() so watchers are scoped to its lifecycle.
 */
export function useViewerSync() {
  const viewerStore = useViewerStore();
  const settingsStore = useSettingsStore();
  const textures = useTexturesStore();

  watch(
    () => textures.skinSource,
    async (newSkin) => {
      if (!viewerStore.viewer) return;
      try {
        await viewerStore.viewer.setSkin(newSkin ?? textures.DEFAULT_SKIN_URL);
      } catch (e) {
        console.error("Failed to update skin:", e);
      }
    },
  );

  watch(
    () => settingsStore.settings.slimModel,
    (slim) => {
      viewerStore.viewer?.setSlim(slim);
    },
  );

  watch(
    () => textures.capeSource,
    async (newCape) => {
      if (!viewerStore.viewer) return;
      try {
        if (newCape === null) {
          await viewerStore.viewer.setCape(null);
        } else {
          await viewerStore.viewer.setCape(newCape ?? textures.DEFAULT_CAPE_URL);
        }
      } catch (e) {
        console.error("Failed to update cape:", e);
      }
    },
  );

  watch(
    () => settingsStore.settings.backEquipment,
    (equipment) => {
      viewerStore.viewer?.setBackEquipment(equipment as BackEquipment);
    },
  );

  watch(
    () => textures.panoramaSource,
    async (newPanorama) => {
      if (!viewerStore.viewer) return;
      try {
        await viewerStore.viewer.setPanorama(newPanorama ?? null);
      } catch (e) {
        console.error("Failed to update panorama:", e);
      }
    },
  );

  watch(
    () => [
      settingsStore.settings.animation,
      settingsStore.settings.animationSpeed,
      settingsStore.settings.animationAmplitude,
    ],
    () => {
      viewerStore.playAnimation();
    },
  );

  watch(
    () => settingsStore.settings.zoom,
    (zoom) => {
      viewerStore.viewer?.setZoom(zoom);
    },
  );

  watch(
    () => settingsStore.settings.autoRotate,
    (autoRotate) => {
      viewerStore.viewer?.setAutoRotate(autoRotate);
    },
  );

  watch(
    () => settingsStore.settings.partsVisibility,
    (visibility) => {
      if (!viewerStore.viewer) return;
      for (const part of PART_NAMES) {
        const v = visibility[part];
        if (v) {
          viewerStore.viewer.setPartVisibility(part as PartName, "inner", v.inner);
          viewerStore.viewer.setPartVisibility(part as PartName, "outer", v.outer);
        }
      }
    },
    { deep: true },
  );
}
