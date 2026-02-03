/**
 * Bone Utility Functions
 *
 * Separated to avoid circular dependencies between model/types and core/math.
 */

import { mat4Identity, mat4Translate, mat4Multiply, quatToMat4 } from "../core/math";
import type { Mat4 } from "../core/math";
import type { Bone } from "./types";

/**
 * Compute the local transformation matrix for a bone.
 *
 * The matrix transforms from the bone's parent space to its local space,
 * applying position, rotation around the pivot point, and any animation offsets.
 *
 * @param bone - The bone to compute the matrix for
 * @returns The 4x4 local transformation matrix
 */
export function getBoneLocalMatrix(bone: Bone): Mat4 {
  // Translate to pivot, rotate, translate back, then apply position
  let matrix = mat4Identity();

  // Apply position offset (base position + animation offset)
  matrix = mat4Translate(matrix, [
    bone.position[0] + bone.positionOffset[0],
    bone.position[1] + bone.positionOffset[1],
    bone.position[2] + bone.positionOffset[2],
  ]);

  // Move to pivot point
  matrix = mat4Translate(matrix, bone.pivot);

  // Apply rotation
  const rotMatrix = quatToMat4(bone.rotation);
  matrix = mat4Multiply(matrix, rotMatrix);

  // Move back from pivot
  matrix = mat4Translate(matrix, [-bone.pivot[0], -bone.pivot[1], -bone.pivot[2]]);

  return matrix;
}
