import { defineStore } from "pinia";
import { ref } from "vue";
import type { TextureSource } from "../types";

const DEFAULT_SKIN_URL = "./skin.png";
const DEFAULT_CAPE_URL = "./cape.png";
const DEFAULT_PANORAMA_URL = "./panorama.avif";

export const useTexturesStore = defineStore("textures", () => {
  const skinSource = ref<TextureSource>(DEFAULT_SKIN_URL);
  const capeSource = ref<TextureSource>(DEFAULT_CAPE_URL);
  const panoramaSource = ref<TextureSource>(null);

  function resetSkin() {
    skinSource.value = DEFAULT_SKIN_URL;
  }

  function resetCape() {
    capeSource.value = DEFAULT_CAPE_URL;
  }

  function clearCape() {
    capeSource.value = null;
  }

  function clearPanorama() {
    panoramaSource.value = null;
  }

  return {
    skinSource,
    capeSource,
    panoramaSource,
    resetSkin,
    resetCape,
    clearCape,
    clearPanorama,
    DEFAULT_SKIN_URL,
    DEFAULT_CAPE_URL,
    DEFAULT_PANORAMA_URL,
  };
});
