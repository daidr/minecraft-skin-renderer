# Vue 3

本库提供了开箱即用的 Vue 3 集成，包括 `SkinViewer` 组件和一系列组合式函数。

## 安装

确保你的项目已安装 Vue 3，然后从 `vue3` 子路径导入：

```ts
import { SkinViewer, useSkinViewer } from "@daidr/minecraft-skin-renderer/vue3";
```

::: tip
使用组合式函数或组件前，仍需注册渲染器插件。你可以在应用入口处调用 `use()`，或通过 `plugins` 选项传入。
:::

## SkinViewer 组件

`SkinViewer` 是一个 Props 驱动的 3D 皮肤查看器组件，渲染一个承载 WebGL/WebGPU 画布的容器 `div`。所有选项通过 props 控制，响应式同步到查看器实例。

### 基本用法

```vue
<script setup lang="ts">
import { SkinViewer } from "@daidr/minecraft-skin-renderer/vue3";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

const skinUrl = "https://example.com/skin.png";
</script>

<template>
  <SkinViewer
    :plugins="[WebGLRendererPlugin]"
    :skin="skinUrl"
    animation="walk"
    style="width: 400px; height: 600px"
  />
</template>
```

### Props

| Prop                 | 类型                            | 默认值   | 说明                                                   |
| -------------------- | ------------------------------- | -------- | ------------------------------------------------------ |
| `plugins`            | `AnyRegistrablePlugin[]`        | —        | 自动注册的插件列表                                     |
| `skin`               | `TextureSource`                 | —        | 皮肤纹理（URL、Blob、HTMLImageElement 或 ImageBitmap） |
| `cape`               | `TextureSource \| null`         | —        | 披风纹理，`null` 隐藏披风                              |
| `slim`               | `boolean`                       | `false`  | 是否使用纤细（3px）手臂模型                            |
| `backEquipment`      | `'none' \| 'cape' \| 'elytra'`  | `'none'` | 背部装备                                               |
| `preferredBackend`   | `'webgl' \| 'webgpu' \| 'auto'` | `'auto'` | 首选渲染后端                                           |
| `zoom`               | `number`                        | —        | 相机缩放距离                                           |
| `autoRotate`         | `boolean`                       | `false`  | 启用自动旋转                                           |
| `autoRotateSpeed`    | `number`                        | —        | 自动旋转速度                                           |
| `enableRotate`       | `boolean`                       | `true`   | 启用鼠标旋转控制                                       |
| `enableZoom`         | `boolean`                       | `true`   | 启用鼠标缩放控制                                       |
| `animation`          | `string \| null`                | —        | 播放的动画名称，`null` 停止动画                        |
| `animationSpeed`     | `number`                        | `1`      | 动画播放速度倍率                                       |
| `animationAmplitude` | `number`                        | `1`      | 动画运动幅度倍率                                       |
| `partsVisibility`    | `PartsVisibility`               | —        | 各部位图层可见性                                       |
| `panorama`           | `TextureSource \| null`         | —        | 全景图背景（需要 PanoramaPlugin）                      |
| `pixelRatio`         | `number`                        | —        | 设备像素比覆盖                                         |
| `antialias`          | `boolean`                       | `true`   | 启用抗锯齿                                             |
| `fov`                | `number`                        | —        | 相机视场角（度）                                       |

### 事件

| 事件    | 参数                   | 说明                     |
| ------- | ---------------------- | ------------------------ |
| `ready` | `(viewer: SkinViewer)` | 查看器初始化完成时触发   |
| `error` | `(error: Error)`       | 初始化或运行时出错时触发 |

### 暴露方法

通过模板引用（template ref）访问：

```vue
<script setup lang="ts">
import { ref } from "vue";
import { SkinViewer } from "@daidr/minecraft-skin-renderer/vue3";

const viewerRef = ref<InstanceType<typeof SkinViewer>>();

function takeScreenshot() {
  const dataUrl = viewerRef.value?.screenshot("png");
  // ...
}
</script>

<template>
  <SkinViewer ref="viewerRef" :skin="skinUrl" />
</template>
```

| 方法         | 类型                                                           | 说明             |
| ------------ | -------------------------------------------------------------- | ---------------- |
| `viewer`     | `ShallowRef<SkinViewer \| null>`                               | 查看器实例       |
| `backend`    | `ComputedRef<BackendType \| null>`                             | 当前渲染后端     |
| `screenshot` | `(type?: 'png' \| 'jpeg', quality?: number) => string \| null` | 截图             |
| `recreate`   | `() => Promise<void>`                                          | 销毁并重建查看器 |

## useSkinViewer

底层组合式函数，用于手动管理 SkinViewer 实例的创建和生命周期。适合需要更细粒度控制的场景。

### 基本用法

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useSkinViewer } from "@daidr/minecraft-skin-renderer/vue3";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";

const skinUrl = ref("https://example.com/skin.png");

const { containerRef, viewer, isReady, error } = useSkinViewer(() => ({
  plugins: [WebGLRendererPlugin],
  skin: skinUrl.value,
  animation: "walk",
}));
</script>

<template>
  <div ref="containerRef" style="width: 400px; height: 600px" />
</template>
```

### 选项

传入一个返回 `UseSkinViewerOptions` 的 getter 函数。动态选项（`skin`、`cape`、`slim`、`zoom`、`animation` 等）会被自动监听并同步到查看器。创建时选项（`preferredBackend`、`antialias`、`fov` 等）仅在初始化时应用，修改后需调用 `recreate()` 重新初始化。

### 返回值

| 属性           | 类型                                                           | 说明                     |
| -------------- | -------------------------------------------------------------- | ------------------------ |
| `containerRef` | `Ref<HTMLElement \| null>`                                     | 绑定到容器元素的模板引用 |
| `viewer`       | `ShallowRef<SkinViewer \| null>`                               | 查看器实例               |
| `backend`      | `ComputedRef<BackendType \| null>`                             | 当前渲染后端             |
| `isReady`      | `Ref<boolean>`                                                 | 查看器是否已初始化       |
| `error`        | `ShallowRef<Error \| null>`                                    | 初始化或运行时错误       |
| `screenshot`   | `(type?: 'png' \| 'jpeg', quality?: number) => string \| null` | 截图                     |
| `recreate`     | `() => Promise<void>`                                          | 销毁并重建查看器         |

## 2D 渲染组合式函数

提供一组组合式函数，将 Canvas2D 渲染函数包装为响应式接口。当 canvas ref 或选项变化时自动重新渲染。

### 可用函数

| 组合式函数               | 对应渲染函数          | 说明             |
| ------------------------ | --------------------- | ---------------- |
| `useRenderAvatar`        | `renderAvatar`        | 头像（头部正面） |
| `useRenderSkinFront`     | `renderSkinFront`     | 全身正面         |
| `useRenderSkinBack`      | `renderSkinBack`      | 全身背面         |
| `useRenderSkinSide`      | `renderSkinSide`      | 全身侧面         |
| `useRenderSkinIsometric` | `renderSkinIsometric` | 2.5D 等距视图    |
| `useRenderHalfBody`      | `renderHalfBody`      | 半身像           |
| `useRenderBigHead`       | `renderBigHead`       | 大头（Q 版）     |

### 用法

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useRenderAvatar } from "@daidr/minecraft-skin-renderer/vue3";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const skinUrl = ref("https://example.com/skin.png");

const { isRendering, error } = useRenderAvatar(canvasRef, () => ({
  skin: skinUrl.value,
  scale: 8,
}));
</script>

<template>
  <canvas ref="canvasRef" />
  <p v-if="isRendering">渲染中...</p>
  <p v-if="error">{{ error.message }}</p>
</template>
```

### 返回值

所有 2D 渲染组合式函数返回相同的类型：

| 属性          | 类型                        | 说明         |
| ------------- | --------------------------- | ------------ |
| `render`      | `() => Promise<void>`       | 手动触发渲染 |
| `isRendering` | `Ref<boolean>`              | 是否正在渲染 |
| `error`       | `ShallowRef<Error \| null>` | 渲染错误     |
