# 测试与发布

这一页对应阶段 7 和阶段 8 的剩余工作，目标是把仓库从“可以开发和演示”推进到“可以稳定发布”。

## 当前测试结构

- `vitest.config.ts` 以 workspace project 模式组织各包测试。
- `tests/setup.ts` 统一提供 `ResizeObserver`、`matchMedia`、`requestAnimationFrame` 等浏览器能力 mock。
- `packages/core` 和 `packages/theme` 已有基础测试。
- `packages/table` 当前已补上第一批 composable 与组件测试，后续还要扩展到选择、树形、滚动和固定列场景。

## 常用命令

```bash
pnpm test
pnpm test:coverage
pnpm lint
pnpm type-check
pnpm build
pnpm site:build
```

## 版本与发布链路

- `.changeset/config.json` 负责管理多包版本变更。
- `.github/workflows/ci.yml` 在 PR 和 `main` 分支上运行 lint、type-check、test、build。
- `.github/workflows/release.yml` 基于 Changesets Action 生成版本 PR 或触发 npm 发布。

## 发布前检查清单

1. 运行 `pnpm lint && pnpm type-check && pnpm test && pnpm build`。
2. 运行 `pnpm site:build`，确认文档站可构建。
3. 用 `npm pack` 预览每个公开包的发布内容。
4. 检查 `README.md`、类型声明、CSS 导出和 `exports` 字段是否一致。

## 当前建议

- 测试优先级先放在 `useSelection`、`useTreeData`、`useScroll` 和固定列相关组件。
- 文档站下一步先接入 playground 示例，再补 API 明细页。
- 发布验证阶段需要补一次全新项目安装验证，确认聚合包和样式入口可直接消费。
