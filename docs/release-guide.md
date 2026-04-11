# 发布流程指南

> 本文档描述 vtable-guild 基于 **Changesets + GitHub Actions** 的自动化发版流程。

## 目录

- [版本策略](#版本策略)
- [日常开发流程](#日常开发流程)
- [CI 自动发布流程](#ci-自动发布流程)
- [首次发布](#首次发布)
- [手动发布（回退方案）](#手动发布回退方案)
- [NPM Token 配置](#npm-token-配置)
- [常见问题](#常见问题)

---

## 版本策略

所有包采用 **linked（联动）** 版本模式：`@vtable-guild/core`、`@vtable-guild/icons`、`@vtable-guild/table`、`@vtable-guild/theme`、`@vtable-guild/vtable-guild` 始终保持同一版本号，简化用户心智。

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

1. **选择受影响的包** — 使用空格选中（linked 模式下任选一个即可，版本号会联动）
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
    ▼ (并行触发)
.github/workflows/release.yml
    │
    ├── 检测 .changeset/ 中是否有未消费的 changeset
    │
    ├── 有 changeset → 创建/更新 "chore(release): version packages" PR
    │       └── PR 内容：自动更新各包 version + 生成 CHANGELOG.md
    │
    └── 无 changeset（即合并了 Version PR）→ 执行发布
            ├── pnpm release
            │     ├── pnpm lint
            │     ├── pnpm type-check
            │     ├── pnpm test
            │     ├── pnpm build
            │     └── changeset publish  ──→  发布到 npm
            └── 创建 GitHub Release + Tag
```

**关键点：**

- 每次 push 到 master 后，changesets/action 会做二选一：
  - 存在 changeset 文件 → **打开/更新 Release PR**（不发布）
  - Release PR 被合并 → **执行发布**（消费 changeset，推送到 npm）
- 开发者唯一需要做的就是：**合并 Release PR**

---

## 首次发布

首次发布需要手动创建 changeset 并推送：

```bash
# 1. 创建 changeset，选择所有包，选择 minor（建议首次用 0.1.0）
pnpm changeset

# 2. 应用版本号（本地预览）
pnpm run version:packages
# 此命令会：更新各包 package.json 版本、生成 CHANGELOG.md、删除 changeset 文件

# 3. 提交版本变更
git add .
git commit -m "chore(release): version packages"
git push origin master

# CI 检测到没有待消费的 changeset（已被 pnpm run version:packages 消费）→ 自动执行 changeset publish
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

# 确认构建产物是最新的
pnpm build

# 发布所有包（lint + type-check + test + build + changeset publish）
pnpm release
```

> `pnpm release` 脚本定义在根 `package.json`：
>
> ```json
> "release": "pnpm lint && pnpm type-check && pnpm test && pnpm build && changeset publish"
> ```

---

## NPM Token 配置

### 创建 npm Access Token

1. 登录 [npmjs.com](https://www.npmjs.com)
2. 右上角头像 → **Access Tokens**
3. 点击 **Generate New Token** → 选择 **Automation**（用于 CI，不受 2FA 限制）
4. 复制生成的 token

### 配置到 GitHub Repository

1. 打开 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. Name: `NPM_TOKEN`，Value: 粘贴上面复制的 token
4. 点击 **Add secret**

> `GITHUB_TOKEN` 无需手动配置，GitHub Actions 自动生成。

---

## 常见问题

### Q: push 后 release workflow 没有创建 PR？

检查：

- `.changeset/` 目录中是否有 `.md` 文件（排除 `README.md` 和 `config.json`）
- 运行 `pnpm changeset status` 查看当前 changeset 状态

### Q: Release PR 合并后没有发布到 npm？

检查：

- GitHub repo → Settings → Secrets 中是否有 `NPM_TOKEN`
- npm token 是否过期（Automation 类型 token 默认长期有效，但可手动撤销）
- GitHub Actions 日志中 `changeset publish` 步骤的输出

### Q: 发布时报错 "You must be logged in"？

说明 `NPM_TOKEN` 未正确传入。检查 `.github/workflows/release.yml` 中的 `env` 块，确认 `NODE_AUTH_TOKEN` 或 `NPM_TOKEN` 均已配置。

`setup-node` action 的 `registry-url` 配置了 `https://registry.npmjs.org` 后，会自动将 `NODE_AUTH_TOKEN` 映射为 npm 认证 token。

### Q: 想回滚某个版本？

npm 已发布的包版本**无法删除**（超过 72 小时后），但可以：

- 发布一个新的 patch 版本修复问题
- 使用 `npm deprecate @vtable-guild/table@x.x.x "use x.x.x instead"` 标记废弃

### Q: 如何跳过某次 push 的发布检测？

在 commit message 中加入 `[skip ci]`：

```bash
git commit -m "docs: update readme [skip ci]"
```

### Q: 如何查看当前待发布的变更？

```bash
pnpm changeset status
```

### Q: linked 模式下只改了一个包，其他包版本也会跳吗？

是的，linked 保证所有包版本号一致。只要有任何一个包的 changeset，所有 linked 包都会同步 bump 版本。这是有意为之的设计，方便用户统一升级。

### Q: CI 发布报 403 Forbidden / Two-factor authentication required？

npm 已于 2025 年 11 月废除 Legacy Token（Classic Token）。现在 CI 发布必须使用 **Granular Access Token** 并开启 **Bypass two-factor authentication**：

1. npmjs.com → 头像 → **Access Tokens** → **Generate New Token** → **Granular Access Token**
2. Packages and scopes → **Read and write**
3. **Bypass two-factor authentication** → **Enabled**
4. 更新 GitHub repo → Settings → Secrets → `NPM_TOKEN`
