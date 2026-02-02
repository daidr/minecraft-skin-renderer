/**
 * Walk animation preset
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";
import {
  createArmSwingTracks,
  createLegSwingTracks,
  createHeadBobTrack,
  createClosedWingTracks,
} from "./utils";

/** Create walk animation */
function createWalkAnimation(): Animation {
  const armSwing = 24;
  const legSwing = 40;

  const [rightArm, leftArm] = createArmSwingTracks(armSwing);
  const [rightLeg, leftLeg] = createLegSwingTracks(legSwing);
  const [leftWing, rightWing] = createClosedWingTracks(
    { x: 20, y: 0.5, z: 15 },
    { dx: 3, dy: 1, dz: 2 },
  );

  return {
    name: "walk",
    duration: 1.2,
    loop: true,
    tracks: [
      createHeadBobTrack(2, 2),
      rightArm,
      leftArm,
      rightLeg,
      leftLeg,
      // Cape sway
      {
        boneIndex: BoneIndex.Cape,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(22), degToRad(2), 0) },
          { time: 0.25, rotation: quatFromEuler(degToRad(18), 0, 0), easing: easeInOutSine },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(22), degToRad(-2), 0),
            easing: easeInOutSine,
          },
          { time: 0.75, rotation: quatFromEuler(degToRad(18), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(22), degToRad(2), 0), easing: easeInOutSine },
        ],
      },
      leftWing,
      rightWing,
    ],
  };
}

registerAnimation(createWalkAnimation());

export { createWalkAnimation };
