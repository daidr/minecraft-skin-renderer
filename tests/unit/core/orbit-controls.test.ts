/**
 * OrbitControls unit tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOrbitControls,
  updateOrbitControls,
  setOrbitRotation,
  getOrbitRotation,
  setOrbitDistance,
  getOrbitDistance,
  resetOrbitControls,
  updateOrbitCamera,
} from "@/core/camera/OrbitControls";
import { createCamera } from "@/core/camera/Camera";
import type { Camera } from "@/core/camera/Camera";
import { degToRad } from "@/core/math";

describe("OrbitControls", () => {
  let camera: Camera;
  let element: HTMLElement;

  beforeEach(() => {
    camera = createCamera(1.0, {
      position: [0, 16, 50],
      target: [0, 16, 0],
    });
    element = document.createElement("div");
    // Mock methods that happy-dom may not fully implement
    element.setPointerCapture = vi.fn();
    element.releasePointerCapture = vi.fn();
  });

  describe("createOrbitControls", () => {
    it("should create controls with default options", () => {
      const controls = createOrbitControls(camera, element);
      expect(controls.enabled).toBe(true);
      expect(controls.enableRotate).toBe(true);
      expect(controls.enableZoom).toBe(true);
      expect(controls.enablePan).toBe(false);
      expect(controls.autoRotate).toBe(false);
      expect(controls.isDragging).toBe(false);
      expect(controls.onDistanceChange).toBeNull();
      expect(controls.onRotationChange).toBeNull();
    });

    it("should respect custom options", () => {
      const controls = createOrbitControls(camera, element, {
        enableRotate: false,
        enableZoom: false,
        autoRotate: true,
        autoRotateSpeed: 60,
        minDistance: 10,
        maxDistance: 100,
      });
      expect(controls.enableRotate).toBe(false);
      expect(controls.enableZoom).toBe(false);
      expect(controls.autoRotate).toBe(true);
      expect(controls.autoRotateSpeed).toBe(60);
      expect(controls.minDistance).toBe(10);
      expect(controls.maxDistance).toBe(100);
    });

    it("should calculate initial spherical coordinates from camera position", () => {
      const controls = createOrbitControls(camera, element);
      // Camera at [0, 16, 50], target at [0, 16, 0] → dx=0, dy=0, dz=50
      // theta = atan2(0, 50) = 0
      // phi = acos(0/50) = PI/2
      // distance = 50
      expect(controls.theta).toBeCloseTo(0, 5);
      expect(controls.phi).toBeCloseTo(Math.PI / 2, 5);
      expect(controls.distance).toBeCloseTo(50, 5);
    });

    it("should compute correct spherical coords for off-axis camera", () => {
      const offCamera = createCamera(1.0, {
        position: [50, 16, 0],
        target: [0, 16, 0],
      });
      const controls = createOrbitControls(offCamera, element);
      // dx=50, dy=0, dz=0 → theta=atan2(50,0)=PI/2, phi=acos(0/50)=PI/2
      expect(controls.theta).toBeCloseTo(Math.PI / 2, 5);
      expect(controls.phi).toBeCloseTo(Math.PI / 2, 5);
      expect(controls.distance).toBeCloseTo(50, 5);
    });

    it("should provide a dispose function", () => {
      const controls = createOrbitControls(camera, element);
      expect(typeof controls.dispose).toBe("function");
      // Should not throw
      controls.dispose();
    });
  });

  describe("setOrbitRotation / getOrbitRotation", () => {
    it("should set and get rotation angles", () => {
      const controls = createOrbitControls(camera, element);
      setOrbitRotation(controls, 1.5, 1.0);
      const rot = getOrbitRotation(controls);
      expect(rot.theta).toBeCloseTo(1.5, 5);
      expect(rot.phi).toBeCloseTo(1.0, 5);
    });

    it("should clamp phi to minPolarAngle / maxPolarAngle", () => {
      const controls = createOrbitControls(camera, element, {
        minPolarAngle: degToRad(30),
        maxPolarAngle: degToRad(150),
      });

      // Try to set phi below minimum
      setOrbitRotation(controls, 0, degToRad(10));
      expect(controls.phi).toBeCloseTo(degToRad(30), 5);

      // Try to set phi above maximum
      setOrbitRotation(controls, 0, degToRad(170));
      expect(controls.phi).toBeCloseTo(degToRad(150), 5);

      // Valid value in range
      setOrbitRotation(controls, 0, degToRad(90));
      expect(controls.phi).toBeCloseTo(degToRad(90), 5);
    });

    it("should update camera position after setOrbitRotation", () => {
      const controls = createOrbitControls(camera, element);
      const posBefore = [...camera.position];
      setOrbitRotation(controls, Math.PI / 4, Math.PI / 3);
      // Camera position should have changed
      const posAfter = camera.position;
      expect(posAfter[0]).not.toBeCloseTo(posBefore[0], 1);
    });
  });

  describe("setOrbitDistance / getOrbitDistance", () => {
    it("should set and get distance", () => {
      const controls = createOrbitControls(camera, element);
      setOrbitDistance(controls, 80);
      expect(getOrbitDistance(controls)).toBeCloseTo(80, 5);
    });

    it("should clamp distance to minDistance / maxDistance", () => {
      const controls = createOrbitControls(camera, element, {
        minDistance: 20,
        maxDistance: 100,
      });

      setOrbitDistance(controls, 5);
      expect(getOrbitDistance(controls)).toBeCloseTo(20, 5);

      setOrbitDistance(controls, 999);
      expect(getOrbitDistance(controls)).toBeCloseTo(100, 5);
    });
  });

  describe("resetOrbitControls", () => {
    it("should reset to defaults (theta=0, phi=PI/2, distance=50)", () => {
      const controls = createOrbitControls(camera, element);
      setOrbitRotation(controls, 2.0, 1.0);
      setOrbitDistance(controls, 80);

      resetOrbitControls(controls);
      expect(controls.theta).toBeCloseTo(0, 5);
      expect(controls.phi).toBeCloseTo(Math.PI / 2, 5);
      expect(controls.distance).toBeCloseTo(50, 5);
    });
  });

  describe("updateOrbitControls (autoRotate)", () => {
    it("should rotate theta when autoRotate is enabled and not dragging", () => {
      const controls = createOrbitControls(camera, element, {
        autoRotate: true,
        autoRotateSpeed: 90, // 90 deg/s
      });
      const thetaBefore = controls.theta;
      updateOrbitControls(controls, 1.0); // 1 second
      // theta should increase by degToRad(90)
      expect(controls.theta).toBeCloseTo(thetaBefore + degToRad(90), 3);
    });

    it("should not rotate when autoRotate is disabled", () => {
      const controls = createOrbitControls(camera, element, {
        autoRotate: false,
        autoRotateSpeed: 90,
      });
      const thetaBefore = controls.theta;
      updateOrbitControls(controls, 1.0);
      expect(controls.theta).toBeCloseTo(thetaBefore, 5);
    });

    it("should not rotate when dragging", () => {
      const controls = createOrbitControls(camera, element, {
        autoRotate: true,
        autoRotateSpeed: 90,
      });
      controls.isDragging = true;
      const thetaBefore = controls.theta;
      updateOrbitControls(controls, 1.0);
      expect(controls.theta).toBeCloseTo(thetaBefore, 5);
    });

    it("should not rotate when disabled", () => {
      const controls = createOrbitControls(camera, element, {
        autoRotate: true,
        autoRotateSpeed: 90,
      });
      controls.enabled = false;
      const thetaBefore = controls.theta;
      updateOrbitControls(controls, 1.0);
      expect(controls.theta).toBeCloseTo(thetaBefore, 5);
    });

    it("should fire onRotationChange callback during autoRotate", () => {
      const controls = createOrbitControls(camera, element, {
        autoRotate: true,
        autoRotateSpeed: 30,
      });
      const callback = vi.fn();
      controls.onRotationChange = callback;
      updateOrbitControls(controls, 0.5);
      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(controls.theta, controls.phi);
    });

    it("should not fire onRotationChange when autoRotate is off", () => {
      const controls = createOrbitControls(camera, element, {
        autoRotate: false,
      });
      const callback = vi.fn();
      controls.onRotationChange = callback;
      updateOrbitControls(controls, 1.0);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("updateOrbitCamera", () => {
    it("should update camera position based on spherical coords", () => {
      const controls = createOrbitControls(camera, element);
      controls.theta = 0;
      controls.phi = Math.PI / 2;
      controls.distance = 50;
      controls.target = [0, 16, 0];

      updateOrbitCamera(controls);

      // theta=0, phi=PI/2 → x=50*sin(PI/2)*sin(0)=0, y=16+50*cos(PI/2)=16, z=50*sin(PI/2)*cos(0)=50
      expect(camera.position[0]).toBeCloseTo(0, 3);
      expect(camera.position[1]).toBeCloseTo(16, 3);
      expect(camera.position[2]).toBeCloseTo(50, 3);
    });

    it("should offset by target position", () => {
      const controls = createOrbitControls(camera, element);
      controls.theta = 0;
      controls.phi = Math.PI / 2;
      controls.distance = 50;
      controls.target = [10, 20, 5];

      updateOrbitCamera(controls);

      expect(camera.position[0]).toBeCloseTo(10, 3);
      expect(camera.position[1]).toBeCloseTo(20, 3);
      expect(camera.position[2]).toBeCloseTo(55, 3);
    });
  });

  describe("onDistanceChange callback", () => {
    it("should fire on wheel zoom", () => {
      const controls = createOrbitControls(camera, element, {
        enableZoom: true,
      });
      const callback = vi.fn();
      controls.onDistanceChange = callback;

      // Simulate wheel event
      const wheelEvent = new WheelEvent("wheel", {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(wheelEvent);

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });

    it("should not fire wheel zoom when enableZoom is false", () => {
      const controls = createOrbitControls(camera, element, {
        enableZoom: false,
      });
      const callback = vi.fn();
      controls.onDistanceChange = callback;

      const wheelEvent = new WheelEvent("wheel", {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(wheelEvent);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should clean up event listeners", () => {
      const removeEventListenerSpy = vi.spyOn(element, "removeEventListener");
      const controls = createOrbitControls(camera, element);
      controls.dispose();

      // Should remove pointer and wheel event listeners
      const removedTypes = removeEventListenerSpy.mock.calls.map((call) => call[0]);
      expect(removedTypes).toContain("pointerdown");
      expect(removedTypes).toContain("pointermove");
      expect(removedTypes).toContain("pointerup");
      expect(removedTypes).toContain("pointercancel");
      expect(removedTypes).toContain("wheel");
    });
  });
});
