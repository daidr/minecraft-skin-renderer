/**
 * Run animation preset
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";

/** Create run animation */
function createRunAnimation(): Animation {
  const armSwing = 70; // degrees (larger than walk)
  const legSwing = 60; // degrees (larger than walk)

  // Elytra closed position
  const wingClosedX = 15;
  const wingClosedY = 0.5;
  const wingClosedZ = 15;

  return {
    name: "run",
    duration: 0.6, // 0.6 second cycle (running pace, faster than walk)
    loop: true,
    tracks: [
      // Head slight bob (same as walk, just faster)
      {
        boneIndex: BoneIndex.Head,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-3), 0, 0) },
          { time: 0.25, rotation: quatFromEuler(degToRad(3), 0, 0), easing: easeInOutSine },
          { time: 0.5, rotation: quatFromEuler(degToRad(-3), 0, 0), easing: easeInOutSine },
          { time: 0.75, rotation: quatFromEuler(degToRad(3), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(-3), 0, 0), easing: easeInOutSine },
        ],
      },
      // Right arm - larger swing
      {
        boneIndex: BoneIndex.RightArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(armSwing), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(-armSwing), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(armSwing), 0, 0), easing: easeInOutSine },
        ],
      },
      // Left arm
      {
        boneIndex: BoneIndex.LeftArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-armSwing), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(armSwing), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(-armSwing), 0, 0), easing: easeInOutSine },
        ],
      },
      // Right leg - larger swing
      {
        boneIndex: BoneIndex.RightLeg,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-legSwing), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(legSwing), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(-legSwing), 0, 0), easing: easeInOutSine },
        ],
      },
      // Left leg
      {
        boneIndex: BoneIndex.LeftLeg,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(legSwing), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(-legSwing), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(legSwing), 0, 0), easing: easeInOutSine },
        ],
      },
      // Cape flows back more while running
      {
        boneIndex: BoneIndex.Cape,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(25), degToRad(8), 0) },
          { time: 0.25, rotation: quatFromEuler(degToRad(18), 0, 0), easing: easeInOutSine },
          { time: 0.5, rotation: quatFromEuler(degToRad(25), degToRad(-8), 0), easing: easeInOutSine },
          { time: 0.75, rotation: quatFromEuler(degToRad(18), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(25), degToRad(8), 0), easing: easeInOutSine },
        ],
      },
      // Elytra wings closed - static position
      {
        boneIndex: BoneIndex.LeftWing,
        keyframes: [
          {
            time: 0,
            rotation: quatFromEuler(degToRad(wingClosedX), degToRad(wingClosedY), degToRad(wingClosedZ)),
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(wingClosedX), degToRad(wingClosedY), degToRad(wingClosedZ)),
          },
        ],
      },
      {
        boneIndex: BoneIndex.RightWing,
        keyframes: [
          {
            time: 0,
            rotation: quatFromEuler(degToRad(wingClosedX), degToRad(-wingClosedY), degToRad(-wingClosedZ)),
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(wingClosedX), degToRad(-wingClosedY), degToRad(-wingClosedZ)),
          },
        ],
      },
    ],
  };
}

// Register the animation
registerAnimation(createRunAnimation());

export { createRunAnimation };
