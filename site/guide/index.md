# 指南

这套文档面向已经在 Vue 3 项目中使用 ant-design-vue 或 element-plus 的开发者。

重点不是介绍仓库如何开发，而是帮助你判断是否值得替换现有表格、如何接入现有项目，以及在排序、筛选、树形、虚拟滚动和主题覆盖这些高频场景里怎样使用 vtable-guild。

## 建议阅读顺序

### 如果你正在评估是否替换

1. 先看 [为什么选择 vtable-guild](/guide/why)，确认它解决的是哪一类表格问题。
2. 再看 [功能对比总览](/comparison/)，快速判断和 ant-design-vue 的差异。
3. 如果你关心增强点，再看 [增强与独有功能](/comparison/enhancements)。

### 如果你已经准备接入

1. 从 [快速开始](/guide/getting-started) 完成安装、样式引入和插件初始化。
2. 如果你已有 ant-design-vue Table，继续看 [从 ant-design-vue 迁移](/guide/migration-from-antd)。
3. 根据项目结构选择 [包导入与样式](/guide/package-consumption) 的接入方式。

### 如果你正在实现具体功能

- 数据交互： [排序](/guide/sorting)、[筛选](/guide/filtering)、[行选择](/guide/selection)
- 数据层级： [展开行](/guide/expandable-rows)、[树形表格](/guide/tree-table)
- 大表格体验： [固定列](/guide/fixed-columns)、[虚拟滚动](/guide/virtualization)、[列宽拖拽](/guide/column-resize)
- 结构扩展： [多级表头与合并](/guide/grouped-and-merged-cells)、[标题与摘要行](/guide/title-footer-summary)、[自定义行与插槽](/guide/api-wiring-and-slots)

### 如果你要统一视觉体系

1. 先看 [三层主题覆盖](/guide/theme-overrides)。
2. 再看 [预设与语言](/guide/presets-and-locales)。
3. 需要做二次封装或理解配置分层时，再参考 [API Reference](/guide/api-reference) 和 [为什么这样设计](/guide/architecture)。
