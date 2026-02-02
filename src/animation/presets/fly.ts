/**
 * Fly animation preset (elytra flying pose)
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";
import { createSpreadWingTracks, rot } from "./utils";

/** Create fly animation */
function createFlyAnimation(): Animation {
  const bodyPitch = 80;
  const armAngle = 10;
  const legAngle = 5;

  const [leftWing, rightWing] = createSpreadWingTracks(20, 80);

  return {
    name: "fly",
    duration: 1.5,
    loop: true,
    tracks: [
      // Body pitched forward
      {
        boneIndex: BoneIndex.Body,
        keyframes: [
          { time: 0, rotation: rot(bodyPitch) },
          { time: 0.5, rotation: rot(bodyPitch + 3), easing: easeInOutSine },
          { time: 1, rotation: rot(bodyPitch), easing: easeInOutSine },
        ],
      },
      // Head compensates for body pitch
      {
        boneIndex: BoneIndex.Head,
        keyframes: [
          { time: 0, rotation: rot(-bodyPitch + 10) },
          { time: 0.5, rotation: rot(-bodyPitch + 5), easing: easeInOutSine },
          { time: 1, rotation: rot(-bodyPitch + 10), easing: easeInOutSine },
        ],
      },
      // Arms slightly back and out
      {
        boneIndex: BoneIndex.RightArm,
        keyframes: [
          { time: 0, rotation: rot(armAngle, 0, -15) },
          { time: 0.5, rotation: rot(armAngle + 5, 0, -20), easing: easeInOutSine },
          { time: 1, rotation: rot(armAngle, 0, -15), easing: easeInOutSine },
        ],
      },
      {
        boneIndex: BoneIndex.LeftArm,
        keyframes: [
          { time: 0, rotation: rot(armAngle, 0, 15) },
          { time: 0.5, rotation: rot(armAngle + 5, 0, 20), easing: easeInOutSine },
          { time: 1, rotation: rot(armAngle, 0, 15), easing: easeInOutSine },
        ],
      },
      // Legs stretched back
      {
        boneIndex: BoneIndex.RightLeg,
        keyframes: [
          { time: 0, rotation: rot(legAngle, 0, -3) },
          { time: 0.5, rotation: rot(legAngle + 5, 0, -5), easing: easeInOutSine },
          { time: 1, rotation: rot(legAngle, 0, -3), easing: easeInOutSine },
        ],
      },
      {
        boneIndex: BoneIndex.LeftLeg,
        keyframes: [
          { time: 0, rotation: rot(legAngle, 0, 3) },
          { time: 0.5, rotation: rot(legAngle + 5, 0, 5), easing: easeInOutSine },
          { time: 1, rotation: rot(legAngle, 0, 3), easing: easeInOutSine },
        ],
      },
      // Cape flows behind
      {
        boneIndex: BoneIndex.Cape,
        keyframes: [
          { time: 0, rotation: rot(10) },
          { time: 0.25, rotation: quatFromEuler(degToRad(15), degToRad(2), 0), easing: easeInOutSine },
          { time: 0.5, rotation: rot(5), easing: easeInOutSine },
          { time: 0.75, rotation: quatFromEuler(degToRad(15), degToRad(-2), 0), easing: easeInOutSine },
          { time: 1, rotation: rot(10), easing: easeInOutSine },
        ],
      },
      leftWing,
      rightWing,
    ],
  };
}

registerAnimation(createFlyAnimation());

export { createFlyAnimation };
