# 发布流程指南

> 本文档描述 vtable-guild 基于 **Changesets + GitHub Actions** 的自动化发版流程。

## 目录

- [版本策略](#版本策略)
- [日常开发流程](#日常开发流程)
- [CI 自动发布流程](#ci-自动发布流程)
- [首次发布](#首次发布)
- [手动发布（回退方案）](#手动发布回退方案)
- [npm Trusted Publisher 配置](#npm-trusted-publisher-配置)
- [常见问题](#常见问题)

---

## 版本策略

对外只发布一个包：`@vtable-guild/vtable-guild`。内部源码模块继续保留，但不再作为公开 npm 包发布。

版本语义遵循 [Semantic Versioning](https://semver.org/):

| 类型    | bump              | 场景                 |
| ------- | ----------------- | -------------------- |
| `patch` | `0.1.0` → `0.1.1` | bug 修复、文档更新   |
| `minor` | `0.1.0` → `0.2.0` | 新功能、非破坏性变更 |
| `major` | `0.1.0` → `1.0.0` | 破坏性 API 变更      |

---

## 日常开发流程

### 1. 完成功能开发

按正常开发流程编写代码，通过 lint / type-check / test：

```bash
pnpm lint
pnpm type-check
pnpm test
```

### 2. 创建 Changeset

每次涉及需要发版的改动（新功能、bug 修复），在提交前执行：

```bash
pnpm changeset
```

交互式提示：

1. **选择受影响的包** — 只选择 `@vtable-guild/vtable-guild`
2. **选择 bump 类型** — `major` / `minor` / `patch`
3. **填写变更描述** — 一句话概括此次变更，将出现在 CHANGELOG 中

命令执行完毕后，`.changeset/` 目录下会生成一个 `<随机名>.md` 文件，**将此文件和代码一起提交**：

```bash
git add .
git commit -m "feat(table): add xxx feature"
```

> **何时创建 Changeset？**
>
> - ✅ 新功能、Bug 修复、Breaking Change
> - ❌ 仅修改 playground/docs/site 内容（不影响发布包）
> - ❌ 仅修改 CI 配置、依赖升级等基础设施变更

### 3. 推送到远端

```bash
git push origin master
```

推送后，GitHub Actions 自动接管后续流程。

---

## CI 自动发布流程

```
push to master
    │
    ▼
.github/workflows/ci.yml
    ├── pnpm lint
    ├── pnpm type-check
    ├── pnpm test
    └── pnpm build
    │
    ▼ (CI 成功后才触发，通过 workflow_run 事件)
.github/workflows/release.yml
    │
    ├── 检测 .changeset/ 中是否有未消费的 changeset
    │
    ├── 有 changeset → 创建/更新 "chore(release): version packages" PR
    │       └── PR 内容：自动更新各包 version + 生成 CHANGELOG.md（含 PR 链接/作者）
    │
    └── 无 changeset（即合并了 Version PR）→ 执行发布
            ├── pnpm publish-packages
            │     ├── pnpm build
            │     └── node ./scripts/publish-trusted.mjs  ──→  通过 npm Trusted Publisher 发布
            └── 创建 GitHub Release + Tag
```

**关键点：**

- Release workflow 通过 `workflow_run` 事件触发，**必须等 CI 全部通过才会运行**，不会在 lint/test 失败时发布
- 每次触发后，changesets/action 会做二选一：
  - 存在 changeset 文件 → **打开/更新 Release PR**（不发布）
  - Release PR 被合并 → **执行发布**（消费 changeset，推送到 npm）
- 发布通过 npm Trusted Publisher 的 OIDC 认证完成，不需要 `NPM_TOKEN`
- Trusted Publisher 会自动生成 npm provenance 供应链签名
- 开发者唯一需要做的就是：**合并 Release PR**

---

## 首次发布

首次发布需要手动创建 changeset 并推送：

```bash
# 1. 创建 changeset，选择 @vtable-guild/vtable-guild，选择 minor（建议首次用 0.1.0）
pnpm changeset

# 2. 应用版本号（本地预览）
pnpm run version:packages
# 此命令会：更新各包 package.json 版本、生成 CHANGELOG.md、删除 changeset 文件

# 3. 提交版本变更
git add .
git commit -m "chore(release): version packages"
git push origin master

# CI 检测到没有待消费的 changeset（已被 pnpm run version:packages 消费）→ 自动执行 publish-trusted
```

> **注意**：如果使用 CI 自动流程，可以跳过第 2、3 步，直接 push 后让 CI 创建 Release PR，合并即可。
>
> 不要使用 `pnpm version`，它会命中 pnpm 自带命令而不是根脚本，导致 Changesets 不会真正生成版本变更。

---

## 手动发布（回退方案）

当 CI 不可用时，可以在本地手动发布：

```bash
# 确保本地已登录 npm
npm login

# 发布所有包（lint + type-check + test + build + publish）
pnpm release
```

> `pnpm release` 脚本定义在根 `package.json`：
>
> ```json
> "release": "pnpm lint && pnpm type-check && pnpm test && pnpm publish-packages"
> ```
>
> `publish-packages` 脚本：`pnpm build && node ./scripts/publish-trusted.mjs`

### 发布前预览（dry-run）

在正式发布前，可以通过以下命令预览将要发布的包和版本号，不会实际推送到 npm：

```bash
pnpm release:dry
```

### 本地运行 version:packages

`pnpm version:packages` 在本地运行需要 `GITHUB_TOKEN`（用于生成含 PR 链接的 CHANGELOG）：

```bash
# 在 https://github.com/settings/tokens/new 创建 PAT
# 勾选 read:user 和 repo:status 权限
$env:GITHUB_TOKEN = "ghp_your_token"
pnpm version:packages
```

在 CI 中 `GITHUB_TOKEN` 由 Actions 自动注入，无需手动处理。

---

## npm Trusted Publisher 配置

CI 发布使用 npm Trusted Publisher，不再配置 `NPM_TOKEN`。

### npmjs.com 配置

1. 打开 npm 包页面 → **Settings** → **Trusted Publisher**
2. Publisher 选择 **GitHub Actions**
3. Organization or user: `parade0393`
4. Repository: `vtable-guild`
5. Workflow filename: `release.yml`
6. Permissions 至少勾选 `npm publish`

### GitHub Actions 配置

- `.github/workflows/release.yml` 必须包含 `permissions.id-token: write`
- 发布 job 必须运行在 GitHub-hosted runner 上
- npm CLI 版本必须 `>=11.5.1`，Node.js 版本必须 `>=22.14.0`
- 只保留 `GITHUB_TOKEN` 供 Changesets 创建 Release PR / GitHub Release；不要再传 `NPM_TOKEN` 或 `NODE_AUTH_TOKEN`

> `GITHUB_TOKEN` 无需手动配置，GitHub Actions 自动生成。npm 发布认证由 OIDC 临时凭据完成。

---

## 常见问题

### Q: push 后 release workflow 没有创建 PR？

检查：

- `.changeset/` 目录中是否有 `.md` 文件（排除 `README.md` 和 `config.json`）
- 运行 `pnpm changeset status` 查看当前 changeset 状态

### Q: Release PR 合并后没有发布到 npm？

检查：

- npm 包 Settings → Trusted Publisher 是否指向 `parade0393/vtable-guild` 和 `release.yml`
- `.github/workflows/release.yml` 是否有 `permissions.id-token: write`
- 发布 job 是否运行在 GitHub-hosted runner 上
- npm CLI 是否为 `>=11.5.1`，Node.js 是否为 `>=22.14.0`
- GitHub Actions 日志中 `publish-trusted` 步骤的输出

### Q: 发布时报错 "You must be logged in"？

说明 npm CLI 没有拿到 OIDC 发布凭据。检查 Trusted Publisher 的仓库和 workflow 文件名是否匹配，以及 workflow 是否包含 `id-token: write`。

### Q: 想回滚某个版本？

npm 已发布的包版本**无法删除**（超过 72 小时后），但可以：

- 发布一个新的 patch 版本修复问题
- 发布一个新的 patch 版本修复问题

### Q: 如何跳过某次 push 的发布检测？

在 commit message 中加入 `[skip ci]`：

```bash
git commit -m "docs: update readme [skip ci]"
```

### Q: 如何查看当前待发布的变更？

```bash
pnpm changeset status
```

### Q: 内部模块改动后，为什么还是只选择一个 changeset？

因为对外只有 `@vtable-guild/vtable-guild` 一个公开发布物。无论内部源码改动发生在什么模块，changeset 都只面向这个公开包。

### Q: CI 发布报 403 Forbidden / Two-factor authentication required？

CI 不再使用 npm token。优先检查 npm 包是否已经启用 Trusted Publisher，并确认发布 workflow 使用 GitHub-hosted runner、`id-token: write`、Node.js `>=22.14.0` 和 npm `>=11.5.1`。
