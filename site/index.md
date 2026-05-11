---
layout: home

hero:
  name: vtable-guild
  text: 面向 ant-design-vue 和 element-plus 用户的高性能表格替换方案
  tagline: 内置虚拟滚动、主题预设与三层样式覆盖，让复杂业务表格不再靠额外补丁拼装。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 功能对比
      link: /comparison/

features:
  - title: 迁移成本可控
    details: 保留熟悉的 columns、排序、筛选、选择和 change 事件模型，适合从现有表格逐步迁移，而不是推倒重写。
  - title: 内置大表格能力
    details: 同一套表格模型里直接提供虚拟滚动、固定列和列宽拖拽，不需要再拆出另一套列表方案。
  - title: 主题系统清晰
    details: 通过 themePreset、全局 theme、实例级 ui 三层分工管理样式，既能统一规范，也能保留局部例外。
  - title: 多预设接入
    details: 同一套表格逻辑可以在 antdv 和 element-plus 两套视觉体系下接入，适合已有 Vue UI 生态项目。
  - title: 视觉状态直接开启
    details: striped、hoverable、bordered 等常见视觉状态都可以直接通过 props 或主题配置开启。
  - title: TypeScript 体验完整
    details: 列类型、主题 key、slot key 和事件参数都有明确类型边界，适合在业务代码里长期维护。
---

## 适合谁

vtable-guild 面向已经在项目中使用 ant-design-vue 或 element-plus 的团队。

如果你希望保留熟悉的表格使用方式，但又需要更稳定的虚拟滚动、列宽控制、主题扩展和更可维护的样式覆盖模型，这个库比继续在原表格外堆补丁更合适。

## 你会先看哪条路线

- 想尽快接入：
  看 [快速开始](/guide/getting-started)
- 想先判断值不值得替换：
  看 [功能对比总览](/comparison/) 和 [为什么选择 vtable-guild](/guide/why)
- 想统一视觉体系：
  看 [三层主题覆盖](/guide/theme-overrides) 和 [Table CSS 变量参考](/guide/theme-tokens)
- 想直接查 API：
  看 [API Reference](/guide/api-reference) 和 [类型参考](/guide/type-reference)
