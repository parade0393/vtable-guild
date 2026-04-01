import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'vtable-guild',
  description: '面向 ant-design-vue 和 element-plus 用户的高性能表格替换方案。',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: '对比与增强', link: '/comparison/' },
      { text: 'API', link: '/guide/api-reference' },
      { text: 'Roadmap', link: '/about/roadmap' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '指南概览', link: '/guide/' },
            { text: '为什么选择 vtable-guild', link: '/guide/why' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '从 ant-design-vue 迁移', link: '/guide/migration-from-antd' },
            { text: '包导入与样式', link: '/guide/package-consumption' },
          ],
        },
        {
          text: '功能',
          items: [
            { text: '排序', link: '/guide/sorting' },
            { text: '筛选', link: '/guide/filtering' },
            { text: '行选择', link: '/guide/selection' },
            { text: '展开行', link: '/guide/expandable-rows' },
            { text: '树形表格', link: '/guide/tree-table' },
            { text: '固定列', link: '/guide/fixed-columns' },
            { text: '虚拟滚动', link: '/guide/virtualization' },
            { text: '列宽拖拽', link: '/guide/column-resize' },
            { text: '多级表头与合并', link: '/guide/grouped-and-merged-cells' },
            { text: '标题与摘要行', link: '/guide/title-footer-summary' },
            { text: '自定义行与插槽', link: '/guide/api-wiring-and-slots' },
          ],
        },
        {
          text: '主题系统',
          items: [
            { text: '三层主题覆盖', link: '/guide/theme-overrides' },
            { text: '预设与语言', link: '/guide/presets-and-locales' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: '为什么这样设计', link: '/guide/architecture' },
            { text: 'API Reference', link: '/guide/api-reference' },
          ],
        },
      ],
      '/comparison/': [
        {
          text: '对比与增强',
          items: [
            { text: '功能对比总览', link: '/comparison/' },
            { text: '增强与独有功能', link: '/comparison/enhancements' },
          ],
        },
      ],
      '/about/': [
        {
          text: '项目路线',
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
