# 安装

## 包管理器

::: code-group

```sh [npm]
npm install @daidr/minecraft-skin-renderer
```

```sh [pnpm]
pnpm add @daidr/minecraft-skin-renderer
```

```sh [yarn]
yarn add @daidr/minecraft-skin-renderer
```

```sh [bun]
bun add @daidr/minecraft-skin-renderer
```

:::

::: tip 注册渲染器插件
使用 3D 查看器前需注册至少一个渲染器插件。可以在应用入口处调用 `use()` 全局注册，或在 Vue 3 中通过 `plugins` prop 传入：

```ts
// 全局注册
import { use } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";
use(WebGLRendererPlugin);
```

```vue
<!-- Vue 3：通过 plugins prop 注册 -->
<script setup>
import { SkinViewer } from "@daidr/minecraft-skin-renderer/vue3";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";
</script>

<template>
  <SkinViewer :plugins="[WebGLRendererPlugin]" :skin="skinUrl" />
</template>
```

参考[快速上手](./getting-started)了解详情。
:::

## JSR

本库也发布在 [JSR](https://jsr.io/@daidr/minecraft-skin-renderer) 上：

::: code-group

```sh [npx]
npx jsr add @daidr/minecraft-skin-renderer
```

```sh [pnpm]
pnpm dlx jsr add @daidr/minecraft-skin-renderer
```

```sh [yarn]
yarn dlx jsr add @daidr/minecraft-skin-renderer
```

```sh [bunx]
bunx jsr add @daidr/minecraft-skin-renderer
```

```sh [deno]
deno add jsr:@daidr/minecraft-skin-renderer
```

:::

## CDN

你也可以通过 `<script>` 标签直接引入 IIFE 版本：

### 核心包

```html
<script src="https://unpkg.com/@daidr/minecraft-skin-renderer/dist/minecraft-skin-renderer.min.js"></script>
```

引入后，所有 API（包括 3D 查看器、所有渲染器插件和 Canvas2D 渲染函数）将挂载在全局 `MSR` 命名空间下。渲染器插件会自动注册，无需手动调用 `use()`。

```html
<script src="https://unpkg.com/@daidr/minecraft-skin-renderer/dist/minecraft-skin-renderer.min.js"></script>
<script>
  // 3D 查看器（插件已自动注册）
  const viewer = await MSR.createSkinViewer({
    canvas: document.getElementById("canvas"),
    skin: "https://example.com/skin.png",
  });
  viewer.startRenderLoop();

  // Canvas2D 渲染
  const avatarCanvas = document.getElementById("avatar");
  await MSR.renderAvatar(avatarCanvas, { skin: "https://example.com/skin.png", scale: 8 });
</script>
```

### Vue 3 集成

如果需要在 Vue 3 中通过 CDN 使用，需要按顺序加载三个脚本：

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/@daidr/minecraft-skin-renderer/dist/minecraft-skin-renderer.min.js"></script>
<script src="https://unpkg.com/@daidr/minecraft-skin-renderer/dist/minecraft-skin-renderer-vue3.min.js"></script>
```

Vue 3 组件和组合式函数将挂载在全局 `MSRVue3` 命名空间下。

```html
<script>
  const app = Vue.createApp({
    setup() {
      const { containerRef, viewer } = MSRVue3.useSkinViewer(() => ({
        skin: "https://example.com/skin.png",
        animation: "walk",
      }));
      return { containerRef };
    },
    template: '<div ref="containerRef" style="width:400px;height:600px" />',
  });
  app.mount("#app");
</script>
```
