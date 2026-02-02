/**
 * Idle animation preset
 * Subtle breathing motion
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";
import { createClosedWingTracks, rot } from "./utils";

/** Create idle animation */
function createIdleAnimation(): Animation {
  const [leftWing, rightWing] = createClosedWingTracks(
    { x: 15, y: 0.5, z: 15 },
    { dx: 2, dy: 0, dz: 1 },
  );

  return {
    name: "idle",
    duration: 3.0,
    loop: true,
    tracks: [
      // Subtle head bob
      {
        boneIndex: BoneIndex.Head,
        keyframes: [
          { time: 0, rotation: rot(0) },
          { time: 0.5, rotation: rot(2), easing: easeInOutSine },
          { time: 1, rotation: rot(0) },
        ],
      },
      // Very subtle arm sway
      {
        boneIndex: BoneIndex.RightArm,
        keyframes: [
          { time: 0, rotation: rot(2) },
          { time: 0.5, rotation: rot(-2), easing: easeInOutSine },
          { time: 1, rotation: rot(2), easing: easeInOutSine },
        ],
      },
      {
        boneIndex: BoneIndex.LeftArm,
        keyframes: [
          { time: 0, rotation: rot(-2) },
          { time: 0.5, rotation: rot(2), easing: easeInOutSine },
          { time: 1, rotation: rot(-2), easing: easeInOutSine },
        ],
      },
      // Cape subtle sway
      {
        boneIndex: BoneIndex.Cape,
        keyframes: [
          { time: 0, rotation: rot(10) },
          { time: 0.5, rotation: quatFromEuler(degToRad(12), degToRad(2), 0), easing: easeInOutSine },
          { time: 1, rotation: rot(10), easing: easeInOutSine },
        ],
      },
      leftWing,
      rightWing,
    ],
  };
}

registerAnimation(createIdleAnimation());

export { createIdleAnimation };
