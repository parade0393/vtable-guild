# 贡献指南

感谢你愿意花时间改进 vtable-guild。这份文档说明怎么把改动跑起来、怎么提交。

中文英文都可以，用你顺手的那个。

## 提问题之前

- **Bug**：请附一个可复现的最小例子。最省事的方式是用 [在线 Playground](https://parade0393.github.io/vtable-guild/play/) 复现后点「分享链接」，把链接贴进 issue。
- **功能建议**：先说清楚你实际遇到的场景，而不是直接给 API 设计。本项目定位是「ant-design-vue / element-plus 的表格替换件」，不打算长成完整 UI 库，分页等部分能力是刻意不做的。
- **用法疑问**：先翻[文档站](https://parade0393.github.io/vtable-guild/)，尤其是 [API Reference](https://parade0393.github.io/vtable-guild/guide/api-reference)。

## 本地跑起来

需要 Node `^20.19.0 || >=22.12.0` 和 pnpm `>=10.28.0`。包管理器锁定 pnpm，用 npm/yarn 装会被 `only-allow` 拦下。

```bash
pnpm install
pnpm build          # 首次必须先构建：playground 和文档站都消费 packages/*/dist
pnpm playground     # 手动验证用的 Vite 应用
pnpm site:dev       # VitePress 文档站
pnpm play:dev       # 独立 Playground（@vue/repl）
```

`pnpm build` 走 Turborepo，按依赖拓扑构建 `core → icons/theme → table → vtable-guild → site/play`。改了 `packages/theme/css` 之后要重新跑 `pnpm --filter @vtable-guild/vtable-guild copy-css`（`pnpm install` 的 `prepare` 钩子也会做这件事）。

## 提交之前

```bash
pnpm lint
pnpm type-check
pnpm test
```

CI 跑的就是这几项加 `pnpm build`，本地过了基本不会在 CI 翻车。

> 注意：目前各子包还没有各自的 `lint` script，所以 `pnpm lint` 实际不执行任何检查。
> ESLint 是在 `git commit` 时由 lint-staged 对暂存文件跑的——真正拦住你的是那一步。

### 涉及 UI 的改动

表格是「所见即所得」型组件，**改动必须在两套预设下都验证**：`antdv` 和 `element-plus`。playground 是左右对照布局，可以直接和原版组件比对。PR 里请附截图。

样式改动不要在组件里硬编码。视觉调整走 `packages/theme` 的 token 和预设层——这是三层主题系统能成立的前提。

## 提交信息

Husky + commitlint 强制 Conventional Commits，格式 `type(scope): subject`：

- 类型：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`revert`、`build`
- 类型必须小写，标题不加句号，整行不超过 95 字符
- 拿不准就用 `pnpm commit`（Commitizen 交互式）

## 版本与发布

用 [Changesets](https://github.com/changesets/changesets) 管版本。**任何影响已发布包（`@vtable-guild/vtable-guild`）行为的改动都要带 changeset**：

```bash
pnpm changeset
```

按提示选影响范围和 semver 级别，生成的 markdown 文件一起提交。纯文档、纯 CI、纯 playground 的改动不需要。

发布由 `release.yml` 在合入 master 后自动完成（npm trusted publishing），维护者无需手动 `npm publish`。

## PR 约定

- 从 master 切分支，分支名建议 `feat/xxx`、`fix/xxx`、`docs/xxx`
- 一个 PR 只做一件事，方便 review 和回滚
- 描述里写清楚：解决什么问题、怎么验证的、有没有破坏性变更
- 关联对应 issue

## 代码风格

- Prettier：无分号、单引号、`printWidth: 100`
- 缩进 2 空格，LF，UTF-8
- 组件文件 `PascalCase`，composable 用 `useXxx.ts`，公共工具放 `src/utils/`
- 表格子组件一律用 TSX，不用 SFC（`VTable.vue` 是历史遗留的薄壳）
- 刻意不用的变量/参数加 `_` 前缀

格式化由 lint-staged 在提交时自动处理，不用手动跑 prettier。

## 项目结构

```
packages/
  core          tv() 封装、useTheme、插件、基础 UI 组件
  theme         纯数据的主题配置 + CSS 变量，含 antdv / element-plus 两套预设
  table         VTable 组件与 composables（全 TSX）
  icons         SVG 图标组件
  vtable-guild  聚合入口，唯一对外发布的包
site/           VitePress 文档站
play/           独立 Playground（@vue/repl + Monaco）
playground/     本地手动验证用的 Vite 应用
docs/           架构说明、路线图、实现记录
```

更多设计背景见 [docs/architecture.md](./docs/architecture.md) 和文档站的[为什么这样设计](https://parade0393.github.io/vtable-guild/guide/architecture)。

## 行为准则

对事不对人，保持基本的尊重。维护者是业余时间投入，回复可能不会很快，请见谅。
