/**
 * WebGL Buffer implementation
 */

import { BufferUsage } from "../types";
import type { IBuffer } from "../types";

let nextBufferId = 0;

export class WebGLBuffer implements IBuffer {
  readonly id: number;
  readonly size: number;
  readonly usage: BufferUsage;

  private gl: WebGL2RenderingContext;
  private buffer: globalThis.WebGLBuffer | null;
  private target: number;
  private disposed = false;

  constructor(gl: WebGL2RenderingContext, usage: BufferUsage, data: ArrayBufferView) {
    this.id = nextBufferId++;
    this.gl = gl;
    this.usage = usage;
    this.size = data.byteLength;

    // Determine buffer target based on usage
    if (usage & BufferUsage.Index) {
      this.target = gl.ELEMENT_ARRAY_BUFFER;
    } else {
      this.target = gl.ARRAY_BUFFER;
    }

    // Create and initialize buffer
    this.buffer = gl.createBuffer();
    if (!this.buffer) {
      throw new Error("Failed to create WebGL buffer");
    }

    gl.bindBuffer(this.target, this.buffer);
    gl.bufferData(this.target, data, gl.DYNAMIC_DRAW);
    gl.bindBuffer(this.target, null);
  }

  /** Get the native WebGL buffer */
  getNativeBuffer(): globalThis.WebGLBuffer | null {
    return this.buffer;
  }

  /** Get the buffer target (ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER) */
  getTarget(): number {
    return this.target;
  }

  /** Update buffer data */
  update(data: ArrayBufferView, offset = 0): void {
    if (this.disposed || !this.buffer) return;

    this.gl.bindBuffer(this.target, this.buffer);
    this.gl.bufferSubData(this.target, offset, data);
    this.gl.bindBuffer(this.target, null);
  }

  /** Dispose the buffer */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }
  }
}
