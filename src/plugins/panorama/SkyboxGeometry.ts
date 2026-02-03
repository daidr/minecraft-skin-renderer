/**
 * Skybox Geometry
 *
 * Creates a cube with faces pointing inward for panorama rendering.
 */

/** Skybox geometry data */
export interface SkyboxGeometry {
  /** Vertex positions (vec3 per vertex) */
  vertices: Float32Array;
  /** Triangle indices */
  indices: Uint16Array;
  /** Number of indices */
  indexCount: number;
}

/**
 * Create a skybox cube geometry.
 * The cube is centered at origin with size 2 (from -1 to 1 on each axis).
 * Faces are wound to point inward (for rendering from inside the cube).
 *
 * @param size - Size of the cube (default 2.0)
 */
export function createSkyboxGeometry(size = 2.0): SkyboxGeometry {
  const s = size / 2;

  // 8 corners of the cube
  // prettier-ignore
  const vertices = new Float32Array([
    // Front face (z = +s)
    -s, -s,  s,   //  0: bottom-left
     s, -s,  s,   //  1: bottom-right
     s,  s,  s,   //  2: top-right
    -s,  s,  s,   //  3: top-left

    // Back face (z = -s)
     s, -s, -s,   //  4: bottom-left (viewed from inside)
    -s, -s, -s,   //  5: bottom-right
    -s,  s, -s,   //  6: top-right
     s,  s, -s,   //  7: top-left

    // Top face (y = +s)
    -s,  s,  s,   //  8: front-left
     s,  s,  s,   //  9: front-right
     s,  s, -s,   // 10: back-right
    -s,  s, -s,   // 11: back-left

    // Bottom face (y = -s)
    -s, -s, -s,   // 12: back-left
     s, -s, -s,   // 13: back-right
     s, -s,  s,   // 14: front-right
    -s, -s,  s,   // 15: front-left

    // Right face (x = +s)
     s, -s,  s,   // 16: front-bottom
     s, -s, -s,   // 17: back-bottom
     s,  s, -s,   // 18: back-top
     s,  s,  s,   // 19: front-top

    // Left face (x = -s)
    -s, -s, -s,   // 20: back-bottom
    -s, -s,  s,   // 21: front-bottom
    -s,  s,  s,   // 22: front-top
    -s,  s, -s,   // 23: back-top
  ]);

  // Indices for triangles (wound for inward-facing normals)
  // Each face: 2 triangles, 6 indices
  // prettier-ignore
  const indices = new Uint16Array([
    // Front face
     0,  1,  2,   0,  2,  3,
    // Back face
     4,  5,  6,   4,  6,  7,
    // Top face
     8,  9, 10,   8, 10, 11,
    // Bottom face
    12, 13, 14,  12, 14, 15,
    // Right face
    16, 17, 18,  16, 18, 19,
    // Left face
    20, 21, 22,  20, 22, 23,
  ]);

  return {
    vertices,
    indices,
    indexCount: indices.length,
  };
}
