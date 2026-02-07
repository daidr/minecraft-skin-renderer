/**
 * Main SkinViewer implementation
 *
 * This module provides the public API for the Minecraft skin viewer.
 * It orchestrates the rendering subsystems while delegating specific concerns to:
 * - ResourceManager: GPU resource lifecycle
 * - BoneMatrixComputer: Skeleton matrix calculations
 * - RenderState: Pre-allocated render objects
 */

import { createCamera, setCameraAspect } from "../core/camera/Camera";
import type { Camera } from "../core/camera/Camera";
import {
  createOrbitControls,
  getOrbitDistance,
  getOrbitRotation,
  resetOrbitControls,
  setOrbitDistance,
  setOrbitRotation,
  updateOrbitControls,
} from "../core/camera/OrbitControls";
import type { OrbitControls } from "../core/camera/OrbitControls";
import { BufferUsage, TextureFilter, isWebGPUSupported } from "../core/renderer/types";
import type { BackendType, BindGroup, IBuffer, IPipeline, IRenderer, ITexture } from "../core/renderer/types";
import { getRendererPlugin, getRegisteredBackends } from "../core/renderer/registry";
import { PART_NAMES, createDefaultVisibility } from "../model/types";
import type {
  BoxGeometry,
  ModelVariant,
  PlayerSkeleton,
  PartName,
  PartsVisibility,
} from "../model/types";
import { createPlayerSkeleton, resetSkeleton } from "../model/PlayerModel";
import { loadSkinTexture, loadCapeTexture, createPlaceholderTexture } from "../texture";
import type { TextureSource } from "../texture";
import { createRenderLoop, startRenderLoop, stopRenderLoop } from "./RenderLoop";
import type { RenderLoop } from "./RenderLoop";
import type { AnimationConfig, AnimationController } from "../animation/types";
import {
  createAnimationController,
  updateAnimationController,
} from "../animation/AnimationController";
import type { BackgroundRenderer } from "../core/plugins/types";
import { getBackgroundPlugin } from "../core/plugins/registry";

// Import refactored modules
import {
  createAllPartGeometries,
  createAllPartBuffers,
  disposeAllPartBuffers,
  createCapeGeometry,
  createElytraGeometry,
  createPipelines,
} from "./ResourceManager";
import type { PartBuffers, PartGeometry } from "./ResourceManager";
import { computeBoneMatrices } from "./BoneMatrixComputer";
import { createRenderBindGroups } from "./RenderState";
import type { RenderBindGroups } from "./RenderState";

/** Panorama plugin not registered warning */
const PANORAMA_WARN =
  "PanoramaPlugin is not registered. Import and use() it to enable panorama backgrounds:\n" +
  "  import { PanoramaPlugin } from 'minecraft-skin-renderer/panorama'\n" +
  "  use(PanoramaPlugin)";

/** Back equipment type (cape, elytra, or none) */
export type BackEquipment = "cape" | "elytra" | "none";

/** SkinViewer options */
export interface SkinViewerOptions {
  canvas: HTMLCanvasElement;
  preferredBackend?: BackendType | "auto";
  antialias?: boolean;
  pixelRatio?: number;
  skin?: TextureSource;
  /** Cape texture (64x32 format). Used for both cape and elytra if elytra texture is not provided. */
  cape?: TextureSource;
  /** Back equipment to display: 'cape', 'elytra', or 'none'. Default: 'none' unless cape is provided. */
  backEquipment?: BackEquipment;
  slim?: boolean;
  fov?: number;
  zoom?: number;
  enableRotate?: boolean;
  enableZoom?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  /**
   * Panorama background. Requires PanoramaPlugin to be registered.
   * Provide a URL or TextureSource for an equirectangular panorama image.
   */
  panorama?: TextureSource;
}

/** SkinViewer interface */
export interface SkinViewer {
  setSkin(source: TextureSource | null): Promise<void>;
  /**
   * Set the cape texture (64x32 format).
   * This texture is used for both cape and elytra display.
   */
  setCape(source: TextureSource | null): Promise<void>;
  setSlim(slim: boolean): void;

  /**
   * Set which back equipment to display.
   * @param equipment - 'cape' for cape, 'elytra' for elytra wings, 'none' to hide
   */
  setBackEquipment(equipment: BackEquipment): void;
  /** Get the current back equipment setting */
  readonly backEquipment: BackEquipment;

  /**
   * Get the current parts visibility settings
   */
  getPartsVisibility(): PartsVisibility;

  /**
   * Set visibility for all parts at once
   */
  setPartsVisibility(visibility: PartsVisibility): void;

  /**
   * Set visibility for a specific part
   * @param part - The part name (head, body, leftArm, rightArm, leftLeg, rightLeg)
   * @param layer - The layer to modify ('inner', 'outer', or 'both')
   * @param visible - Whether the layer should be visible
   */
  setPartVisibility(part: PartName, layer: "inner" | "outer" | "both", visible: boolean): void;

  playAnimation(name: string, config?: AnimationConfig): void;
  pauseAnimation(): void;
  resumeAnimation(): void;
  stopAnimation(): void;

  setRotation(theta: number, phi: number): void;
  getRotation(): { theta: number; phi: number };
  setZoom(zoom: number): void;
  getZoom(): number;
  setAutoRotate(enabled: boolean): void;
  resetCamera(): void;

  render(): void;
  startRenderLoop(): void;
  stopRenderLoop(): void;
  resize(width: number, height: number): void;

  screenshot(type?: "png" | "jpeg", quality?: number): string;

  /**
   * Set panorama background. Requires PanoramaPlugin to be registered.
   * @param source - Panorama texture source, or null to clear
   */
  setPanorama(source: TextureSource | null): Promise<void>;

  readonly isPlaying: boolean;
  readonly currentAnimation: string | null;
  readonly backend: BackendType;

  dispose(): void;
}

/** Internal SkinViewer state */
interface SkinViewerState {
  renderer: IRenderer;
  camera: Camera;
  controls: OrbitControls;
  renderLoop: RenderLoop;
  animationController: AnimationController;

  skeleton: PlayerSkeleton;
  variant: ModelVariant;

  // GPU resources - pipelines
  skinPipeline: IPipeline;
  overlayPipeline: IPipeline;
  capePipeline: IPipeline;

  // GPU resources - part buffers
  partBuffers: Record<PartName, PartBuffers>;

  // GPU resources - cape/elytra
  capeVertexBuffer: IBuffer;
  capeIndexBuffer: IBuffer;
  capeGeometry: BoxGeometry;
  elytraVertexBuffer: IBuffer;
  elytraIndexBuffer: IBuffer;
  elytraGeometry: BoxGeometry;

  // Textures
  skinTexture: ITexture | null;
  capeTexture: ITexture | null;

  // Geometry data
  partGeometries: Record<PartName, PartGeometry>;

  // Visibility and equipment
  partsVisibility: PartsVisibility;
  backEquipment: BackEquipment;

  // Performance optimization: bone matrix cache
  boneMatricesCache: Float32Array;
  boneMatricesDirty: boolean;

  // Performance optimization: pre-allocated render objects (from RenderState module)
  renderBindGroups: RenderBindGroups;

  // Background state
  backgroundRenderer: BackgroundRenderer | null;

  // State flags
  disposed: boolean;
}

/**
 * Create a SkinViewer
 */
export async function createSkinViewer(options: SkinViewerOptions): Promise<SkinViewer> {
  const canvas = options.canvas;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  const variant: ModelVariant = options.slim ? "slim" : "classic";

  // Determine and create renderer based on preferred backend
  const preferredBackend = options.preferredBackend ?? "auto";
  const registeredBackends = getRegisteredBackends();

  if (registeredBackends.length === 0) {
    throw new Error(
      "No renderer registered. Please register a renderer using use():\n" +
        "  import { use } from 'minecraft-skin-renderer'\n" +
        "  import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'\n" +
        "  use(WebGLRendererPlugin)",
    );
  }

  // Determine which backend to use (prefer WebGPU if available)
  const targetBackend: BackendType =
    preferredBackend !== "auto"
      ? preferredBackend
      : getRendererPlugin("webgpu") && isWebGPUSupported()
        ? "webgpu"
        : getRendererPlugin("webgl")
          ? "webgl"
          : registeredBackends[0];

  const plugin = getRendererPlugin(targetBackend);
  if (!plugin) {
    throw new Error(
      `Renderer "${targetBackend}" is not registered. Available: [${registeredBackends.join(", ")}]\n` +
        `Please register it using use():\n` +
        `  import { ${targetBackend === "webgpu" ? "WebGPURendererPlugin" : "WebGLRendererPlugin"} } from 'minecraft-skin-renderer/${targetBackend}'\n` +
        `  use(${targetBackend === "webgpu" ? "WebGPURendererPlugin" : "WebGLRendererPlugin"})`,
    );
  }

  const rendererOptions = {
    canvas,
    antialias: options.antialias ?? true,
    pixelRatio: options.pixelRatio,
    preserveDrawingBuffer: true,
  };

  let renderer: IRenderer;
  try {
    renderer = await plugin.createRenderer(rendererOptions);
  } catch (e) {
    // Try fallback to other registered backend
    const fb = registeredBackends.find((b) => b !== targetBackend);
    const fbPlugin = fb && getRendererPlugin(fb);
    if (!fbPlugin) throw e;
    console.warn(`${targetBackend} initialization failed, falling back to ${fb}:`, e);
    renderer = await fbPlugin.createRenderer(rendererOptions);
  }

  renderer.resize(width, height);

  // Create camera
  const aspect = width / height;
  const camera = createCamera(aspect, {
    fov: options.fov ?? 70,
    position: [0, 16, 50],
    target: [0, 12, 0],
  });

  // Create orbit controls
  const controls = createOrbitControls(camera, canvas, {
    enableRotate: options.enableRotate ?? true,
    enableZoom: options.enableZoom ?? true,
    autoRotate: options.autoRotate ?? false,
    autoRotateSpeed: options.autoRotateSpeed ?? 30.0,
    minDistance: 20,
    maxDistance: 150,
  });

  if (options.zoom !== undefined) {
    setOrbitDistance(controls, options.zoom);
  }

  // Create skeleton
  const skeleton = createPlayerSkeleton(variant);

  // Create geometry for all parts (using ResourceManager)
  const partGeometries = createAllPartGeometries(variant);

  // Create pipelines (using ResourceManager)
  const { skinPipeline, overlayPipeline, capePipeline } = createPipelines(renderer);

  // Create buffers for all parts
  const partBuffers = createAllPartBuffers(renderer, partGeometries);

  // Create cape geometry and buffers
  const capeGeometry = createCapeGeometry();
  const capeVertexBuffer = renderer.createBuffer(BufferUsage.Vertex, capeGeometry.vertices);
  const capeIndexBuffer = renderer.createBuffer(BufferUsage.Index, capeGeometry.indices);

  // Create elytra geometry and buffers
  const elytraGeometry = createElytraGeometry();
  const elytraVertexBuffer = renderer.createBuffer(BufferUsage.Vertex, elytraGeometry.vertices);
  const elytraIndexBuffer = renderer.createBuffer(BufferUsage.Index, elytraGeometry.indices);

  // Load initial skin texture (fallback to placeholder)
  let skinBitmap: ImageBitmap;
  try {
    skinBitmap = options.skin
      ? await loadSkinTexture(options.skin)
      : await createPlaceholderTexture();
  } catch {
    skinBitmap = await createPlaceholderTexture();
  }
  const texOpts = { magFilter: TextureFilter.Linear, minFilter: TextureFilter.Linear };
  let skinTexture: ITexture | null = await renderer.createTexture(skinBitmap, texOpts);

  // Create animation controller
  const animationController = createAnimationController(skeleton);

  // Load initial cape texture if provided
  let capeTexture: ITexture | null = null;
  if (options.cape) {
    try {
      const bitmap = await loadCapeTexture(options.cape);
      capeTexture = await renderer.createTexture(bitmap, texOpts);
    } catch {
      // Cape texture failed to load, continue without it
    }
  }

  // Determine initial back equipment
  let initialBackEquipment: BackEquipment = options.backEquipment ?? "none";
  if (initialBackEquipment === "none" && capeTexture) {
    initialBackEquipment = "cape"; // Default to cape if texture is provided but no explicit setting
  }

  // Pre-allocate render objects to avoid GC pressure (using RenderState module)
  const renderBindGroups = createRenderBindGroups();

  // Create state object
  const state: SkinViewerState = {
    renderer,
    camera,
    controls,
    renderLoop: null as unknown as RenderLoop,
    animationController,
    skeleton,
    variant,
    skinPipeline,
    overlayPipeline,
    capePipeline,
    partBuffers,
    capeVertexBuffer,
    capeIndexBuffer,
    capeGeometry,
    elytraVertexBuffer,
    elytraIndexBuffer,
    elytraGeometry,
    skinTexture,
    capeTexture,
    partGeometries,
    partsVisibility: createDefaultVisibility(),
    backEquipment: initialBackEquipment,
    boneMatricesCache: new Float32Array(24 * 16),
    boneMatricesDirty: true,
    renderBindGroups,
    backgroundRenderer: null,
    disposed: false,
  };

  // Initialize panorama background if plugin is registered and source provided
  if (options.panorama) {
    const panoramaPlugin = getBackgroundPlugin("panorama");
    if (panoramaPlugin) {
      state.backgroundRenderer = panoramaPlugin.createRenderer(renderer);
      // Load panorama asynchronously (don't await to avoid blocking)
      state.backgroundRenderer.setSource(options.panorama).catch((e) => {
        console.warn("Failed to load panorama:", e);
      });
    } else {
      console.warn(PANORAMA_WARN);
    }
  }

  // Render function
  const doRender = () => {
    if (state.disposed) return;

    const {
      renderer,
      camera,
      skinPipeline,
      overlayPipeline,
      capePipeline,
      partBuffers,
      capeVertexBuffer,
      capeIndexBuffer,
      elytraVertexBuffer,
      elytraIndexBuffer,
      skinTexture,
      capeTexture,
      partsVisibility,
      backEquipment,
    } = state;

    renderer.beginFrame();
    renderer.clear(0, 0, 0, 0);

    // Render background first (if available)
    if (state.backgroundRenderer) {
      state.backgroundRenderer.render(camera);
    }

    if (skinTexture) {
      // Compute bone matrices only if dirty
      if (state.boneMatricesDirty) {
        const newMatrices = computeBoneMatrices(state.skeleton);
        state.boneMatricesCache.set(newMatrices);
        state.boneMatricesDirty = false;
      }

      // Update pre-allocated bind groups (using RenderState module)
      const { renderBindGroups } = state;
      renderBindGroups.uniforms.u_viewMatrix = camera.viewMatrix;
      renderBindGroups.uniforms.u_projectionMatrix = camera.projectionMatrix;
      renderBindGroups.uniforms["u_boneMatrices[0]"] = state.boneMatricesCache;
      renderBindGroups.skinTextures.u_skinTexture = skinTexture;

      // Helper to issue a draw call
      const draw = (pl: IPipeline, vb: IBuffer, ib: IBuffer, ic: number, bg: BindGroup) => {
        renderer.draw({ pipeline: pl, vertexBuffers: [vb], indexBuffer: ib, indexCount: ic, bindGroup: bg });
      };

      // Draw each part based on visibility settings
      for (const partName of PART_NAMES) {
        const visibility = partsVisibility[partName];
        const buffers = partBuffers[partName];
        if (visibility.inner) draw(skinPipeline, buffers.innerVertexBuffer, buffers.innerIndexBuffer, buffers.innerIndexCount, renderBindGroups.skinBindGroup);
        if (visibility.outer) draw(overlayPipeline, buffers.outerVertexBuffer, buffers.outerIndexBuffer, buffers.outerIndexCount, renderBindGroups.skinBindGroup);
      }

      // Draw cape or elytra if texture is available and equipment is enabled
      if (capeTexture && backEquipment !== "none") {
        renderBindGroups.capeTextures.u_skinTexture = capeTexture;
        const isCape = backEquipment === "cape";
        draw(
          capePipeline,
          isCape ? capeVertexBuffer : elytraVertexBuffer,
          isCape ? capeIndexBuffer : elytraIndexBuffer,
          (isCape ? state.capeGeometry : state.elytraGeometry).indexCount,
          renderBindGroups.capeBindGroup,
        );
      }
    }

    renderer.endFrame();
  };

  // Update function
  const doUpdate = (deltaTime: number) => {
    if (state.disposed) return;

    updateOrbitControls(state.controls, deltaTime);
    updateAnimationController(state.animationController, deltaTime);

    // Mark bone matrices as dirty if animation is playing
    if (state.animationController.isPlaying) {
      state.boneMatricesDirty = true;
    }
  };

  // Create render loop
  state.renderLoop = createRenderLoop(doUpdate, doRender);

  // Create viewer interface
  const viewer: SkinViewer = {
    get backend() {
      return state.renderer.backend;
    },

    get isPlaying() {
      return state.animationController.isPlaying;
    },

    get currentAnimation() {
      return state.animationController.currentAnimation;
    },

    async setSkin(source: TextureSource | null) {
      if (state.disposed) return;

      if (state.skinTexture) {
        state.skinTexture.dispose();
        state.skinTexture = null;
      }

      if (source) {
        const bitmap = await loadSkinTexture(source);
        state.skinTexture = await state.renderer.createTexture(bitmap, texOpts);
      }
    },

    async setCape(source: TextureSource | null) {
      if (state.disposed) return;

      if (state.capeTexture) {
        state.capeTexture.dispose();
        state.capeTexture = null;
      }

      if (source) {
        const bitmap = await loadCapeTexture(source);
        state.capeTexture = await state.renderer.createTexture(bitmap, texOpts);
        // Auto-enable cape display if not already showing something
        if (state.backEquipment === "none") {
          state.backEquipment = "cape";
        }
      } else {
        // Hide back equipment if cape texture is removed
        state.backEquipment = "none";
      }
    },

    setBackEquipment(equipment: BackEquipment) {
      state.backEquipment = equipment;
    },

    get backEquipment() {
      return state.backEquipment;
    },

    getPartsVisibility(): PartsVisibility {
      // Return a deep copy to prevent external mutation
      const result = {} as PartsVisibility;
      for (const part of PART_NAMES) {
        result[part] = { ...state.partsVisibility[part] };
      }
      return result;
    },

    setPartsVisibility(visibility: PartsVisibility) {
      for (const part of PART_NAMES) {
        state.partsVisibility[part] = { ...visibility[part] };
      }
    },

    setPartVisibility(part: PartName, layer: "inner" | "outer" | "both", visible: boolean) {
      if (layer === "both") {
        state.partsVisibility[part].inner = visible;
        state.partsVisibility[part].outer = visible;
      } else {
        state.partsVisibility[part][layer] = visible;
      }
    },

    setSlim(slim: boolean) {
      if (state.disposed) return;

      const newVariant = slim ? "slim" : "classic";
      if (newVariant === state.variant) return;

      // Remember current animation state
      const currentAnimation = state.animationController.currentAnimation;
      const wasPlaying = state.animationController.isPlaying;
      const wasPaused = state.animationController.isPaused;

      state.variant = newVariant;

      // Recreate skeleton
      state.skeleton = createPlayerSkeleton(newVariant);

      // Recreate animation controller with new skeleton
      state.animationController = createAnimationController(state.skeleton);

      // Restore animation state
      if (currentAnimation && wasPlaying) {
        state.animationController.play(currentAnimation);
        if (wasPaused) {
          state.animationController.pause();
        }
      }

      // Dispose old buffers
      disposeAllPartBuffers(state.partBuffers);

      // Recreate geometry and buffers
      state.partGeometries = createAllPartGeometries(newVariant);
      state.partBuffers = createAllPartBuffers(state.renderer, state.partGeometries);

      // Mark bone matrices as dirty
      state.boneMatricesDirty = true;
    },

    playAnimation(name: string, config?: AnimationConfig) {
      state.animationController.play(name, config);
    },

    pauseAnimation() {
      state.animationController.pause();
    },

    resumeAnimation() {
      state.animationController.resume();
    },

    stopAnimation() {
      state.animationController.stop();
      resetSkeleton(state.skeleton);
      state.boneMatricesDirty = true;
    },

    setRotation(theta: number, phi: number) {
      setOrbitRotation(state.controls, theta, phi);
    },

    getRotation() {
      return getOrbitRotation(state.controls);
    },

    setZoom(zoom: number) {
      setOrbitDistance(state.controls, zoom);
    },

    getZoom() {
      return getOrbitDistance(state.controls);
    },

    setAutoRotate(enabled: boolean) {
      state.controls.autoRotate = enabled;
    },

    resetCamera() {
      resetOrbitControls(state.controls);
    },

    render: doRender,

    startRenderLoop: () => startRenderLoop(state.renderLoop),

    stopRenderLoop: () => stopRenderLoop(state.renderLoop),

    resize(width: number, height: number) {
      if (state.disposed) return;

      state.renderer.resize(width, height);
      setCameraAspect(state.camera, width / height);
    },

    screenshot(type = "png" as const, quality = 0.92) {
      doRender();
      return canvas.toDataURL(`image/${type}`, quality);
    },

    async setPanorama(source: TextureSource | null) {
      if (state.disposed) return;

      // Clear existing background
      if (state.backgroundRenderer) {
        state.backgroundRenderer.dispose();
        state.backgroundRenderer = null;
      }

      if (source === null) {
        return;
      }

      // Get panorama plugin
      const panoramaPlugin = getBackgroundPlugin("panorama");
      if (!panoramaPlugin) {
        console.warn(PANORAMA_WARN);
        return;
      }

      // Create and set up new background renderer
      state.backgroundRenderer = panoramaPlugin.createRenderer(renderer);
      await state.backgroundRenderer.setSource(source);
    },

    dispose() {
      if (state.disposed) return;
      state.disposed = true;

      stopRenderLoop(state.renderLoop);
      state.controls.dispose();

      // Dispose all part buffers
      disposeAllPartBuffers(state.partBuffers);

      // Dispose pipelines, buffers, textures, and background
      for (const r of [
        state.skinPipeline, state.overlayPipeline, state.capePipeline,
        state.capeVertexBuffer, state.capeIndexBuffer,
        state.elytraVertexBuffer, state.elytraIndexBuffer,
        state.skinTexture, state.capeTexture, state.backgroundRenderer,
      ]) r?.dispose();

      state.renderer.dispose();
    },
  };

  return viewer;
}
