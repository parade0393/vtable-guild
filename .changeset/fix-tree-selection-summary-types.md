---
'@vtable-guild/vtable-guild': patch
---

- 修复无分页树形表格的表头全选状态，将折叠后代纳入统计，与全选操作保持一致。
- 修复 `VTableSummary` 的发布类型声明，保留 props 和 `Row` / `Cell` 子组件类型，并在构建后校验消费方类型声明。
- 修复重新生成 CSS 时样式入口短暂缺失的问题，避免运行中的 Playground 热更新失败。
