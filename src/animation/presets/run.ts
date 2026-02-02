/**
 * Run animation preset
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

/** Create run animation */
function createRunAnimation(): Animation {
  const armSwing = 70;
  const legSwing = 60;
  const bobHeight = 1;

  const [rightArm, leftArm] = createArmSwingTracks(armSwing);
  const [rightLeg, leftLeg] = createLegSwingTracks(legSwing);
  const [leftWing, rightWing] = createClosedWingTracks(
    { x: 25, y: 0.5, z: 15 },
    { dx: 5, dy: 3, dz: 3 },
  );

  return {
    name: "run",
    duration: 0.5,
    loop: true,
    tracks: [
      // Root vertical bobbing
      {
        boneIndex: BoneIndex.Root,
        keyframes: [
          { time: 0, position: [0, 0, 0] },
          { time: 0.25, position: [0, bobHeight, 0], easing: easeInOutSine },
          { time: 0.5, position: [0, 0, 0], easing: easeInOutSine },
          { time: 0.75, position: [0, bobHeight, 0], easing: easeInOutSine },
          { time: 1, position: [0, 0, 0], easing: easeInOutSine },
        ],
      },
      createHeadBobTrack(3, 2),
      rightArm,
      leftArm,
      rightLeg,
      leftLeg,
      // Cape flows back more while running
      {
        boneIndex: BoneIndex.Cape,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(55), degToRad(2), 0) },
          { time: 0.25, rotation: quatFromEuler(degToRad(50), 0, 0), easing: easeInOutSine },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(55), degToRad(-2), 0),
            easing: easeInOutSine,
          },
          { time: 0.75, rotation: quatFromEuler(degToRad(50), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(55), degToRad(2), 0), easing: easeInOutSine },
        ],
      },
      leftWing,
      rightWing,
    ],
  };
}

registerAnimation(createRunAnimation());

export { createRunAnimation };
