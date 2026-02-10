# Turborepo 详解：是什么、为什么用、解决什么问题

---

## 1. Turborepo 是什么

Turborepo 是一个面向 JavaScript/TypeScript monorepo 的**构建编排工具**。它不替代 pnpm、Vite、ESLint 等工具，而是站在它们之上，解决一个核心问题：

> **当你有多个互相依赖的包时，如何正确、高效地执行构建/测试/lint 等任务？**

一句话定位：**Turborepo 是 monorepo 的任务调度器**。

```
你的工具链（不变）：
  pnpm        — 包管理、workspace 链接
  Vite        — 单个包的构建
  ESLint      — 单个包的代码检查
  Vitest      — 单个包的测试

Turborepo 的角色：
  "我来决定这些任务的执行顺序、并行策略、缓存策略"
```

---

## 2. 不用 Turborepo 时会遇到什么问题

假设我们的 vtable-guild 有 5 个包，依赖关系如下：

```
core（无上游依赖）
theme → core
pagination → core
table → core, theme, pagination
vtable-guild → core, theme, table, pagination
```

### 痛点 1：手动管理构建顺序

不用 Turborepo 时，你需要自己保证构建顺序：

```bash
# 必须严格按顺序执行，否则 import 会找不到产物
cd packages/core && pnpm build
cd packages/theme && pnpm build
cd packages/pagination && pnpm build
cd packages/table && pnpm build
cd packages/vtable-guild && pnpm build
```

问题：
- 手动维护顺序，包越多越容易出错
- theme 和 pagination 其实可以并行（都只依赖 core），但手动脚本做不到
- 新增一个包时，要记得更新构建脚本的顺序

### 痛点 2：每次都全量构建

你改了 `packages/theme/src/table.ts` 一行代码，执行 `pnpm build`：

```bash
# 不用 turbo：所有包都重新构建
core     — 没改，但还是构建了（浪费）
theme    — 改了，需要构建 ✓
pagination — 没改，但还是构建了（浪费）
table    — 依赖 theme，需要重新构建 ✓
vtable-guild — 依赖 table，需要重新构建 ✓
```

5 个包全部重新构建。如果每个包构建要 3 秒，就是 15 秒。

### 痛点 3：CI 重复劳动

每次 PR 推送，CI 都从零开始构建所有包。即使这次 PR 只改了文档，构建、测试、lint 全部重跑。

### 痛点 4：脚本膨胀

没有统一编排时，根 `package.json` 的 scripts 会变成这样：

```jsonc
{
  "scripts": {
    "build:core": "cd packages/core && pnpm build",
    "build:theme": "cd packages/theme && pnpm build",
    "build:pagination": "cd packages/pagination && pnpm build",
    "build:table": "cd packages/table && pnpm build",
    "build:vtable-guild": "cd packages/vtable-guild && pnpm build",
    "build": "pnpm build:core && pnpm build:theme && pnpm build:pagination && pnpm build:table && pnpm build:vtable-guild",
    "test:core": "cd packages/core && pnpm test",
    "test:theme": "...",
    // ... 每个包每个任务都要写一遍
  }
}
```

每新增一个包，要改 N 个 script。

---

## 3. Turborepo 怎么解决这些问题

### 解决方案 1：自动拓扑排序

Turborepo 读取每个子包 `package.json` 的 `dependencies` / `peerDependencies`，自动构建依赖图：

```
turbo run build

# Turborepo 自动推导出：
# 1. core（无依赖，最先构建）
# 2. theme + pagination（都只依赖 core，并行构建）
# 3. table（依赖 core + theme + pagination，等它们完成后构建）
# 4. vtable-guild（依赖所有包，最后构建）
```

你只需要在 `turbo.json` 中声明：

```jsonc
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]  // ^ = 先构建上游依赖
    }
  }
}
```

新增包时，**不需要改任何配置**——只要子包的 `package.json` 声明了正确的依赖，turbo 自动调整拓扑。

### 解决方案 2：智能缓存

Turborepo 对每个任务计算一个 hash，基于：
- 源文件内容
- 依赖包的构建产物
- 环境变量
- turbo.json 配置

如果 hash 没变，直接跳过，从缓存恢复产物：

```bash
turbo run build

# 第一次：
#  core     — cache miss, 构建 (2.1s)
#  theme    — cache miss, 构建 (1.8s)
#  pagination — cache miss, 构建 (1.5s)
#  table    — cache miss, 构建 (3.2s)
#  vtable-guild — cache miss, 构建 (0.8s)
#  Total: 5.3s（theme 和 pagination 并行）

# 改了 theme/src/table.ts 后再次构建：
#  core       — cache hit, 跳过 ✓
#  theme      — cache miss, 重新构建
#  pagination — cache hit, 跳过 ✓
#  table      — cache miss, 重新构建（因为依赖 theme 变了）
#  vtable-guild — cache miss, 重新构建
#  Total: 3.5s

# 什么都没改再构建：
#  全部 cache hit
#  Total: 0.2s
```

### 解决方案 3：最大化并行

Turborepo 在拓扑约束内尽可能并行执行：

```
时间线：
  t=0s   [core build]
  t=2s   [theme build] [pagination build]  ← 并行
  t=4s   [table build]
  t=7s   [vtable-guild build]
```

而不是串行的 2+2+2+3+1 = 10 秒。

### 解决方案 4：一条命令管所有

```bash
pnpm build        # turbo run build — 构建所有包
pnpm test         # turbo run test — 测试所有包
pnpm lint         # turbo run lint — lint 所有包
pnpm type-check   # turbo run type-check — 类型检查所有包
```

根 `package.json` 只需要：

```jsonc
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

新增 10 个包也不用改这里。

---

## 4. turbo.json 配置详解

以我们项目的配置为例：

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### `dependsOn` 的两种写法

| 写法 | 含义 | 示例 |
|------|------|------|
| `"^build"` | 先构建**上游依赖包**的 build | table 的 build 会等 core、theme、pagination 的 build 完成 |
| `"build"` | 先执行**同一个包**的 build | table 的 test 会等 table 自己的 build 完成 |

### `outputs`

告诉 turbo 哪些文件是构建产物，用于缓存恢复：

```jsonc
"outputs": ["dist/**"]  // 缓存 dist 目录下所有文件
```

cache hit 时，turbo 直接从缓存把 dist 目录恢复出来，不需要重新构建。

### `cache: false`

dev 任务是 watch 模式，每次都不同，不应缓存。

### `persistent: true`

dev 任务是长驻进程（vite build --watch），turbo 不会等它结束，也不会杀掉它。

---

## 5. 不用 Turborepo 的替代方案

### 方案 A：pnpm --filter + 手动脚本

pnpm 本身支持按拓扑顺序执行命令：

```bash
pnpm -r --filter=./packages/* run build
```

**优点**：
- 零额外依赖
- pnpm 自带拓扑排序

**缺点**：
- 无缓存——每次全量构建
- 并行控制有限（`--workspace-concurrency` 只能控制并发数，不能按依赖图并行）
- 无法跨 CI 共享缓存

**适合**：包数量少（< 3 个）、构建速度快、不在意 CI 耗时的小项目。

### 方案 B：Nx

Nx 是 Turborepo 的主要竞品，功能更丰富：

```bash
npx nx run-many --target=build
```

**优点**：
- 拓扑排序 + 缓存 + 并行（与 turbo 相同）
- 内置代码生成器（`nx generate`）
- 内置依赖图可视化（`nx graph`）
- 支持分布式缓存和分布式执行
- 插件生态丰富（@nx/vite, @nx/eslint 等）

**缺点**：
- 配置更重——`nx.json` + `project.json`（每个包一个）
- 学习曲线更陡
- 对项目结构有更多约定（推荐 apps/ + libs/ 结构）
- 包体更大

**适合**：大型企业级 monorepo（50+ 包）、需要分布式构建、需要代码生成器。

### 方案 C：Lerna（已不推荐）

Lerna 是最早的 JS monorepo 工具，现已被 Nx 团队接管：

```bash
npx lerna run build
```

**优点**：
- 历史悠久，文档多

**缺点**：
- 现代版本底层就是 Nx，不如直接用 Nx
- 旧版本无缓存、无并行优化
- 社区已转向 turbo/nx

**适合**：历史项目迁移。新项目不推荐。

### 方案 D：npm-run-all2 / concurrently

当前项目根已安装了 `npm-run-all2`，可以用它并行执行：

```bash
run-p "build:core" "build:theme"  # 并行
run-s "build:core" "build:table"  # 串行
```

**优点**：
- 极简，无额外概念

**缺点**：
- 手动维护顺序和并行关系
- 无缓存
- 无拓扑感知——你得自己算哪些能并行
- 脚本膨胀

**适合**：2-3 个包的微型 monorepo，或非 monorepo 项目的多任务并行。

---

## 6. 方案对比总结

| 特性 | Turborepo | Nx | pnpm -r | npm-run-all2 |
|------|-----------|-----|---------|--------------|
| 拓扑排序 | 自动 | 自动 | 自动 | 手动 |
| 并行执行 | 按依赖图最大化 | 按依赖图最大化 | 有限 | 手动指定 |
| 本地缓存 | 有 | 有 | 无 | 无 |
| 远程缓存 | 有（Vercel） | 有（Nx Cloud） | 无 | 无 |
| 配置复杂度 | 低（一个 turbo.json） | 中高 | 零 | 低 |
| 学习成本 | 低 | 中高 | 零 | 零 |
| 新增包成本 | 零配置 | 需加 project.json | 零 | 需改脚本 |
| 包体大小 | 小（~10MB） | 大（~50MB+） | 已有 | 已有 |

---

## 7. 为什么 vtable-guild 选择 Turborepo

1. **5 个包，依赖关系明确**——turbo 的拓扑排序和并行能力刚好够用
2. **配置极简**——一个 `turbo.json` 搞定，不需要 Nx 那套 project.json
3. **缓存收益明显**——开发时频繁构建，cache hit 能省大量时间
4. **零侵入**——不改变现有工具链（pnpm + Vite + ESLint），只在上层编排
5. **新增包零成本**——后续加包只需创建 package.json，turbo 自动识别
6. **社区主流**——Vue 生态（如 Radix Vue、Nuxt 周边）广泛使用

不选 Nx 的原因：项目规模不大，Nx 的高级功能（分布式执行、代码生成器）用不上，配置负担不值得。

不选纯 pnpm -r 的原因：没有缓存，5 个包每次全量构建体验差。
