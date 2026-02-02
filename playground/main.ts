/**
 * Playground main entry point
 */

import { createSkinViewer, PART_NAMES } from "../src";
import type { BackendType, BackEquipment, SkinViewer, PartName } from "../src";

// Default texture paths
const DEFAULT_SKIN_URL = "./default.png";
const DEFAULT_CAPE_URL = "./cape.png";

let viewer: SkinViewer | null = null;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// DOM Elements
let canvas = document.getElementById("skinCanvas") as HTMLCanvasElement;
const backendSelect = document.getElementById("backendSelect") as HTMLSelectElement;
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

// Cape controls
const capeUrlInput = document.getElementById("capeUrl") as HTMLInputElement;
const loadCapeBtn = document.getElementById("loadCapeBtn") as HTMLButtonElement;
const capeFileInput = document.getElementById("capeFile") as HTMLInputElement;
const backEquipmentSelect = document.getElementById("backEquipment") as HTMLSelectElement;
const removeCapeBtn = document.getElementById("removeCapeBtn") as HTMLButtonElement;

// Camera controls
const zoomSlider = document.getElementById("zoomSlider") as HTMLInputElement;
const zoomValue = document.getElementById("zoomValue") as HTMLElement;
const autoRotateCheckbox = document.getElementById("autoRotate") as HTMLInputElement;
const resetCameraBtn = document.getElementById("resetCameraBtn") as HTMLButtonElement;

// Export controls
const screenshotBtn = document.getElementById("screenshotBtn") as HTMLButtonElement;

// Parts visibility controls
const showAllPartsBtn = document.getElementById("showAllParts") as HTMLButtonElement;
const hideAllOuterBtn = document.getElementById("hideAllOuter") as HTMLButtonElement;

/**
 * Initialize the viewer
 */
async function init() {
  // Set canvas size
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Create viewer with selected backend
  await createViewerWithBackend();

  // Setup event listeners
  setupEventListeners();
}

/**
 * Create viewer with specified backend
 */
async function createViewerWithBackend() {
  // Dispose existing viewer if any
  if (viewer) {
    viewer.dispose();
    viewer = null;
  }

  const preferredBackend = backendSelect.value as BackendType | "auto";

  // Canvas can only have one context type, so we need to create a new canvas when switching backends
  const oldCanvas = canvas;
  const newCanvas = document.createElement("canvas");
  newCanvas.id = "skinCanvas";
  oldCanvas.replaceWith(newCanvas);
  canvas = newCanvas;
  resizeCanvas();

  try {
    viewer = await createSkinViewer({
      canvas,
      skin: DEFAULT_SKIN_URL,
      cape: DEFAULT_CAPE_URL,
      preferredBackend,
      antialias: true,
      enableRotate: true,
      enableZoom: true,
    });

    // Update backend badge
    backendBadge.textContent = viewer.backend.toUpperCase();
    backendBadge.className = `backend-badge ${viewer.backend}`;

    // Sync back equipment select with viewer state
    backEquipmentSelect.value = viewer.backEquipment;

    // Start render loop
    viewer.startRenderLoop();

    // Start FPS counter (only once)
    if (fps === 0) {
      startFPSCounter();
    }

    // Play default animation
    playAnimation();

    console.log(`Minecraft Skin Renderer initialized with ${viewer.backend.toUpperCase()} backend`);
  } catch (error) {
    console.error("Failed to initialize viewer:", error);
    alert(
      "Failed to initialize the skin viewer. Please make sure your browser supports WebGL or WebGPU.",
    );
  }
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
  // Backend select - recreate viewer with new backend
  backendSelect.addEventListener("change", async () => {
    await createViewerWithBackend();
  });

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

  // Load cape from URL
  loadCapeBtn.addEventListener("click", async () => {
    const url = capeUrlInput.value.trim();
    if (!url || !viewer) return;

    try {
      await viewer.setCape(url);
      backEquipmentSelect.value = viewer.backEquipment;
    } catch (error) {
      console.error("Failed to load cape:", error);
      alert("Failed to load cape from URL");
    }
  });

  // Load cape from file
  capeFileInput.addEventListener("change", async () => {
    const file = capeFileInput.files?.[0];
    if (!file || !viewer) return;

    try {
      await viewer.setCape(file);
      backEquipmentSelect.value = viewer.backEquipment;
    } catch (error) {
      console.error("Failed to load cape:", error);
      alert("Failed to load cape from file");
    }
  });

  // Back equipment select
  backEquipmentSelect.addEventListener("change", () => {
    if (!viewer) return;
    viewer.setBackEquipment(backEquipmentSelect.value as BackEquipment);
  });

  // Remove cape
  removeCapeBtn.addEventListener("click", async () => {
    if (!viewer) return;
    await viewer.setCape(null);
    backEquipmentSelect.value = "none";
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

  // Parts visibility controls
  for (const part of PART_NAMES) {
    const innerCheckbox = document.getElementById(`${part}-inner`) as HTMLInputElement;
    const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;

    innerCheckbox?.addEventListener("change", () => {
      if (!viewer) return;
      viewer.setPartVisibility(part as PartName, "inner", innerCheckbox.checked);
    });

    outerCheckbox?.addEventListener("change", () => {
      if (!viewer) return;
      viewer.setPartVisibility(part as PartName, "outer", outerCheckbox.checked);
    });
  }

  // Show all parts button
  showAllPartsBtn.addEventListener("click", () => {
    if (!viewer) return;
    for (const part of PART_NAMES) {
      viewer.setPartVisibility(part as PartName, "both", true);
      const innerCheckbox = document.getElementById(`${part}-inner`) as HTMLInputElement;
      const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;
      if (innerCheckbox) innerCheckbox.checked = true;
      if (outerCheckbox) outerCheckbox.checked = true;
    }
  });

  // Hide all outer layers button
  hideAllOuterBtn.addEventListener("click", () => {
    if (!viewer) return;
    for (const part of PART_NAMES) {
      viewer.setPartVisibility(part as PartName, "outer", false);
      const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;
      if (outerCheckbox) outerCheckbox.checked = false;
    }
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", init);
