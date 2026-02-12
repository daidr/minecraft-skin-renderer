import { computed, onMounted, onUnmounted, ref, shallowRef, toValue, watch } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { use, createSkinViewer, PART_NAMES } from "../index";
import type { BackEquipment, SkinViewer } from "../viewer";
import type { PartName } from "../model/types";
import type { UseSkinViewerOptions, UseSkinViewerReturn } from "./types";

/**
 * Low-level composable for creating and managing a SkinViewer instance.
 *
 * Returns a `containerRef` that should be bound to a container element in your template.
 * The composable creates a canvas inside the container and initializes the viewer on mount.
 *
 * Dynamic options (skin, cape, slim, zoom, animation, etc.) are watched and synced
 * to the viewer automatically. Creation-time options (preferredBackend, antialias, fov,
 * enableRotate, enableZoom, autoRotateSpeed, pixelRatio) are only applied at initialization.
 * Call `recreate()` to re-initialize with updated creation-time options.
 *
 * @example
 * ```ts
 * const { containerRef, viewer, isReady } = useSkinViewer(() => ({
 *   skin: skinUrl.value,
 *   slim: isSlim.value,
 *   animation: 'walk',
 * }))
 * ```
 */
export function useSkinViewer(
  options?: MaybeRefOrGetter<UseSkinViewerOptions>,
): UseSkinViewerReturn {
  const containerRef = ref<HTMLElement | null>(null);
  const viewer = shallowRef<SkinViewer | null>(null);
  const isReady = ref(false);
  const error = shallowRef<Error | null>(null);

  const backend = computed(() => viewer.value?.backend ?? null);

  let resizeObserver: ResizeObserver | null = null;
  let canvas: HTMLCanvasElement | null = null;

  async function init() {
    const container = containerRef.value;
    if (!container) return;

    dispose();

    const opts = toValue(options) ?? {};

    if (opts.plugins) {
      for (const plugin of opts.plugins) {
        use(plugin);
      }
    }

    canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(canvas);

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * (opts.pixelRatio ?? devicePixelRatio);
    canvas.height = rect.height * (opts.pixelRatio ?? devicePixelRatio);

    try {
      const v = await createSkinViewer({
        canvas,
        skin: opts.skin,
        cape: opts.cape === null ? undefined : opts.cape,
        preferredBackend: opts.preferredBackend ?? "auto",
        antialias: opts.antialias ?? true,
        pixelRatio: opts.pixelRatio,
        fov: opts.fov,
        slim: opts.slim,
        zoom: opts.zoom,
        enableRotate: opts.enableRotate ?? true,
        enableZoom: opts.enableZoom ?? true,
        autoRotate: opts.autoRotate,
        autoRotateSpeed: opts.autoRotateSpeed,
        panorama: opts.panorama ?? undefined,
      });

      viewer.value = v;
      isReady.value = true;
      error.value = null;

      if (opts.backEquipment) {
        v.setBackEquipment(opts.backEquipment);
      }

      if (opts.partsVisibility) {
        v.setPartsVisibility(opts.partsVisibility);
      }

      if (opts.animation) {
        v.playAnimation(opts.animation, {
          speed: opts.animationSpeed,
          amplitude: opts.animationAmplitude,
        });
      }

      v.startRenderLoop();
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      isReady.value = false;
    }
  }

  function dispose() {
    if (viewer.value) {
      viewer.value.dispose();
      viewer.value = null;
      isReady.value = false;
    }
  }

  function screenshot(type?: "png" | "jpeg", quality?: number): string | null {
    return viewer.value?.screenshot(type, quality) ?? null;
  }

  async function recreate(): Promise<void> {
    await init();
  }

  // --- Dynamic property watchers ---

  watch(
    () => toValue(options)?.skin,
    async (newSkin) => {
      if (!viewer.value || newSkin === undefined) return;
      try {
        await viewer.value.setSkin(newSkin ?? null);
      } catch (e) {
        console.error("Failed to update skin:", e);
      }
    },
  );

  watch(
    () => toValue(options)?.cape,
    async (newCape) => {
      if (!viewer.value || newCape === undefined) return;
      try {
        await viewer.value.setCape(newCape);
      } catch (e) {
        console.error("Failed to update cape:", e);
      }
    },
  );

  watch(
    () => toValue(options)?.slim,
    (slim) => {
      if (viewer.value && slim !== undefined) {
        viewer.value.setSlim(slim);
      }
    },
  );

  watch(
    () => toValue(options)?.backEquipment,
    (equipment) => {
      if (viewer.value && equipment !== undefined) {
        viewer.value.setBackEquipment(equipment as BackEquipment);
      }
    },
  );

  watch(
    () => toValue(options)?.zoom,
    (zoom) => {
      if (viewer.value && zoom !== undefined) {
        viewer.value.setZoom(zoom);
      }
    },
  );

  watch(
    () => toValue(options)?.autoRotate,
    (autoRotate) => {
      if (viewer.value && autoRotate !== undefined) {
        viewer.value.setAutoRotate(autoRotate);
      }
    },
  );

  watch(
    () => {
      const opts = toValue(options);
      return [opts?.animation, opts?.animationSpeed, opts?.animationAmplitude] as const;
    },
    ([animation, speed, amplitude]) => {
      if (!viewer.value) return;
      if (animation === undefined) return;
      if (animation === null || animation === "") {
        viewer.value.stopAnimation();
      } else {
        viewer.value.playAnimation(animation, { speed, amplitude });
      }
    },
  );

  watch(
    () => toValue(options)?.partsVisibility,
    (visibility) => {
      if (!viewer.value || !visibility) return;
      for (const part of PART_NAMES) {
        const v = visibility[part];
        if (v) {
          viewer.value.setPartVisibility(part as PartName, "inner", v.inner);
          viewer.value.setPartVisibility(part as PartName, "outer", v.outer);
        }
      }
    },
    { deep: true },
  );

  watch(
    () => toValue(options)?.panorama,
    async (newPanorama) => {
      if (!viewer.value || newPanorama === undefined) return;
      try {
        await viewer.value.setPanorama(newPanorama);
      } catch (e) {
        console.error("Failed to update panorama:", e);
      }
    },
  );

  // --- Lifecycle ---

  onMounted(async () => {
    await init();

    if (containerRef.value) {
      resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) return;
        const { width, height } = entry.contentRect;
        const opts = toValue(options) ?? {};
        const ratio = opts.pixelRatio ?? devicePixelRatio;
        if (canvas) {
          canvas.width = width * ratio;
          canvas.height = height * ratio;
        }
        viewer.value?.resize(width, height);
      });
      resizeObserver.observe(containerRef.value);
    }
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    dispose();
  });

  return {
    containerRef,
    viewer,
    backend,
    isReady,
    error,
    screenshot,
    recreate,
  };
}
