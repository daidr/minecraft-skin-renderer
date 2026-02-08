---
layout: home

hero:
  name: Minecraft Skin Renderer
  text: 零依赖的 Minecraft 皮肤渲染器
  tagline: 支持 WebGL、WebGPU 和 Canvas2D，轻量且可树摇优化
  actions:
    - theme: brand
      text: 快速上手
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/daidr/minecraft-skin-renderer

features:
  - title: 多渲染后端
    details: 同时支持 WebGL2 和 WebGPU，通过插件系统按需加载
  - title: 零依赖
    details: 纯 TypeScript 实现，不依赖任何第三方库
  - title: 树摇优化
    details: ESM 模块化设计，只打包你实际使用的功能
  - title: Canvas2D 渲染
    details: 无需 WebGL 即可生成 2D 皮肤预览，支持 Node.js 环境
---
