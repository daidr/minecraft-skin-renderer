# 示例

本节展示 Minecraft Skin Renderer 的常见使用场景和代码示例。

## 基础 3D 渲染

使用 WebGL 渲染一个 3D 皮肤模型：

```ts
import { use, createSkinViewer } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

use(WebGLRendererPlugin);

const viewer = await createSkinViewer({
  canvas: document.getElementById("canvas"),
  skin: "https://example.com/skin.png",
});
```

## 2D 头像渲染

快速生成一个像素风格的头像：

```ts
import { renderAvatar } from "@daidr/minecraft-skin-renderer/canvas2d";

const avatarCanvas = renderAvatar(skinImage, { scale: 8 });
document.body.appendChild(avatarCanvas);
```

## 全景图背景

为 3D 场景添加全景图背景：

```ts
import { use, createSkinViewer } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";
import { PanoramaBackgroundPlugin } from "@daidr/minecraft-skin-renderer/panorama";

use(WebGLRendererPlugin);
use(PanoramaBackgroundPlugin);

const viewer = await createSkinViewer({
  canvas: document.getElementById("canvas"),
  skin: "https://example.com/skin.png",
  panorama: "https://example.com/panorama.png",
});
```

::: tip
更多示例将持续补充。你也可以访问 [在线 Playground](https://mcskin.daidr.me/playground/) 进行交互体验。
:::
