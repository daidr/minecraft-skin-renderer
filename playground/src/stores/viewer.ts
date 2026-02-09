import { defineStore } from "pinia";
import { shallowRef, ref } from "vue";
import { createSkinViewer, PART_NAMES } from "@daidr/minecraft-skin-renderer";
import type {
  BackendType,
  BackEquipment,
  SkinViewer,
  PartName,
} from "@daidr/minecraft-skin-renderer";
import { useSettingsStore } from "./settings";
import { useTexturesStore } from "./textures";

export const useViewerStore = defineStore("viewer", () => {
  const viewer = shallowRef<SkinViewer | null>(null);
  const backendLabel = ref("WebGL");
  const backendClass = ref("webgl");

  function applySettings() {
    if (!viewer.value) return;
    const { settings } = useSettingsStore();

    viewer.value.setSlim(settings.slimModel);
    viewer.value.setBackEquipment(settings.backEquipment as BackEquipment);
    viewer.value.setZoom(settings.zoom);
    viewer.value.setAutoRotate(settings.autoRotate);

    for (const part of PART_NAMES) {
      const visibility = settings.partsVisibility[part] ?? { inner: true, outer: true };
      viewer.value.setPartVisibility(part as PartName, "inner", visibility.inner);
      viewer.value.setPartVisibility(part as PartName, "outer", visibility.outer);
    }
  }

  async function createViewer(container: HTMLElement) {
    dispose();

    const { settings } = useSettingsStore();
    const textures = useTexturesStore();
    const preferredBackend = settings.backend as BackendType | "auto";

    // Create a new canvas (canvas can only have one context type)
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(canvas);

    // Size the canvas
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    try {
      const v = await createSkinViewer({
        canvas,
        skin: textures.skinSource ?? textures.DEFAULT_SKIN_URL,
        cape:
          textures.capeSource === null
            ? undefined
            : (textures.capeSource ?? textures.DEFAULT_CAPE_URL),
        preferredBackend,
        antialias: true,
        enableRotate: true,
        enableZoom: true,
        panorama: textures.panoramaSource ?? undefined,
      });

      viewer.value = v;
      backendLabel.value = v.backend.toUpperCase();
      backendClass.value = v.backend;

      applySettings();
      v.startRenderLoop();

      // Play animation from settings
      playAnimation();

      console.log(`Minecraft Skin Renderer initialized with ${v.backend.toUpperCase()} backend`);
      return canvas;
    } catch (error) {
      console.error("Failed to initialize viewer:", error);
      alert(
        "Failed to initialize the skin viewer. Please make sure your browser supports WebGL or WebGPU.",
      );
      return null;
    }
  }

  function playAnimation() {
    if (!viewer.value) return;
    const { settings } = useSettingsStore();

    const animationName = settings.animation;
    if (!animationName) {
      viewer.value.stopAnimation();
      return;
    }

    viewer.value.playAnimation(animationName, {
      speed: settings.animationSpeed,
      amplitude: settings.animationAmplitude,
    });
  }

  function resize(width: number, height: number) {
    if (!viewer.value) return;
    viewer.value.resize(width, height);
  }

  function dispose() {
    if (viewer.value) {
      viewer.value.dispose();
      viewer.value = null;
    }
  }

  function screenshot(): string | null {
    if (!viewer.value) return null;
    return viewer.value.screenshot("png");
  }

  return {
    viewer,
    backendLabel,
    backendClass,
    createViewer,
    applySettings,
    playAnimation,
    resize,
    dispose,
    screenshot,
  };
});
