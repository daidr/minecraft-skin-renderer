/**
 * Player model skeleton definition
 * Based on Minecraft's player model structure
 */

import { quatIdentity, quatFromEuler, degToRad } from "../core/math";
import type { Quat, Vec3 } from "../core/math";
import { BoneIndex } from "./types";
import type { Bone, ModelVariant, PlayerSkeleton } from "./types";

/**
 * Minecraft player dimensions (in pixels, 1 pixel = 1 unit)
 * Head: 8x8x8
 * Body: 8x12x4
 * Arms: 4x12x4 (classic) or 3x12x4 (slim)
 * Legs: 4x12x4
 */

/** Create a bone definition */
function createBone(
  index: BoneIndex,
  name: string,
  parentIndex: BoneIndex | null,
  position: Vec3,
  pivot: Vec3,
  size: Vec3,
): Bone {
  return {
    index,
    name,
    parentIndex,
    position,
    pivot,
    rotation: quatIdentity(),
    positionOffset: [0, 0, 0],
    size,
  };
}

/** Create the player skeleton */
export function createPlayerSkeleton(variant: ModelVariant = "classic"): PlayerSkeleton {
  const armWidth = variant === "slim" ? 3 : 4;
  const bones = new Map<BoneIndex, Bone>();

  // Minecraft player model coordinates (Y up, origin at feet):
  // - Legs: y = 0 to 12
  // - Body: y = 12 to 24
  // - Head: y = 24 to 32
  // - Arms: y = 12 to 24 (attached at shoulders, y = 22)

  // Root bone (at feet level, center)
  bones.set(
    BoneIndex.Root,
    createBone(BoneIndex.Root, "root", null, [0, 0, 0], [0, 0, 0], [0, 0, 0]),
  );

  // Body (pivot at bottom of body, y=12)
  bones.set(
    BoneIndex.Body,
    createBone(
      BoneIndex.Body,
      "body",
      BoneIndex.Root,
      [0, 24, 0], // Position body top at y=24
      [0, 0, 0], // Pivot at body top (for head attachment)
      [8, 12, 4], // Body size
    ),
  );

  // Head (attached to body top, y=24)
  bones.set(
    BoneIndex.Head,
    createBone(
      BoneIndex.Head,
      "head",
      BoneIndex.Body,
      [0, 0, 0], // At body top
      [0, 0, 0], // Pivot at neck (head bottom)
      [8, 8, 8], // Head size
    ),
  );

  // Right Arm (attached at shoulder, x = -5 or -5.5 for slim)
  bones.set(
    BoneIndex.RightArm,
    createBone(
      BoneIndex.RightArm,
      "rightArm",
      BoneIndex.Body,
      [-(4 + armWidth / 2), 0, 0], // Shoulder position (at body top)
      [0, 0, 0], // Pivot at shoulder (arm top)
      [armWidth, 12, 4], // Arm size
    ),
  );

  // Left Arm (attached at shoulder)
  bones.set(
    BoneIndex.LeftArm,
    createBone(
      BoneIndex.LeftArm,
      "leftArm",
      BoneIndex.Body,
      [4 + armWidth / 2, 0, 0], // Shoulder position (at body top)
      [0, 0, 0], // Pivot at shoulder
      [armWidth, 12, 4], // Arm size
    ),
  );

  // Right Leg (attached to body at hip level)
  bones.set(
    BoneIndex.RightLeg,
    createBone(
      BoneIndex.RightLeg,
      "rightLeg",
      BoneIndex.Body,
      [-2, -12, 0], // Hip position (relative to body top at y=24, so y=24-12=12)
      [0, 0, 0], // Pivot at hip (leg top)
      [4, 12, 4], // Leg size
    ),
  );

  // Left Leg (attached to body at hip level)
  bones.set(
    BoneIndex.LeftLeg,
    createBone(
      BoneIndex.LeftLeg,
      "leftLeg",
      BoneIndex.Body,
      [2, -12, 0], // Hip position (relative to body top)
      [0, 0, 0], // Pivot at hip
      [4, 12, 4], // Leg size
    ),
  );

  // Overlay layers (slightly larger, same pivot)
  const overlayScale = 0.5; // Extra size for overlay

  bones.set(
    BoneIndex.HeadOverlay,
    createBone(
      BoneIndex.HeadOverlay,
      "headOverlay",
      BoneIndex.Head,
      [0, 0, 0],
      [0, 0, 0],
      [8 + overlayScale * 2, 8 + overlayScale * 2, 8 + overlayScale * 2],
    ),
  );

  bones.set(
    BoneIndex.BodyOverlay,
    createBone(
      BoneIndex.BodyOverlay,
      "bodyOverlay",
      BoneIndex.Body,
      [0, 0, 0],
      [0, 0, 0],
      [8 + overlayScale * 2, 12 + overlayScale * 2, 4 + overlayScale * 2],
    ),
  );

  bones.set(
    BoneIndex.RightArmOverlay,
    createBone(
      BoneIndex.RightArmOverlay,
      "rightArmOverlay",
      BoneIndex.RightArm,
      [0, 0, 0],
      [0, 0, 0],
      [armWidth + overlayScale * 2, 12 + overlayScale * 2, 4 + overlayScale * 2],
    ),
  );

  bones.set(
    BoneIndex.LeftArmOverlay,
    createBone(
      BoneIndex.LeftArmOverlay,
      "leftArmOverlay",
      BoneIndex.LeftArm,
      [0, 0, 0],
      [0, 0, 0],
      [armWidth + overlayScale * 2, 12 + overlayScale * 2, 4 + overlayScale * 2],
    ),
  );

  bones.set(
    BoneIndex.RightLegOverlay,
    createBone(
      BoneIndex.RightLegOverlay,
      "rightLegOverlay",
      BoneIndex.RightLeg,
      [0, 0, 0],
      [0, 0, 0],
      [4 + overlayScale * 2, 12 + overlayScale * 2, 4 + overlayScale * 2],
    ),
  );

  bones.set(
    BoneIndex.LeftLegOverlay,
    createBone(
      BoneIndex.LeftLegOverlay,
      "leftLegOverlay",
      BoneIndex.LeftLeg,
      [0, 0, 0],
      [0, 0, 0],
      [4 + overlayScale * 2, 12 + overlayScale * 2, 4 + overlayScale * 2],
    ),
  );

  // Cape (attached to body back)
  // Cape hangs from the neck, pivot at the top attachment point
  // Body back face is at z = -2 (body is 4 deep, centered at z=0)
  // Cape should be flush against body back
  bones.set(
    BoneIndex.Cape,
    createBone(
      BoneIndex.Cape,
      "cape",
      BoneIndex.Body,
      [0, 0, -2], // At body back surface (z = -2)
      [0, 0, 0], // Pivot at bone origin (top of cape attachment)
      [10, 16, 1], // Cape size: 10 wide, 16 tall, 1 deep
    ),
  );

  // Elytra wings (attached to body back at the spine)
  // Based on skinview3d: wings pivot from attachment point at spine
  // Left wing pivot is 5 units to the left of center, extends outward
  // Wing rotates around this pivot point for open/close animations
  // Y=-2 to position wings slightly below shoulders (body top is at y=0)
  bones.set(
    BoneIndex.LeftWing,
    createBone(
      BoneIndex.LeftWing,
      "leftWing",
      BoneIndex.Body,
      [5, -1, -2], // Pivot point: below shoulders, at body back
      [0, 0, 0], // Pivot at bone origin
      [10, 20, 2], // Wing size for UV mapping
    ),
  );

  bones.set(
    BoneIndex.RightWing,
    createBone(
      BoneIndex.RightWing,
      "rightWing",
      BoneIndex.Body,
      [-5, -1, -2], // Pivot point: below shoulders, at body back (mirrored)
      [0, 0, 0], // Pivot at bone origin (mirrored)
      [10, 20, 2], // Wing size for UV mapping
    ),
  );

  // Set default elytra rotation to match idle animation's closed position
  const leftWing = bones.get(BoneIndex.LeftWing)!;
  const rightWing = bones.get(BoneIndex.RightWing)!;
  leftWing.rotation = quatFromEuler(degToRad(15), degToRad(0.5), degToRad(15));
  rightWing.rotation = quatFromEuler(degToRad(15), degToRad(-0.5), degToRad(-15));

  return { variant, bones };
}

/** Set bone rotation */
export function setBoneRotation(
  skeleton: PlayerSkeleton,
  boneIndex: BoneIndex,
  rotation: Quat,
): void {
  const bone = skeleton.bones.get(boneIndex);
  if (bone) {
    bone.rotation = rotation;
  }
}

/** Set bone position offset (for animation) */
export function setBonePositionOffset(
  skeleton: PlayerSkeleton,
  boneIndex: BoneIndex,
  offset: Vec3,
): void {
  const bone = skeleton.bones.get(boneIndex);
  if (bone) {
    bone.positionOffset = offset;
  }
}

/** Reset all bone rotations and position offsets */
export function resetSkeleton(skeleton: PlayerSkeleton): void {
  for (const bone of skeleton.bones.values()) {
    bone.rotation = quatIdentity();
    bone.positionOffset = [0, 0, 0];
  }

  // Restore default elytra rotation (idle closed position)
  const leftWing = skeleton.bones.get(BoneIndex.LeftWing);
  const rightWing = skeleton.bones.get(BoneIndex.RightWing);
  if (leftWing) {
    leftWing.rotation = quatFromEuler(degToRad(15), degToRad(0.5), degToRad(15));
  }
  if (rightWing) {
    rightWing.rotation = quatFromEuler(degToRad(15), degToRad(-0.5), degToRad(-15));
  }
}

/** Clone a skeleton */
export function cloneSkeleton(skeleton: PlayerSkeleton): PlayerSkeleton {
  const bones = new Map<BoneIndex, Bone>();
  for (const [index, bone] of skeleton.bones) {
    bones.set(index, {
      ...bone,
      position: [...bone.position] as Vec3,
      pivot: [...bone.pivot] as Vec3,
      rotation: [...bone.rotation] as Quat,
      positionOffset: [...bone.positionOffset] as Vec3,
      size: [...bone.size] as Vec3,
    });
  }
  return { variant: skeleton.variant, bones };
}
