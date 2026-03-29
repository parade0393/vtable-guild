import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'vtable-guild',
  description: 'Vue 3 表格组件库，支持主题预设、三层主题覆盖与多包发布。',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '架构', link: '/guide/architecture' },
      { text: '预设与语言', link: '/guide/presets-and-locales' },
      { text: '接入方式', link: '/guide/package-consumption' },
      { text: 'API', link: '/guide/api-reference' },
      { text: '贡献流程', link: '/guide/contributing-and-workflow' },
      { text: '完整接入', link: '/guide/business-integration' },
      { text: '主题', link: '/guide/theme-overrides' },
      { text: '发布', link: '/guide/testing-and-release' },
      { text: 'Roadmap', link: '/about/roadmap' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '概览', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '排序', link: '/guide/sorting' },
            { text: '筛选', link: '/guide/filtering' },
            { text: '行选择', link: '/guide/selection' },
            { text: '标题与摘要行', link: '/guide/title-footer-summary' },
            { text: '列宽拖拽', link: '/guide/column-resize' },
            { text: '多级表头与合并', link: '/guide/grouped-and-merged-cells' },
            { text: '自定义行与插槽', link: '/guide/api-wiring-and-slots' },
            { text: 'API Reference', link: '/guide/api-reference' },
            { text: '预设与语言', link: '/guide/presets-and-locales' },
            { text: '包导入与样式入口', link: '/guide/package-consumption' },
            { text: '开发与贡献流程', link: '/guide/contributing-and-workflow' },
            { text: '业务项目完整接入', link: '/guide/business-integration' },
            { text: '固定列', link: '/guide/fixed-columns' },
            { text: '展开行', link: '/guide/expandable-rows' },
            { text: '虚拟滚动', link: '/guide/virtualization' },
            { text: '树形表格', link: '/guide/tree-table' },
            { text: '主题覆盖', link: '/guide/theme-overrides' },
          ],
        },
        {
          text: '工程与设计',
          items: [
            { text: '架构设计', link: '/guide/architecture' },
            { text: '测试与发布', link: '/guide/testing-and-release' },
          ],
        },
      ],
      '/about/': [
        {
          text: '项目状态',
          items: [{ text: 'Roadmap', link: '/about/roadmap' }],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/vtable-guild/vtable-guild' }],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
  },
})
