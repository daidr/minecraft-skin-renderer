/**
 * bone-utils unit tests
 */

import { describe, it, expect } from "vitest";
import { getBoneLocalMatrix } from "@/model/bone-utils";
import { quatIdentity, quatFromEuler } from "@/core/math/quat";
import { mat4GetTranslation } from "@/core/math/mat4";
import type { Bone } from "@/model/types";
import { BoneIndex } from "@/model/types";

function createTestBone(overrides: Partial<Bone> = {}): Bone {
  return {
    index: BoneIndex.Head,
    name: "head",
    parentIndex: BoneIndex.Root,
    position: [0, 0, 0],
    pivot: [0, 0, 0],
    rotation: quatIdentity(),
    positionOffset: [0, 0, 0],
    size: [8, 8, 8],
    ...overrides,
  };
}

describe("getBoneLocalMatrix", () => {
  it("should return identity-like matrix for default bone", () => {
    const bone = createTestBone();
    const matrix = getBoneLocalMatrix(bone);
    // With zero position, zero pivot, identity rotation
    // the matrix should be effectively identity
    expect(matrix[0]).toBeCloseTo(1);
    expect(matrix[5]).toBeCloseTo(1);
    expect(matrix[10]).toBeCloseTo(1);
    expect(matrix[15]).toBeCloseTo(1);
  });

  it("should incorporate bone position", () => {
    const bone = createTestBone({ position: [5, 10, 15] });
    const matrix = getBoneLocalMatrix(bone);
    const t = mat4GetTranslation(matrix);
    expect(t[0]).toBeCloseTo(5);
    expect(t[1]).toBeCloseTo(10);
    expect(t[2]).toBeCloseTo(15);
  });

  it("should incorporate positionOffset (animation offset)", () => {
    const bone = createTestBone({
      position: [1, 0, 0],
      positionOffset: [2, 3, 4],
    });
    const matrix = getBoneLocalMatrix(bone);
    const t = mat4GetTranslation(matrix);
    expect(t[0]).toBeCloseTo(3); // 1 + 2
    expect(t[1]).toBeCloseTo(3); // 0 + 3
    expect(t[2]).toBeCloseTo(4); // 0 + 4
  });

  it("should apply rotation around pivot point", () => {
    const bone = createTestBone({
      position: [0, 0, 0],
      pivot: [0, 4, 0], // Pivot at y=4
      rotation: quatFromEuler(0, 0, Math.PI / 2), // 90° Z rotation
    });
    const matrix = getBoneLocalMatrix(bone);
    // Matrix = T(pos) * T(pivot) * Rz(90°) * T(-pivot)
    // Applied to origin: (0,0,0) → T(-pivot) → (0,-4,0) → Rz(90°) → (4,0,0) → T(pivot) → (4,4,0)
    const t = mat4GetTranslation(matrix);
    expect(t[0]).toBeCloseTo(4);
    expect(t[1]).toBeCloseTo(4);
    expect(t[2]).toBeCloseTo(0);
  });

  it("should combine position and pivot rotation correctly", () => {
    const bone = createTestBone({
      position: [10, 0, 0],
      pivot: [0, 4, 0],
      rotation: quatFromEuler(0, 0, Math.PI / 2), // 90° Z rotation
    });
    const matrix = getBoneLocalMatrix(bone);
    // T(10,0,0) * T(0,4,0) * Rz(90°) * T(0,-4,0) applied to origin → (14, 4, 0)
    const t = mat4GetTranslation(matrix);
    expect(t[0]).toBeCloseTo(14);
    expect(t[1]).toBeCloseTo(4);
    expect(t[2]).toBeCloseTo(0);
  });
});
