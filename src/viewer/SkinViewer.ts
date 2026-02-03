/**
 * Main SkinViewer implementation
 */

import { mat4Identity, mat4Multiply, mat4Translate, quatToMat4 } from "../core/math";
import type { Mat4 } from "../core/math";
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
import {
  BlendMode,
  BufferUsage,
  CullMode,
  DepthCompare,
  VertexFormat,
  isWebGPUSupported,
} from "../core/renderer/types";
import type {
  BackendType,
  IBuffer,
  IPipeline,
  IRenderer,
  ITexture,
  UniformValue,
} from "../core/renderer/types";
import { getRendererPlugin, getRegisteredBackends } from "../core/renderer/registry";
import { BoneIndex, PART_NAMES, VERTEX_STRIDE, createDefaultVisibility } from "../model/types";
import type {
  BoxGeometry,
  ModelVariant,
  PlayerSkeleton,
  PartName,
  PartsVisibility,
} from "../model/types";
import { createPlayerSkeleton, resetSkeleton } from "../model/PlayerModel";
import {
  createBoxGeometry,
  createCapeBoxGeometry,
  mergeGeometries,
} from "../model/geometry/BoxGeometry";
import { getSkinUV } from "../model/uv/SkinUV";
import { getCapeUV, getElytraUV } from "../model/uv/CapeUV";
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

/** Geometry for a single part with inner and outer layers */
interface PartGeometry {
  inner: BoxGeometry;
  outer: BoxGeometry;
}

/** GPU buffers for a single part */
interface PartBuffers {
  innerVertexBuffer: IBuffer;
  innerIndexBuffer: IBuffer;
  outerVertexBuffer: IBuffer;
  outerIndexBuffer: IBuffer;
  innerIndexCount: number;
  outerIndexCount: number;
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
  skinPipeline: IPipeline; // inner parts (with backface culling)
  overlayPipeline: IPipeline; // overlay parts (double-sided, no culling)
  capePipeline: IPipeline; // cape/elytra (double-sided)

  // GPU resources - part buffers (each part has inner and outer)
  partBuffers: Record<PartName, PartBuffers>;

  // GPU resources - cape
  capeVertexBuffer: IBuffer;
  capeIndexBuffer: IBuffer;
  capeGeometry: BoxGeometry;

  // GPU resources - elytra
  elytraVertexBuffer: IBuffer;
  elytraIndexBuffer: IBuffer;
  elytraGeometry: BoxGeometry;

  skinTexture: ITexture | null;
  /** Cape texture used for both cape and elytra */
  capeTexture: ITexture | null;

  // Geometry data
  partGeometries: Record<PartName, PartGeometry>;

  // Parts visibility
  partsVisibility: PartsVisibility;

  // Back equipment state
  backEquipment: BackEquipment;

  // Performance optimization: bone matrix cache
  boneMatricesCache: Float32Array;
  boneMatricesDirty: boolean;

  // Background state (only used if a background plugin is registered)
  backgroundRenderer: BackgroundRenderer | null;

  // State flags
  disposed: boolean;
}

/**
 * Create geometry for all parts (separated by part and layer)
 */
function createAllPartGeometries(variant: ModelVariant): Record<PartName, PartGeometry> {
  const uvMap = getSkinUV(variant);
  const armWidth = variant === "slim" ? 3 : 4;

  return {
    head: {
      inner: createBoxGeometry([8, 8, 8], uvMap.head.inner, BoneIndex.Head, [0, 4, 0]),
      outer: createBoxGeometry([8, 8, 8], uvMap.head.outer, BoneIndex.HeadOverlay, [0, 4, 0], 0.5),
    },
    body: {
      inner: createBoxGeometry([8, 12, 4], uvMap.body.inner, BoneIndex.Body, [0, -6, 0]),
      outer: createBoxGeometry(
        [8, 12, 4],
        uvMap.body.outer,
        BoneIndex.BodyOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    rightArm: {
      inner: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.rightArm.inner,
        BoneIndex.RightArm,
        [0, -6, 0],
      ),
      outer: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.rightArm.outer,
        BoneIndex.RightArmOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    leftArm: {
      inner: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.leftArm.inner,
        BoneIndex.LeftArm,
        [0, -6, 0],
      ),
      outer: createBoxGeometry(
        [armWidth, 12, 4],
        uvMap.leftArm.outer,
        BoneIndex.LeftArmOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    rightLeg: {
      inner: createBoxGeometry([4, 12, 4], uvMap.rightLeg.inner, BoneIndex.RightLeg, [0, -6, 0]),
      outer: createBoxGeometry(
        [4, 12, 4],
        uvMap.rightLeg.outer,
        BoneIndex.RightLegOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
    leftLeg: {
      inner: createBoxGeometry([4, 12, 4], uvMap.leftLeg.inner, BoneIndex.LeftLeg, [0, -6, 0]),
      outer: createBoxGeometry(
        [4, 12, 4],
        uvMap.leftLeg.outer,
        BoneIndex.LeftLegOverlay,
        [0, -6, 0],
        0.25,
      ),
    },
  };
}

/**
 * Create GPU buffers for a part geometry
 */
function createPartBuffers(renderer: IRenderer, geometry: PartGeometry): PartBuffers {
  return {
    innerVertexBuffer: renderer.createBuffer(BufferUsage.Vertex, geometry.inner.vertices),
    innerIndexBuffer: renderer.createBuffer(BufferUsage.Index, geometry.inner.indices),
    outerVertexBuffer: renderer.createBuffer(BufferUsage.Vertex, geometry.outer.vertices),
    outerIndexBuffer: renderer.createBuffer(BufferUsage.Index, geometry.outer.indices),
    innerIndexCount: geometry.inner.indexCount,
    outerIndexCount: geometry.outer.indexCount,
  };
}

/**
 * Create GPU buffers for all parts
 */
function createAllPartBuffers(
  renderer: IRenderer,
  geometries: Record<PartName, PartGeometry>,
): Record<PartName, PartBuffers> {
  const result = {} as Record<PartName, PartBuffers>;
  for (const part of PART_NAMES) {
    result[part] = createPartBuffers(renderer, geometries[part]);
  }
  return result;
}

/**
 * Dispose all part buffers
 */
function disposeAllPartBuffers(buffers: Record<PartName, PartBuffers>): void {
  for (const part of PART_NAMES) {
    const b = buffers[part];
    b.innerVertexBuffer.dispose();
    b.innerIndexBuffer.dispose();
    b.outerVertexBuffer.dispose();
    b.outerIndexBuffer.dispose();
  }
}

/**
 * Create cape geometry
 * Cape: 10 wide, 16 tall, 1 deep, attached to Cape bone
 * Cape hangs down from attachment point at neck
 */
function createCapeGeometry(): BoxGeometry {
  const capeUV = getCapeUV();
  // Cape hangs down from the top
  // Offset: y=-8 so top of cape (y=+8 from center) is at bone origin (y=0)
  // z=-0.5 to position cape slightly behind the attachment point
  return createCapeBoxGeometry([10, 16, 1], capeUV, BoneIndex.Cape, [0, -8, -0.5]);
}

/**
 * Create elytra geometry (both wings merged)
 * Based on skinview3d: each wing pivots from attachment point
 * Geometry: 12 wide, 22 tall, 4 deep (actual mesh size)
 * UV mapping: 10 wide, 20 tall, 2 deep (texture layout)
 *
 * In skinview3d:
 * - Left wing: pivot at x=5, mesh offset (-5, -10, -1), no scale
 * - Right wing: pivot at x=-5, mesh offset (-5, -10, -1) with scale.x=-1
 *
 * Note: In our coordinate system when viewed from behind:
 * - Positive X = screen right = player's left
 * - Negative X = screen left = player's right
 */
function createElytraGeometry(): BoxGeometry {
  const elytraUV = getElytraUV();

  // Left wing (player's left = screen right when viewed from behind)
  // Bone at x=+5, wing extends towards center
  // No mirror - uses original geometry orientation (like skinview3d)
  const leftWing = createCapeBoxGeometry(
    [12, 22, 4], // Geometry size
    elytraUV,
    BoneIndex.LeftWing,
    [-5, -10, -1], // Wing offset from pivot
    false, // No mirror (skinview3d has no scale on left wing)
  );

  // Right wing (player's right = screen left when viewed from behind)
  // Bone at x=-5, wing extends towards center
  // Mirror to match skinview3d's scale.x=-1
  const rightWing = createCapeBoxGeometry(
    [12, 22, 4], // Same geometry size
    elytraUV,
    BoneIndex.RightWing,
    [-5, -10, -1], // Same offset
    true, // Mirror X (simulates skinview3d's scale.x=-1)
  );

  return mergeGeometries([leftWing, rightWing]);
}

/**
 * Compute bone matrices for the skeleton
 */
function computeBoneMatrices(skeleton: PlayerSkeleton): Float32Array {
  const matrices = new Float32Array(24 * 16); // 24 bones, 16 floats each

  // Helper to set matrix for bone index
  const setMatrix = (index: number, matrix: Mat4) => {
    matrices.set(matrix, index * 16);
  };

  // Initialize all matrices to identity
  for (let i = 0; i < 24; i++) {
    setMatrix(i, mat4Identity());
  }

  // Compute world matrices for each bone
  const worldMatrices = new Map<BoneIndex, Mat4>();

  // Process bones in parent-first order
  const boneOrder = [
    BoneIndex.Root,
    BoneIndex.Body,
    BoneIndex.Head,
    BoneIndex.RightArm,
    BoneIndex.LeftArm,
    BoneIndex.RightLeg,
    BoneIndex.LeftLeg,
    BoneIndex.HeadOverlay,
    BoneIndex.BodyOverlay,
    BoneIndex.RightArmOverlay,
    BoneIndex.LeftArmOverlay,
    BoneIndex.RightLegOverlay,
    BoneIndex.LeftLegOverlay,
    // Cape and elytra bones (attached to body)
    BoneIndex.Cape,
    BoneIndex.LeftWing,
    BoneIndex.RightWing,
  ];

  for (const boneIndex of boneOrder) {
    const bone = skeleton.bones.get(boneIndex);
    if (!bone) continue;

    // Get parent matrix
    let parentMatrix = mat4Identity();
    if (bone.parentIndex !== null) {
      parentMatrix = worldMatrices.get(bone.parentIndex) ?? mat4Identity();
    }

    // Compute local matrix:
    // 1. Translate to bone position (relative to parent) + animation offset
    // 2. Apply rotation around pivot point
    const pos = bone.position;
    const offset = bone.positionOffset;
    const pivot = bone.pivot;

    // Local transform: translate to position, then rotate around pivot
    let localMatrix = mat4Identity();

    // Translate to bone position + animation offset
    localMatrix = mat4Translate(localMatrix, [
      pos[0] + offset[0],
      pos[1] + offset[1],
      pos[2] + offset[2],
    ]);

    // Translate to pivot, rotate, translate back
    localMatrix = mat4Translate(localMatrix, pivot);
    localMatrix = mat4Multiply(localMatrix, quatToMat4(bone.rotation));
    localMatrix = mat4Translate(localMatrix, [-pivot[0], -pivot[1], -pivot[2]]);

    // Compute world matrix
    const worldMatrix = mat4Multiply(parentMatrix, localMatrix);
    worldMatrices.set(boneIndex, worldMatrix);

    // Store in uniform buffer
    setMatrix(boneIndex, worldMatrix);
  }

  return matrices;
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

  // Determine which backend to use
  let targetBackend: BackendType;
  if (preferredBackend === "auto") {
    // Prefer WebGPU if registered and supported, otherwise use first registered backend
    if (getRendererPlugin("webgpu") && isWebGPUSupported()) {
      targetBackend = "webgpu";
    } else if (getRendererPlugin("webgl")) {
      targetBackend = "webgl";
    } else {
      targetBackend = registeredBackends[0];
    }
  } else {
    targetBackend = preferredBackend;
  }

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
    const fallbackBackend = registeredBackends.find((b) => b !== targetBackend);
    if (fallbackBackend) {
      const fallbackPlugin = getRendererPlugin(fallbackBackend);
      if (fallbackPlugin) {
        console.warn(
          `${targetBackend} initialization failed, falling back to ${fallbackBackend}:`,
          e,
        );
        renderer = await fallbackPlugin.createRenderer(rendererOptions);
      } else {
        throw e;
      }
    } else {
      throw e;
    }
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

  // Create geometry for all parts
  const partGeometries = createAllPartGeometries(variant);

  // Vertex layout shared by all pipelines
  const vertexLayout = {
    stride: VERTEX_STRIDE * 4, // bytes
    attributes: [
      { name: "a_position", location: 0, format: VertexFormat.Float32x3, offset: 0 },
      { name: "a_uv", location: 1, format: VertexFormat.Float32x2, offset: 12 },
      { name: "a_normal", location: 2, format: VertexFormat.Float32x3, offset: 20 },
      { name: "a_boneIndex", location: 3, format: VertexFormat.Float32, offset: 32 },
    ],
  };

  // Get shaders from the active plugin
  const activePlugin = getRendererPlugin(renderer.backend)!;
  const shaders = activePlugin.shaders;
  const vertexShader = shaders.vertex;
  const fragmentShader = shaders.fragment;

  // Create pipeline for inner parts (with backface culling)
  const skinPipeline = renderer.createPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout,
    cullMode: CullMode.Back,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  // Create pipeline for overlay parts (double-sided, no culling)
  const overlayPipeline = renderer.createPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout,
    cullMode: CullMode.None,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

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

  // Create pipeline for cape/elytra (double-sided, no culling)
  const capePipeline = renderer.createPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout,
    cullMode: CullMode.None,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  // Load initial skin texture
  let skinTexture: ITexture | null = null;
  if (options.skin) {
    try {
      const bitmap = await loadSkinTexture(options.skin);
      skinTexture = await renderer.createTexture(bitmap);
    } catch {
      // Use placeholder
      const placeholder = await createPlaceholderTexture();
      skinTexture = await renderer.createTexture(placeholder);
    }
  } else {
    // Create placeholder texture
    const placeholder = await createPlaceholderTexture();
    skinTexture = await renderer.createTexture(placeholder);
  }

  // Create animation controller
  const animationController = createAnimationController(skeleton);

  // Load initial cape texture if provided
  let capeTexture: ITexture | null = null;
  if (options.cape) {
    try {
      const bitmap = await loadCapeTexture(options.cape);
      capeTexture = await renderer.createTexture(bitmap);
    } catch {
      // Cape texture failed to load, continue without it
    }
  }

  // Determine initial back equipment
  let initialBackEquipment: BackEquipment = options.backEquipment ?? "none";
  if (initialBackEquipment === "none" && capeTexture) {
    initialBackEquipment = "cape"; // Default to cape if texture is provided but no explicit setting
  }

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
      console.warn(
        "PanoramaPlugin is not registered. Import and use() it to enable panorama backgrounds:\n" +
          "  import { PanoramaPlugin } from 'minecraft-skin-renderer/panorama'\n" +
          "  use(PanoramaPlugin)",
      );
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
      const boneMatrices = state.boneMatricesCache;

      // Model matrix (identity for now)
      const modelMatrix = mat4Identity();

      // Common bind group uniforms
      const uniforms: Record<string, UniformValue> = {
        u_modelMatrix: modelMatrix,
        u_viewMatrix: camera.viewMatrix,
        u_projectionMatrix: camera.projectionMatrix,
        "u_boneMatrices[0]": boneMatrices,
        u_alphaTest: 0.01,
      };

      const textures = {
        u_skinTexture: skinTexture,
      };

      // Draw each part based on visibility settings
      for (const partName of PART_NAMES) {
        const visibility = partsVisibility[partName];
        const buffers = partBuffers[partName];

        // Draw inner layer if visible
        if (visibility.inner) {
          renderer.draw({
            pipeline: skinPipeline,
            vertexBuffers: [buffers.innerVertexBuffer],
            indexBuffer: buffers.innerIndexBuffer,
            indexCount: buffers.innerIndexCount,
            bindGroup: { uniforms, textures },
          });
        }

        // Draw outer layer if visible
        if (visibility.outer) {
          renderer.draw({
            pipeline: overlayPipeline,
            vertexBuffers: [buffers.outerVertexBuffer],
            indexBuffer: buffers.outerIndexBuffer,
            indexCount: buffers.outerIndexCount,
            bindGroup: { uniforms, textures },
          });
        }
      }

      // Draw cape or elytra if texture is available and equipment is enabled
      if (capeTexture && backEquipment !== "none") {
        const capeTextures = {
          u_skinTexture: capeTexture,
        };

        if (backEquipment === "cape") {
          // Draw cape
          renderer.draw({
            pipeline: capePipeline,
            vertexBuffers: [capeVertexBuffer],
            indexBuffer: capeIndexBuffer,
            indexCount: state.capeGeometry.indexCount,
            bindGroup: { uniforms, textures: capeTextures },
          });
        } else if (backEquipment === "elytra") {
          // Draw elytra wings
          renderer.draw({
            pipeline: capePipeline,
            vertexBuffers: [elytraVertexBuffer],
            indexBuffer: elytraIndexBuffer,
            indexCount: state.elytraGeometry.indexCount,
            bindGroup: { uniforms, textures: capeTextures },
          });
        }
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
        state.skinTexture = await state.renderer.createTexture(bitmap);
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
        state.capeTexture = await state.renderer.createTexture(bitmap);
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

    render() {
      doRender();
    },

    startRenderLoop() {
      startRenderLoop(state.renderLoop);
    },

    stopRenderLoop() {
      stopRenderLoop(state.renderLoop);
    },

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
        console.warn(
          "PanoramaPlugin is not registered. Import and use() it to enable panorama backgrounds:\n" +
            "  import { PanoramaPlugin } from 'minecraft-skin-renderer/panorama'\n" +
            "  use(PanoramaPlugin)",
        );
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
      state.skinPipeline.dispose();
      state.overlayPipeline.dispose();

      if (state.skinTexture) state.skinTexture.dispose();
      if (state.capeTexture) state.capeTexture.dispose();

      // Dispose cape/elytra resources
      state.capeVertexBuffer.dispose();
      state.capeIndexBuffer.dispose();
      state.elytraVertexBuffer.dispose();
      state.elytraIndexBuffer.dispose();
      state.capePipeline.dispose();

      // Dispose background renderer
      if (state.backgroundRenderer) {
        state.backgroundRenderer.dispose();
        state.backgroundRenderer = null;
      }

      state.renderer.dispose();
    },
  };

  return viewer;
}
