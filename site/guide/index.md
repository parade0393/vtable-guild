# 指南概览

这一版文档先解决两个问题：如何把 `vtable-guild` 接入现有 Vue 3 项目，以及如何理解当前仓库的工程边界。

## 建议阅读顺序

1. 先看 [快速开始](/guide/getting-started)，确认安装方式、样式入口和插件初始化。
2. 如果你在补具体功能，继续看 [排序](/guide/sorting)、[筛选](/guide/filtering)、[行选择](/guide/selection)、[标题与摘要行](/guide/title-footer-summary)、[列宽拖拽](/guide/column-resize)、[多级表头与合并](/guide/grouped-and-merged-cells)、[自定义行与插槽](/guide/api-wiring-and-slots)、[API Reference](/guide/api-reference)、[预设与语言](/guide/presets-and-locales)、[包导入与样式入口](/guide/package-consumption)、[开发与贡献流程](/guide/contributing-and-workflow) 和 [业务项目完整接入](/guide/business-integration)。
3. 再看 [架构设计](/guide/architecture)，理解 `core`、`theme`、`table` 和聚合包之间的职责。
4. 如果要参与仓库开发或发布，再看 [测试与发布](/guide/testing-and-release)。

## 当前文档策略

- 优先整理现有 `docs/` 里的设计与工程信息。
- 交互 demo 暂时以 `playground/` 页面为准，后续再嵌入 VitePress。
- API 明细页先覆盖高频查询项，精确泛型与边界行为仍以源码类型定义和对应指南页为准。
