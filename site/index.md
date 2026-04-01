---
layout: home

hero:
  name: vtable-guild
  text: 面向 ant-design-vue 和 element-plus 用户的高性能表格替换方案
  tagline: 兼容常用 Table API，内置虚拟滚动、列宽拖拽、斑马纹和主题预设切换，把熟悉的业务表格升级成更强的实现。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看功能对比
      link: /comparison/

features:
  - title: API 高度兼容
    details: 保留常见的列配置、排序、筛选、选择和 change 事件模型，迁移已有 antd-vue 表格代码时不需要从零重写。
  - title: 虚拟滚动
    details: 原生支持 virtual 与 scroll.y 组合，在大数据量场景下维持可用的渲染性能。这是 ant-design-vue Table 不提供的能力。
  - title: 列宽拖拽
    details: 通过 resizable、minWidth 和 maxWidth 直接开启列宽调整，不依赖额外第三方库。
  - title: 主题预设
    details: 同一套表格逻辑可切换 antdv 与 element-plus 视觉预设，便于在不同 Vue UI 体系中接入。
  - title: 三层主题覆盖
    details: 默认主题、createVTableGuild 全局配置与实例级 ui 覆盖按顺序合并，适合从统一规范到局部定制的多层需求。
  - title: 开箱即用
    details: bordered、striped、hoverable 等常见视觉状态可以直接通过 props 打开，不再依赖 rowClassName 或样式补丁。
---

## 谁适合使用

vtable-guild 面向已经在项目中使用 ant-design-vue 或 element-plus 的团队。

如果你希望保留熟悉的列定义和交互模式，但又需要虚拟滚动、列宽拖拽、slot 级样式覆盖和更稳定的主题扩展能力，这个库比继续堆叠原表格的定制代码更合适。

## 你能得到什么

- 对常见 Table 使用方式更友好的迁移成本。
- 面向复杂业务表格的增强能力，而不是只换一层皮肤。
- 从预设切换到局部覆写的一套统一主题模型。
- 更清晰的表格能力边界，避免在业务项目里反复补 CSS hack。

## 推荐阅读顺序

1. 从 [快速开始](/guide/getting-started) 完成安装与初始化。
2. 如果你来自 ant-design-vue，接着看 [从 ant-design-vue 迁移](/guide/migration-from-antd)。
3. 如果你在评估替换价值，先看 [功能对比总览](/comparison/) 和 [增强与独有功能](/comparison/enhancements)。
4. 需要按视觉体系接入时，再看 [三层主题覆盖](/guide/theme-overrides) 与 [预设与语言](/guide/presets-and-locales)。
