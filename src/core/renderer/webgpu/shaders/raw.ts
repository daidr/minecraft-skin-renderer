/**
 * Raw WGSL Shaders (unminified source)
 * Edit these shaders directly. They are minified at build time.
 */

/**
 * Skin shader with bone animation support
 * Uses a uniform buffer with matrices and a separate texture bind group
 */
export const SKIN_SHADER_WGSL_RAW = /* wgsl */ `
// Uniform buffer layout
// Total size: 1744 bytes (aligned to 16)
// - modelMatrix:      64 bytes  (offset 0)
// - viewMatrix:       64 bytes  (offset 64)
// - projectionMatrix: 64 bytes  (offset 128)
// - boneMatrices:     1536 bytes (offset 192, 24 * 64)
// - alphaTest:        4 bytes   (offset 1728)

struct Uniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  boneMatrices: array<mat4x4<f32>, 24>,
  alphaTest: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@group(1) @binding(0) var texSampler: sampler;
@group(1) @binding(1) var skinTexture: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) boneIndex: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Get bone transform
  let boneIdx = u32(input.boneIndex);
  let boneMatrix = uniforms.boneMatrices[boneIdx];

  // Transform position by bone
  let localPos = boneMatrix * vec4<f32>(input.position, 1.0);

  // Transform to world space
  let worldPos = uniforms.modelMatrix * localPos;

  // Pass UV to fragment shader
  output.uv = input.uv;

  // Final position
  output.position = uniforms.projectionMatrix * uniforms.viewMatrix * worldPos;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sample texture
  let texColor = textureSample(skinTexture, texSampler, input.uv);

  // Alpha test (discard fully transparent pixels)
  if (texColor.a < uniforms.alphaTest) {
    discard;
  }

  // Output texture color directly (no lighting)
  return texColor;
}
`;

/**
 * Simple shader without bones (for testing)
 */
export const SIMPLE_SHADER_WGSL_RAW = /* wgsl */ `
struct Uniforms {
  mvpMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  alphaTest: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@group(1) @binding(0) var texSampler: sampler;
@group(1) @binding(1) var diffuseTexture: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) normal: vec3<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) normal: vec3<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  output.uv = input.uv;
  output.normal = (uniforms.modelMatrix * vec4<f32>(input.normal, 0.0)).xyz;
  output.position = uniforms.mvpMatrix * vec4<f32>(input.position, 1.0);

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let texColor = textureSample(diffuseTexture, texSampler, input.uv);

  if (texColor.a < uniforms.alphaTest) {
    discard;
  }

  // Basic lighting
  let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.8));
  let ndotl = max(dot(normalize(input.normal), lightDir), 0.0);
  let light = 0.4 + 0.6 * ndotl;

  return vec4<f32>(texColor.rgb * light, texColor.a);
}
`;
