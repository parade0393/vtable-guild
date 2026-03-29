# 开发与贡献流程

这一页面向仓库贡献者，目标不是解释单个组件 API，而是说明在这个 monorepo 里如何正确开发、验证和提交改动。

## 基础环境

- Node `^20.19.0 || >=22.12.0`
- `pnpm >=10.28.0`
- 使用 `pnpm install` 安装依赖，不建议切换到 npm 或 yarn

## 常用命令

```bash
pnpm install
pnpm dev
pnpm playground
pnpm test
pnpm type-check
pnpm build
pnpm site:build
```

如果只验证单个包，可以使用过滤命令：

```bash
pnpm --filter @vtable-guild/table test
pnpm --filter @vtable-guild/core build
```

## 推荐开发顺序

1. 先在 `packages/` 中修改实现。
2. 同步补对应测试，优先放到实现旁边的 `*.test.ts`。
3. 如果涉及用户可见能力，再同步更新 `site/` 文档与 `playground/` 对照页。
4. 最后运行 `pnpm test`、`pnpm type-check`、`pnpm build` 和 `pnpm site:build`。

## 仓库约定

- monorepo 使用 `pnpm` + Turborepo。
- 表格核心能力位于 `packages/table`。
- 主题、token 和预设位于 `packages/theme`。
- `playground/` 用于真实交互回归和视觉验证。
- `site/` 使用 VitePress，负责最终用户文档。

## 提交与发布前检查

- 提交信息使用 Conventional Commits，例如 `feat(table): add fixed shadow regression test`。
- 发起 PR 前，至少确认：

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

- 如果改动涉及文档站，也应补跑：

```bash
pnpm site:build
```

## 视觉验证建议

涉及 UI 行为时，建议在 playground 里做对照验证，尤其是：

- 固定列与阴影
- 虚拟滚动
- 展开行
- 主题预设切换

当前 playground 已提供 ant-design-vue 与 element-plus 预设切换，以及基础 locale 切换，适合作为回归入口。

## 参考资料

- 仓库规则：AGENTS.md
- 架构说明：CLAUDE.md
- 工程与发布：site/guide/testing-and-release.md
