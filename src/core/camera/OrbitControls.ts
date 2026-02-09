/**
 * Orbit controls for camera rotation around a target
 */

import { clamp, degToRad, vec3 } from "../math";
import type { Vec3 } from "../math";
import { setCameraPosition } from "./Camera";
import type { Camera } from "./Camera";

/** Orbit controls configuration */
export interface OrbitControlsOptions {
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  rotateSpeed?: number;
  zoomSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number; // radians
  maxPolarAngle?: number; // radians
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

/** Orbit controls state */
export interface OrbitControls {
  enabled: boolean;
  enableRotate: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  rotateSpeed: number;
  zoomSpeed: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  autoRotate: boolean;
  autoRotateSpeed: number;

  // Internal state
  theta: number; // Horizontal angle (radians)
  phi: number; // Vertical angle (radians)
  distance: number; // Distance from target
  target: Vec3; // Orbit target point

  // Interaction state
  isDragging: boolean;
  lastX: number;
  lastY: number;

  // References
  camera: Camera;
  element: HTMLElement;
  dispose: () => void;
}

/** Default options */
const DEFAULT_OPTIONS: Required<OrbitControlsOptions> = {
  enableRotate: true,
  enableZoom: true,
  enablePan: false,
  rotateSpeed: 1.0,
  zoomSpeed: 1.0,
  minDistance: 20,
  maxDistance: 200,
  minPolarAngle: degToRad(10),
  maxPolarAngle: degToRad(170),
  autoRotate: false,
  autoRotateSpeed: 30.0, // degrees per second
};

/**
 * Create orbit controls
 */
export function createOrbitControls(
  camera: Camera,
  element: HTMLElement,
  options: OrbitControlsOptions = {},
): OrbitControls {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Calculate initial spherical coordinates from camera position
  const dx = camera.position[0] - camera.target[0];
  const dy = camera.position[1] - camera.target[1];
  const dz = camera.position[2] - camera.target[2];

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const theta = Math.atan2(dx, dz);
  const phi = Math.acos(clamp(dy / distance, -1, 1));

  const controls: OrbitControls = {
    enabled: true,
    enableRotate: opts.enableRotate,
    enableZoom: opts.enableZoom,
    enablePan: opts.enablePan,
    rotateSpeed: opts.rotateSpeed,
    zoomSpeed: opts.zoomSpeed,
    minDistance: opts.minDistance,
    maxDistance: opts.maxDistance,
    minPolarAngle: opts.minPolarAngle,
    maxPolarAngle: opts.maxPolarAngle,
    autoRotate: opts.autoRotate,
    autoRotateSpeed: opts.autoRotateSpeed,

    theta,
    phi,
    distance,
    target: [...camera.target] as Vec3,

    isDragging: false,
    lastX: 0,
    lastY: 0,

    camera,
    element,
    dispose: () => {},
  };

  // Event handlers
  const onPointerDown = (e: PointerEvent) => {
    if (!controls.enabled || !controls.enableRotate) return;

    controls.isDragging = true;
    controls.lastX = e.clientX;
    controls.lastY = e.clientY;

    element.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!controls.enabled || !controls.isDragging) return;

    const deltaX = e.clientX - controls.lastX;
    const deltaY = e.clientY - controls.lastY;

    controls.lastX = e.clientX;
    controls.lastY = e.clientY;

    // Update angles
    const rotateScale = 0.005 * controls.rotateSpeed;
    controls.theta -= deltaX * rotateScale;
    controls.phi -= deltaY * rotateScale;

    // Clamp phi
    controls.phi = clamp(controls.phi, controls.minPolarAngle, controls.maxPolarAngle);

    updateOrbitCamera(controls);
  };

  const onPointerUp = (e: PointerEvent) => {
    controls.isDragging = false;
    element.releasePointerCapture(e.pointerId);
  };

  const onWheel = (e: WheelEvent) => {
    if (!controls.enabled || !controls.enableZoom) return;

    e.preventDefault();

    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    controls.distance *= delta ** controls.zoomSpeed;

    // Clamp distance
    controls.distance = clamp(controls.distance, controls.minDistance, controls.maxDistance);

    updateOrbitCamera(controls);
  };

  // Prevent default touch actions (scrolling/zooming) on the element
  // so pointer events work without triggering page scroll on mobile
  const previousTouchAction = element.style.touchAction;
  element.style.touchAction = "none";

  // Attach event listeners
  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerUp);
  element.addEventListener("pointercancel", onPointerUp);
  element.addEventListener("wheel", onWheel, { passive: false });

  // Dispose function
  controls.dispose = () => {
    element.style.touchAction = previousTouchAction;
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerUp);
    element.removeEventListener("wheel", onWheel);
  };

  return controls;
}

/**
 * Update camera position from orbit controls
 */
export function updateOrbitCamera(controls: OrbitControls): void {
  const { theta, phi, distance, target, camera } = controls;

  // Convert spherical to Cartesian coordinates
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const x = target[0] + distance * sinPhi * sinTheta;
  const y = target[1] + distance * cosPhi;
  const z = target[2] + distance * sinPhi * cosTheta;

  setCameraPosition(camera, vec3(x, y, z));
}

/**
 * Update orbit controls (call in animation loop for auto-rotate)
 */
export function updateOrbitControls(controls: OrbitControls, deltaTime: number): void {
  if (!controls.enabled) return;

  if (controls.autoRotate && !controls.isDragging) {
    controls.theta += degToRad(controls.autoRotateSpeed) * deltaTime;
    updateOrbitCamera(controls);
  }
}

/**
 * Set orbit rotation
 */
export function setOrbitRotation(controls: OrbitControls, theta: number, phi: number): void {
  controls.theta = theta;
  controls.phi = clamp(phi, controls.minPolarAngle, controls.maxPolarAngle);
  updateOrbitCamera(controls);
}

/**
 * Get current orbit rotation
 */
export function getOrbitRotation(controls: OrbitControls): { theta: number; phi: number } {
  return { theta: controls.theta, phi: controls.phi };
}

/**
 * Set orbit distance (zoom)
 */
export function setOrbitDistance(controls: OrbitControls, distance: number): void {
  controls.distance = clamp(distance, controls.minDistance, controls.maxDistance);
  updateOrbitCamera(controls);
}

/**
 * Get current orbit distance
 */
export function getOrbitDistance(controls: OrbitControls): number {
  return controls.distance;
}

/**
 * Reset orbit controls to default position
 */
export function resetOrbitControls(controls: OrbitControls): void {
  controls.theta = 0;
  controls.phi = Math.PI / 2;
  controls.distance = 50; // Default zoom distance
  updateOrbitCamera(controls);
}
