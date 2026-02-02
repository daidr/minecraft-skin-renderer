/**
 * WebGPU Buffer implementation
 */

import { BufferUsage } from "../types";
import type { IBuffer } from "../types";
import { bufferId } from "../utils";

export class WebGPUBuffer implements IBuffer {
  readonly id: number;
  readonly size: number;
  readonly usage: BufferUsage;

  private device: GPUDevice;
  private buffer: GPUBuffer;
  private disposed = false;

  constructor(device: GPUDevice, usage: BufferUsage, data: ArrayBufferView) {
    this.id = bufferId();
    this.device = device;
    this.usage = usage;
    this.size = data.byteLength;

    // Convert BufferUsage to GPUBufferUsageFlags
    let gpuUsage: GPUBufferUsageFlags = GPUBufferUsage.COPY_DST;
    if (usage & BufferUsage.Vertex) {
      gpuUsage |= GPUBufferUsage.VERTEX;
    }
    if (usage & BufferUsage.Index) {
      gpuUsage |= GPUBufferUsage.INDEX;
    }
    if (usage & BufferUsage.Uniform) {
      gpuUsage |= GPUBufferUsage.UNIFORM;
    }

    // Create buffer with mapped at creation for initial data
    this.buffer = device.createBuffer({
      size: this.size,
      usage: gpuUsage,
      mappedAtCreation: true,
    });

    // Copy initial data
    const mappedRange = this.buffer.getMappedRange();
    new Uint8Array(mappedRange).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    this.buffer.unmap();
  }

  /** Get the native WebGPU buffer */
  getNativeBuffer(): GPUBuffer {
    return this.buffer;
  }

  /** Update buffer data */
  update(data: ArrayBufferView, offset = 0): void {
    if (this.disposed) return;
    this.device.queue.writeBuffer(
      this.buffer,
      offset,
      data.buffer,
      data.byteOffset,
      data.byteLength,
    );
  }

  /** Dispose the buffer */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.buffer.destroy();
  }
}
