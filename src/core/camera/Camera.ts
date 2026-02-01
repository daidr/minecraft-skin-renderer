/**
 * Camera system for 3D rendering
 */

import { mat4Identity, mat4LookAt, mat4Multiply, mat4Perspective } from "../math";
import type { Mat4, Vec3 } from "../math";

/** Camera configuration */
export interface CameraOptions {
  fov?: number; // Field of view in degrees
  near?: number; // Near clipping plane
  far?: number; // Far clipping plane
  position?: Vec3; // Initial camera position
  target?: Vec3; // Look-at target
  up?: Vec3; // Up vector
}

/** Camera state */
export interface Camera {
  fov: number;
  near: number;
  far: number;
  aspect: number;
  position: Vec3;
  target: Vec3;
  up: Vec3;
  projectionMatrix: Mat4;
  viewMatrix: Mat4;
  viewProjectionMatrix: Mat4;
}

/** Default camera options */
const DEFAULT_OPTIONS: Required<CameraOptions> = {
  fov: 70,
  near: 0.1,
  far: 1000,
  position: [0, 20, 50],
  target: [0, 12, 0],
  up: [0, 1, 0],
};

/**
 * Create a camera
 */
export function createCamera(aspect: number, options: CameraOptions = {}): Camera {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const camera: Camera = {
    fov: opts.fov,
    near: opts.near,
    far: opts.far,
    aspect,
    position: [...opts.position] as Vec3,
    target: [...opts.target] as Vec3,
    up: [...opts.up] as Vec3,
    projectionMatrix: mat4Identity(),
    viewMatrix: mat4Identity(),
    viewProjectionMatrix: mat4Identity(),
  };

  updateCameraMatrices(camera);
  return camera;
}

/**
 * Update camera matrices after changing parameters
 */
export function updateCameraMatrices(camera: Camera): void {
  // Convert FOV to radians
  const fovRad = (camera.fov * Math.PI) / 180;

  // Update projection matrix
  camera.projectionMatrix = mat4Perspective(fovRad, camera.aspect, camera.near, camera.far);

  // Update view matrix
  camera.viewMatrix = mat4LookAt(camera.position, camera.target, camera.up);

  // Update combined matrix
  camera.viewProjectionMatrix = mat4Multiply(camera.projectionMatrix, camera.viewMatrix);
}

/**
 * Set camera aspect ratio
 */
export function setCameraAspect(camera: Camera, aspect: number): void {
  camera.aspect = aspect;
  updateCameraMatrices(camera);
}

/**
 * Set camera position
 */
export function setCameraPosition(camera: Camera, position: Vec3): void {
  camera.position = [...position] as Vec3;
  updateCameraMatrices(camera);
}

/**
 * Set camera target
 */
export function setCameraTarget(camera: Camera, target: Vec3): void {
  camera.target = [...target] as Vec3;
  updateCameraMatrices(camera);
}

/**
 * Set camera FOV
 */
export function setCameraFOV(camera: Camera, fov: number): void {
  camera.fov = fov;
  updateCameraMatrices(camera);
}

/**
 * Get view-projection matrix
 */
export function getCameraVPMatrix(camera: Camera): Mat4 {
  return camera.viewProjectionMatrix;
}
