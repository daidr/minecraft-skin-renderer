/**
 * Performance test - unlimited frame rate rendering
 */

import { createSkinViewer } from "../src";
import type { BackendType, SkinViewer } from "../src";

// Default textures
const DEFAULT_SKIN_URL = "./default.png";
const DEFAULT_CAPE_URL = "./cape.png";

// DOM Elements
const backendSelect = document.getElementById("backendSelect") as HTMLSelectElement;
const backendBadge = document.getElementById("backendBadge") as HTMLElement;
const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
const fpsValue = document.getElementById("fpsValue") as HTMLElement;
const frameTimeValue = document.getElementById("frameTimeValue") as HTMLElement;
const frameCountValue = document.getElementById("frameCountValue") as HTMLElement;

// State
let viewer: SkinViewer | null = null;
let isRunning = false;
let totalFrames = 0;
let lastFpsUpdate = 0;
let framesSinceLastUpdate = 0;

// Use MessageChannel for faster scheduling than setTimeout
const channel = new MessageChannel();
channel.port1.onmessage = () => {
  if (isRunning) unlimitedRenderLoop();
};

function scheduleNextFrame(): void {
  channel.port2.postMessage(null);
}

function getCanvas(): HTMLCanvasElement {
  return document.getElementById("canvas") as HTMLCanvasElement;
}

/**
 * Initialize the viewer
 */
async function initViewer(): Promise<void> {
  if (viewer) {
    viewer.dispose();
    viewer = null;
  }

  // Replace canvas to reset context
  const oldCanvas = getCanvas();
  const container = oldCanvas.parentElement!;
  const newCanvas = document.createElement("canvas");
  newCanvas.id = "canvas";
  oldCanvas.replaceWith(newCanvas);

  const rect = container.getBoundingClientRect();
  newCanvas.width = rect.width * devicePixelRatio;
  newCanvas.height = rect.height * devicePixelRatio;
  newCanvas.style.width = `${rect.width}px`;
  newCanvas.style.height = `${rect.height}px`;

  const preferredBackend = backendSelect.value as BackendType | "auto";

  viewer = await createSkinViewer({
    canvas: newCanvas,
    skin: DEFAULT_SKIN_URL,
    cape: DEFAULT_CAPE_URL,
    preferredBackend,
    antialias: true,
    enableRotate: true,
    enableZoom: true,
    autoRotate: true,
    autoRotateSpeed: 60,
  });

  // Update backend badge
  backendBadge.textContent = viewer.backend.toUpperCase();
  backendBadge.className = `backend-badge ${viewer.backend}`;

  // Play walk animation
  viewer.playAnimation("walk", { speed: 1.0 });
}

/**
 * Unlimited frame rate render loop using MessageChannel
 */
function unlimitedRenderLoop(): void {
  if (!isRunning || !viewer) return;

  const now = performance.now();

  // Render frame
  viewer.render();

  // Track frames
  totalFrames++;
  framesSinceLastUpdate++;

  // Update stats every 100ms
  if (now - lastFpsUpdate >= 100) {
    const elapsed = (now - lastFpsUpdate) / 1000;
    const fps = framesSinceLastUpdate / elapsed;
    const frameTime = (elapsed / framesSinceLastUpdate) * 1000;

    fpsValue.textContent = fps.toFixed(0);
    fpsValue.className = `stat-value ${fps < 30 ? "danger" : fps < 60 ? "warning" : ""}`;

    frameTimeValue.textContent = `${frameTime.toFixed(2)}ms`;
    frameCountValue.textContent = totalFrames.toLocaleString();

    framesSinceLastUpdate = 0;
    lastFpsUpdate = now;
  }

  // Schedule next frame immediately (no vsync wait)
  scheduleNextFrame();
}

/**
 * Start the performance test
 */
function start(): void {
  if (isRunning) return;

  isRunning = true;
  totalFrames = 0;
  framesSinceLastUpdate = 0;
  lastFpsUpdate = performance.now();

  // Use the viewer's render loop for animation updates
  viewer?.startRenderLoop();

  // Start unlimited rendering
  unlimitedRenderLoop();

  startBtn.disabled = true;
  stopBtn.disabled = false;
  backendSelect.disabled = true;
}

/**
 * Stop the performance test
 */
function stop(): void {
  if (!isRunning) return;

  isRunning = false;
  viewer?.stopRenderLoop();

  startBtn.disabled = false;
  stopBtn.disabled = true;
  backendSelect.disabled = false;
}

/**
 * Handle backend change
 */
async function handleBackendChange(): Promise<void> {
  const wasRunning = isRunning;
  if (wasRunning) stop();

  await initViewer();

  if (wasRunning) start();
}

// Setup event listeners
startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
backendSelect.addEventListener("change", handleBackendChange);

// Initialize on load
document.addEventListener("DOMContentLoaded", async () => {
  await initViewer();
});
