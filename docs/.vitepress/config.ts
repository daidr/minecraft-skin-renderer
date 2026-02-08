import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "Minecraft Skin Renderer",
  description: "零依赖的 Minecraft 皮肤渲染器，支持 WebGL 和 WebGPU",

  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/", activeMatch: "/guide/" },
      { text: "API 参考", link: "/api/", activeMatch: "/api/" },
      { text: "示例", link: "/examples/", activeMatch: "/examples/" },
      {
        text: "Playground",
        link: "https://mcskin.daidr.me/playground/",
        target: "_blank",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "开始",
          items: [
            { text: "简介", link: "/guide/" },
            { text: "安装", link: "/guide/installation" },
            { text: "快速上手", link: "/guide/getting-started" },
          ],
        },
        {
          text: "进阶",
          items: [{ text: "插件系统", link: "/guide/plugins" }],
        },
      ],
      "/api/": [
        {
          text: "API 参考",
          items: [
            { text: "概览", link: "/api/" },
            { text: "SkinViewer", link: "/api/skin-viewer" },
            { text: "Canvas2D", link: "/api/canvas2d" },
            { text: "动画", link: "/api/animations" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "示例",
          items: [{ text: "概览", link: "/examples/" }],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/daidr/minecraft-skin-renderer",
      },
    ],

    outline: {
      label: "本页目录",
    },

    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    lastUpdated: {
      text: "最后更新于",
    },

    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "没有找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
    },
  },
});
