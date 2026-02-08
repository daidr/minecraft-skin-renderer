/**
 * RenderLoop unit tests
 */

import type { Mock } from "vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRenderLoop,
  startRenderLoop,
  stopRenderLoop,
  isRenderLoopRunning,
} from "@/viewer/RenderLoop";

describe("RenderLoop", () => {
  let onUpdate: Mock<(deltaTime: number) => void>;
  let onRender: Mock<() => void>;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;

  beforeEach(() => {
    onUpdate = vi.fn();
    onRender = vi.fn();
    rafCallbacks = new Map();
    rafId = 0;

    // Mock requestAnimationFrame/cancelAnimationFrame
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    });
    globalThis.cancelAnimationFrame = vi.fn((id: number) => {
      rafCallbacks.delete(id);
    });
  });

  function fireFrame(time: number) {
    const cbs = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    for (const [, cb] of cbs) {
      cb(time);
    }
  }

  describe("createRenderLoop", () => {
    it("should create a non-running loop", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      expect(loop.isRunning).toBe(false);
      expect(loop.frameId).toBeNull();
      expect(isRenderLoopRunning(loop)).toBe(false);
    });
  });

  describe("startRenderLoop", () => {
    it("should start the loop", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      startRenderLoop(loop);
      expect(loop.isRunning).toBe(true);
      expect(isRenderLoopRunning(loop)).toBe(true);
    });

    it("should not start twice", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      startRenderLoop(loop);
      const callCount = (globalThis.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls
        .length;
      startRenderLoop(loop); // Should be no-op
      expect((globalThis.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
        callCount,
      );
    });

    it("should call onUpdate and onRender on each frame", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      startRenderLoop(loop);

      // Fire a frame
      fireFrame(loop.lastTime + 16);

      expect(onUpdate).toHaveBeenCalled();
      expect(onRender).toHaveBeenCalled();
    });

    it("should cap delta time to 0.1 seconds", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      startRenderLoop(loop);

      // Fire a frame with a 500ms gap
      fireFrame(loop.lastTime + 500);

      expect(onUpdate).toHaveBeenCalled();
      const deltaTime = onUpdate.mock.calls[0][0];
      expect(deltaTime).toBeLessThanOrEqual(0.1);
    });
  });

  describe("stopRenderLoop", () => {
    it("should stop a running loop", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      startRenderLoop(loop);
      stopRenderLoop(loop);

      expect(loop.isRunning).toBe(false);
      expect(loop.frameId).toBeNull();
      expect(isRenderLoopRunning(loop)).toBe(false);
    });

    it("should not call callbacks after stopping", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      startRenderLoop(loop);
      stopRenderLoop(loop);

      onUpdate.mockClear();
      onRender.mockClear();

      // Fire a frame after stop — callbacks were cleared by cancelAnimationFrame
      fireFrame(2000);

      expect(onUpdate).not.toHaveBeenCalled();
      expect(onRender).not.toHaveBeenCalled();
    });

    it("should be safe to call on a non-running loop", () => {
      const loop = createRenderLoop(onUpdate, onRender);
      expect(() => stopRenderLoop(loop)).not.toThrow();
    });
  });
});
