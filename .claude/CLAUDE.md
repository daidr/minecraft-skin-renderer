# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

Use `bun` for all commands (not npm/yarn/pnpm). Note: `bunfig.toml` sets `bun = false`, so scripts run via Node runtime, not Bun runtime.

- `bun run build` - Build library with tsdown (ESM + IIFE)
- `bun dev` - Build in watch mode
- `bun dev:playground` - Run playground dev server (Vite, port 3000)
- `bun run test` - Run tests (Vitest)
- `bun run test tests/unit/math/vec3.test.ts` - Run specific test file
- `bun run test -t "quaternion"` - Run tests matching pattern
- `bun run test:coverage` - Run tests with coverage
- `bun lint` - Lint with oxlint (type-aware)
- `bun lint:fix` - Lint and auto-fix
- `bun fmt` - Format with oxfmt
- `bun bench:math` - Run all math benchmarks (mitata)
- `bun bench:math:vec3` - Run specific benchmark file
- `bun docs:dev` - Run docs dev server (VitePress)
- `bun docs:build` - Build documentation

## Conventions

- **Commits**: Conventional Commits enforced via commitlint (`feat:`, `fix:`, `refactor:`, etc.)
- **Git hooks**: bun-git-hooks (`git-hooks.config.ts`) — pre-commit runs lint-staged (oxlint on staged files), commit-msg validates format via commitlint
- **Path alias**: `@/*` maps to `./src/*` in both tsconfig and vitest
- **Formatting**: oxfmt with 2-space indent, LF line endings, max 100 chars

## Architecture

### Entry Points (Tree-Shakable)

Six package entry points, each a separate file in `src/`:

- `minecraft-skin-renderer` (`src/index.ts`) - Main API: `use()`, `createSkinViewer()`, types, utilities
- `minecraft-skin-renderer/webgl` (`src/webgl.ts`) - WebGL2 renderer plugin
- `minecraft-skin-renderer/webgpu` (`src/webgpu.ts`) - WebGPU renderer plugin
- `minecraft-skin-renderer/panorama` (`src/panorama.ts`) - Panorama background plugin
- `minecraft-skin-renderer/canvas2d` (`src/canvas2d.ts`) - 2D static skin rendering (no WebGL needed)
- `minecraft-skin-renderer/vue3` (`src/vue3.ts`) - Vue 3 components and composables

Plus two IIFE entries for `<script>` tag usage:
- `src/iife-core.ts` — auto-registers all plugins, global `MSR` namespace
- `src/iife-vue3.ts` — Vue 3 integration, global `MSRVue3` namespace (requires Vue 3 + MSR loaded first)

```ts
import { use, createSkinViewer } from "minecraft-skin-renderer";
import { WebGLRendererPlugin } from "minecraft-skin-renderer/webgl";

use(WebGLRendererPlugin); // Register before creating viewer
const viewer = await createSkinViewer({ canvas, skin: "..." });
```

### Build Configuration

tsdown produces three outputs (configured in `tsdown.config.ts`):

- **ESM** (`unbundle: true`) - Preserves module structure for tree-shaking
- **IIFE core** (`minecraft-skin-renderer.min.js`) - Minified, global `MSR` namespace, includes 3D viewer + all plugins + Canvas2D
- **IIFE vue3** (`minecraft-skin-renderer-vue3.min.js`) - Minified, global `MSRVue3` namespace, Vue 3 components/composables (externals: Vue + MSR)

### Plugin System

Two separate plugin registries:

1. **Renderer plugins** (`src/core/renderer/registry.ts`) - WebGL/WebGPU backends registered via `use()`. Each provides a factory function, backend-specific shaders, and optional shader composition hooks.

2. **Feature plugins** (`src/core/plugins/registry.ts`) - Non-renderer plugins (e.g., Panorama as a `BackgroundPlugin`). Registered internally when `use()` detects a feature plugin.

Shader composition (`src/core/renderer/shader-composer.ts`) supports injection markers (`[PLUGIN_VERTEX_DECLARATIONS]`, etc.) for plugin shader code.

### Canvas2D Module

Standalone 2D rendering system at `src/canvas2d/` — no WebGL/WebGPU required. Provides 7 render functions: `renderAvatar`, `renderSkinFront`, `renderSkinBack`, `renderSkinSide`, `renderSkinIsometric`, `renderHalfBody`, `renderBigHead`. Each supports classic/slim variants and optional overlay layers.

**Node.js portability**: The module works in Node.js via `canvas-env.ts`. In non-browser environments, call `setCreateCanvas()` with a canvas factory (e.g., `@napi-rs/canvas`) before any render function. In the browser, it auto-detects `document.createElement("canvas")`.

### Core Modules

- **src/core/renderer/** - Renderer abstraction layer with `webgl/` and `webgpu/` backends implementing identical interfaces (`IRenderer`, `IBuffer`, `ITexture`, `IPipeline`, `IUniformBuffer`)
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
- **src/viewer/BoneMatrixComputer.ts** - Skeleton bone matrix computation
- **src/viewer/ResourceManager.ts** - GPU resource lifecycle management
- **src/viewer/RenderState.ts** - Per-frame render state

## Key Patterns

- Renderers implement `IRenderer`, `IBuffer`, `ITexture`, `IPipeline` interfaces
- Skeleton bones form a tree: Root → Body → (Head, Arms, Legs) → Overlays
- Cape and Elytra share the same texture format (64x32)
- All rotations use quaternions; conversions via `quatFromEuler()`

## Workspaces

- **playground/** - Vue 3 + Pinia + Vite interactive demo. Imports the library via Vite aliases (not `workspace:*`). Run with `bun dev:playground`.
- **native-playground/** - Node.js/Bun environment for testing Canvas2D rendering with `@napi-rs/canvas`. Validates that the Canvas2D module works outside the browser.
- **docs/** - VitePress documentation site. Run with `bun docs:dev`. Deployed to Vercel alongside the playground.

## Testing

Tests use Vitest with happy-dom environment and `globals: true` (no need to import `describe`/`it`/`expect`). WebGL is mocked via `vitest-webgl-canvas-mock`.

Test setup (`tests/setup.ts`) mocks: `requestAnimationFrame`, `performance.now()`, `createImageBitmap()` (returns 64×64 dummy), `HTMLCanvasElement.transferToImageBitmap()`.

Test structure mirrors src: `tests/unit/{animation,canvas2d,core,math,model,viewer}/`

Coverage excludes `.d.ts` files and barrel `index.ts` files.

## Release

Automated via release-please on `main` branch. On release, publishes to npm (with provenance), JSR (`bunx jsr publish`), and GitHub Packages. Version is synced across `package.json` and `jsr.json`.
