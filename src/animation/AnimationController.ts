/**
 * Animation controller implementation
 */

import { quatIdentity, quatSlerp, vec3Lerp, vec3Zero } from "../core/math";
import type { Quat, Vec3 } from "../core/math";
import type { PlayerSkeleton } from "../model/types";
import { setBoneRotation, setBonePositionOffset, resetSkeleton } from "../model/PlayerModel";
import { linear } from "./easing";
import { getAnimation, AnimationPlayState } from "./types";
import type { Animation, AnimationConfig, AnimationController, Keyframe } from "./types";

// Import presets to register them
import "./presets";

/** Internal animation state */
interface AnimationState {
  animation: Animation;
  config: AnimationConfig;
  time: number; // Current time in seconds
  playState: AnimationPlayState;
}

/** Animation controller internal state */
interface ControllerState {
  skeleton: PlayerSkeleton;
  current: AnimationState | null;
}

// Internal state storage using WeakMap
const controllerStates = new WeakMap<AnimationController, ControllerState>();

/** Result of keyframe interpolation */
interface InterpolationResult {
  rotation?: Quat;
  position?: Vec3;
}

/**
 * Binary search for keyframe index
 * Returns the index of the last keyframe with time <= target time
 */
function binarySearchKeyframe(keyframes: Keyframe[], time: number): number {
  let low = 0;
  let high = keyframes.length - 1;

  // Edge cases
  if (time <= keyframes[0]!.time) return 0;
  if (time >= keyframes[high]!.time) return high;

  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (keyframes[mid]!.time <= time) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Interpolate between keyframes using binary search
 */
function interpolateKeyframes(
  keyframes: Keyframe[],
  normalizedTime: number,
  amplitude: number,
): InterpolationResult {
  if (keyframes.length === 0) {
    return {};
  }

  // Single keyframe fast path
  if (keyframes.length === 1) {
    const kf = keyframes[0]!;
    const result: InterpolationResult = {};

    if (kf.rotation) {
      result.rotation =
        amplitude !== 1.0 ? quatSlerp(quatIdentity(), kf.rotation, amplitude) : kf.rotation;
    }
    if (kf.position) {
      result.position =
        amplitude !== 1.0 ? vec3Lerp(vec3Zero(), kf.position, amplitude) : kf.position;
    }

    return result;
  }

  // Use binary search to find keyframe pair
  const prevIndex = binarySearchKeyframe(keyframes, normalizedTime);
  const prevKeyframe = keyframes[prevIndex]!;

  // If at the last keyframe, return its values
  if (prevIndex >= keyframes.length - 1) {
    const result: InterpolationResult = {};

    if (prevKeyframe.rotation) {
      result.rotation =
        amplitude !== 1.0
          ? quatSlerp(quatIdentity(), prevKeyframe.rotation, amplitude)
          : prevKeyframe.rotation;
    }
    if (prevKeyframe.position) {
      result.position =
        amplitude !== 1.0
          ? vec3Lerp(vec3Zero(), prevKeyframe.position, amplitude)
          : prevKeyframe.position;
    }

    return result;
  }

  const nextKeyframe = keyframes[prevIndex + 1]!;

  // Calculate local interpolation factor
  const segmentDuration = nextKeyframe.time - prevKeyframe.time;
  const localT = segmentDuration > 0 ? (normalizedTime - prevKeyframe.time) / segmentDuration : 0;

  // Apply easing
  const easing = nextKeyframe.easing ?? linear;
  const easedT = easing(localT);

  const result: InterpolationResult = {};

  // Interpolate rotation if present
  if (prevKeyframe.rotation && nextKeyframe.rotation) {
    let rotation = quatSlerp(prevKeyframe.rotation, nextKeyframe.rotation, easedT);
    // Apply amplitude scaling (interpolate from identity)
    if (amplitude !== 1.0) {
      rotation = quatSlerp(quatIdentity(), rotation, amplitude);
    }
    result.rotation = rotation;
  }

  // Interpolate position if present
  if (prevKeyframe.position && nextKeyframe.position) {
    let position = vec3Lerp(prevKeyframe.position, nextKeyframe.position, easedT);
    // Apply amplitude scaling
    if (amplitude !== 1.0) {
      position = vec3Lerp(vec3Zero(), position, amplitude);
    }
    result.position = position;
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
      return state.current?.playState === AnimationPlayState.Playing;
    },

    get isPaused() {
      return state.current?.playState === AnimationPlayState.Paused;
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
        playState: AnimationPlayState.Playing,
      };
    },

    pause() {
      if (state.current && state.current.playState === AnimationPlayState.Playing) {
        state.current.playState = AnimationPlayState.Paused;
      }
    },

    resume() {
      if (state.current && state.current.playState === AnimationPlayState.Paused) {
        state.current.playState = AnimationPlayState.Playing;
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
  if (state.current.playState !== AnimationPlayState.Playing) return;

  const { animation, config } = state.current;

  // Update time
  state.current.time += deltaTime * (config.speed ?? 1.0);

  // Handle looping
  if (animation.loop) {
    state.current.time %= animation.duration;
  } else if (state.current.time >= animation.duration) {
    state.current.time = animation.duration;
    state.current.playState = AnimationPlayState.Stopped;
  }

  // Calculate normalized time (0-1)
  const normalizedTime = state.current.time / animation.duration;

  // Apply animation to each track
  const amplitude = config.amplitude ?? 1.0;

  for (const track of animation.tracks) {
    const result = interpolateKeyframes(track.keyframes, normalizedTime, amplitude);
    if (result.rotation) {
      setBoneRotation(controller.skeleton, track.boneIndex, result.rotation);
    }
    if (result.position) {
      setBonePositionOffset(controller.skeleton, track.boneIndex, result.position);
    }
  }
}
