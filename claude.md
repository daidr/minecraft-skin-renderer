# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

Use `bun` for all commands (not npm/yarn/pnpm):

- `bun run build` - Build library with tsdown
- `bun dev` - Build in watch mode
- `bun dev:playground` - Run playground dev server (Vite)
- `bun test` - Run tests (Vitest)
- `bun test tests/unit/math/vec3.test.ts` - Run specific test file
- `bun test -t "quaternion"` - Run tests matching pattern
- `bun test:coverage` - Run tests with coverage
- `bun lint` - Lint with oxlint (type-aware)
- `bun lint:fix` - Lint and auto-fix
- `bun fmt` - Format with oxfmt

## Architecture

### Entry Points (Tree-Shakable)

The library uses a plugin system for tree-shaking renderers:

```ts
import { use, createSkinViewer } from 'minecraft-skin-renderer'
import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'

use(WebGLRendererPlugin)  // Register before creating viewer
const viewer = await createSkinViewer({ canvas, skin: '...' })
```

Three package entry points:
- `minecraft-skin-renderer` - Main API (SkinViewer, types, utilities)
- `minecraft-skin-renderer/webgl` - WebGL renderer plugin
- `minecraft-skin-renderer/webgpu` - WebGPU renderer plugin

### Core Modules

- **src/core/renderer/** - Renderer abstraction layer
  - `registry.ts` - Plugin registration system (`use()` function)
  - `webgl/` and `webgpu/` - Backend implementations with identical interfaces

- **src/core/math/** - Pure math utilities (Vec3, Mat4, Quat) with no dependencies

- **src/core/camera/** - Camera system with orbit controls

### Model System

- **src/model/PlayerModel.ts** - Bone-based skeleton with hierarchical transforms
  - Uses `BoneIndex` enum for type-safe bone references
  - Supports "classic" (4px arms) and "slim" (3px arms) variants
  - Overlay bones are slightly inflated versions of base bones

- **src/model/uv/** - UV coordinate generation for skin/cape textures

- **src/model/geometry/** - Box geometry generation with UV mapping

### Animation System

- **src/animation/types.ts** - Animation and keyframe definitions
- **src/animation/AnimationController.ts** - Playback controller
- **src/animation/presets/** - Built-in animations (idle, walk, run, fly)

Animations are keyframe-based tracks per bone, registered globally via `registerAnimation()`.

### Viewer

- **src/viewer/SkinViewer.ts** - Main API facade orchestrating all subsystems
- **src/viewer/RenderLoop.ts** - RAF-based render loop with delta time

## Key Patterns

- Renderers implement `IRenderer`, `IBuffer`, `ITexture`, `IPipeline` interfaces
- Skeleton bones form a tree: Root → Body → (Head, Arms, Legs) → Overlays
- Cape and Elytra share the same texture format (64x32)
- All rotations use quaternions; conversions via `quatFromEuler()`

## Testing

Tests use Vitest with happy-dom environment. WebGL is mocked via `vitest-webgl-canvas-mock`.

Test structure mirrors src: `tests/unit/{animation,math,model}/`
