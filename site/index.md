---
layout: home

hero:
  name: vtable-guild
  text: 面向 Vue 3 UI 生态的表格替换方案
  tagline: 用 theme preset 和三层主题覆盖机制，把 ant-design-vue 与 element-plus 风格迁移到同一套表格能力上。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看架构
      link: /guide/architecture

features:
  - title: 预设驱动
    details: 当前聚焦 ant-design-vue 与 element-plus，两套预设共用同一套表格能力。
  - title: 三层主题覆盖
    details: 默认主题、插件级全局配置、实例级 ui/class 覆盖按顺序合并。
  - title: Monorepo 可发布
    details: core、theme、table、icons、聚合入口按包拆分，配合 changesets 和 GitHub Actions 走发布流程。
---

<div class="vtg-callout">

当前文档站是阶段 7 的首版骨架，优先提供安装、架构、测试与发布信息。交互 demo 嵌入会在后续迭代中接入 playground 页面。

</div>

## 当前覆盖范围

<div class="vtg-grid">
  <div class="vtg-card">
    <h3>已完成</h3>
    <p>多包基建、主题系统、表格主体能力、changesets、CI 与 release workflow 基础配置。</p>
  </div>
  <div class="vtg-card">
    <h3>推进中</h3>
    <p>table composable 与组件测试、VitePress 内容迁移、发包前验证。</p>
  </div>
  <div class="vtg-card">
    <h3>下一步</h3>
    <p>补更多交互测试，接入 playground 示例，完成 npm pack 和全链路验证。</p>
  </div>
</div>
