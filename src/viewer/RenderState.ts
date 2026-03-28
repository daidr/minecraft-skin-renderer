/**
 * Render State Management
 *
 * Manages pre-allocated render objects to avoid GC pressure during rendering.
 * Also handles bind group caching for efficient draw calls.
 */

import { mat4Identity, mat4MultiplyMut } from "../core/math";
import type { Mat4 } from "../core/math";
import type { ITexture, UniformValue } from "../core/renderer/types";

/**
 * Pre-allocated render state to avoid per-frame allocations.
 */
export interface RenderBindGroups {
  /** Pre-allocated model matrix (identity, can be modified if needed) */
  modelMatrix: Float32Array;

  /** Pre-allocated viewProjection matrix to avoid per-frame allocation */
  viewProjectionMatrix: Mat4;

  /** Pre-allocated light direction vector */
  lightDirection: Float32Array;

  /** Cached uniforms object for skin rendering */
  uniforms: Record<string, UniformValue>;

  /** Cached textures object for skin rendering */
  skinTextures: Record<string, ITexture>;

  /** Cached textures object for cape rendering */
  capeTextures: Record<string, ITexture>;

  /** Complete bind group for skin rendering */
  skinBindGroup: {
    uniforms: Record<string, UniformValue>;
    textures: Record<string, ITexture>;
  };

  /** Complete bind group for cape/elytra rendering */
  capeBindGroup: {
    uniforms: Record<string, UniformValue>;
    textures: Record<string, ITexture>;
  };
}

/**
 * Create pre-allocated render bind groups.
 * These objects are reused each frame to avoid garbage collection.
 */
export function createRenderBindGroups(): RenderBindGroups {
  const modelMatrix = mat4Identity();
  const viewProjectionMatrix = new Float32Array(16);

  const lightDirection = new Float32Array(3);

  const uniforms: Record<string, UniformValue> = {
    u_modelMatrix: modelMatrix,
    u_viewProjectionMatrix: viewProjectionMatrix,
    "u_boneMatrices[0]": null as unknown as Float32Array,
    u_alphaTest: 0.01,
    u_ambientIntensity: 0.6,
    u_diffuseIntensity: 0.4,
    u_lightDirection: lightDirection,
  };

  const skinTextures: Record<string, ITexture> = {
    u_skinTexture: null as unknown as ITexture,
  };

  const capeTextures: Record<string, ITexture> = {
    u_skinTexture: null as unknown as ITexture,
  };

  return {
    modelMatrix,
    viewProjectionMatrix,
    lightDirection,
    uniforms,
    skinTextures,
    capeTextures,
    skinBindGroup: { uniforms, textures: skinTextures },
    capeBindGroup: { uniforms, textures: capeTextures },
  };
}

/**
 * Update render bind groups with current frame data.
 *
 * @param bindGroups - Pre-allocated bind groups to update
 * @param viewMatrix - Current view matrix
 * @param projectionMatrix - Current projection matrix
 * @param boneMatrices - Current bone matrices
 * @param skinTexture - Current skin texture
 * @param cameraPosition - Camera position for light direction
 * @param cameraTarget - Camera target for light direction
 * @param capeTexture - Current cape texture (optional)
 */
export function updateRenderBindGroups(
  bindGroups: RenderBindGroups,
  viewMatrix: Float32Array,
  projectionMatrix: Float32Array,
  boneMatrices: Float32Array,
  skinTexture: ITexture,
  cameraPosition: readonly [number, number, number],
  cameraTarget: readonly [number, number, number],
  capeTexture?: ITexture | null,
): void {
  // Precompute viewProjection matrix on CPU (avoids per-vertex multiply in shader)
  mat4MultiplyMut(bindGroups.viewProjectionMatrix, projectionMatrix, viewMatrix);

  // Compute light direction (from target to camera, normalized)
  const dx = cameraPosition[0] - cameraTarget[0];
  const dy = cameraPosition[1] - cameraTarget[1];
  const dz = cameraPosition[2] - cameraTarget[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  bindGroups.lightDirection[0] = dx / len;
  bindGroups.lightDirection[1] = dy / len;
  bindGroups.lightDirection[2] = dz / len;

  // Update uniforms
  bindGroups.uniforms["u_boneMatrices[0]"] = boneMatrices;

  // Update textures
  bindGroups.skinTextures.u_skinTexture = skinTexture;

  if (capeTexture) {
    bindGroups.capeTextures.u_skinTexture = capeTexture;
  }
}
