/**
 * Gaze controller
 *
 * Makes the rendered player follow the mouse cursor:
 * - The head turns towards the pointer within anatomical limits.
 * - Once the required head yaw exceeds those limits, the whole body (root bone)
 *   rotates by the remaining angle, keeping the posture natural.
 *
 * The controller is deliberately split into a pure math part
 * ({@link computeGazePose}) and a stateful, DOM-aware part
 * ({@link createGazeController}) so the pose maths can be tested in isolation.
 */

import { clamp, degToRad, quatClone, quatEquals, quatFromEuler, quatMultiply } from "../core/math";
import type { Quat } from "../core/math";
import type { Camera } from "../core/camera/Camera";
import { BoneIndex } from "../model/types";
import type { Bone, PlayerSkeleton } from "../model/types";

/** Tuning options for mouse gaze tracking */
export interface GazeOptions {
  /** Maximum head yaw relative to the body, in degrees. Default: `55` */
  maxHeadYaw?: number;
  /** Maximum head pitch (up/down), in degrees. Default: `30` */
  maxHeadPitch?: number;
  /** Maximum body yaw relative to the default pose, in degrees. Default: `75` */
  maxBodyYaw?: number;
  /** Gaze yaw when the pointer is at the maximum horizontal offset from the head, in degrees. Default: `100` */
  yawRange?: number;
  /** Gaze pitch when the pointer is at the maximum vertical offset from the head, in degrees. Default: `32` */
  pitchRange?: number;
  /** Exponential smoothing time constant in seconds. Set to `0` to disable smoothing. Default: `0.12` */
  smoothing?: number;
  /**
   * Element that receives pointer events.
   * - `"window"`: the pointer is tracked anywhere on the page (default)
   * - `"canvas"`: tracking is limited to the canvas area
   */
  scope?: "window" | "canvas";
}

/** Gaze options with every field resolved to a concrete value */
export type ResolvedGazeOptions = Required<GazeOptions>;

/** Default gaze options */
export const DEFAULT_GAZE_OPTIONS: ResolvedGazeOptions = {
  maxHeadYaw: 55,
  maxHeadPitch: 30,
  maxBodyYaw: 75,
  yawRange: 100,
  pitchRange: 32,
  smoothing: 0.12,
  scope: "window",
};

/** Gaze pose in radians */
export interface GazePose {
  /** Body (root bone) yaw relative to the default pose */
  bodyYaw: number;
  /** Head yaw relative to the body */
  headYaw: number;
  /** Head pitch around the local X axis (negative = looking up) */
  headPitch: number;
}

/** Head centre in model space (model units, Y up) */
const HEAD_CENTRE: [number, number, number] = [0, 28, 0];

/**
 * Project the head centre to normalized device coordinates.
 *
 * The pointer offsets are measured from this point so pointing at the head
 * gives a neutral gaze instead of tilting it towards the screen centre.
 *
 * @param camera - Camera used for the frame
 * @returns Normalized screen position of the head, `-1` to `1` on both axes
 */
export function computeHeadNdc(camera: Camera): { x: number; y: number } {
  const m = camera.viewProjectionMatrix;
  const [x, y, z] = HEAD_CENTRE;

  const clipX = m[0] * x + m[4] * y + m[8] * z + m[12];
  const clipY = m[1] * x + m[5] * y + m[9] * z + m[13];
  const clipW = m[3] * x + m[7] * y + m[11] * z + m[15];

  if (Math.abs(clipW) < 1e-6) return { x: 0, y: 0 };
  return { x: clipX / clipW, y: clipY / clipW };
}

/**
 * Compute the target gaze pose for a pointer position.
 *
 * @param pointerX - Horizontal pointer offset from the canvas centre, `-1` (left) to `1` (right)
 * @param pointerY - Vertical pointer offset from the canvas centre, `-1` (bottom) to `1` (top)
 * @param cameraYaw - Orbit controls horizontal angle (radians)
 * @param cameraPolar - Orbit controls vertical angle (radians, `PI / 2` = level)
 * @param options - Resolved gaze options
 * @returns Target gaze pose, split between body and head
 */
export function computeGazePose(
  pointerX: number,
  pointerY: number,
  cameraYaw: number,
  cameraPolar: number,
  options: ResolvedGazeOptions = DEFAULT_GAZE_OPTIONS,
): GazePose {
  const nx = clamp(pointerX, -1, 1);
  const ny = clamp(pointerY, -1, 1);

  // Camera basis derived from the orbit angles.
  const sinPolar = Math.sin(cameraPolar);
  const cosPolar = Math.cos(cameraPolar);
  const sinYaw = Math.sin(cameraYaw);
  const cosYaw = Math.cos(cameraYaw);

  // Camera forward (from camera towards the model)
  const fx = -sinPolar * sinYaw;
  const fy = -cosPolar;
  const fz = -sinPolar * cosYaw;
  // Camera right
  const rx = cosYaw;
  const rz = -sinYaw;
  // Camera up (right x forward)
  const ux = -sinYaw * cosPolar;
  const uy = sinPolar;
  const uz = -cosYaw * cosPolar;

  const yawOffset = nx * degToRad(options.yawRange);
  const pitchOffset = ny * degToRad(options.pitchRange);
  const cosYawOffset = Math.cos(yawOffset);
  const sinYawOffset = Math.sin(yawOffset);
  const cosPitch = Math.cos(pitchOffset);
  const sinPitch = Math.sin(pitchOffset);

  // Start from looking at the viewer, then sweep towards the pointer.
  const dx = (-fx * cosYawOffset + rx * sinYawOffset) * cosPitch + ux * sinPitch;
  const dy = -fy * cosYawOffset * cosPitch + uy * sinPitch;
  const dz = (-fz * cosYawOffset + rz * sinYawOffset) * cosPitch + uz * sinPitch;

  const targetYaw = Math.atan2(dx, dz);
  const targetPitch = -Math.asin(clamp(dy, -1, 1));

  // Split the requested yaw: the head turns first, the body follows the excess.
  const headLimit = degToRad(options.maxHeadYaw);
  const bodyLimit = degToRad(options.maxBodyYaw);
  const bodyYaw = clamp(targetYaw - clamp(targetYaw, -headLimit, headLimit), -bodyLimit, bodyLimit);
  const headYaw = clamp(targetYaw - bodyYaw, -headLimit, headLimit);
  const pitchLimit = degToRad(options.maxHeadPitch);

  return {
    bodyYaw,
    headYaw,
    headPitch: clamp(targetPitch, -pitchLimit, pitchLimit),
  };
}

/** Gaze controller instance */
export interface GazeController {
  /** Whether pointer tracking is enabled */
  readonly enabled: boolean;
  /**
   * Enable or disable pointer tracking.
   * Disabling restores the pose that was modified by the controller.
   */
  setEnabled(enabled: boolean): void;
  /** Merge new tuning options, applied immediately */
  setOptions(options: GazeOptions): void;
  /**
   * Apply the current gaze pose to the skeleton.
   *
   * Must run after the animation controller has updated the skeleton and before
   * bone matrices are computed.
   *
   * @param camera - Current camera, used to map pointer coordinates to model space
   * @returns `true` when the pose changed and bone matrices need recomputing
   */
  update(skeleton: PlayerSkeleton, deltaTime: number, camera: Camera): boolean;
  /** Forget the applied pose without restoring it (used when the skeleton is replaced) */
  forget(): void;
  /** Remove listeners and restore the modified pose */
  dispose(): void;
}

/** Internal controller state */
interface ControllerState {
  enabled: boolean;
  options: ResolvedGazeOptions;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  bodyYaw: number;
  headYaw: number;
  headPitch: number;
  applied: boolean;
  skeleton: PlayerSkeleton | null;
  headBase: Quat | null;
  headApplied: Quat | null;
  rootBase: Quat | null;
  rootApplied: Quat | null;
  detach: (() => void) | null;
}

/** Smooth a value towards a target. */
function approach(current: number, target: number, t: number): number {
  const next = current + (target - current) * t;
  return Math.abs(target - next) < 1e-5 ? target : next;
}

/** Whether a rotation around Y (and optionally X) is close enough to identity. */
function isNeutralAngle(yaw: number, pitch = 0): boolean {
  return Math.abs(yaw) < 1e-6 && Math.abs(pitch) < 1e-6;
}

/**
 * Create a gaze controller driven by pointer events.
 *
 * @param canvas - Canvas used to map pointer coordinates to the rendered area
 * @param options - Initial tuning options
 */
export function createGazeController(
  canvas: HTMLCanvasElement,
  options: GazeOptions = {},
): GazeController {
  const state: ControllerState = {
    enabled: false,
    options: { ...DEFAULT_GAZE_OPTIONS, ...options },
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    bodyYaw: 0,
    headYaw: 0,
    headPitch: 0,
    applied: false,
    skeleton: null,
    headBase: null,
    headApplied: null,
    rootBase: null,
    rootApplied: null,
    detach: null,
  };

  const view = canvas.ownerDocument?.defaultView ?? null;

  const onPointerMove = (event: PointerEvent) => {
    if (!state.enabled) return;
    // Touch and pen drags are used for camera orbiting, not for gazing.
    if (event.pointerType && event.pointerType !== "mouse") return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    state.pointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    state.pointerY = clamp(1 - ((event.clientY - rect.top) / rect.height) * 2, -1, 1);
    state.pointerActive = true;
  };

  const onPointerLeave = () => {
    state.pointerActive = false;
  };

  const attach = () => {
    if (state.detach || !view) return;

    if (state.options.scope === "canvas") {
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerLeave);
      state.detach = () => {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
      };
      return;
    }

    view.addEventListener("pointermove", onPointerMove, { passive: true });
    view.addEventListener("blur", onPointerLeave);
    view.document.addEventListener("mouseleave", onPointerLeave);
    state.detach = () => {
      view.removeEventListener("pointermove", onPointerMove);
      view.removeEventListener("blur", onPointerLeave);
      view.document.removeEventListener("mouseleave", onPointerLeave);
    };
  };

  const detach = () => {
    state.detach?.();
    state.detach = null;
  };

  /** Recover the pose that existed before the controller touched the bone. */
  const resolveBase = (bone: Bone, applied: Quat | null, base: Quat | null): Quat => {
    if (state.applied && applied && quatEquals(bone.rotation, applied)) {
      return quatClone(base ?? bone.rotation);
    }
    return quatClone(bone.rotation);
  };

  const restore = () => {
    const skeleton = state.skeleton;
    if (state.applied && skeleton) {
      const head = skeleton.bones.get(BoneIndex.Head);
      if (
        head &&
        state.headApplied &&
        state.headBase &&
        quatEquals(head.rotation, state.headApplied)
      ) {
        head.rotation = state.headBase;
      }
      const root = skeleton.bones.get(BoneIndex.Root);
      if (
        root &&
        state.rootApplied &&
        state.rootBase &&
        quatEquals(root.rotation, state.rootApplied)
      ) {
        root.rotation = state.rootBase;
      }
    }

    state.applied = false;
    state.skeleton = null;
    state.headBase = null;
    state.headApplied = null;
    state.rootBase = null;
    state.rootApplied = null;
    state.pointerX = 0;
    state.pointerY = 0;
    state.pointerActive = false;
    state.bodyYaw = 0;
    state.headYaw = 0;
    state.headPitch = 0;
  };

  return {
    get enabled() {
      return state.enabled;
    },

    setEnabled(enabled: boolean) {
      if (enabled === state.enabled) return;

      if (enabled) {
        state.enabled = true;
        attach();
      } else {
        restore();
        detach();
        state.enabled = false;
      }
    },

    setOptions(options: GazeOptions) {
      const previousScope = state.options.scope;
      state.options = { ...state.options, ...options };
      if (state.enabled && previousScope !== state.options.scope) {
        detach();
        attach();
      }
    },

    update(skeleton, deltaTime, camera) {
      if (!state.enabled) return false;

      state.skeleton = skeleton;

      // Derive the orbit angles from the camera itself so the gaze always
      // matches what is actually rendered.
      const relX = camera.position[0] - camera.target[0];
      const relY = camera.position[1] - camera.target[1];
      const relZ = camera.position[2] - camera.target[2];
      const distance = Math.hypot(relX, relY, relZ);
      const cameraYaw = Math.atan2(relX, relZ);
      const cameraPolar = distance > 0 ? Math.acos(clamp(relY / distance, -1, 1)) : Math.PI / 2;

      const headNdc = computeHeadNdc(camera);
      const pointerX = state.pointerActive ? state.pointerX - headNdc.x : 0;
      const pointerY = state.pointerActive ? state.pointerY - headNdc.y : 0;

      const target = computeGazePose(pointerX, pointerY, cameraYaw, cameraPolar, state.options);

      const tau = state.options.smoothing;
      const t = tau > 0 ? 1 - Math.exp(-Math.max(deltaTime, 0) / tau) : 1;

      state.bodyYaw = approach(state.bodyYaw, target.bodyYaw, t);
      state.headYaw = approach(state.headYaw, target.headYaw, t);
      state.headPitch = approach(state.headPitch, target.headPitch, t);

      const head = skeleton.bones.get(BoneIndex.Head);
      const root = skeleton.bones.get(BoneIndex.Root);
      if (!head || !root) return false;

      const headBase = resolveBase(head, state.headApplied, state.headBase);
      const rootBase = resolveBase(root, state.rootApplied, state.rootBase);

      const headOut = isNeutralAngle(state.headYaw, state.headPitch)
        ? headBase
        : quatMultiply(quatFromEuler(state.headPitch, state.headYaw, 0), headBase);
      const rootOut = isNeutralAngle(state.bodyYaw)
        ? rootBase
        : quatMultiply(quatFromEuler(0, state.bodyYaw, 0), rootBase);

      const changed = !quatEquals(head.rotation, headOut) || !quatEquals(root.rotation, rootOut);

      head.rotation = headOut;
      root.rotation = rootOut;

      state.applied = true;
      state.headBase = headBase;
      state.headApplied = headOut;
      state.rootBase = rootBase;
      state.rootApplied = rootOut;

      return changed;
    },

    forget() {
      state.applied = false;
      state.skeleton = null;
      state.headBase = null;
      state.headApplied = null;
      state.rootBase = null;
      state.rootApplied = null;
    },

    dispose() {
      restore();
      detach();
      state.enabled = false;
    },
  };
}
