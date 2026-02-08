# 简介

Minecraft Skin Renderer 是一个零依赖的 Minecraft 皮肤渲染库，支持 WebGL2、WebGPU 和 Canvas2D 多种渲染后端。

## 特性

- **多渲染后端** — 支持 WebGL2 和 WebGPU，通过插件系统按需注册
- **零依赖** — 纯 TypeScript 实现，无第三方依赖
- **树摇优化** — ESM 模块化入口，只打包实际使用的功能
- **Canvas2D 渲染** — 不需要 WebGL 即可生成 2D 皮肤静态预览
- **Node.js 支持** — Canvas2D 模块可在 Node.js 环境中运行
- **动画系统** — 内置空闲、行走、奔跑、飞行等预设动画
- **插件架构** — 可扩展的渲染器插件和功能插件系统

## 下一步

- [安装](./installation) — 了解如何安装到你的项目
- [快速上手](./getting-started) — 几分钟内渲染你的第一个皮肤
