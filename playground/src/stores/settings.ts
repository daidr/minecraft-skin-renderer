import { defineStore } from "pinia";
import { reactive, watch } from "vue";
import { PART_NAMES, createDefaultVisibility } from "@daidr/minecraft-skin-renderer";
import type { PartsVisibility } from "@daidr/minecraft-skin-renderer";
import type { PlaygroundSettings, PlaygroundMode } from "../types";

const STORAGE_KEY = "minecraft-skin-renderer-playground-settings";

function getDefaultSettings(): PlaygroundSettings {
  return {
    mode: "3d" as PlaygroundMode,
    backend: "auto",
    slimModel: false,
    animation: "idle",
    animationSpeed: 1,
    animationAmplitude: 1,
    backEquipment: "cape",
    zoom: 50,
    rotationTheta: 0,
    rotationPhi: 90,
    autoRotate: false,
    partsVisibility: createDefaultVisibility(),
    panoramaUrl: "",
  };
}

function loadFromStorage(): PlaygroundSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PlaygroundSettings>;
      const defaults = getDefaultSettings();
      const result = { ...defaults, ...parsed };

      // Deep-merge partsVisibility: only keep valid part names from stored data
      const defaultParts = defaults.partsVisibility;
      const storedParts = (parsed.partsVisibility ?? {}) as Partial<PartsVisibility>;
      const mergedParts = { ...defaultParts };
      for (const part of PART_NAMES) {
        if (part in storedParts) {
          mergedParts[part] = { ...defaultParts[part], ...storedParts[part] };
        }
      }
      result.partsVisibility = mergedParts;

      return result;
    }
  } catch (e) {
    console.warn("Failed to load settings from localStorage:", e);
  }
  return getDefaultSettings();
}

export const useSettingsStore = defineStore("settings", () => {
  const settings = reactive<PlaygroundSettings>(loadFromStorage());

  watch(
    () => ({ ...settings, partsVisibility: { ...settings.partsVisibility } }),
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn("Failed to save settings to localStorage:", e);
      }
    },
    { deep: true },
  );

  function resetToDefaults() {
    Object.assign(settings, getDefaultSettings());
  }

  return { settings, resetToDefaults };
});
