# minecraft-skin-renderer

[![npm version](https://img.shields.io/npm/v/minecraft-skin-renderer.svg)](https://www.npmjs.com/package/minecraft-skin-renderer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, browser-based 3D Minecraft skin renderer with WebGL and WebGPU support.

[Online Demo](https://mcskin.daidr.me)

## Features

- **Dual Rendering Backends** - WebGL2 for broad compatibility, WebGPU for modern performance
- **Skin Variants** - Classic (4px arms) and slim (3px arms) model support
- **Back Equipment** - Cape and elytra rendering
- **Animations** - Built-in presets (idle, walk, run, fly) with custom animation support
- **Camera Controls** - Orbit controls with zoom, rotation, and auto-rotate
- **Panorama Backgrounds** - Equirectangular panorama support via plugin
- **Screenshot Export** - Export renders as PNG or JPEG
- **Tree-Shakable** - Plugin architecture for minimal bundle size

## Quick Start

### Installation

```bash
# npm
npm install minecraft-skin-renderer

# pnpm
pnpm add minecraft-skin-renderer

# yarn
yarn add minecraft-skin-renderer

# bun
bun add minecraft-skin-renderer
```

### Basic Usage

```typescript
import { use, createSkinViewer } from 'minecraft-skin-renderer'
import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'

// Register renderer plugin (required before creating viewer)
use(WebGLRendererPlugin)

// Create viewer
const viewer = await createSkinViewer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  skin: 'https://example.com/skin.png',
})

// Start rendering
viewer.startRenderLoop()

// Play animation
viewer.playAnimation('walk')
```

## API Reference

### `use(plugin)`

Register a renderer or feature plugin. Must be called before `createSkinViewer()`.

```typescript
import { use } from 'minecraft-skin-renderer'
import { WebGLRendererPlugin } from 'minecraft-skin-renderer/webgl'
import { WebGPURendererPlugin } from 'minecraft-skin-renderer/webgpu'
import { PanoramaPlugin } from 'minecraft-skin-renderer/panorama'

use(WebGLRendererPlugin)
use(WebGPURendererPlugin)
use(PanoramaPlugin)
```

### `createSkinViewer(options)`

Create and initialize a skin viewer instance.

```typescript
const viewer = await createSkinViewer({
  canvas: HTMLCanvasElement,        // Required: canvas element
  preferredBackend: 'auto',         // 'webgl' | 'webgpu' | 'auto'
  antialias: true,                  // Enable antialiasing
  pixelRatio: window.devicePixelRatio,
  skin: 'url' | File | Blob,        // Skin texture source
  cape: 'url' | File | Blob,        // Cape texture (64x32)
  backEquipment: 'none',            // 'cape' | 'elytra' | 'none'
  slim: false,                      // Use slim model variant
  fov: 70,                          // Field of view in degrees
  zoom: 60,                         // Initial zoom distance
  enableRotate: true,               // Enable orbit rotation
  enableZoom: true,                 // Enable zoom controls
  autoRotate: false,                // Auto-rotate camera
  autoRotateSpeed: 30,              // Degrees per second
  panorama: 'url',                  // Panorama background (requires PanoramaPlugin)
})
```

### SkinViewer Methods

#### Textures

```typescript
await viewer.setSkin(source)        // Set skin texture
await viewer.setCape(source)        // Set cape texture
viewer.setSlim(true)                // Switch to slim model
viewer.setBackEquipment('cape')     // 'cape' | 'elytra' | 'none'
```

#### Visibility

```typescript
// Get current visibility state
const visibility = viewer.getPartsVisibility()

// Set visibility for all parts
viewer.setPartsVisibility({
  head: { inner: true, outer: true },
  body: { inner: true, outer: false },
  // ...
})

// Set single part visibility
viewer.setPartVisibility('head', 'outer', false)
```

#### Animation

```typescript
viewer.playAnimation('walk')        // Play animation
viewer.playAnimation('walk', {      // With options
  speed: 1.5,
  amplitude: 1.0,
})
viewer.pauseAnimation()             // Pause
viewer.resumeAnimation()            // Resume
viewer.stopAnimation()              // Stop
```

#### Camera

```typescript
viewer.setRotation(theta, phi)      // Set camera angles
const { theta, phi } = viewer.getRotation()
viewer.setZoom(80)                  // Set zoom distance
viewer.getZoom()                    // Get current zoom
viewer.setAutoRotate(true)          // Toggle auto-rotate
viewer.resetCamera()                // Reset to default
```

#### Rendering

```typescript
viewer.render()                     // Manual render
viewer.startRenderLoop()            // Start RAF loop
viewer.stopRenderLoop()             // Stop RAF loop
viewer.resize(width, height)        // Resize canvas
const dataUrl = viewer.screenshot('png', 0.9)  // Export
```

#### Lifecycle

```typescript
viewer.dispose()                    // Clean up resources
```

#### Properties

```typescript
viewer.backend                      // 'webgl' | 'webgpu' (readonly)
viewer.isPlaying                    // Animation playing (readonly)
viewer.currentAnimation             // Current animation name (readonly)
viewer.backEquipment                // Current back equipment (readonly)
```

### Plugins

| Plugin | Import Path | Description |
|--------|-------------|-------------|
| WebGL | `minecraft-skin-renderer/webgl` | WebGL2 rendering backend |
| WebGPU | `minecraft-skin-renderer/webgpu` | WebGPU rendering backend |
| Panorama | `minecraft-skin-renderer/panorama` | Panorama background support |

### Built-in Animations

| Name | Description |
|------|-------------|
| `idle` | Standing idle animation |
| `walk` | Walking animation |
| `run` | Running animation |
| `fly` | Flying/gliding animation |

## Development

### Prerequisites

- Node.js 18+ or Bun

### Setup

```bash
# Install dependencies
bun install
```

### Scripts

| Command | Description |
|---------|-------------|
| `bun run build` | Build library with tsdown |
| `bun dev` | Build in watch mode |
| `bun dev:playground` | Run playground dev server |
| `bun test` | Run tests |
| `bun test:coverage` | Run tests with coverage |
| `bun lint` | Lint with oxlint |
| `bun lint:fix` | Lint and auto-fix |
| `bun fmt` | Format with oxfmt |

### Project Structure

```
src/
├── core/
│   ├── renderer/     # Renderer abstraction (WebGL/WebGPU)
│   ├── math/         # Math utilities (Vec3, Mat4, Quat)
│   ├── camera/       # Camera system
│   └── plugins/      # Plugin registry
├── model/            # Skeleton and geometry
├── animation/        # Animation system
├── viewer/           # Main SkinViewer
└── plugins/          # Plugin implementations
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
