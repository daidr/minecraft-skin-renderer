# API 参考

本节包含 Minecraft Skin Renderer 的完整 API 文档。

## 模块

| 模块     | 导入路径                                  | 说明                                                  |
| -------- | ----------------------------------------- | ----------------------------------------------------- |
| 核心     | `@daidr/minecraft-skin-renderer`          | 主 API：`use()`、`createSkinViewer()`、类型、工具函数 |
| WebGL    | `@daidr/minecraft-skin-renderer/webgl`    | WebGL2 渲染器插件                                     |
| WebGPU   | `@daidr/minecraft-skin-renderer/webgpu`   | WebGPU 渲染器插件                                     |
| Panorama | `@daidr/minecraft-skin-renderer/panorama` | 全景图背景插件                                        |
| Canvas2D | `@daidr/minecraft-skin-renderer/canvas2d` | 2D 静态皮肤渲染（无需 WebGL）                         |

## 章节

- [SkinViewer](./skin-viewer) — 3D 皮肤查看器核心 API，包括创建选项、实例方法、相机控制、部位可见性和工具函数
- [Canvas2D](./canvas2d) — 7 个 2D 静态渲染函数，支持浏览器和 Node.js 环境
- [动画](./animations) — 动画系统、预设动画、自定义动画注册和缓动函数

## 快速入口

### 核心 API

```ts
import {
  use, // 注册插件
  createSkinViewer, // 创建 3D 查看器
  registerAnimation, // 注册自定义动画
  getAnimation, // 获取动画定义
  isWebGPUSupported, // WebGPU 支持检测
  isWebGL2Supported, // WebGL2 支持检测
  detectBestBackend, // 自动检测最佳后端
  loadSkinTexture, // 加载皮肤纹理
  loadCapeTexture, // 加载披风纹理
  createDefaultVisibility, // 创建默认可见性
  PART_NAMES, // 部位名称常量
} from "@daidr/minecraft-skin-renderer";
```

### 插件

```ts
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";
import { WebGPURendererPlugin } from "@daidr/minecraft-skin-renderer/webgpu";
import { PanoramaPlugin } from "@daidr/minecraft-skin-renderer/panorama";
```

### Canvas2D

```ts
import {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
  setCreateCanvas,
} from "@daidr/minecraft-skin-renderer/canvas2d";
```
