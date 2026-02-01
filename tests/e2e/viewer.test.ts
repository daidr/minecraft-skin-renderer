/**
 * E2E tests for the skin viewer
 */

import { test, expect } from "@playwright/test";

test.describe("Skin Viewer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the playground page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Minecraft Skin Renderer");
  });

  test("should display canvas", async ({ page }) => {
    const canvas = page.locator("#skinCanvas");
    await expect(canvas).toBeVisible();
  });

  test("should show backend badge", async ({ page }) => {
    const badge = page.locator("#backendBadge");
    await expect(badge).toBeVisible();
    // Should be either WebGL or WebGPU
    const text = await badge.textContent();
    expect(["WEBGL", "WEBGPU"]).toContain(text);
  });

  test("should update FPS counter", async ({ page }) => {
    const fpsCounter = page.locator("#fpsCounter");
    await expect(fpsCounter).toBeVisible();

    // Wait for FPS to update
    await page.waitForTimeout(2000);

    const text = await fpsCounter.textContent();
    expect(text).toMatch(/FPS: \d+/);
  });

  test("should have animation controls", async ({ page }) => {
    const animationSelect = page.locator("#animationSelect");
    await expect(animationSelect).toBeVisible();

    // Check options exist
    const options = animationSelect.locator("option");
    await expect(options).toHaveCount(5); // None, idle, walk, run, fly
  });

  test("should change animation", async ({ page }) => {
    const animationSelect = page.locator("#animationSelect");

    // Select run animation
    await animationSelect.selectOption("run");

    // Animation should be selected
    await expect(animationSelect).toHaveValue("run");
  });

  test("should have speed and amplitude sliders", async ({ page }) => {
    const speedSlider = page.locator("#speedSlider");
    const amplitudeSlider = page.locator("#amplitudeSlider");

    await expect(speedSlider).toBeVisible();
    await expect(amplitudeSlider).toBeVisible();
  });

  test("should update speed value display", async ({ page }) => {
    const speedSlider = page.locator("#speedSlider");
    const speedValue = page.locator("#speedValue");

    // Change slider value
    await speedSlider.fill("2");

    await expect(speedValue).toContainText("2");
  });

  test("should have zoom slider", async ({ page }) => {
    const zoomSlider = page.locator("#zoomSlider");
    await expect(zoomSlider).toBeVisible();

    // Change zoom
    await zoomSlider.fill("80");

    const zoomValue = page.locator("#zoomValue");
    await expect(zoomValue).toContainText("80");
  });

  test("should reset camera", async ({ page }) => {
    const resetBtn = page.locator("#resetCameraBtn");
    const zoomSlider = page.locator("#zoomSlider");

    // Change zoom first
    await zoomSlider.fill("100");

    // Reset
    await resetBtn.click();

    // Should be back to default
    await expect(zoomSlider).toHaveValue("50");
  });

  test("should take screenshot", async ({ page }) => {
    const screenshotBtn = page.locator("#screenshotBtn");

    // Listen for download
    const downloadPromise = page.waitForEvent("download");

    await screenshotBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("minecraft-skin.png");
  });

  test("should toggle slim model", async ({ page }) => {
    const slimCheckbox = page.locator("#slimModel");

    await expect(slimCheckbox).not.toBeChecked();

    await slimCheckbox.check();

    await expect(slimCheckbox).toBeChecked();
  });

  test("should handle file upload", async ({ page }) => {
    const fileInput = page.locator("#skinFile");
    await expect(fileInput).toBeVisible();

    // File input should accept PNG
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toBe("image/png");
  });
});
