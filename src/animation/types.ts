/**
 * Animation system types
 */

import type { Quat, Vec3 } from "../core/math";
import type { BoneIndex, PlayerSkeleton } from "../model/types";

/** Easing function type */
export type EasingFunction = (t: number) => number;

/** Animation playback state */
export enum AnimationPlayState {
  Stopped = 0,
  Playing = 1,
  Paused = 2,
}

/** Animation keyframe */
export interface Keyframe {
  time: number; // 0-1 normalized time
  rotation?: Quat; // Target rotation (optional)
  position?: Vec3; // Target position offset (optional)
  easing?: EasingFunction;
}

/** Animation track for a single bone */
export interface AnimationTrack {
  boneIndex: BoneIndex;
  keyframes: Keyframe[];
}

/** Animation definition */
export interface Animation {
  name: string;
  duration: number; // Duration in seconds
  loop: boolean;
  tracks: AnimationTrack[];
}

/** Animation playback configuration */
export interface AnimationConfig {
  speed?: number; // Playback speed multiplier (default: 1.0)
  amplitude?: number; // Motion amplitude multiplier (default: 1.0)
}

/** Animation controller interface */
export interface AnimationController {
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
  readonly currentAnimation: string | null;
  readonly progress: number; // 0-1

  play(name: string, config?: AnimationConfig): void;
  pause(): void;
  resume(): void;
  stop(): void;

  // Internal use
  skeleton: PlayerSkeleton;
}

/** Registered animations */
export const animations: Map<string, Animation> = new Map();

/** Register an animation */
export function registerAnimation(animation: Animation): void {
  animations.set(animation.name, animation);
}

/** Get animation by name */
export function getAnimation(name: string): Animation | undefined {
  return animations.get(name);
}

/** Get all registered animation names */
export function getRegisteredAnimations(): string[] {
  return Array.from(animations.keys());
}
