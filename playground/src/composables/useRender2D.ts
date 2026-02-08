import { watch } from "vue";
import type { Ref } from "vue";
import {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
} from "@daidr/minecraft-skin-renderer/canvas2d";
import { useRender2dStore } from "../stores/render2d";
import { useTexturesStore } from "../stores/textures";
import { useSettingsStore } from "../stores/settings";

export function useRender2D(canvasRef: Ref<HTMLCanvasElement | null>) {
  const render2d = useRender2dStore();
  const textures = useTexturesStore();
  const settingsStore = useSettingsStore();

  async function render() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const skinSource = textures.skinSource ?? textures.DEFAULT_SKIN_URL;
    const slim = settingsStore.settings.slimModel;
    const { showOverlay, overlayInflated, scale, renderType } = render2d;

    try {
      switch (renderType) {
        case "avatar":
          await renderAvatar(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            overlayInflated,
          });
          break;
        case "front":
          await renderSkinFront(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            overlayInflated,
          });
          break;
        case "back":
          await renderSkinBack(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            overlayInflated,
          });
          break;
        case "side":
          await renderSkinSide(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            overlayInflated,
          });
          break;
        case "isometric":
          await renderSkinIsometric(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            overlayInflated,
          });
          break;
        case "halfBody":
          await renderHalfBody(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            overlayInflated,
          });
          break;
        case "bigHead":
          await renderBigHead(canvas, {
            skin: skinSource,
            slim,
            showOverlay,
            scale,
            border: render2d.bigHeadBorderWidth,
            borderColor: render2d.bigHeadBorderColor,
          });
          break;
      }
    } catch (error) {
      console.error("Failed to render 2D:", error);
    }
  }

  // Auto-render when relevant state changes
  watch(
    () => [
      render2d.renderType,
      render2d.scale,
      render2d.showOverlay,
      render2d.overlayInflated,
      render2d.bigHeadBorderWidth,
      render2d.bigHeadBorderColor,
      textures.skinSource,
      settingsStore.settings.slimModel,
    ],
    () => {
      if (canvasRef.value) {
        void render();
      }
    },
  );

  return { render };
}
