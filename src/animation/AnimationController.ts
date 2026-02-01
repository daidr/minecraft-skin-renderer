/**
 * Animation controller implementation
 */

import { quatIdentity, quatSlerp } from "../core/math";
import type { Quat } from "../core/math";
import type { PlayerSkeleton } from "../model/types";
import { setBoneRotation, resetSkeleton } from "../model/PlayerModel";
import { linear } from "./easing";
import { getAnimation } from "./types";
import type { Animation, AnimationConfig, AnimationController, Keyframe } from "./types";

// Import presets to register them
import "./presets";

/** Internal animation state */
interface AnimationState {
  animation: Animation;
  config: AnimationConfig;
  time: number; // Current time in seconds
  isPlaying: boolean;
  isPaused: boolean;
}

/** Animation controller internal state */
interface ControllerState {
  skeleton: PlayerSkeleton;
  current: AnimationState | null;
}

// Internal state storage using WeakMap
const controllerStates = new WeakMap<AnimationController, ControllerState>();

/**
 * Interpolate between keyframes
 */
function interpolateKeyframes(
  keyframes: Keyframe[],
  normalizedTime: number,
  amplitude: number,
): Quat {
  if (keyframes.length === 0) {
    return quatIdentity();
  }

  if (keyframes.length === 1) {
    return keyframes[0]!.rotation;
  }

  // Find the two keyframes to interpolate between
  let prevKeyframe = keyframes[0]!;
  let nextKeyframe = keyframes[keyframes.length - 1]!;
  let localT = normalizedTime;

  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i]!;
    const next = keyframes[i + 1]!;
    if (normalizedTime >= current.time && normalizedTime <= next.time) {
      prevKeyframe = current;
      nextKeyframe = next;

      // Calculate local interpolation factor
      const segmentDuration = nextKeyframe.time - prevKeyframe.time;
      if (segmentDuration > 0) {
        localT = (normalizedTime - prevKeyframe.time) / segmentDuration;
      } else {
        localT = 0;
      }
      break;
    }
  }

  // Apply easing
  const easing = nextKeyframe.easing ?? linear;
  const easedT = easing(localT);

  // Interpolate rotation
  const result = quatSlerp(prevKeyframe.rotation, nextKeyframe.rotation, easedT);

  // Apply amplitude scaling (interpolate from identity)
  if (amplitude !== 1.0) {
    return quatSlerp(quatIdentity(), result, amplitude);
  }

  return result;
}

/**
 * Create animation controller
 */
export function createAnimationController(skeleton: PlayerSkeleton): AnimationController {
  // Create state
  const state: ControllerState = {
    skeleton,
    current: null,
  };

  const controller: AnimationController = {
    get isPlaying() {
      return state.current?.isPlaying ?? false;
    },

    get isPaused() {
      return state.current?.isPaused ?? false;
    },

    get currentAnimation() {
      return state.current?.animation.name ?? null;
    },

    get progress() {
      if (!state.current) return 0;
      return (
        (state.current.time % state.current.animation.duration) / state.current.animation.duration
      );
    },

    skeleton,

    play(name: string, config?: AnimationConfig) {
      const animation = getAnimation(name);
      if (!animation) {
        console.warn(`Animation "${name}" not found`);
        return;
      }

      // Reset skeleton to default pose before starting new animation
      resetSkeleton(skeleton);

      state.current = {
        animation,
        config: {
          speed: config?.speed ?? 1.0,
          amplitude: config?.amplitude ?? 1.0,
        },
        time: 0,
        isPlaying: true,
        isPaused: false,
      };
    },

    pause() {
      if (state.current) {
        state.current.isPaused = true;
      }
    },

    resume() {
      if (state.current) {
        state.current.isPaused = false;
      }
    },

    stop() {
      state.current = null;
      resetSkeleton(skeleton);
    },
  };

  // Store state in WeakMap
  controllerStates.set(controller, state);

  return controller;
}

/**
 * Update animation controller
 */
export function updateAnimationController(
  controller: AnimationController,
  deltaTime: number,
): void {
  const state = controllerStates.get(controller);
  if (!state || !state.current) return;
  if (state.current.isPaused) return;

  const { animation, config } = state.current;

  // Update time
  state.current.time += deltaTime * (config.speed ?? 1.0);

  // Handle looping
  if (animation.loop) {
    state.current.time %= animation.duration;
  } else if (state.current.time >= animation.duration) {
    state.current.time = animation.duration;
    state.current.isPlaying = false;
  }

  // Calculate normalized time (0-1)
  const normalizedTime = state.current.time / animation.duration;

  // Apply animation to each track
  const amplitude = config.amplitude ?? 1.0;

  for (const track of animation.tracks) {
    const rotation = interpolateKeyframes(track.keyframes, normalizedTime, amplitude);
    setBoneRotation(controller.skeleton, track.boneIndex, rotation);
  }
}
