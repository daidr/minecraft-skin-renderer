import { defineStore } from "pinia";
import { shallowRef, ref } from "vue";
import type { SkinViewer } from "@daidr/minecraft-skin-renderer";

export const useViewerStore = defineStore("viewer", () => {
  const viewer = shallowRef<SkinViewer | null>(null);
  const backendLabel = ref("WebGL");
  const backendClass = ref("webgl");

  function setViewer(v: SkinViewer) {
    viewer.value = v;
    backendLabel.value = v.backend.toUpperCase();
    backendClass.value = v.backend;
  }

  function clearViewer() {
    viewer.value = null;
  }

  function screenshot(): string | null {
    return viewer.value?.screenshot("png") ?? null;
  }

  return {
    viewer,
    backendLabel,
    backendClass,
    setViewer,
    clearViewer,
    screenshot,
  };
});
