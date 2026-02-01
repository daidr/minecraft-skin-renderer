/**
 * Idle animation preset
 * Subtle breathing motion
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";

/** Create idle animation */
function createIdleAnimation(): Animation {
  return {
    name: "idle",
    duration: 3.0, // 3 second cycle
    loop: true,
    tracks: [
      // Subtle head bob
      {
        boneIndex: BoneIndex.Head,
        keyframes: [
          { time: 0, rotation: quatFromEuler(0, 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(2), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(0, 0, 0) },
        ],
      },
      // Very subtle arm sway (forward/backward on X axis to avoid Z-fighting with body)
      {
        boneIndex: BoneIndex.RightArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(2), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(-2), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(2), 0, 0), easing: easeInOutSine },
        ],
      },
      {
        boneIndex: BoneIndex.LeftArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-2), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(2), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(-2), 0, 0), easing: easeInOutSine },
        ],
      },
    ],
  };
}

// Register the animation
registerAnimation(createIdleAnimation());

export { createIdleAnimation };
