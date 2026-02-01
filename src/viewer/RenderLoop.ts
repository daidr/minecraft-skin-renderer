/**
 * Render loop management
 */

/** Render loop state */
export interface RenderLoop {
  isRunning: boolean;
  lastTime: number;
  frameId: number | null;
  onUpdate: (deltaTime: number) => void;
  onRender: () => void;
}

/**
 * Create a render loop
 */
export function createRenderLoop(
  onUpdate: (deltaTime: number) => void,
  onRender: () => void,
): RenderLoop {
  return {
    isRunning: false,
    lastTime: 0,
    frameId: null,
    onUpdate,
    onRender,
  };
}

/**
 * Start the render loop
 */
export function startRenderLoop(loop: RenderLoop): void {
  if (loop.isRunning) return;

  loop.isRunning = true;
  loop.lastTime = performance.now();

  const tick = (currentTime: number) => {
    if (!loop.isRunning) return;

    const deltaTime = (currentTime - loop.lastTime) / 1000; // Convert to seconds
    loop.lastTime = currentTime;

    // Cap delta time to prevent huge jumps
    const cappedDelta = Math.min(deltaTime, 0.1);

    loop.onUpdate(cappedDelta);
    loop.onRender();

    loop.frameId = requestAnimationFrame(tick);
  };

  loop.frameId = requestAnimationFrame(tick);
}

/**
 * Stop the render loop
 */
export function stopRenderLoop(loop: RenderLoop): void {
  loop.isRunning = false;

  if (loop.frameId !== null) {
    cancelAnimationFrame(loop.frameId);
    loop.frameId = null;
  }
}

/**
 * Check if render loop is running
 */
export function isRenderLoopRunning(loop: RenderLoop): boolean {
  return loop.isRunning;
}
