/**
 * Playground main entry point
 */

import { createSkinViewer } from "../src";
import type { SkinViewer } from "../src";

// Default Steve skin (base64 encoded minimal placeholder)
const DEFAULT_SKIN_URL = "./skin.png";

let viewer: SkinViewer | null = null;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// DOM Elements
const canvas = document.getElementById("skinCanvas") as HTMLCanvasElement;
const backendBadge = document.getElementById("backendBadge") as HTMLElement;
const fpsCounter = document.getElementById("fpsCounter") as HTMLElement;

// Skin controls
const skinUrlInput = document.getElementById("skinUrl") as HTMLInputElement;
const loadSkinBtn = document.getElementById("loadSkinBtn") as HTMLButtonElement;
const skinFileInput = document.getElementById("skinFile") as HTMLInputElement;
const slimModelCheckbox = document.getElementById("slimModel") as HTMLInputElement;

// Animation controls
const animationSelect = document.getElementById("animationSelect") as HTMLSelectElement;
const speedSlider = document.getElementById("speedSlider") as HTMLInputElement;
const speedValue = document.getElementById("speedValue") as HTMLElement;
const amplitudeSlider = document.getElementById("amplitudeSlider") as HTMLInputElement;
const amplitudeValue = document.getElementById("amplitudeValue") as HTMLElement;
const playBtn = document.getElementById("playBtn") as HTMLButtonElement;
const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;

// Camera controls
const zoomSlider = document.getElementById("zoomSlider") as HTMLInputElement;
const zoomValue = document.getElementById("zoomValue") as HTMLElement;
const autoRotateCheckbox = document.getElementById("autoRotate") as HTMLInputElement;
const resetCameraBtn = document.getElementById("resetCameraBtn") as HTMLButtonElement;

// Export controls
const screenshotBtn = document.getElementById("screenshotBtn") as HTMLButtonElement;

/**
 * Initialize the viewer
 */
async function init() {
  // Set canvas size
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Create viewer
  try {
    viewer = await createSkinViewer({
      canvas,
      skin: DEFAULT_SKIN_URL,
      antialias: true,
      enableRotate: true,
      enableZoom: true,
    });

    // Update backend badge
    backendBadge.textContent = viewer.backend.toUpperCase();

    // Start render loop
    viewer.startRenderLoop();

    // Start FPS counter
    startFPSCounter();

    // Play default animation
    playAnimation();

    console.log("Minecraft Skin Renderer initialized");
  } catch (error) {
    console.error("Failed to initialize viewer:", error);
    alert("Failed to initialize the skin viewer. Please make sure your browser supports WebGL.");
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Resize canvas to fill container
 */
function resizeCanvas() {
  const container = canvas.parentElement!;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  if (viewer) {
    viewer.resize(rect.width, rect.height);
  }
}

/**
 * Start FPS counter
 */
function startFPSCounter() {
  const updateFPS = () => {
    const now = performance.now();
    frameCount++;

    if (now - lastFrameTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFrameTime = now;
      fpsCounter.textContent = `FPS: ${fps}`;
    }

    requestAnimationFrame(updateFPS);
  };

  updateFPS();
}

/**
 * Play selected animation
 */
function playAnimation() {
  if (!viewer) return;

  const animationName = animationSelect.value;
  if (!animationName) {
    viewer.stopAnimation();
    return;
  }

  const speed = Number.parseFloat(speedSlider.value);
  const amplitude = Number.parseFloat(amplitudeSlider.value);

  viewer.playAnimation(animationName, { speed, amplitude });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Load skin from URL
  loadSkinBtn.addEventListener("click", async () => {
    const url = skinUrlInput.value.trim();
    if (!url || !viewer) return;

    try {
      await viewer.setSkin(url);
    } catch (error) {
      console.error("Failed to load skin:", error);
      alert("Failed to load skin from URL");
    }
  });

  // Load skin from file
  skinFileInput.addEventListener("change", async () => {
    const file = skinFileInput.files?.[0];
    if (!file || !viewer) return;

    try {
      await viewer.setSkin(file);
    } catch (error) {
      console.error("Failed to load skin:", error);
      alert("Failed to load skin from file");
    }
  });

  // Toggle slim model
  slimModelCheckbox.addEventListener("change", () => {
    if (!viewer) return;
    viewer.setSlim(slimModelCheckbox.checked);
  });

  // Animation select
  animationSelect.addEventListener("change", playAnimation);

  // Speed slider
  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedSlider.value;
    playAnimation();
  });

  // Amplitude slider
  amplitudeSlider.addEventListener("input", () => {
    amplitudeValue.textContent = amplitudeSlider.value;
    playAnimation();
  });

  // Play button
  playBtn.addEventListener("click", () => {
    if (!viewer) return;
    viewer.resumeAnimation();
  });

  // Pause button
  pauseBtn.addEventListener("click", () => {
    if (!viewer) return;
    viewer.pauseAnimation();
  });

  // Stop button
  stopBtn.addEventListener("click", () => {
    if (!viewer) return;
    viewer.stopAnimation();
    animationSelect.value = "";
  });

  // Zoom slider
  zoomSlider.addEventListener("input", () => {
    zoomValue.textContent = zoomSlider.value;
    if (viewer) {
      viewer.setZoom(Number.parseFloat(zoomSlider.value));
    }
  });

  // Auto rotate
  autoRotateCheckbox.addEventListener("change", () => {
    if (!viewer) return;
    viewer.setAutoRotate(autoRotateCheckbox.checked);
  });

  // Reset camera
  resetCameraBtn.addEventListener("click", () => {
    if (!viewer) return;
    viewer.resetCamera();
    zoomSlider.value = "50";
    zoomValue.textContent = "50";
  });

  // Screenshot
  screenshotBtn.addEventListener("click", () => {
    if (!viewer) return;

    const dataUrl = viewer.screenshot("png");
    const link = document.createElement("a");
    link.download = "minecraft-skin.png";
    link.href = dataUrl;
    link.click();
  });

  // Update zoom when user zooms with mouse wheel
  canvas.addEventListener("wheel", () => {
    if (!viewer) return;
    const zoom = viewer.getZoom();
    zoomSlider.value = String(Math.round(zoom));
    zoomValue.textContent = String(Math.round(zoom));
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", init);
