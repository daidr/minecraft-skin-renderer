/**
 * Animation preset utilities
 *
 * Helper functions for creating common animation patterns.
 */

import { degToRad, quatFromEuler } from "../../core/math";
import type { Quat } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import type { AnimationTrack, EasingFunction, Keyframe } from "../types";

/** Wing configuration for elytra animations */
export interface WingConfig {
  x: number; // X rotation (tilt forward/backward)
  y: number; // Y rotation
  z: number; // Z rotation (spread)
}

/** Swing animation parameters */
export interface SwingParams {
  amplitude: number; // Swing amplitude in degrees
  /** Additional Z rotation (for flying pose) */
  zRotation?: number;
}

/**
 * Create a simple oscillating swing track (for arms/legs)
 * Creates keyframes: start -> opposite -> start
 */
export function createSwingTrack(
  boneIndex: BoneIndex,
  params: SwingParams,
  /** If true, start with negative amplitude (opposite phase) */
  invertPhase = false,
  easing: EasingFunction = easeInOutSine,
): AnimationTrack {
  const amp = params.amplitude;
  const z = params.zRotation ?? 0;
  const start = invertPhase ? -amp : amp;

  return {
    boneIndex,
    keyframes: [
      { time: 0, rotation: quatFromEuler(degToRad(start), 0, degToRad(z)) },
      { time: 0.5, rotation: quatFromEuler(degToRad(-start), 0, degToRad(z)), easing },
      { time: 1, rotation: quatFromEuler(degToRad(start), 0, degToRad(z)), easing },
    ],
  };
}

/**
 * Create arm swing tracks for walking/running
 * Arms swing opposite to legs
 */
export function createArmSwingTracks(amplitude: number): [AnimationTrack, AnimationTrack] {
  return [
    createSwingTrack(BoneIndex.RightArm, { amplitude }, false),
    createSwingTrack(BoneIndex.LeftArm, { amplitude }, true),
  ];
}

/**
 * Create leg swing tracks for walking/running
 * Legs swing opposite to each other
 */
export function createLegSwingTracks(amplitude: number): [AnimationTrack, AnimationTrack] {
  return [
    createSwingTrack(BoneIndex.RightLeg, { amplitude }, true),
    createSwingTrack(BoneIndex.LeftLeg, { amplitude }, false),
  ];
}

/**
 * Create elytra wing tracks (closed position with optional sway)
 *
 * @param baseConfig - Base wing configuration
 * @param swayConfig - Optional sway configuration (deltaX, deltaY, deltaZ)
 */
export function createClosedWingTracks(
  baseConfig: WingConfig,
  swayConfig?: { dx: number; dy: number; dz: number },
  easing: EasingFunction = easeInOutSine,
): [AnimationTrack, AnimationTrack] {
  const { x, y, z } = baseConfig;

  if (swayConfig) {
    const { dx, dy, dz } = swayConfig;
    return [
      {
        boneIndex: BoneIndex.LeftWing,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(x), degToRad(y), degToRad(z)) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(x + dx), degToRad(y + dy), degToRad(z + dz)),
            easing,
          },
          { time: 1, rotation: quatFromEuler(degToRad(x), degToRad(y), degToRad(z)), easing },
        ],
      },
      {
        boneIndex: BoneIndex.RightWing,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(x), degToRad(-y), degToRad(-z)) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(x + dx), degToRad(-y - dy), degToRad(-z - dz)),
            easing,
          },
          { time: 1, rotation: quatFromEuler(degToRad(x), degToRad(-y), degToRad(-z)), easing },
        ],
      },
    ];
  }

  // Static position (no sway)
  const leftRot = quatFromEuler(degToRad(x), degToRad(y), degToRad(z));
  const rightRot = quatFromEuler(degToRad(x), degToRad(-y), degToRad(-z));

  return [
    {
      boneIndex: BoneIndex.LeftWing,
      keyframes: [
        { time: 0, rotation: leftRot },
        { time: 1, rotation: leftRot },
      ],
    },
    {
      boneIndex: BoneIndex.RightWing,
      keyframes: [
        { time: 0, rotation: rightRot },
        { time: 1, rotation: rightRot },
      ],
    },
  ];
}

/**
 * Create spread wing tracks for flying
 */
export function createSpreadWingTracks(
  tilt: number,
  spread: number,
): [AnimationTrack, AnimationTrack] {
  return createClosedWingTracks({ x: tilt, y: 0, z: spread });
}

/**
 * Create a head bob track with given amplitude
 */
export function createHeadBobTrack(
  amplitude: number,
  /** Number of bobs per cycle (default: 2 for walk/run) */
  bobsPerCycle = 2,
  easing: EasingFunction = easeInOutSine,
): AnimationTrack {
  const keyframes: Keyframe[] = [{ time: 0, rotation: quatFromEuler(degToRad(-amplitude), 0, 0) }];

  const step = 1 / (bobsPerCycle * 2);
  for (let i = 1; i <= bobsPerCycle * 2; i++) {
    const isUp = i % 2 === 1;
    keyframes.push({
      time: i * step,
      rotation: quatFromEuler(degToRad(isUp ? amplitude : -amplitude), 0, 0),
      easing,
    });
  }

  return { boneIndex: BoneIndex.Head, keyframes };
}

/**
 * Create a rotation keyframe helper
 */
export function rot(x: number, y = 0, z = 0): Quat {
  return quatFromEuler(degToRad(x), degToRad(y), degToRad(z));
}
