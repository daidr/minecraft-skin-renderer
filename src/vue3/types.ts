import type { ComputedRef, Ref, ShallowRef } from "vue";
import type { BackendType } from "../core/renderer/types";
import type { AnyRegistrablePlugin } from "../core/renderer/registry";
import type { PartsVisibility } from "../model/types";
import type { BackEquipment, SkinViewer } from "../viewer";
import type { TextureSource } from "../texture";

/** Options for the `useSkinViewer` composable */
export interface UseSkinViewerOptions {
  /**
   * Plugins to register before creating the viewer.
   * Each plugin is registered via `use()` automatically.
   *
   * @example
   * ```ts
   * import { WebGLRendererPlugin } from '@daidr/minecraft-skin-renderer/webgl'
   * import { PanoramaPlugin } from '@daidr/minecraft-skin-renderer/panorama'
   *
   * useSkinViewer(() => ({
   *   plugins: [WebGLRendererPlugin, PanoramaPlugin],
   *   skin: 'https://example.com/skin.png',
   * }))
   * ```
   */
  plugins?: AnyRegistrablePlugin[];
  /** Preferred renderer backend. Default: `'auto'` */
  preferredBackend?: BackendType | "auto";
  /** Enable antialiasing. Default: `true` */
  antialias?: boolean;
  /** Device pixel ratio override */
  pixelRatio?: number;
  /** Camera field of view in degrees */
  fov?: number;
  /** Skin texture source (URL string, Blob, HTMLImageElement, or ImageBitmap) */
  skin?: TextureSource;
  /** Cape texture source, or `null` to hide cape */
  cape?: TextureSource | null;
  /** Whether to use slim (3px) arm model. Default: `false` */
  slim?: boolean;
  /** Back equipment to display. Default: `'none'` */
  backEquipment?: BackEquipment;
  /** Camera zoom distance */
  zoom?: number;
  /** Enable mouse rotation control. Default: `true` */
  enableRotate?: boolean;
  /** Enable mouse zoom control. Default: `true` */
  enableZoom?: boolean;
  /** Enable auto-rotation. Default: `false` */
  autoRotate?: boolean;
  /** Auto-rotation speed */
  autoRotateSpeed?: number;
  /** Animation name to play, or `null` to stop */
  animation?: string | null;
  /** Animation playback speed multiplier. Default: `1` */
  animationSpeed?: number;
  /** Animation motion amplitude multiplier. Default: `1` */
  animationAmplitude?: number;
  /** Per-part layer visibility */
  partsVisibility?: PartsVisibility;
  /** Panorama background texture source, or `null` to clear. Requires PanoramaPlugin. */
  panorama?: TextureSource | null;
}

/** Emits definition for the `SkinViewer` component */
export type SkinViewerEmits = {
  /** Fired when the viewer has been successfully initialized */
  ready: (viewer: SkinViewer) => void;
  /** Fired on initialization or runtime error */
  error: (error: Error) => void;
};

/** Return type of `useSkinViewer` */
export interface UseSkinViewerReturn {
  /** Template ref to bind on a container element */
  containerRef: Ref<HTMLElement | null>;
  /** The SkinViewer instance (shallowRef, `null` before initialization) */
  viewer: ShallowRef<SkinViewer | null>;
  /** Current renderer backend, `null` before initialization */
  backend: ComputedRef<BackendType | null>;
  /** Whether the viewer has been successfully initialized */
  isReady: Ref<boolean>;
  /** Initialization or runtime error, `null` if none */
  error: ShallowRef<Error | null>;
  /** Take a screenshot of the current frame */
  screenshot: (type?: "png" | "jpeg", quality?: number) => string | null;
  /** Destroy and recreate the viewer (e.g. after backend change) */
  recreate: () => Promise<void>;
}
