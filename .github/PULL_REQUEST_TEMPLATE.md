<!-- 中英文都可以 -->

## 这个 PR 做了什么

<!-- 一两句话说清楚。如果是修 bug，说明根因，不只是现象。 -->

关联 issue：<!-- Closes #123 / 无 -->

## 类型

- [ ] fix — 修复问题
- [ ] feat — 新能力
- [ ] docs — 只改文档
- [ ] refactor / perf / test / chore — 不影响对外行为

## 怎么验证的

<!-- 复现步骤、测试用例、或 Playground 链接 -->

- [ ] `pnpm lint`
- [ ] `pnpm type-check`
- [ ] `pnpm test`
- [ ] `pnpm build`

## 涉及 UI 的话

表格改动必须在两套预设下都成立。没动 UI 就跳过这段。

- [ ] `antdv` 预设下验证过
- [ ] `element-plus` 预设下验证过
- [ ] 视觉调整走的是 `packages/theme` 的 token / 预设层，没有在组件里硬编码样式

<!-- 附上 playground 截图，改动前后对比更好 -->

## Changeset

影响 `@vtable-guild/vtable-guild` 对外行为的改动需要 `pnpm changeset`。

- [ ] 已添加 changeset
- [ ] 不需要（纯文档 / CI / playground）

## 破坏性变更

<!-- 有的话写清楚影响面和迁移方式，没有就写「无」 -->
