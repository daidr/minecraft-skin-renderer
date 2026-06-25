/**
 * SkinViewer resource lifecycle regression tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSkinViewer } from "@/viewer/SkinViewer";
import { use } from "@/core/renderer/registry";
import { BufferUsage } from "@/core/renderer/types";
import type {
  DrawParams,
  IBuffer,
  IPipeline,
  IRenderer,
  ITexture,
  PipelineConfig,
  RendererOptions,
  TextureOptions,
} from "@/core/renderer/types";
import type { BackgroundRenderer } from "@/core/plugins/types";
import type { TextureSource } from "@/texture";

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createReadyImage(width = 64, height = 64): HTMLImageElement {
  const image = document.createElement("img");
  Object.defineProperties(image, {
    complete: { value: true },
    width: { value: width },
    height: { value: height },
  });
  return image;
}

async function waitForCondition(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 1000;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for test condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function createMockBitmap(label: string): ImageBitmap {
  return {
    width: 64,
    height: 64,
    close: vi.fn(),
    __label: label,
  } as unknown as ImageBitmap;
}

class MockBuffer implements IBuffer {
  readonly id: number;
  readonly size: number;
  readonly usage: BufferUsage;
  readonly dispose = vi.fn();
  readonly update = vi.fn();

  constructor(id: number, usage: BufferUsage, data: ArrayBufferView) {
    this.id = id;
    this.usage = usage;
    this.size = data.byteLength;
  }
}

class MockPipeline implements IPipeline {
  readonly dispose = vi.fn();

  constructor(readonly id: number) {}
}

class MockTexture implements ITexture {
  readonly width = 64;
  readonly height = 64;
  readonly update = vi.fn();
  readonly dispose = vi.fn();

  constructor(
    readonly id: number,
    readonly source: TexImageSource,
  ) {}
}

class MockRenderer implements IRenderer {
  readonly backend = "webgl" as const;
  readonly pixelRatio = 1;
  width = 300;
  height = 150;
  readonly createTextureCalls: TexImageSource[] = [];
  readonly drawCalls: DrawParams[] = [];
  readonly dispose = vi.fn();
  readonly beginFrame = vi.fn();
  readonly clear = vi.fn();
  readonly endFrame = vi.fn();

  private nextResourceId = 1;
  private textureResults: (Deferred<ITexture> | Error)[] = [];

  constructor(readonly canvas: HTMLCanvasElement) {}

  queueTextureResult(result: Deferred<ITexture> | Error): void {
    this.textureResults.push(result);
  }

  createBuffer(usage: BufferUsage, data: ArrayBufferView): IBuffer {
    return new MockBuffer(this.nextResourceId++, usage, data);
  }

  async createTexture(source: TexImageSource, _options?: TextureOptions): Promise<ITexture> {
    this.createTextureCalls.push(source);
    const result = this.textureResults.shift();
    if (result instanceof Error) {
      throw result;
    }
    if (result) {
      return result.promise;
    }
    return new MockTexture(this.nextResourceId++, source);
  }

  createPipeline(_config: PipelineConfig): IPipeline {
    return new MockPipeline(this.nextResourceId++);
  }

  draw(params: DrawParams): void {
    this.drawCalls.push(params);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

let lastRenderer: MockRenderer | null = null;

function registerMockRenderer(): void {
  use({
    type: "renderer",
    backend: "webgl",
    createRenderer: (options: RendererOptions) => {
      lastRenderer = new MockRenderer(options.canvas);
      return lastRenderer;
    },
    shaders: {
      vertex: "void main() {}",
      fragment: "void main() {}",
    },
  });
}

function getLastRenderer(): MockRenderer {
  if (!lastRenderer) {
    throw new Error("Mock renderer was not created");
  }
  return lastRenderer;
}

beforeEach(() => {
  lastRenderer = null;
  registerMockRenderer();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SkinViewer resource lifecycle", () => {
  it("keeps the current skin texture when a later setSkin load fails", async () => {
    const viewer = await createSkinViewer({
      canvas: document.createElement("canvas"),
      preferredBackend: "webgl",
    });
    const renderer = getLastRenderer();
    const initialTexture = renderer.createTextureCalls[0];

    renderer.queueTextureResult(new Error("gpu texture allocation failed"));

    await expect(viewer.setSkin(createReadyImage())).rejects.toThrow(
      "gpu texture allocation failed",
    );
    viewer.render();

    const skinDraw = renderer.drawCalls.find((call) => "u_skinTexture" in call.bindGroup.textures);
    const renderedTexture = skinDraw?.bindGroup.textures.u_skinTexture as MockTexture | undefined;
    expect(renderedTexture?.source).toBe(initialTexture);

    viewer.dispose();
  });

  it("lets the latest setSkin request win and disposes stale textures", async () => {
    const viewer = await createSkinViewer({
      canvas: document.createElement("canvas"),
      preferredBackend: "webgl",
    });
    const renderer = getLastRenderer();

    const first = deferred<ITexture>();
    const second = deferred<ITexture>();
    renderer.queueTextureResult(first);
    renderer.queueTextureResult(second);

    const firstUpdate = viewer.setSkin(createReadyImage());
    await waitForCondition(() => renderer.createTextureCalls.length === 2);
    const secondUpdate = viewer.setSkin(createReadyImage());
    await waitForCondition(() => renderer.createTextureCalls.length === 3);
    const firstTexture = new MockTexture(1001, createMockBitmap("first"));
    const secondTexture = new MockTexture(1002, createMockBitmap("second"));

    second.resolve(secondTexture);
    await secondUpdate;

    first.resolve(firstTexture);
    await firstUpdate;

    viewer.render();
    const skinDraw = renderer.drawCalls
      .filter((call) => "u_skinTexture" in call.bindGroup.textures)
      .at(-1);
    expect(skinDraw?.bindGroup.textures.u_skinTexture).toBe(secondTexture);
    expect(firstTexture.dispose).toHaveBeenCalledTimes(1);
    expect(secondTexture.dispose).not.toHaveBeenCalled();

    viewer.dispose();
  });

  it("rolls back allocated resources when initial texture creation fails", async () => {
    const rendererBuffers: MockBuffer[] = [];
    const rendererPipelines: MockPipeline[] = [];

    use({
      type: "renderer",
      backend: "webgl",
      createRenderer: (options: RendererOptions) => {
        const renderer = new MockRenderer(options.canvas);
        lastRenderer = renderer;
        renderer.queueTextureResult(new Error("initial texture failed"));

        const createBuffer = renderer.createBuffer.bind(renderer);
        renderer.createBuffer = (usage, data) => {
          const buffer = createBuffer(usage, data) as MockBuffer;
          rendererBuffers.push(buffer);
          return buffer;
        };

        const createPipeline = renderer.createPipeline.bind(renderer);
        renderer.createPipeline = (config) => {
          const pipeline = createPipeline(config) as MockPipeline;
          rendererPipelines.push(pipeline);
          return pipeline;
        };

        return renderer;
      },
      shaders: {
        vertex: "void main() {}",
        fragment: "void main() {}",
      },
    });

    await expect(
      createSkinViewer({
        canvas: document.createElement("canvas"),
        preferredBackend: "webgl",
      }),
    ).rejects.toThrow("initial texture failed");

    const renderer = getLastRenderer();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(rendererBuffers.length).toBeGreaterThan(0);
    expect(rendererBuffers.every((buffer) => buffer.dispose.mock.calls.length === 1)).toBe(true);
    expect(rendererPipelines.length).toBe(3);
    expect(rendererPipelines.every((pipeline) => pipeline.dispose.mock.calls.length === 1)).toBe(
      true,
    );
  });
});

describe("SkinViewer panorama lifecycle", () => {
  it("keeps the latest panorama request when an earlier request resolves later", async () => {
    const sources: TextureSource[] = [];
    const createdRenderers: {
      renderer: BackgroundRenderer;
      render: ReturnType<typeof vi.fn>;
      dispose: ReturnType<typeof vi.fn>;
    }[] = [];
    const first = deferred<void>();
    const second = deferred<void>();

    use({
      type: "background",
      name: "panorama",
      createRenderer: () => {
        const load = createdRenderers.length === 0 ? first : second;
        const render = vi.fn();
        const dispose = vi.fn();
        const renderer: BackgroundRenderer = {
          setSource: vi.fn(async (source) => {
            sources.push(source);
            await load.promise;
          }),
          render,
          dispose,
        };
        createdRenderers.push({ renderer, render, dispose });
        return renderer;
      },
    });

    const viewer = await createSkinViewer({
      canvas: document.createElement("canvas"),
      preferredBackend: "webgl",
    });

    const firstUpdate = viewer.setPanorama(createReadyImage());
    const secondUpdate = viewer.setPanorama(createReadyImage());

    second.resolve();
    await secondUpdate;
    first.resolve();
    await firstUpdate;

    viewer.render();

    expect(sources).toHaveLength(2);
    const firstRenderer = createdRenderers[0]!;
    const secondRenderer = createdRenderers[1]!;
    expect(firstRenderer.dispose).toHaveBeenCalledTimes(1);
    expect(firstRenderer.render).not.toHaveBeenCalled();
    expect(secondRenderer.dispose).not.toHaveBeenCalled();
    expect(secondRenderer.render).toHaveBeenCalledTimes(1);

    viewer.dispose();
  });
});
