/**
 * Panorama Renderer
 *
 * Renders equirectangular panorama images as a background skybox.
 */

import type { Camera } from "../../core/camera/Camera";
import type { IRenderer, ITexture } from "../../core/renderer/types";
import {
  BufferUsage,
  CullMode,
  DepthCompare,
  BlendMode,
  VertexFormat,
  TextureWrap,
  TextureFilter,
} from "../../core/renderer/types";
import type { TextureSource } from "../../texture";
import { loadTexture } from "../../texture";
import type { BackgroundRenderer } from "../../core/plugins/types";
import { createSkyboxGeometry } from "./SkyboxGeometry";
import { PANORAMA_VERTEX_SHADER, PANORAMA_FRAGMENT_SHADER } from "./shaders/webgl";
import { PANORAMA_WGSL_SHADER } from "./shaders/webgpu";

/**
 * Get the appropriate shaders based on the renderer backend
 */
function getShaders(renderer: IRenderer): { vertexShader: string; fragmentShader: string } {
  if (renderer.backend === "webgpu") {
    // WebGPU uses a combined WGSL shader
    return {
      vertexShader: PANORAMA_WGSL_SHADER,
      fragmentShader: PANORAMA_WGSL_SHADER,
    };
  }
  // WebGL uses separate vertex and fragment shaders
  return {
    vertexShader: PANORAMA_VERTEX_SHADER,
    fragmentShader: PANORAMA_FRAGMENT_SHADER,
  };
}

/**
 * Create a panorama background renderer
 */
export function createPanoramaRenderer(renderer: IRenderer): BackgroundRenderer {
  // Create skybox geometry
  const skybox = createSkyboxGeometry(2.0);

  // Create vertex buffer (position only, vec3)
  const vertexBuffer = renderer.createBuffer(BufferUsage.Vertex, skybox.vertices);
  const indexBuffer = renderer.createBuffer(BufferUsage.Index, skybox.indices);

  // Vertex layout for skybox (just position)
  const vertexLayout = {
    stride: 12, // 3 floats * 4 bytes
    attributes: [{ name: "a_position", location: 0, format: VertexFormat.Float32x3, offset: 0 }],
  };

  // Get shaders based on backend
  const shaders = getShaders(renderer);

  // Create pipeline for panorama rendering
  // - Cull front faces (we're inside the cube, render back faces)
  // - Depth test less-or-equal (skybox is at far plane)
  // - No depth write (don't affect depth buffer)
  const pipeline = renderer.createPipeline({
    vertexShader: shaders.vertexShader,
    fragmentShader: shaders.fragmentShader,
    vertexLayout,
    cullMode: CullMode.Front, // Render inside of cube
    depthWrite: false, // Don't write to depth buffer
    depthCompare: DepthCompare.LessEqual, // Always pass at far plane
    blendMode: BlendMode.None,
  });

  let panoramaTexture: ITexture | null = null;
  const indexCount = skybox.indexCount;

  return {
    async setSource(source: TextureSource): Promise<void> {
      // Dispose old texture if exists
      if (panoramaTexture) {
        panoramaTexture.dispose();
        panoramaTexture = null;
      }

      // Load new texture
      const bitmap = await loadTexture(source);
      panoramaTexture = await renderer.createTexture(bitmap, {
        wrapU: TextureWrap.Repeat, // Wrap horizontally
        wrapV: TextureWrap.ClampToEdge, // Clamp vertically
        minFilter: TextureFilter.Linear,
        magFilter: TextureFilter.Linear,
        generateMipmaps: true,
      });
    },

    render(camera: Camera): void {
      if (!panoramaTexture) return;

      renderer.draw({
        pipeline,
        vertexBuffers: [vertexBuffer],
        indexBuffer,
        indexCount,
        bindGroup: {
          uniforms: {
            u_viewMatrix: camera.viewMatrix,
            u_projectionMatrix: camera.projectionMatrix,
          },
          textures: {
            u_panorama: panoramaTexture,
          },
        },
      });
    },

    dispose(): void {
      vertexBuffer.dispose();
      indexBuffer.dispose();
      pipeline.dispose();
      if (panoramaTexture) {
        panoramaTexture.dispose();
        panoramaTexture = null;
      }
    },
  };
}
