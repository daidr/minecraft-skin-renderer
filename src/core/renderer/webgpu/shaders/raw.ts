/**
 * Raw WGSL Shaders
 */

/**
 * Skin shader with bone animation support
 * Uses a uniform buffer with matrices and a separate texture bind group
 */
export const SKIN_SHADER_WGSL_RAW = /* wgsl */ `
// Uniform buffer layout
// Total size: 1680 bytes (aligned to 16)
// - modelMatrix:          64 bytes  (offset 0)
// - viewProjectionMatrix: 64 bytes  (offset 64)
// - boneMatrices:         1536 bytes (offset 128, 24 * 64)
// - alphaTest:            4 bytes   (offset 1664)

struct Uniforms {
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
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
  output.position = uniforms.viewProjectionMatrix * worldPos;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sharp bilinear: smooth texel edges while preserving pixel art
  // NOTE: Use intermediate variables to prevent shader minifier from dropping parentheses
  let texSize = vec2<f32>(textureDimensions(skinTexture));
  let texelCoord = input.uv * texSize;
  let texelFloor = floor(texelCoord - 0.5) + 0.5;
  let texelFrac = texelCoord - texelFloor;
  let fw = fwidth(texelCoord);
  let fracShifted = texelFrac - 0.5;
  let sharpFrac = clamp(fracShifted / fw + 0.5, vec2(0.0), vec2(1.0));
  let sharpCoord = texelFloor + sharpFrac;
  let sharpUV = sharpCoord / texSize;

  var texColor = textureSample(skinTexture, texSampler, sharpUV);

  if (uniforms.alphaTest > 0.0) {
    // Outer layer: nearest-neighbor alpha to avoid bilinear bleeding
    let nearestTexel = clamp(vec2<i32>(floor(texelCoord)), vec2<i32>(0), vec2<i32>(texSize) - 1);
    let nearestAlpha = textureLoad(skinTexture, nearestTexel, 0).a;
    if (nearestAlpha < uniforms.alphaTest) {
      discard;
    }
    // Fix RGB contamination from bilinear filtering at transparency edges
    if (texColor.a > 0.001) {
      texColor = vec4<f32>(texColor.rgb / texColor.a, texColor.a);
    }
    texColor.a = 1.0;
  } else {
    // Inner layer: force fully opaque (transparent pixels become black)
    texColor.a = 1.0;
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
