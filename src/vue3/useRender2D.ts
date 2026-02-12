import { ref, shallowRef, toValue, watch } from "vue";
import type { MaybeRefOrGetter, Ref, ShallowRef } from "vue";
import {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
} from "../canvas2d/index";
import type { ICanvas } from "../canvas2d/canvas-env";
import type {
  AvatarOptions,
  BaseRenderOptions,
  BigHeadOptions,
  HalfBodyOptions,
  IsometricOptions,
  SkinViewOptions,
} from "../canvas2d/types";

/** Return type for all 2D render composables */
export interface UseRender2DReturn {
  /** Manually trigger a render */
  render: () => Promise<void>;
  /** Whether a render is currently in progress */
  isRendering: Ref<boolean>;
  /** Last render error, `null` if none */
  error: ShallowRef<Error | null>;
}

/**
 * Internal factory that creates a 2D render composable for a specific render function.
 *
 * The returned composable watches the canvas ref and options, automatically re-rendering
 * when either changes.
 */
function createUseRender<T extends BaseRenderOptions>(
  renderFn: (canvas: ICanvas, options: T) => Promise<void>,
) {
  return function (
    canvasRef: MaybeRefOrGetter<HTMLCanvasElement | null | undefined>,
    options: MaybeRefOrGetter<T>,
  ): UseRender2DReturn {
    const isRendering = ref(false);
    const error = shallowRef<Error | null>(null);

    async function render() {
      const canvas = toValue(canvasRef);
      if (!canvas) return;

      isRendering.value = true;
      error.value = null;
      try {
        await renderFn(canvas, toValue(options));
      } catch (e) {
        error.value = e instanceof Error ? e : new Error(String(e));
      } finally {
        isRendering.value = false;
      }
    }

    watch(
      () => [toValue(canvasRef), toValue(options)] as const,
      () => void render(),
      { deep: true },
    );

    return { render, isRendering, error };
  };
}

/**
 * Render a square avatar (head front face) to a canvas element.
 *
 * @example
 * ```ts
 * const canvasRef = ref<HTMLCanvasElement | null>(null)
 * const { render, isRendering } = useRenderAvatar(canvasRef, () => ({
 *   skin: skinUrl.value,
 *   scale: 8,
 * }))
 * ```
 */
export const useRenderAvatar = createUseRender<AvatarOptions>(renderAvatar);

/**
 * Render a full-body front view to a canvas element.
 */
export const useRenderSkinFront = createUseRender<SkinViewOptions>(renderSkinFront);

/**
 * Render a full-body back view to a canvas element.
 */
export const useRenderSkinBack = createUseRender<SkinViewOptions>(renderSkinBack);

/**
 * Render a full-body side view to a canvas element.
 */
export const useRenderSkinSide = createUseRender<SkinViewOptions>(renderSkinSide);

/**
 * Render a 2.5D isometric view to a canvas element.
 */
export const useRenderSkinIsometric = createUseRender<IsometricOptions>(renderSkinIsometric);

/**
 * Render a half-body portrait (head + torso + arms) to a canvas element.
 */
export const useRenderHalfBody = createUseRender<HalfBodyOptions>(renderHalfBody);

/**
 * Render a big-head (Q-version) style view to a canvas element.
 */
export const useRenderBigHead = createUseRender<BigHeadOptions>(renderBigHead);
