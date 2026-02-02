/**
 * Shared renderer utilities
 */

/**
 * Simple ID generator for renderer resources
 * Creates unique sequential IDs for buffers, textures, pipelines, etc.
 */
export function createIdGenerator(): () => number {
  let nextId = 0;
  return () => nextId++;
}

/** Shared ID generators for renderer resources */
export const bufferId = createIdGenerator();
export const textureId = createIdGenerator();
export const pipelineId = createIdGenerator();
