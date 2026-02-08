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

```html
<script src="https://unpkg.com/@daidr/minecraft-skin-renderer/dist/minecraft-skin-renderer.min.js"></script>
```

引入后，所有 API 将挂载在全局 `MSR` 命名空间下。

如果只需要 Canvas2D 渲染功能：

```html
<script src="https://unpkg.com/@daidr/minecraft-skin-renderer/dist/minecraft-skin-renderer-2d.min.js"></script>
```

Canvas2D API 将挂载在全局 `MSR2D` 命名空间下。
