# 快速上手

## 基本用法

使用 Minecraft Skin Renderer 渲染一个 3D 皮肤模型只需几步：

### 1. 注册渲染器插件

在创建 viewer 之前，需要先注册一个渲染器后端插件：

```ts
import { use, createSkinViewer } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

// 注册 WebGL 渲染器
use(WebGLRendererPlugin);
```

### 2. 创建 SkinViewer

```ts
const viewer = await createSkinViewer({
  canvas: document.getElementById("canvas"),
  skin: "skin-url-or-base64",
});
```

### 3. 完整示例

```html
<canvas id="skin-canvas" width="300" height="400"></canvas>

<script type="module">
  import { use, createSkinViewer } from "@daidr/minecraft-skin-renderer";
  import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

  use(WebGLRendererPlugin);

  const viewer = await createSkinViewer({
    canvas: document.getElementById("skin-canvas"),
    skin: "https://example.com/skin.png",
  });
</script>
```

## 使用 WebGPU

如果你想使用 WebGPU 作为渲染后端：

```ts
import { use, createSkinViewer } from "@daidr/minecraft-skin-renderer";
import { WebGPURendererPlugin } from "@daidr/minecraft-skin-renderer/webgpu";

use(WebGPURendererPlugin);

const viewer = await createSkinViewer({
  canvas: document.getElementById("canvas"),
  skin: "skin-url-or-base64",
});
```

## 使用 Canvas2D

如果不需要 3D 渲染，可以使用 Canvas2D 模块生成静态 2D 皮肤预览：

```ts
import { renderAvatar, renderSkinFront } from "@daidr/minecraft-skin-renderer/canvas2d";

// 渲染头像
const avatarCanvas = renderAvatar(skinImage, { scale: 8 });

// 渲染皮肤正面全身
const frontCanvas = renderSkinFront(skinImage, { scale: 4 });
```

## 下一步

- [插件系统](./plugins) — 了解渲染器插件和功能插件的工作方式
- [API 参考](/api/) — 查看完整的 API 文档
