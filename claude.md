# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

Use `bun` for all commands (not npm/yarn/pnpm):

- `bun run build` - Build library with tsdown (ESM + IIFE)
- `bun dev` - Build in watch mode
- `bun dev:playground` - Run playground dev server (Vite)
- `bun test` - Run tests (Vitest)
- `bun test tests/unit/math/vec3.test.ts` - Run specific test file
- `bun test -t "quaternion"` - Run tests matching pattern
- `bun test:coverage` - Run tests with coverage
- `bun lint` - Lint with oxlint (type-aware)
- `bun lint:fix` - Lint and auto-fix
- `bun fmt` - Format with oxfmt
- `bun bench:math` - Run all math benchmarks (mitata)
- `bun bench:math:vec3` - Run specific benchmark file

## Conventions

- **Commits**: Conventional Commits enforced via commitlint (`feat:`, `fix:`, `refactor:`, etc.)
- **Git hooks**: bun-git-hooks (`git-hooks.config.ts`) — pre-commit runs lint-staged (oxlint on staged files), commit-msg validates format via commitlint
- **Path alias**: `@/*` maps to `./src/*` in both tsconfig and vitest
- **Formatting**: oxfmt with 2-space indent, LF line endings, max 100 chars

## Architecture

### Entry Points (Tree-Shakable)

Five package entry points, each a separate file in `src/`:

- `minecraft-skin-renderer` (`src/index.ts`) - Main API: `use()`, `createSkinViewer()`, types, utilities
- `minecraft-skin-renderer/webgl` (`src/webgl.ts`) - WebGL2 renderer plugin
- `minecraft-skin-renderer/webgpu` (`src/webgpu.ts`) - WebGPU renderer plugin
- `minecraft-skin-renderer/panorama` (`src/panorama.ts`) - Panorama background plugin
- `minecraft-skin-renderer/canvas2d` (`src/canvas2d.ts`) - 2D static skin rendering (no WebGL needed)

Plus an IIFE entry (`src/iife.ts`) that auto-registers all plugins for `<script>` tag usage under global `MSR` namespace.

```ts
import { use, createSkinViewer } from "minecraft-skin-renderer";
import { WebGLRendererPlugin } from "minecraft-skin-renderer/webgl";

use(WebGLRendererPlugin); // Register before creating viewer
const viewer = await createSkinViewer({ canvas, skin: "..." });
```

### Build Configuration

tsdown produces two outputs (configured in `tsdown.config.ts`):

- **ESM** (`unbundle: true`) - Preserves module structure for tree-shaking
- **IIFE** (`minecraft-skin-renderer.min.js`) - Minified, global `MSR` namespace

### Plugin System

Two separate plugin registries:

1. **Renderer plugins** (`src/core/renderer/registry.ts`) - WebGL/WebGPU backends registered via `use()`. Each provides a factory function, backend-specific shaders, and optional shader composition hooks.

2. **Feature plugins** (`src/core/plugins/registry.ts`) - Non-renderer plugins (e.g., Panorama as a `BackgroundPlugin`). Registered internally when `use()` detects a feature plugin.

Shader composition (`src/core/renderer/shader-composer.ts`) supports injection markers (`[PLUGIN_VERTEX_DECLARATIONS]`, etc.) for plugin shader code.

### Canvas2D Module

Standalone 2D rendering system at `src/canvas2d/` — no WebGL/WebGPU required. Provides 7 render functions: `renderAvatar`, `renderSkinFront`, `renderSkinBack`, `renderSkinSide`, `renderSkinIsometric`, `renderHalfBody`, `renderBigHead`. Each supports classic/slim variants and optional overlay layers.

**Node.js portability**: The module works in Node.js via `canvas-env.ts`. In non-browser environments, call `setCreateCanvas()` with a canvas factory (e.g., `@napi-rs/canvas`) before any render function. In the browser, it auto-detects `document.createElement("canvas")`.

### Core Modules

- **src/core/renderer/** - Renderer abstraction layer with `webgl/` and `webgpu/` backends implementing identical interfaces
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

## Workspaces

- **playground/** - Vue 3 + Pinia + Vite interactive demo. Imports the library via Vite aliases (not `workspace:*`). Run with `bun dev:playground`.
- **native-playground/** - Node.js/Bun environment for testing Canvas2D rendering with `@napi-rs/canvas`. Validates that the Canvas2D module works outside the browser.

## Testing

Tests use Vitest with happy-dom environment and `globals: true` (no need to import `describe`/`it`/`expect`). WebGL is mocked via `vitest-webgl-canvas-mock`.

Test setup (`tests/setup.ts`) mocks: `requestAnimationFrame`, `performance.now()`, `createImageBitmap()` (returns 64×64 dummy), `HTMLCanvasElement.transferToImageBitmap()`.

Test structure mirrors src: `tests/unit/{animation,math,model}/`

Coverage excludes `.d.ts` files and barrel `index.ts` files.
