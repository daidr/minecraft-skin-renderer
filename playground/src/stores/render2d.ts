import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { RenderType } from "../types";

const STORAGE_KEY = "minecraft-skin-renderer-playground-render2d";

interface Render2dSettings {
  renderType: RenderType;
  scale: number;
  showOverlay: boolean;
  overlayInflated: boolean;
  bigHeadBorderWidth: number;
  bigHeadBorderColor: string;
}

function getDefaults(): Render2dSettings {
  return {
    renderType: "avatar",
    scale: 8,
    showOverlay: true,
    overlayInflated: false,
    bigHeadBorderWidth: 2,
    bigHeadBorderColor: "#000000",
  };
}

function loadFromStorage(): Render2dSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Render2dSettings>;
      return { ...getDefaults(), ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load render2d settings from localStorage:", e);
  }
  return getDefaults();
}

export const useRender2dStore = defineStore("render2d", () => {
  const saved = loadFromStorage();
  const renderType = ref<RenderType>(saved.renderType);
  const scale = ref(saved.scale);
  const showOverlay = ref(saved.showOverlay);
  const overlayInflated = ref(saved.overlayInflated);
  const bigHeadBorderWidth = ref(saved.bigHeadBorderWidth);
  const bigHeadBorderColor = ref(saved.bigHeadBorderColor);

  watch(
    [renderType, scale, showOverlay, overlayInflated, bigHeadBorderWidth, bigHeadBorderColor],
    () => {
      try {
        const data: Render2dSettings = {
          renderType: renderType.value,
          scale: scale.value,
          showOverlay: showOverlay.value,
          overlayInflated: overlayInflated.value,
          bigHeadBorderWidth: bigHeadBorderWidth.value,
          bigHeadBorderColor: bigHeadBorderColor.value,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to save render2d settings to localStorage:", e);
      }
    },
  );

  return {
    renderType,
    scale,
    showOverlay,
    overlayInflated,
    bigHeadBorderWidth,
    bigHeadBorderColor,
  };
});
