/**
 * WebGL Texture implementation
 */

import { TextureFilter, TextureWrap } from "../types";
import type { ITexture, TextureOptions } from "../types";

let nextTextureId = 0;

export class WebGLTextureImpl implements ITexture {
  readonly id: number;
  readonly width: number;
  readonly height: number;

  private gl: WebGL2RenderingContext;
  private texture: WebGLTexture | null;
  private disposed = false;

  constructor(gl: WebGL2RenderingContext, source: TexImageSource, options: TextureOptions = {}) {
    this.id = nextTextureId++;
    this.gl = gl;

    // Get dimensions from source
    if (source instanceof HTMLVideoElement) {
      this.width = source.videoWidth;
      this.height = source.videoHeight;
    } else if (source instanceof VideoFrame) {
      this.width = source.displayWidth;
      this.height = source.displayHeight;
    } else {
      this.width = source.width;
      this.height = source.height;
    }

    // Create texture
    this.texture = gl.createTexture();
    if (!this.texture) {
      throw new Error("Failed to create WebGL texture");
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Flip Y axis: WebGL stores image data with Y=0 at bottom by default,
    // but image files have Y=0 at top. This makes UV coords match image coords.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Set texture parameters
    const minFilter = this.getGLFilter(options.minFilter ?? TextureFilter.Nearest);
    const magFilter = this.getGLFilter(options.magFilter ?? TextureFilter.Nearest);
    const wrapS = this.getGLWrap(options.wrapU ?? TextureWrap.ClampToEdge);
    const wrapT = this.getGLWrap(options.wrapV ?? TextureWrap.ClampToEdge);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

    // Upload texture data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // Reset to default
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    // Generate mipmaps if requested
    if (options.generateMipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Convert filter enum to GL constant */
  private getGLFilter(filter: TextureFilter): number {
    const gl = this.gl;
    switch (filter) {
      case TextureFilter.Linear:
        return gl.LINEAR;
      default:
        return gl.NEAREST;
    }
  }

  /** Convert wrap enum to GL constant */
  private getGLWrap(wrap: TextureWrap): number {
    const gl = this.gl;
    switch (wrap) {
      case TextureWrap.Repeat:
        return gl.REPEAT;
      case TextureWrap.MirrorRepeat:
        return gl.MIRRORED_REPEAT;
      default:
        return gl.CLAMP_TO_EDGE;
    }
  }

  /** Get the native WebGL texture */
  getNativeTexture(): WebGLTexture | null {
    return this.texture;
  }

  /** Update texture data */
  update(source: TexImageSource): void {
    if (this.disposed || !this.texture) return;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Dispose the texture */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
  }
}
