/**
 * Playground main entry point
 */

import Stats from "stats.js";
import { use, createSkinViewer, PART_NAMES } from "../src";
import type { BackendType, BackEquipment, SkinViewer, PartName } from "../src";
import { WebGLRendererPlugin } from "../src/webgl";
import { WebGPURendererPlugin } from "../src/webgpu";
import { PanoramaPlugin } from "../src/panorama";

// Register all plugins for the playground
use(WebGLRendererPlugin);
use(WebGPURendererPlugin);
use(PanoramaPlugin);

// Default texture paths
const DEFAULT_SKIN_URL = "./skin.png";
const DEFAULT_CAPE_URL = "./cape.png";
const DEFAULT_PANORAMA_URL = "./panorama.png";

// LocalStorage key for settings
const STORAGE_KEY = "minecraft-skin-renderer-playground-settings";

// Settings interface
interface PlaygroundSettings {
  backend: string;
  slimModel: boolean;
  animation: string;
  animationSpeed: number;
  animationAmplitude: number;
  backEquipment: string;
  zoom: number;
  autoRotate: boolean;
  partsVisibility: Record<string, { inner: boolean; outer: boolean }>;
  panoramaUrl: string;
}

let viewer: SkinViewer | null = null;

// Stats.js for FPS monitoring
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
stats.dom.style.position = "absolute";
stats.dom.style.top = "8px";
stats.dom.style.left = "8px";

// Current texture sources (for preserving across backend switches)
// Can be URL string, File, or Blob
type TextureSource = string | File | Blob | null;
let currentSkinSource: TextureSource = DEFAULT_SKIN_URL;
let currentCapeSource: TextureSource = DEFAULT_CAPE_URL;

// DOM Elements
let canvas = document.getElementById("skinCanvas") as HTMLCanvasElement;
const backendSelect = document.getElementById("backendSelect") as HTMLSelectElement;
const backendBadge = document.getElementById("backendBadge") as HTMLElement;

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

// Panorama controls
const loadDefaultPanoramaBtn = document.getElementById(
  "loadDefaultPanoramaBtn",
) as HTMLButtonElement;
const panoramaUrlInput = document.getElementById("panoramaUrl") as HTMLInputElement;
const loadPanoramaBtn = document.getElementById("loadPanoramaBtn") as HTMLButtonElement;
const panoramaFileInput = document.getElementById("panoramaFile") as HTMLInputElement;
const clearPanoramaBtn = document.getElementById("clearPanoramaBtn") as HTMLButtonElement;

// Current panorama source (for preserving across backend switches)
let currentPanoramaSource: TextureSource = null;

/**
 * Get default settings
 */
function getDefaultSettings(): PlaygroundSettings {
  const partsVisibility: Record<string, { inner: boolean; outer: boolean }> = {};
  for (const part of PART_NAMES) {
    partsVisibility[part] = { inner: true, outer: true };
  }
  return {
    backend: "auto",
    slimModel: false,
    animation: "idle",
    animationSpeed: 1,
    animationAmplitude: 1,
    backEquipment: "cape",
    zoom: 50,
    autoRotate: false,
    partsVisibility,
    panoramaUrl: "",
  };
}

/**
 * Load settings from localStorage
 */
function loadSettings(): PlaygroundSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PlaygroundSettings>;
      // Merge with defaults to handle missing fields
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load settings from localStorage:", e);
  }
  return getDefaultSettings();
}

/**
 * Get current settings from UI controls
 */
function getCurrentSettingsFromUI(): PlaygroundSettings {
  const partsVisibility: Record<string, { inner: boolean; outer: boolean }> = {};
  for (const part of PART_NAMES) {
    const innerCheckbox = document.getElementById(`${part}-inner`) as HTMLInputElement;
    const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;
    partsVisibility[part] = {
      inner: innerCheckbox?.checked ?? true,
      outer: outerCheckbox?.checked ?? true,
    };
  }

  return {
    backend: backendSelect.value,
    slimModel: slimModelCheckbox.checked,
    animation: animationSelect.value,
    animationSpeed: Number.parseFloat(speedSlider.value),
    animationAmplitude: Number.parseFloat(amplitudeSlider.value),
    backEquipment: backEquipmentSelect.value,
    zoom: Number.parseFloat(zoomSlider.value),
    autoRotate: autoRotateCheckbox.checked,
    partsVisibility,
    panoramaUrl: panoramaUrlInput?.value ?? "",
  };
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  // Update currentSettings from UI
  currentSettings = getCurrentSettingsFromUI();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  } catch (e) {
    console.warn("Failed to save settings to localStorage:", e);
  }
}

/**
 * Apply settings to UI controls
 */
function applySettingsToUI(settings: PlaygroundSettings) {
  backendSelect.value = settings.backend;
  slimModelCheckbox.checked = settings.slimModel;
  animationSelect.value = settings.animation;
  speedSlider.value = String(settings.animationSpeed);
  speedValue.textContent = String(settings.animationSpeed);
  amplitudeSlider.value = String(settings.animationAmplitude);
  amplitudeValue.textContent = String(settings.animationAmplitude);
  backEquipmentSelect.value = settings.backEquipment;
  zoomSlider.value = String(settings.zoom);
  zoomValue.textContent = String(settings.zoom);
  autoRotateCheckbox.checked = settings.autoRotate;

  // Apply parts visibility
  for (const part of PART_NAMES) {
    const innerCheckbox = document.getElementById(`${part}-inner`) as HTMLInputElement;
    const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;
    const visibility = settings.partsVisibility[part] ?? { inner: true, outer: true };
    if (innerCheckbox) innerCheckbox.checked = visibility.inner;
    if (outerCheckbox) outerCheckbox.checked = visibility.outer;
  }

  // Apply panorama settings
  if (panoramaUrlInput) panoramaUrlInput.value = settings.panoramaUrl;
}

/**
 * Apply settings to viewer
 */
function applySettingsToViewer(settings: PlaygroundSettings) {
  if (!viewer) return;

  viewer.setSlim(settings.slimModel);
  viewer.setBackEquipment(settings.backEquipment as BackEquipment);
  viewer.setZoom(settings.zoom);
  viewer.setAutoRotate(settings.autoRotate);

  // Apply parts visibility
  for (const part of PART_NAMES) {
    const visibility = settings.partsVisibility[part] ?? { inner: true, outer: true };
    viewer.setPartVisibility(part as PartName, "inner", visibility.inner);
    viewer.setPartVisibility(part as PartName, "outer", visibility.outer);
  }
}

// Loaded settings (shared between init and createViewerWithBackend)
let currentSettings: PlaygroundSettings;

/**
 * Initialize the viewer
 */
async function init() {
  // Load settings from localStorage
  currentSettings = loadSettings();

  // Apply settings to UI controls first
  applySettingsToUI(currentSettings);

  // Set canvas size
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Create viewer with selected backend
  await createViewerWithBackend();

  // Setup event listeners
  setupEventListeners();

  // Start stats monitoring
  startStatsMonitoring();
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

  // Re-attach canvas event listeners (they were lost when canvas was replaced)
  attachCanvasWheelListener();

  try {
    viewer = await createSkinViewer({
      canvas,
      skin: currentSkinSource ?? DEFAULT_SKIN_URL,
      cape: currentCapeSource === null ? undefined : (currentCapeSource ?? DEFAULT_CAPE_URL),
      preferredBackend,
      antialias: true,
      enableRotate: true,
      enableZoom: true,
      panorama: currentPanoramaSource ?? undefined,
    });

    // Update backend badge
    backendBadge.textContent = viewer.backend.toUpperCase();
    backendBadge.className = `backend-badge ${viewer.backend}`;

    // Apply saved settings to viewer
    applySettingsToViewer(currentSettings);

    // Start render loop
    viewer.startRenderLoop();

    // Play animation from settings
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
 * Start stats.js monitoring
 */
function startStatsMonitoring() {
  // Add stats to canvas container
  const canvasContainer = canvas.parentElement;
  if (canvasContainer) {
    canvasContainer.style.position = "relative";
    canvasContainer.appendChild(stats.dom);
  }

  const animate = () => {
    stats.begin();
    stats.end();
    requestAnimationFrame(animate);
  };

  animate();
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
 * Attach wheel listener to canvas (needs to be re-attached when canvas is replaced)
 */
function attachCanvasWheelListener() {
  canvas.addEventListener("wheel", () => {
    if (!viewer) return;
    const zoom = viewer.getZoom();
    zoomSlider.value = String(Math.round(zoom));
    zoomValue.textContent = String(Math.round(zoom));
    saveSettings();
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Backend select - recreate viewer with new backend
  backendSelect.addEventListener("change", async () => {
    // Update currentSettings from UI before recreating viewer
    currentSettings = getCurrentSettingsFromUI();
    await createViewerWithBackend();
    saveSettings();
  });

  // Load skin from URL
  loadSkinBtn.addEventListener("click", async () => {
    const url = skinUrlInput.value.trim();
    if (!url || !viewer) return;

    try {
      await viewer.setSkin(url);
      currentSkinSource = url;
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
      currentSkinSource = file;
    } catch (error) {
      console.error("Failed to load skin:", error);
      alert("Failed to load skin from file");
    }
  });

  // Toggle slim model
  slimModelCheckbox.addEventListener("change", () => {
    if (!viewer) return;
    viewer.setSlim(slimModelCheckbox.checked);
    saveSettings();
  });

  // Load cape from URL
  loadCapeBtn.addEventListener("click", async () => {
    const url = capeUrlInput.value.trim();
    if (!url || !viewer) return;

    try {
      await viewer.setCape(url);
      currentCapeSource = url;
      backEquipmentSelect.value = viewer.backEquipment;
      saveSettings();
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
      currentCapeSource = file;
      backEquipmentSelect.value = viewer.backEquipment;
      saveSettings();
    } catch (error) {
      console.error("Failed to load cape:", error);
      alert("Failed to load cape from file");
    }
  });

  // Back equipment select
  backEquipmentSelect.addEventListener("change", () => {
    if (!viewer) return;
    viewer.setBackEquipment(backEquipmentSelect.value as BackEquipment);
    saveSettings();
  });

  // Remove cape
  removeCapeBtn.addEventListener("click", async () => {
    if (!viewer) return;
    await viewer.setCape(null);
    currentCapeSource = null;
    backEquipmentSelect.value = "none";
    saveSettings();
  });

  // Animation select
  animationSelect.addEventListener("change", () => {
    playAnimation();
    saveSettings();
  });

  // Speed slider
  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedSlider.value;
    playAnimation();
    saveSettings();
  });

  // Amplitude slider
  amplitudeSlider.addEventListener("input", () => {
    amplitudeValue.textContent = amplitudeSlider.value;
    playAnimation();
    saveSettings();
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
    saveSettings();
  });

  // Auto rotate
  autoRotateCheckbox.addEventListener("change", () => {
    if (!viewer) return;
    viewer.setAutoRotate(autoRotateCheckbox.checked);
    saveSettings();
  });

  // Reset camera
  resetCameraBtn.addEventListener("click", () => {
    if (!viewer) return;
    viewer.resetCamera();
    zoomSlider.value = "50";
    zoomValue.textContent = "50";
    saveSettings();
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
  attachCanvasWheelListener();

  // Panorama controls
  loadDefaultPanoramaBtn?.addEventListener("click", async () => {
    if (!viewer) return;

    try {
      await viewer.setPanorama(DEFAULT_PANORAMA_URL);
      currentPanoramaSource = DEFAULT_PANORAMA_URL;
      panoramaUrlInput.value = "";
      saveSettings();
    } catch (error) {
      console.error("Failed to load default panorama:", error);
      alert("Failed to load default panorama");
    }
  });

  loadPanoramaBtn?.addEventListener("click", async () => {
    const url = panoramaUrlInput.value.trim();
    if (!url || !viewer) return;

    try {
      await viewer.setPanorama(url);
      currentPanoramaSource = url;
      saveSettings();
    } catch (error) {
      console.error("Failed to load panorama:", error);
      alert("Failed to load panorama from URL");
    }
  });

  panoramaFileInput?.addEventListener("change", async () => {
    const file = panoramaFileInput.files?.[0];
    if (!file || !viewer) return;

    try {
      await viewer.setPanorama(file);
      currentPanoramaSource = file;
      saveSettings();
    } catch (error) {
      console.error("Failed to load panorama:", error);
      alert("Failed to load panorama from file");
    }
  });

  clearPanoramaBtn?.addEventListener("click", async () => {
    if (!viewer) return;
    await viewer.setPanorama(null);
    currentPanoramaSource = null;
    panoramaUrlInput.value = "";
    saveSettings();
  });

  // Parts visibility controls
  for (const part of PART_NAMES) {
    const innerCheckbox = document.getElementById(`${part}-inner`) as HTMLInputElement;
    const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;

    innerCheckbox?.addEventListener("change", () => {
      if (!viewer) return;
      viewer.setPartVisibility(part as PartName, "inner", innerCheckbox.checked);
      saveSettings();
    });

    outerCheckbox?.addEventListener("change", () => {
      if (!viewer) return;
      viewer.setPartVisibility(part as PartName, "outer", outerCheckbox.checked);
      saveSettings();
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
    saveSettings();
  });

  // Hide all outer layers button
  hideAllOuterBtn.addEventListener("click", () => {
    if (!viewer) return;
    for (const part of PART_NAMES) {
      viewer.setPartVisibility(part as PartName, "outer", false);
      const outerCheckbox = document.getElementById(`${part}-outer`) as HTMLInputElement;
      if (outerCheckbox) outerCheckbox.checked = false;
    }
    saveSettings();
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", init);
