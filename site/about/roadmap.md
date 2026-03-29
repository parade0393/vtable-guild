# Roadmap

这一页是 `docs/roadmap.md` 的站点化摘要，重点展示当前阶段与剩余任务，而不是逐项复刻所有历史清单。

## 已完成的基础阶段

- 阶段 1 到阶段 6 的核心目标已经基本落地：多包基建、主题系统、基础表格、交互能力、高级能力、树形与虚拟滚动都已有实现与 playground 页面支撑。

## 当前主线

### 阶段 7：测试与文档

- 持续补齐 `packages/table` 的 composable 与组件测试。
- 初始化 VitePress 文档站并迁移现有设计文档。
- 把 playground 页面逐步转化为文档示例和可嵌入 demo。

### 阶段 8：发布准备

- 已接入 Changesets 基础配置。
- 已补齐 CI 和 release workflow 骨架。
- 剩余重点是全链路验证、README/文档补齐和 `npm pack` 检查。

## 下一批直接任务

1. 扩大 `table` 包测试覆盖到选择、树形、滚动、固定列。
2. 为文档站补更多功能页，并接入 playground 示例。
3. 运行完整的 lint、type-check、test、build、site build 验证。
4. 做发包前内容校验和安装验证。

## 详细排期来源

如果需要查看完整阶段拆分，仍以仓库根目录的 `docs/roadmap.md` 为准。这个站点页面只保留对当前执行最有帮助的摘要信息。
