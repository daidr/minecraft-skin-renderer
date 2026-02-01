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
} from "../core/renderer/types";
import type { BackendType, IBuffer, IPipeline, IRenderer, ITexture } from "../core/renderer/types";
import { createWebGLRenderer } from "../core/renderer/webgl";
import { SKIN_FRAGMENT_SHADER, SKIN_VERTEX_SHADER } from "../core/renderer/webgl/shaders";
import { BoneIndex, VERTEX_STRIDE } from "../model/types";
import type { BoxGeometry, ModelVariant, PlayerSkeleton } from "../model/types";
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

  readonly isPlaying: boolean;
  readonly currentAnimation: string | null;
  readonly backend: BackendType;

  dispose(): void;
}

/** Separated geometry for inner and overlay parts */
interface SeparatedGeometry {
  inner: BoxGeometry;
  overlay: BoxGeometry;
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

  // GPU resources - inner parts (with backface culling)
  skinPipeline: IPipeline;
  skinVertexBuffer: IBuffer;
  skinIndexBuffer: IBuffer;

  // GPU resources - overlay parts (double-sided, no culling)
  overlayPipeline: IPipeline;
  overlayVertexBuffer: IBuffer;
  overlayIndexBuffer: IBuffer;

  // GPU resources - cape (double-sided)
  capePipeline: IPipeline;
  capeVertexBuffer: IBuffer;
  capeIndexBuffer: IBuffer;
  capeGeometry: BoxGeometry;

  // GPU resources - elytra (double-sided)
  elytraVertexBuffer: IBuffer;
  elytraIndexBuffer: IBuffer;
  elytraGeometry: BoxGeometry;

  skinTexture: ITexture | null;
  /** Cape texture used for both cape and elytra */
  capeTexture: ITexture | null;

  // Geometry data
  skinGeometry: SeparatedGeometry;

  // Back equipment state
  backEquipment: BackEquipment;

  // State flags
  disposed: boolean;
}

/**
 * Create the player skin geometry (separated into inner and overlay parts)
 * Inner parts use backface culling, overlay parts are double-sided
 */
function createSkinGeometry(variant: ModelVariant): SeparatedGeometry {
  const uvMap = getSkinUV(variant);
  const armWidth = variant === "slim" ? 3 : 4;
  const innerGeometries: BoxGeometry[] = [];
  const overlayGeometries: BoxGeometry[] = [];

  // Head (inner)
  innerGeometries.push(createBoxGeometry([8, 8, 8], uvMap.head.inner, BoneIndex.Head, [0, 4, 0]));

  // Head overlay (double-sided)
  overlayGeometries.push(
    createBoxGeometry([8, 8, 8], uvMap.head.outer, BoneIndex.HeadOverlay, [0, 4, 0], 0.5),
  );

  // Body (inner)
  innerGeometries.push(createBoxGeometry([8, 12, 4], uvMap.body.inner, BoneIndex.Body, [0, -6, 0]));

  // Body overlay (double-sided)
  overlayGeometries.push(
    createBoxGeometry([8, 12, 4], uvMap.body.outer, BoneIndex.BodyOverlay, [0, -6, 0], 0.25),
  );

  // Right Arm (inner)
  innerGeometries.push(
    createBoxGeometry([armWidth, 12, 4], uvMap.rightArm.inner, BoneIndex.RightArm, [0, -6, 0]),
  );

  // Right Arm overlay (double-sided)
  overlayGeometries.push(
    createBoxGeometry(
      [armWidth, 12, 4],
      uvMap.rightArm.outer,
      BoneIndex.RightArmOverlay,
      [0, -6, 0],
      0.25,
    ),
  );

  // Left Arm (inner)
  innerGeometries.push(
    createBoxGeometry([armWidth, 12, 4], uvMap.leftArm.inner, BoneIndex.LeftArm, [0, -6, 0]),
  );

  // Left Arm overlay (double-sided)
  overlayGeometries.push(
    createBoxGeometry(
      [armWidth, 12, 4],
      uvMap.leftArm.outer,
      BoneIndex.LeftArmOverlay,
      [0, -6, 0],
      0.25,
    ),
  );

  // Right Leg (inner)
  innerGeometries.push(
    createBoxGeometry([4, 12, 4], uvMap.rightLeg.inner, BoneIndex.RightLeg, [0, -6, 0]),
  );

  // Right Leg overlay (double-sided)
  overlayGeometries.push(
    createBoxGeometry(
      [4, 12, 4],
      uvMap.rightLeg.outer,
      BoneIndex.RightLegOverlay,
      [0, -6, 0],
      0.25,
    ),
  );

  // Left Leg (inner)
  innerGeometries.push(
    createBoxGeometry([4, 12, 4], uvMap.leftLeg.inner, BoneIndex.LeftLeg, [0, -6, 0]),
  );

  // Left Leg overlay (double-sided)
  overlayGeometries.push(
    createBoxGeometry([4, 12, 4], uvMap.leftLeg.outer, BoneIndex.LeftLegOverlay, [0, -6, 0], 0.25),
  );

  return {
    inner: mergeGeometries(innerGeometries),
    overlay: mergeGeometries(overlayGeometries),
  };
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
    // 1. Translate to bone position (relative to parent)
    // 2. Apply rotation around pivot point
    const pos = bone.position;
    const pivot = bone.pivot;

    // Local transform: translate to position, then rotate around pivot
    let localMatrix = mat4Identity();

    // Translate to bone position
    localMatrix = mat4Translate(localMatrix, pos);

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

  // Create renderer
  const renderer = createWebGLRenderer({
    canvas,
    antialias: options.antialias ?? true,
    pixelRatio: options.pixelRatio,
    preserveDrawingBuffer: true,
  });

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

  // Create geometry
  const skinGeometry = createSkinGeometry(variant);

  // Vertex layout shared by both pipelines
  const vertexLayout = {
    stride: VERTEX_STRIDE * 4, // bytes
    attributes: [
      { name: "a_position", location: 0, format: VertexFormat.Float32x3, offset: 0 },
      { name: "a_uv", location: 1, format: VertexFormat.Float32x2, offset: 12 },
      { name: "a_normal", location: 2, format: VertexFormat.Float32x3, offset: 20 },
      { name: "a_boneIndex", location: 3, format: VertexFormat.Float32, offset: 32 },
    ],
  };

  // Create pipeline for inner parts (with backface culling)
  const skinPipeline = renderer.createPipeline({
    vertexShader: SKIN_VERTEX_SHADER,
    fragmentShader: SKIN_FRAGMENT_SHADER,
    vertexLayout,
    cullMode: CullMode.Back,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  // Create pipeline for overlay parts (double-sided, no culling)
  const overlayPipeline = renderer.createPipeline({
    vertexShader: SKIN_VERTEX_SHADER,
    fragmentShader: SKIN_FRAGMENT_SHADER,
    vertexLayout,
    cullMode: CullMode.None,
    blendMode: BlendMode.Alpha,
    depthWrite: true,
    depthCompare: DepthCompare.Less,
  });

  // Create buffers for inner parts
  const skinVertexBuffer = renderer.createBuffer(BufferUsage.Vertex, skinGeometry.inner.vertices);
  const skinIndexBuffer = renderer.createBuffer(BufferUsage.Index, skinGeometry.inner.indices);

  // Create buffers for overlay parts
  const overlayVertexBuffer = renderer.createBuffer(
    BufferUsage.Vertex,
    skinGeometry.overlay.vertices,
  );
  const overlayIndexBuffer = renderer.createBuffer(BufferUsage.Index, skinGeometry.overlay.indices);

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
    vertexShader: SKIN_VERTEX_SHADER,
    fragmentShader: SKIN_FRAGMENT_SHADER,
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
      const placeholder = createPlaceholderTexture();
      skinTexture = await renderer.createTexture(placeholder);
    }
  } else {
    // Create placeholder texture
    const placeholder = createPlaceholderTexture();
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
    skinVertexBuffer,
    skinIndexBuffer,
    overlayPipeline,
    overlayVertexBuffer,
    overlayIndexBuffer,
    capePipeline,
    capeVertexBuffer,
    capeIndexBuffer,
    capeGeometry,
    elytraVertexBuffer,
    elytraIndexBuffer,
    elytraGeometry,
    skinTexture,
    capeTexture,
    skinGeometry,
    backEquipment: initialBackEquipment,
    disposed: false,
  };

  // Render function
  const doRender = () => {
    if (state.disposed) return;

    const {
      renderer,
      camera,
      skinPipeline,
      skinVertexBuffer,
      skinIndexBuffer,
      overlayPipeline,
      overlayVertexBuffer,
      overlayIndexBuffer,
      capePipeline,
      capeVertexBuffer,
      capeIndexBuffer,
      elytraVertexBuffer,
      elytraIndexBuffer,
      skinTexture,
      capeTexture,
      backEquipment,
    } = state;

    renderer.beginFrame();
    renderer.clear(0, 0, 0, 0);

    if (skinTexture) {
      // Compute bone matrices
      const boneMatrices = computeBoneMatrices(state.skeleton);

      // Model matrix (identity for now)
      const modelMatrix = mat4Identity();

      // Common bind group uniforms
      const uniforms = {
        u_modelMatrix: modelMatrix,
        u_viewMatrix: camera.viewMatrix,
        u_projectionMatrix: camera.projectionMatrix,
        "u_boneMatrices[0]": boneMatrices,
        u_alphaTest: 0.01,
      };

      const textures = {
        u_skinTexture: skinTexture,
      };

      // Draw inner parts first (with backface culling)
      renderer.draw({
        pipeline: skinPipeline,
        vertexBuffers: [skinVertexBuffer],
        indexBuffer: skinIndexBuffer,
        indexCount: state.skinGeometry.inner.indexCount,
        bindGroup: { uniforms, textures },
      });

      // Draw overlay parts (double-sided, no culling)
      renderer.draw({
        pipeline: overlayPipeline,
        vertexBuffers: [overlayVertexBuffer],
        indexBuffer: overlayIndexBuffer,
        indexCount: state.skinGeometry.overlay.indexCount,
        bindGroup: { uniforms, textures },
      });

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

      // Recreate geometry
      const newGeometry = createSkinGeometry(newVariant);
      state.skinGeometry = newGeometry;

      // Update inner part buffers
      state.skinVertexBuffer.dispose();
      state.skinIndexBuffer.dispose();

      state.skinVertexBuffer = state.renderer.createBuffer(
        BufferUsage.Vertex,
        newGeometry.inner.vertices,
      );
      state.skinIndexBuffer = state.renderer.createBuffer(
        BufferUsage.Index,
        newGeometry.inner.indices,
      );

      // Update overlay part buffers
      state.overlayVertexBuffer.dispose();
      state.overlayIndexBuffer.dispose();

      state.overlayVertexBuffer = state.renderer.createBuffer(
        BufferUsage.Vertex,
        newGeometry.overlay.vertices,
      );
      state.overlayIndexBuffer = state.renderer.createBuffer(
        BufferUsage.Index,
        newGeometry.overlay.indices,
      );
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

    dispose() {
      if (state.disposed) return;
      state.disposed = true;

      stopRenderLoop(state.renderLoop);
      state.controls.dispose();

      // Dispose inner part resources
      state.skinVertexBuffer.dispose();
      state.skinIndexBuffer.dispose();
      state.skinPipeline.dispose();

      // Dispose overlay part resources
      state.overlayVertexBuffer.dispose();
      state.overlayIndexBuffer.dispose();
      state.overlayPipeline.dispose();

      if (state.skinTexture) state.skinTexture.dispose();
      if (state.capeTexture) state.capeTexture.dispose();

      // Dispose cape/elytra resources
      state.capeVertexBuffer.dispose();
      state.capeIndexBuffer.dispose();
      state.elytraVertexBuffer.dispose();
      state.elytraIndexBuffer.dispose();
      state.capePipeline.dispose();

      state.renderer.dispose();
    },
  };

  return viewer;
}
