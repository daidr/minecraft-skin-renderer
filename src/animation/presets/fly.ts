/**
 * Fly animation preset (elytra flying pose)
 */

import { degToRad, quatFromEuler } from "../../core/math";
import { BoneIndex } from "../../model/types";
import { easeInOutSine } from "../easing";
import { registerAnimation } from "../types";
import type { Animation } from "../types";

/** Create fly animation */
function createFlyAnimation(): Animation {
  const bodyPitch = 80; // Body almost horizontal
  const armAngle = 10; // Arms slightly back
  const legAngle = 5; // Legs slightly apart (now relative to body since attached to body)

  // Elytra wing spread angles (in degrees)
  // Note: Elytra should NOT flutter/swing - they stay in a fixed spread position
  const wingSpread = 80; // Z rotation for spread
  const wingTilt = 20; // X rotation tilt

  return {
    name: "fly",
    duration: 1.5, // Slower, gliding motion
    loop: true,
    tracks: [
      // Body pitched forward (flying horizontal)
      {
        boneIndex: BoneIndex.Body,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(bodyPitch), 0, 0) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(bodyPitch + 3), 0, 0),
            easing: easeInOutSine,
          },
          { time: 1, rotation: quatFromEuler(degToRad(bodyPitch), 0, 0), easing: easeInOutSine },
        ],
      },
      // Head looks forward (compensates for body pitch)
      {
        boneIndex: BoneIndex.Head,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(-bodyPitch + 10), 0, 0) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(-bodyPitch + 5), 0, 0),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(-bodyPitch + 10), 0, 0),
            easing: easeInOutSine,
          },
        ],
      },
      // Right arm - slightly back and out
      {
        boneIndex: BoneIndex.RightArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(armAngle), 0, degToRad(-15)) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(armAngle + 5), 0, degToRad(-20)),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(armAngle), 0, degToRad(-15)),
            easing: easeInOutSine,
          },
        ],
      },
      // Left arm
      {
        boneIndex: BoneIndex.LeftArm,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(armAngle), 0, degToRad(15)) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(armAngle + 5), 0, degToRad(20)),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(armAngle), 0, degToRad(15)),
            easing: easeInOutSine,
          },
        ],
      },
      // Right leg - stretched back (positive X rotation = backward)
      {
        boneIndex: BoneIndex.RightLeg,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(legAngle), 0, degToRad(-3)) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(legAngle + 5), 0, degToRad(-5)),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(legAngle), 0, degToRad(-3)),
            easing: easeInOutSine,
          },
        ],
      },
      // Left leg
      {
        boneIndex: BoneIndex.LeftLeg,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(legAngle), 0, degToRad(3)) },
          {
            time: 0.5,
            rotation: quatFromEuler(degToRad(legAngle + 5), 0, degToRad(5)),
            easing: easeInOutSine,
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(legAngle), 0, degToRad(3)),
            easing: easeInOutSine,
          },
        ],
      },
      // Cape flows behind the player in wind (small angle for flying)
      {
        boneIndex: BoneIndex.Cape,
        keyframes: [
          { time: 0, rotation: quatFromEuler(degToRad(10), 0, 0) },
          {
            time: 0.25,
            rotation: quatFromEuler(degToRad(15), degToRad(2), 0),
            easing: easeInOutSine,
          },
          { time: 0.5, rotation: quatFromEuler(degToRad(5), 0, 0), easing: easeInOutSine },
          {
            time: 0.75,
            rotation: quatFromEuler(degToRad(15), degToRad(-2), 0),
            easing: easeInOutSine,
          },
          { time: 1, rotation: quatFromEuler(degToRad(10), 0, 0), easing: easeInOutSine },
        ],
      },
      // Left elytra wing - spread out (static, no flutter)
      {
        boneIndex: BoneIndex.LeftWing,
        keyframes: [
          {
            time: 0,
            rotation: quatFromEuler(degToRad(wingTilt), 0, degToRad(wingSpread)),
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(wingTilt), 0, degToRad(wingSpread)),
          },
        ],
      },
      // Right elytra wing - mirrored spread (static, no flutter)
      {
        boneIndex: BoneIndex.RightWing,
        keyframes: [
          {
            time: 0,
            rotation: quatFromEuler(degToRad(wingTilt), 0, degToRad(-wingSpread)),
          },
          {
            time: 1,
            rotation: quatFromEuler(degToRad(wingTilt), 0, degToRad(-wingSpread)),
          },
        ],
      },
    ],
  };
}

// Register the animation
registerAnimation(createFlyAnimation());

export { createFlyAnimation };
