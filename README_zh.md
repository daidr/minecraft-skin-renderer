# minecraft-skin-renderer

[![npm version](https://img.shields.io/npm/v/@daidr/minecraft-skin-renderer.svg)](https://www.npmjs.com/package/@daidr/minecraft-skin-renderer)
[![JSR](https://jsr.io/badges/@daidr/minecraft-skin-renderer)](https://jsr.io/@daidr/minecraft-skin-renderer)
[![JSR Score](https://jsr.io/badges/@daidr/minecraft-skin-renderer/score)](https://jsr.io/@daidr/minecraft-skin-renderer)
[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-available-blue?logo=github)](https://github.com/daidr/minecraft-skin-renderer/pkgs/npm/minecraft-skin-renderer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

高性能、基于浏览器的 3D Minecraft 皮肤渲染器，支持 WebGL 和 WebGPU。

[在线演示](https://mcskin.daidr.me)

## 特性

- **双渲染后端** - WebGL2 提供广泛兼容性，WebGPU 提供现代高性能
- **皮肤变体** - 支持经典款（4px 手臂）和纤细款（3px 手臂）模型
- **背部装备** - 披风和鞘翅渲染
- **动画系统** - 内置预设动画（idle、walk、run、fly），支持自定义动画
- **相机控制** - 轨道控制，支持缩放、旋转和自动旋转
- **全景背景** - 通过插件支持等距圆柱投影全景图
- **2D 静态渲染** - 轻量级 Canvas 2D 渲染（头像、全身、等距视角、大头版）
- **截图导出** - 导出渲染结果为 PNG 或 JPEG
- **按需加载** - 插件架构实现最小打包体积

## 快速开始

### 安装

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

### 基础用法

```typescript
import { use, createSkinViewer } from "minecraft-skin-renderer";
import { WebGLRendererPlugin } from "minecraft-skin-renderer/webgl";

// 注册渲染器插件（必须在创建 viewer 之前调用）
use(WebGLRendererPlugin);

// 创建 viewer
const viewer = await createSkinViewer({
  canvas: document.getElementById("canvas") as HTMLCanvasElement,
  skin: "https://example.com/skin.png",
});

// 开始渲染
viewer.startRenderLoop();

// 播放动画
viewer.playAnimation("walk");
```

## API 参考

### `use(plugin)`

注册渲染器或功能插件。必须在 `createSkinViewer()` 之前调用。

```typescript
import { use } from "minecraft-skin-renderer";
import { WebGLRendererPlugin } from "minecraft-skin-renderer/webgl";
import { WebGPURendererPlugin } from "minecraft-skin-renderer/webgpu";
import { PanoramaPlugin } from "minecraft-skin-renderer/panorama";

use(WebGLRendererPlugin);
use(WebGPURendererPlugin);
use(PanoramaPlugin);
```

### `createSkinViewer(options)`

创建并初始化皮肤查看器实例。

```typescript
const viewer = await createSkinViewer({
  canvas: HTMLCanvasElement, // 必需：canvas 元素
  preferredBackend: "auto", // 'webgl' | 'webgpu' | 'auto'
  antialias: true, // 启用抗锯齿
  pixelRatio: window.devicePixelRatio,
  skin: "url" | File | Blob, // 皮肤纹理来源
  cape: "url" | File | Blob, // 披风纹理（64x32）
  backEquipment: "none", // 'cape' | 'elytra' | 'none'
  slim: false, // 使用纤细模型变体
  fov: 70, // 视场角（度）
  zoom: 60, // 初始缩放距离
  enableRotate: true, // 启用轨道旋转
  enableZoom: true, // 启用缩放控制
  autoRotate: false, // 自动旋转相机
  autoRotateSpeed: 30, // 每秒旋转度数
  panorama: "url", // 全景背景（需要 PanoramaPlugin）
});
```

### SkinViewer 方法

#### 纹理

```typescript
await viewer.setSkin(source); // 设置皮肤纹理
await viewer.setCape(source); // 设置披风纹理
viewer.setSlim(true); // 切换到纤细模型
viewer.setBackEquipment("cape"); // 'cape' | 'elytra' | 'none'
```

#### 可见性

```typescript
// 获取当前可见性状态
const visibility = viewer.getPartsVisibility();

// 设置所有部位的可见性
viewer.setPartsVisibility({
  head: { inner: true, outer: true },
  body: { inner: true, outer: false },
  // ...
});

// 设置单个部位可见性
viewer.setPartVisibility("head", "outer", false);
```

#### 动画

```typescript
viewer.playAnimation("walk"); // 播放动画
viewer.playAnimation("walk", {
  // 带选项
  speed: 1.5,
  amplitude: 1.0,
});
viewer.pauseAnimation(); // 暂停
viewer.resumeAnimation(); // 恢复
viewer.stopAnimation(); // 停止
```

#### 相机

```typescript
viewer.setRotation(theta, phi); // 设置相机角度
const { theta, phi } = viewer.getRotation();
viewer.setZoom(80); // 设置缩放距离
viewer.getZoom(); // 获取当前缩放
viewer.setAutoRotate(true); // 切换自动旋转
viewer.resetCamera(); // 重置为默认值
```

#### 渲染

```typescript
viewer.render(); // 手动渲染
viewer.startRenderLoop(); // 启动 RAF 循环
viewer.stopRenderLoop(); // 停止 RAF 循环
viewer.resize(width, height); // 调整画布大小
const dataUrl = viewer.screenshot("png", 0.9); // 导出截图
```

#### 生命周期

```typescript
viewer.dispose(); // 清理资源
```

#### 属性

```typescript
viewer.backend; // 'webgl' | 'webgpu'（只读）
viewer.isPlaying; // 动画是否播放中（只读）
viewer.currentAnimation; // 当前动画名称（只读）
viewer.backEquipment; // 当前背部装备（只读）
```

### 插件

| 插件     | 导入路径                           | 描述                |
| -------- | ---------------------------------- | ------------------- |
| WebGL    | `minecraft-skin-renderer/webgl`    | WebGL2 渲染后端     |
| WebGPU   | `minecraft-skin-renderer/webgpu`   | WebGPU 渲染后端     |
| Panorama | `minecraft-skin-renderer/panorama` | 全景背景支持        |
| Canvas2D | `minecraft-skin-renderer/canvas2d` | 2D 静态渲染模块     |

### Canvas 2D 渲染

轻量级 2D 渲染模块，基于 Canvas 2D API，无需 WebGL/WebGPU。

```typescript
import {
  renderAvatar,
  renderSkinFront,
  renderSkinBack,
  renderSkinSide,
  renderSkinIsometric,
  renderHalfBody,
  renderBigHead,
} from "minecraft-skin-renderer/canvas2d";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// 渲染头像
await renderAvatar(canvas, {
  skin: "https://example.com/skin.png",
});

// 渲染全身正面视图
await renderSkinFront(canvas, {
  skin: "https://example.com/skin.png",
  slim: true, // 使用纤细模型变体
  scale: 8, // 1 MC 像素 = 8 屏幕像素（默认值）
  showOverlay: true, // 显示外层覆盖层（默认值）
  overlayInflated: false, // 膨胀覆盖层使其有 3D 效果（默认 false）
});

// 渲染大头版（Q版）
await renderBigHead(canvas, {
  skin: "https://example.com/skin.png",
  border: 2, // 边框宽度，虚拟像素单位（默认 2）
  borderColor: "black", // 边框颜色（默认 'black'）
});
```

#### 渲染函数

| 函数                 | 描述                             |
| -------------------- | -------------------------------- |
| `renderAvatar`       | 头部正面（8×8 MC 像素）          |
| `renderSkinFront`    | 全身正面视图                     |
| `renderSkinBack`     | 全身背面视图                     |
| `renderSkinSide`     | 全身侧面视图                     |
| `renderSkinIsometric`| 2.5D 等距视角                    |
| `renderHalfBody`     | 上半身肖像                       |
| `renderBigHead`      | 大头版（Q版），带边框            |

#### 通用选项 (`BaseRenderOptions`)

| 选项              | 类型            | 默认值    | 描述                                           |
| ----------------- | --------------- | --------- | ---------------------------------------------- |
| `skin`            | `TextureSource` | 必填      | 皮肤纹理（URL、Blob、HTMLImageElement 或 ImageBitmap） |
| `slim`            | `boolean`       | `false`   | 使用纤细款（3px）手臂模型                       |
| `showOverlay`     | `boolean`       | `true`    | 显示外层覆盖层                                  |
| `scale`           | `number`        | `8`       | 像素缩放比（1 MC 像素 = scale 屏幕像素）        |
| `overlayInflated` | `boolean`       | `false`   | 覆盖层略微放大渲染（类似 3D 效果）              |

`renderBigHead` 额外支持 `border`（默认 `2`）和 `borderColor`（默认 `'black'`）。

所有函数签名为 `(canvas: HTMLCanvasElement, options) => Promise<void>`。画布会自动调整大小以适应渲染内容。

### 内置动画

| 名称   | 描述          |
| ------ | ------------- |
| `idle` | 站立待机动画  |
| `walk` | 行走动画      |
| `run`  | 奔跑动画      |
| `fly`  | 飞行/滑翔动画 |

## 开发

### 环境要求

- Node.js 18+ 或 Bun

### 安装

```bash
# 安装依赖
bun install
```

### 脚本命令

| 命令                 | 描述                       |
| -------------------- | -------------------------- |
| `bun run build`      | 使用 tsdown 构建库         |
| `bun dev`            | 监听模式构建               |
| `bun dev:playground` | 运行 playground 开发服务器 |
| `bun test`           | 运行测试                   |
| `bun test:coverage`  | 运行测试并生成覆盖率报告   |
| `bun lint`           | 使用 oxlint 检查代码       |
| `bun lint:fix`       | 检查并自动修复             |
| `bun fmt`            | 使用 oxfmt 格式化代码      |

### 项目结构

```
src/
├── core/
│   ├── renderer/     # 渲染器抽象层（WebGL/WebGPU）
│   ├── math/         # 数学工具（Vec3、Mat4、Quat）
│   ├── camera/       # 相机系统
│   └── plugins/      # 插件注册
├── model/            # 骨骼和几何体
├── animation/        # 动画系统
├── viewer/           # 主 SkinViewer
└── plugins/          # 插件实现
```

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 开源协议

[MIT](LICENSE)
