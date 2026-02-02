/**
 * WebGPU Texture implementation
 */

import { TextureFilter, TextureWrap } from "../types";
import type { ITexture, TextureOptions } from "../types";

let nextTextureId = 0;

export class WebGPUTextureImpl implements ITexture {
  readonly id: number;
  readonly width: number;
  readonly height: number;

  private device: GPUDevice;
  private texture: GPUTexture;
  private textureView: GPUTextureView;
  private sampler: GPUSampler;
  private disposed = false;

  private constructor(
    device: GPUDevice,
    texture: GPUTexture,
    sampler: GPUSampler,
    width: number,
    height: number,
  ) {
    this.id = nextTextureId++;
    this.device = device;
    this.texture = texture;
    this.textureView = texture.createView();
    this.sampler = sampler;
    this.width = width;
    this.height = height;
  }

  /**
   * Create a WebGPU texture from an image source
   */
  static async create(
    device: GPUDevice,
    source: TexImageSource,
    options: TextureOptions = {},
  ): Promise<WebGPUTextureImpl> {
    // Get dimensions from source
    let width: number;
    let height: number;

    if (source instanceof HTMLVideoElement) {
      width = source.videoWidth;
      height = source.videoHeight;
    } else if (source instanceof VideoFrame) {
      width = source.displayWidth;
      height = source.displayHeight;
    } else {
      width = source.width;
      height = source.height;
    }

    // Create texture
    const texture = device.createTexture({
      size: { width, height },
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Copy image data to texture
    // Convert to ImageBitmap first if needed for copyExternalImageToTexture
    let bitmap: ImageBitmap;
    if (source instanceof ImageBitmap) {
      bitmap = source;
    } else {
      bitmap = await createImageBitmap(source);
    }

    // Note: WebGPU texture coordinates have (0,0) at top-left, same as image files,
    // so we don't need to flip Y (unlike WebGL where (0,0) is at bottom-left)
    device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, { width, height });

    // Create sampler
    const sampler = device.createSampler({
      minFilter: WebGPUTextureImpl.convertFilter(options.minFilter ?? TextureFilter.Nearest),
      magFilter: WebGPUTextureImpl.convertFilter(options.magFilter ?? TextureFilter.Nearest),
      addressModeU: WebGPUTextureImpl.convertWrap(options.wrapU ?? TextureWrap.ClampToEdge),
      addressModeV: WebGPUTextureImpl.convertWrap(options.wrapV ?? TextureWrap.ClampToEdge),
    });

    return new WebGPUTextureImpl(device, texture, sampler, width, height);
  }

  /** Convert filter enum to GPU filter mode */
  private static convertFilter(filter: TextureFilter): GPUFilterMode {
    switch (filter) {
      case TextureFilter.Linear:
        return "linear";
      default:
        return "nearest";
    }
  }

  /** Convert wrap enum to GPU address mode */
  private static convertWrap(wrap: TextureWrap): GPUAddressMode {
    switch (wrap) {
      case TextureWrap.Repeat:
        return "repeat";
      case TextureWrap.MirrorRepeat:
        return "mirror-repeat";
      default:
        return "clamp-to-edge";
    }
  }

  /** Get the native WebGPU texture */
  getNativeTexture(): GPUTexture {
    return this.texture;
  }

  /** Get the texture view */
  getTextureView(): GPUTextureView {
    return this.textureView;
  }

  /** Get the sampler */
  getSampler(): GPUSampler {
    return this.sampler;
  }

  /** Update texture data */
  update(source: TexImageSource): void {
    if (this.disposed) return;

    // For WebGPU, we need to handle this asynchronously
    // but the interface expects sync. We'll use a fire-and-forget approach
    this.updateAsync(source).catch(console.error);
  }

  /** Async update implementation */
  private async updateAsync(source: TexImageSource): Promise<void> {
    let bitmap: ImageBitmap;
    if (source instanceof ImageBitmap) {
      bitmap = source;
    } else {
      bitmap = await createImageBitmap(source);
    }

    this.device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: this.texture },
      { width: this.width, height: this.height },
    );
  }

  /** Dispose the texture */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.destroy();
  }
}
