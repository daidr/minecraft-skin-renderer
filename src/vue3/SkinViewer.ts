import { defineComponent, h, watch } from "vue";
import type { PropType } from "vue";
import type { PartsVisibility } from "../model/types";
import type { BackendType } from "../core/renderer/types";
import type { AnyRegistrablePlugin } from "../core/renderer/registry";
import type { BackEquipment } from "../viewer";
import type { TextureSource } from "../texture";
import { useSkinViewer } from "./useSkinViewer";

/**
 * Props-driven 3D skin viewer component.
 *
 * Renders a container div that hosts the WebGL/WebGPU canvas.
 * All viewer options are controlled via props and synced reactively.
 *
 * @example
 * ```ts
 * import { SkinViewer } from '@daidr/minecraft-skin-renderer/vue3'
 *
 * // In template: <SkinViewer :skin="skinUrl" :slim="true" animation="walk" />
 * ```
 */
export const SkinViewer = defineComponent({
  name: "SkinViewer",
  props: {
    plugins: { type: Array as PropType<AnyRegistrablePlugin[]>, default: undefined },
    skin: { type: [String, Object] as PropType<TextureSource>, default: undefined },
    cape: { type: [String, Object, null] as PropType<TextureSource | null>, default: undefined },
    slim: { type: Boolean, default: false },
    backEquipment: { type: String as PropType<BackEquipment>, default: "none" },
    preferredBackend: { type: String as PropType<BackendType | "auto">, default: "auto" },
    zoom: { type: Number, default: undefined },
    autoRotate: { type: Boolean, default: false },
    autoRotateSpeed: { type: Number, default: undefined },
    enableRotate: { type: Boolean, default: true },
    enableZoom: { type: Boolean, default: true },
    animation: { type: String as PropType<string | null>, default: undefined },
    animationSpeed: { type: Number, default: 1 },
    animationAmplitude: { type: Number, default: 1 },
    partsVisibility: { type: Object as PropType<PartsVisibility>, default: undefined },
    panorama: { type: [String, Object, null] as PropType<TextureSource | null>, default: undefined },
    pixelRatio: { type: Number, default: undefined },
    antialias: { type: Boolean, default: true },
    fov: { type: Number, default: undefined },
  },
  emits: ["ready", "error"],
  setup(props, { emit, expose }) {
    const { containerRef, viewer, backend, isReady, error, screenshot, recreate } = useSkinViewer(
      () => ({
        plugins: props.plugins,
        skin: props.skin,
        cape: props.cape,
        slim: props.slim,
        backEquipment: props.backEquipment,
        preferredBackend: props.preferredBackend,
        zoom: props.zoom,
        autoRotate: props.autoRotate,
        autoRotateSpeed: props.autoRotateSpeed,
        enableRotate: props.enableRotate,
        enableZoom: props.enableZoom,
        animation: props.animation,
        animationSpeed: props.animationSpeed,
        animationAmplitude: props.animationAmplitude,
        partsVisibility: props.partsVisibility,
        panorama: props.panorama,
        pixelRatio: props.pixelRatio,
        antialias: props.antialias,
        fov: props.fov,
      }),
    );

    watch(isReady, (ready) => {
      if (ready && viewer.value) {
        emit("ready", viewer.value);
      }
    });

    watch(error, (err) => {
      if (err) {
        emit("error", err);
      }
    });

    expose({ viewer, backend, screenshot, recreate });

    return () =>
      h("div", {
        ref: containerRef,
        style: { width: "100%", height: "100%", position: "relative" },
      });
  },
});
