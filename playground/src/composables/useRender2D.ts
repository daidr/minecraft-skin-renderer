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

    const baseOpts = { skin: skinSource, slim, showOverlay, scale, overlayInflated };

    try {
      switch (renderType) {
        case "avatar":
          await renderAvatar(canvas, baseOpts);
          break;
        case "front":
          await renderSkinFront(canvas, baseOpts);
          break;
        case "back":
          await renderSkinBack(canvas, baseOpts);
          break;
        case "side":
          await renderSkinSide(canvas, baseOpts);
          break;
        case "isometric":
          await renderSkinIsometric(canvas, baseOpts);
          break;
        case "halfBody":
          await renderHalfBody(canvas, baseOpts);
          break;
        case "bigHead":
          await renderBigHead(canvas, {
            ...baseOpts,
            border: render2d.bigHeadBorderWidth,
            borderColor: render2d.bigHeadBorderColor,
          });
          break;
        default:
          return;
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
