/**
 * Gaze controller unit tests
 */

import { describe, expect, it, vi } from "vitest";
import {
  computeGazePose,
  computeHeadNdc,
  createGazeController,
  DEFAULT_GAZE_OPTIONS,
} from "@/viewer/GazeController";
import { createPlayerSkeleton } from "@/model/PlayerModel";
import { BoneIndex } from "@/model/types";
import { createCamera } from "@/core/camera/Camera";
import type { Camera } from "@/core/camera/Camera";
import {
  degToRad,
  quatEquals,
  quatFromEuler,
  quatIdentity,
  quatMultiply,
  quatRotateVec3,
} from "@/core/math";

const LEVEL = Math.PI / 2;

function createLevelCamera(): Camera {
  return createCamera(1, { position: [0, 16, 50], target: [0, 16, 0] });
}

function facingYaw(rotation: [number, number, number, number]): number {
  const facing = quatRotateVec3(rotation, [0, 0, 1]);
  return Math.atan2(facing[0], facing[2]);
}

describe("computeGazePose", () => {
  it("returns a neutral pose when the pointer is centred", () => {
    const pose = computeGazePose(0, 0, 0, LEVEL);
    expect(pose.bodyYaw).toBeCloseTo(0, 6);
    expect(pose.headYaw).toBeCloseTo(0, 6);
    expect(pose.headPitch).toBeCloseTo(0, 6);
  });

  it("turns the head towards the pointer and keeps it within the head limit", () => {
    const pose = computeGazePose(0.5, 0, 0, LEVEL);
    // 0.5 * 100deg = 50deg, which fits in the head range
    expect(pose.bodyYaw).toBeCloseTo(0, 6);
    expect(pose.headYaw).toBeCloseTo(degToRad(50), 5);
  });

  it("rotates the body by the yaw excess when the head reaches its limit", () => {
    const pose = computeGazePose(1, 0, 0, LEVEL);
    expect(pose.headYaw).toBeCloseTo(degToRad(DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
    expect(pose.bodyYaw).toBeCloseTo(degToRad(100 - DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
  });

  it("caps the body rotation and leaves the head at its limit", () => {
    // Camera behind the model: requested yaw is 180deg
    const pose = computeGazePose(0, 0, Math.PI, LEVEL);
    expect(pose.bodyYaw).toBeCloseTo(degToRad(DEFAULT_GAZE_OPTIONS.maxBodyYaw), 5);
    expect(pose.headYaw).toBeCloseTo(degToRad(DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
  });

  it("mirrors the axes for negative pointer offsets", () => {
    const pose = computeGazePose(-1, 0, 0, LEVEL);
    expect(pose.headYaw).toBeCloseTo(-degToRad(DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
    expect(pose.bodyYaw).toBeCloseTo(-degToRad(100 - DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
  });

  it("clamps the head pitch and looks up for a pointer above the head", () => {
    const pose = computeGazePose(0, 1, 0, LEVEL);
    expect(pose.headPitch).toBeCloseTo(-degToRad(DEFAULT_GAZE_OPTIONS.maxHeadPitch), 5);
    expect(pose.bodyYaw).toBeCloseTo(0, 6);
    expect(pose.headYaw).toBeCloseTo(0, 6);
  });

  it("follows the camera orbit so the model looks at the pointer from any angle", () => {
    const pose = computeGazePose(0, 0, Math.PI / 2, LEVEL);
    expect(pose.headYaw).toBeCloseTo(degToRad(DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
    expect(pose.bodyYaw).toBeCloseTo(degToRad(90 - DEFAULT_GAZE_OPTIONS.maxHeadYaw), 5);
  });

  it("respects custom options", () => {
    const pose = computeGazePose(1, 0, 0, LEVEL, {
      ...DEFAULT_GAZE_OPTIONS,
      maxHeadYaw: 20,
      maxBodyYaw: 40,
      yawRange: 100,
    });
    expect(pose.bodyYaw).toBeCloseTo(degToRad(40), 5);
    expect(pose.headYaw).toBeCloseTo(degToRad(20), 5);
  });
});

describe("computeHeadNdc", () => {
  it("projects the head centre to screen space", () => {
    const head = computeHeadNdc(createLevelCamera());
    expect(head.x).toBeCloseTo(0, 6);
    // 12 model units above the camera target, projected with a 70deg FOV
    expect(head.y).toBeCloseTo(0.3428, 3);
  });

  it("keeps the head centred horizontally", () => {
    const camera = createCamera(1.5, { position: [30, 16, 40], target: [0, 16, 0] });
    expect(computeHeadNdc(camera).x).toBeCloseTo(0, 4);
  });
});

describe("createGazeController", () => {
  function setup(smoothing = 0) {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const controller = createGazeController(canvas, { smoothing });
    controller.setEnabled(true);
    return { canvas, controller };
  }

  /** Dispatch a pointer event at a normalized canvas position (-1..1) */
  function dispatchPointerAt(ndcX: number, ndcY: number) {
    const clientX = (ndcX + 1) * 50;
    const clientY = (1 - ndcY) * 50;
    window.dispatchEvent(
      typeof PointerEvent === "function"
        ? new PointerEvent("pointermove", { clientX, clientY, bubbles: true })
        : new MouseEvent("pointermove", { clientX, clientY, bubbles: true }),
    );
  }

  it("applies the gaze pose to the head and root bones", () => {
    const { controller } = setup();
    const camera = createLevelCamera();
    const skeleton = createPlayerSkeleton();

    dispatchPointerAt(1, computeHeadNdc(camera).y);
    const changed = controller.update(skeleton, 0, camera);

    expect(changed).toBe(true);
    const head = skeleton.bones.get(BoneIndex.Head)!;
    const root = skeleton.bones.get(BoneIndex.Root)!;

    // Root carries the body yaw, head carries the rest of the request
    expect(facingYaw(root.rotation)).toBeCloseTo(degToRad(45), 4);
    expect(facingYaw(quatMultiply(root.rotation, head.rotation))).toBeCloseTo(degToRad(100), 4);

    controller.dispose();
  });

  it("eases towards the target instead of jumping", () => {
    const { controller } = setup(0.12);
    const camera = createLevelCamera();
    const skeleton = createPlayerSkeleton();

    dispatchPointerAt(1, computeHeadNdc(camera).y);
    controller.update(skeleton, 0.05, camera);

    const head = skeleton.bones.get(BoneIndex.Head)!;
    const yaw = Math.abs(facingYaw(head.rotation));
    expect(yaw).toBeGreaterThan(degToRad(1));
    expect(yaw).toBeLessThan(degToRad(DEFAULT_GAZE_OPTIONS.maxHeadYaw));

    controller.dispose();
  });

  it("restores the pose when disabled", () => {
    const { controller } = setup();
    const camera = createLevelCamera();
    const skeleton = createPlayerSkeleton();

    dispatchPointerAt(1, computeHeadNdc(camera).y);
    controller.update(skeleton, 0, camera);
    expect(quatEquals(skeleton.bones.get(BoneIndex.Head)!.rotation, quatIdentity())).toBe(false);

    controller.setEnabled(false);
    expect(quatEquals(skeleton.bones.get(BoneIndex.Head)!.rotation, quatIdentity())).toBe(true);
    expect(quatEquals(skeleton.bones.get(BoneIndex.Root)!.rotation, quatIdentity())).toBe(true);

    controller.dispose();
  });

  it("treats the head screen position as the neutral point", () => {
    const { controller } = setup();
    const camera = createLevelCamera();
    const skeleton = createPlayerSkeleton();
    const head = skeleton.bones.get(BoneIndex.Head)!;
    const headNdc = computeHeadNdc(camera);

    // Pointer exactly on the head: no gaze offset
    dispatchPointerAt(headNdc.x, headNdc.y);
    controller.update(skeleton, 0, camera);
    expect(quatEquals(head.rotation, quatIdentity())).toBe(true);

    // Pointer below the head: the model looks down
    dispatchPointerAt(0, 0);
    controller.update(skeleton, 0, camera);
    expect(quatRotateVec3(head.rotation, [0, 0, 1])[1]).toBeLessThan(0);

    controller.dispose();
  });

  it("keeps the animation head pose underneath the gaze without doubling it", () => {
    const { controller } = setup();
    const camera = createLevelCamera();
    const skeleton = createPlayerSkeleton();
    const head = skeleton.bones.get(BoneIndex.Head)!;

    // Pointer on the head -> neutral gaze, then an animation writes a 10 degree nod
    dispatchPointerAt(0, computeHeadNdc(camera).y);
    controller.update(skeleton, 0, camera);
    const animationPose = quatFromEuler(degToRad(10), 0, 0);
    head.rotation = animationPose;

    // The gaze is still neutral: the animation pose must be preserved as-is
    controller.update(skeleton, 0, camera);
    expect(quatEquals(head.rotation, animationPose)).toBe(true);

    // ... and not accumulate on the next frame either
    controller.update(skeleton, 0, camera);
    expect(quatEquals(head.rotation, animationPose)).toBe(true);

    controller.dispose();
  });

  it("layers the gaze on top of the animation pose", () => {
    const { controller } = setup();
    const camera = createLevelCamera();
    const skeleton = createPlayerSkeleton();
    const head = skeleton.bones.get(BoneIndex.Head)!;

    controller.update(skeleton, 0, camera);
    head.rotation = quatFromEuler(degToRad(10), 0, 0);

    dispatchPointerAt(0.5, computeHeadNdc(camera).y); // 50% -> 50deg head yaw
    controller.update(skeleton, 0, camera);

    // Yaw still matches the requested gaze, the nod is preserved as pitch
    const facing = quatRotateVec3(head.rotation, [0, 0, 1]);
    expect(Math.atan2(facing[0], facing[2])).toBeCloseTo(degToRad(50), 3);
    expect(facing[1]).toBeCloseTo(-Math.sin(degToRad(10)), 3);

    controller.dispose();
  });
});
