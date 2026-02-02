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
  const wingClosedX = 25;
  const wingClosedY = 0.5;
  const wingClosedZ = 15;

  // Vertical bobbing amplitude (in pixels) - like a small jump
  const bobHeight = 1;

  return {
    name: "run",
    duration: 0.5, // 0.5 second cycle (running pace, faster than walk)
    loop: true,
    tracks: [
      // Root vertical bobbing (twice per cycle - once for each step)
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
      // Cape flows back more while running (minimal side sway)
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
      // Elytra wings closed - more sway while running (Y stays same sign to avoid clipping)
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
              degToRad(wingClosedX + 5),
              degToRad(wingClosedY + 3),
              degToRad(wingClosedZ + 3),
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
              degToRad(wingClosedX + 5),
              degToRad(-wingClosedY - 3),
              degToRad(-wingClosedZ - 3),
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
registerAnimation(createRunAnimation());

export { createRunAnimation };
