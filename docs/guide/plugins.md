# 插件系统

Minecraft Skin Renderer 使用插件架构来保持核心的轻量化，同时提供可扩展的功能。

## 插件类型

项目包含两类插件：

### 渲染器插件

渲染器插件提供不同的图形后端实现，通过 `use()` 注册：

- **WebGLRendererPlugin** — 基于 WebGL2 的渲染器
- **WebGPURendererPlugin** — 基于 WebGPU 的渲染器

```ts
import { use } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

use(WebGLRendererPlugin);
```

::: warning 注意
渲染器插件必须在调用 `createSkinViewer()` 之前注册。
:::

### 功能插件

功能插件为 viewer 添加额外能力：

- **PanoramaBackgroundPlugin** — 全景图背景

```ts
import { use } from "@daidr/minecraft-skin-renderer";
import { PanoramaBackgroundPlugin } from "@daidr/minecraft-skin-renderer/panorama";

use(PanoramaBackgroundPlugin);
```

## 按需加载

得益于 ESM 模块化设计和独立的入口点，你只需导入实际使用的插件。未导入的插件不会被打包到最终产物中，实现真正的树摇优化。
