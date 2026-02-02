/**
 * Walk animation preset
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";

/** Create walk animation */
function createWalkAnimation(): Animation {
  const armSwing = 24; // degrees
  const legSwing = 40; // degrees

  // Elytra closed position
  const wingClosedX = 20;
  const wingClosedY = 0.5;
  const wingClosedZ = 15;

  return {
    name: "walk",
    duration: 1.2, // 1.2 second cycle (slow walking pace)
    loop: true,
    tracks: [
      // Head slight bob
      {
        boneIndex: BoneIndex.Head,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-2), 0, 0) },
          { time: 0.25, rotation: quatFromEuler(degToRad(2), 0, 0), easing: easeInOutSine },
          { time: 0.5, rotation: quatFromEuler(degToRad(-2), 0, 0), easing: easeInOutSine },
          { time: 0.75, rotation: quatFromEuler(degToRad(2), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(-2), 0, 0), easing: easeInOutSine },
        ],
      },
      // Right arm swings opposite to right leg
      {
        boneIndex: BoneIndex.RightArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(armSwing), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(-armSwing), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(armSwing), 0, 0), easing: easeInOutSine },
        ],
      },
      // Left arm swings opposite to left leg
      {
        boneIndex: BoneIndex.LeftArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-armSwing), 0, 0) },
          { time: 0.5, rotation: quatFromEuler(degToRad(armSwing), 0, 0), easing: easeInOutSine },
          { time: 1, rotation: quatFromEuler(degToRad(-armSwing), 0, 0), easing: easeInOutSine },
        ],
      },
      // Right leg
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
      // Cape sway while walking (minimal side sway)
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
      // Elytra wings closed - slight sway while walking (Y stays same sign to avoid clipping)
      {
        boneIndex: BoneIndex.LeftWing,
        keyframes: [
          {
            time: 0,
            rotation: quatFromEuler(
              degToRad(wingClosedX),
              degToRad(wingClosedY),
              degToRad(wingClosedZ),
            ),
          },
          {
            time: 0.5,
            rotation: quatFromEuler(
              degToRad(wingClosedX + 3),
              degToRad(wingClosedY + 1),
              degToRad(wingClosedZ + 2),
            ),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(
              degToRad(wingClosedX),
              degToRad(wingClosedY),
              degToRad(wingClosedZ),
            ),
            easing: easeInOutSine,
          },
        ],
      },
      {
        boneIndex: BoneIndex.RightWing,
        keyframes: [
          {
            time: 0,
            rotation: quatFromEuler(
              degToRad(wingClosedX),
              degToRad(-wingClosedY),
              degToRad(-wingClosedZ),
            ),
          },
          {
            time: 0.5,
            rotation: quatFromEuler(
              degToRad(wingClosedX + 3),
              degToRad(-wingClosedY - 1),
              degToRad(-wingClosedZ - 2),
            ),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(
              degToRad(wingClosedX),
              degToRad(-wingClosedY),
              degToRad(-wingClosedZ),
            ),
            easing: easeInOutSine,
          },
        ],
      },
    ],
  };
}

// Register the animation
registerAnimation(createWalkAnimation());

export { createWalkAnimation };
