import { defineStore } from "pinia";
import { reactive, watch } from "vue";
import { PART_NAMES } from "@daidr/minecraft-skin-renderer";
import type { PlaygroundSettings, PlaygroundMode } from "../types";

const STORAGE_KEY = "minecraft-skin-renderer-playground-settings";

function getDefaultSettings(): PlaygroundSettings {
  const partsVisibility: Record<string, { inner: boolean; outer: boolean }> = {};
  for (const part of PART_NAMES) {
    partsVisibility[part] = { inner: true, outer: true };
  }
  return {
    mode: "3d" as PlaygroundMode,
    backend: "auto",
    slimModel: false,
    animation: "idle",
    animationSpeed: 1,
    animationAmplitude: 1,
    backEquipment: "cape",
    zoom: 50,
    autoRotate: false,
    partsVisibility,
    panoramaUrl: "",
  };
}

function loadFromStorage(): PlaygroundSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PlaygroundSettings>;
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load settings from localStorage:", e);
  }
  return getDefaultSettings();
}

export const useSettingsStore = defineStore("settings", () => {
  const settings = reactive<PlaygroundSettings>(loadFromStorage());

  let skipSave = false;

  watch(
    () => ({ ...settings, partsVisibility: { ...settings.partsVisibility } }),
    () => {
      if (skipSave) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        console.warn("Failed to save settings to localStorage:", e);
      }
    },
    { deep: true },
  );

  function resetToDefaults() {
    skipSave = true;
    Object.assign(settings, getDefaultSettings());
    skipSave = false;
  }

  return { settings, resetToDefaults };
});
