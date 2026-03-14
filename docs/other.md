# 补充知识点

## 1. `@vtable-guild/xxx` 为什么能被识别？（不是别名）

在 `packages/vtable-guild/src/index.ts` 中：

```ts
export * from '@vtable-guild/core'
export * from '@vtable-guild/theme'
export * from '@vtable-guild/table'
```

`@vtable-guild/xxx` **不是路径别名**，而是各子包 `package.json` 中 `name` 字段的真实包名。能被识别依赖两套机制协同工作：

### 1.1 pnpm workspace — 运行时模块解析

`pnpm-workspace.yaml` 声明了 `packages/*`，pnpm 会把 `packages/` 下每个子包的 `name` 注册为工作区包。

`packages/vtable-guild/package.json` 中通过 `workspace:*` 协议声明依赖：

```json
"dependencies": {
    "@vtable-guild/core": "workspace:*",
    "@vtable-guild/theme": "workspace:*",
    "@vtable-guild/table": "workspace:*"
}
```

执行 `pnpm install` 后，pnpm 会在 `node_modules/@vtable-guild/` 下创建指向各子包目录的**符号链接（symlink）**，Node.js 的模块解析就能通过常规的 `node_modules` 查找找到它们。

### 1.2 TypeScript Project References — 类型解析

`packages/vtable-guild/tsconfig.json` 中配置了 `references`：

```json
"references": [
    { "path": "../core" },
    { "path": "../theme" },
    { "path": "../table" }
]
```

TypeScript 通过 project references 找到各子包的 `tsconfig.json`，再根据子包的 `composite: true` + `outDir` 配置定位到编译产物（`.d.ts` 类型声明），从而完成类型检查。

### 1.3 总结

pnpm workspace 的符号链接让**模块解析**生效，TypeScript project references 让**类型解析**生效。两者缺一不可。

---

## 2. tsconfig 中 `extends` 与 `references` 的区别

以 `packages/vtable-guild/tsconfig.json` 为例：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [{ "path": "../core" }, { "path": "../theme" }, { "path": "../table" }]
}
```

### 2.1 `extends` — 配置继承

解决的问题：**避免每个子包重复写相同的编译选项。**

它是纯粹的配置复用机制，效果等同于把 `tsconfig.base.json` 里的内容"复制粘贴"到当前文件，再用当前文件的字段覆盖。

比如 `tsconfig.base.json` 定义了 `strict: true`、`target: ESNext` 等 20 多项通用配置，每个子包 extends 它之后只需补充自己特有的 `outDir`、`rootDir` 即可。

**一句话：继承编译选项，是配置层面的复用，不影响项目之间的关系。**

### 2.2 `references` — 项目引用

解决的问题：**告诉 TypeScript 当前项目依赖哪些其他 TypeScript 项目。**

它建立了项目之间的**依赖拓扑关系**，带来三个作用：

1. **类型解析** — 当 `vtable-guild` 中写 `import { x } from '@vtable-guild/core'` 时，TypeScript 通过 references 找到 core 的 tsconfig，再定位到 core 编译出的 `.d.ts` 文件来提供类型信息。

2. **增量构建** — 运行 `tsc --build` 时，TypeScript 会按 references 的拓扑顺序依次构建（先 core → 再 theme → 再 table → 最后 vtable-guild），且只重新编译发生变化的项目。

3. **边界隔离** — 配合 `composite: true`，每个子包只能看到自己 `include` 范围内的源码，不能随意跨包访问未声明引用的项目文件。

**一句话：声明项目间的依赖关系，影响构建顺序、类型查找和边界隔离。**

### 2.3 对比

|            | `extends`                  | `references`                                                |
| ---------- | -------------------------- | ----------------------------------------------------------- |
| 做什么     | 继承编译配置               | 声明项目依赖                                                |
| 方向       | 向上找父配置               | 向外找兄弟项目                                              |
| 类比       | CSS 公共样式文件           | package.json 的 dependencies                                |
| 去掉会怎样 | 每个包要重复写所有编译选项 | TypeScript 找不到其他包的类型，`tsc --build` 不知道构建顺序 |

---

## 3. Turbo 报错：Missing `packageManager` field in package.json

### 3.1 原因

Turborepo 需要通过根 `package.json` 的 `packageManager` 字段来确定当前项目使用哪个包管理器（npm / yarn / pnpm）以及具体版本。它依赖这个字段来：

1. **选择正确的命令** — 比如用 `pnpm run build` 而不是 `npm run build` 来执行子包脚本
2. **解析 workspace 结构** — 不同包管理器的 workspace 协议不同（pnpm 用 `pnpm-workspace.yaml`，yarn 用 `package.json` 的 `workspaces` 字段）
3. **生成正确的 lockfile 哈希** — turbo 的缓存机制需要知道去哈希哪个 lockfile（`pnpm-lock.yaml` vs `yarn.lock`）

### 3.2 为什么这样设计

`packageManager` 是 Node.js 官方规范的字段（[Corepack](https://nodejs.org/api/corepack.html)），不是 Turbo 自创的。它的意义是让项目**显式声明**包管理器及版本，而不是靠环境碰运气。Turbo 选择依赖这个标准字段而非自己发明配置项。

`package.json` 里的 `engines` 只是建议性的警告，`packageManager` 才是声明性的绑定。

### 3.3 修复

在根 `package.json` 中添加 `packageManager` 字段：

```json
"packageManager": "pnpm@10.28.2"
```

---

## 4. 主题方案论证与优化建议

> 对照 Nuxt UI v4 的主题系统实现，评估 `architecture.md` 中设计的三层主题覆盖方案。

### 4.1 当前方案中合理的部分

**三层覆盖机制**（默认主题 → 全局配置 → 实例级）与 Nuxt UI v4 一致，是经过验证的成熟模式。

**theme 包导出纯对象**而非 `tv()` 调用后的结果——正确，必须在 `useTheme` 中合并完三层配置之后才调用 `tv()`。

**theme 与 core 分离**，theme 是纯数据不含 Vue 依赖，用户可 fork 整个主题包做深度定制。

**tailwind-variants 放在 core 的 dependencies**，作为运行时依赖确保使用者不需要自行安装。

### 4.2 需要优化的 6 个问题

#### 问题 1：缺少 `tailwind-merge` 的显式依赖（P0）

**现状**：`packages/core/package.json` 只声明了 `tailwind-variants: ^3.2.2`，未显式安装 `tailwind-merge`。

**风险**：tailwind-variants 将 tailwind-merge 列为 **optional peer dependency**。如果不安装，class 冲突不会被智能合并——比如默认主题写了 `px-4`，用户通过 `ui` prop 传入 `px-2`，最终会同时保留 `px-4 px-2`，导致样式不可预测。

**修复**：在 `packages/core/package.json` 的 `dependencies` 中显式添加 `tailwind-merge`。

#### 问题 2：`useTheme` 的合并策略未明确（P0）

**现状**：architecture.md 只写了"deep merge"，但没有说明具体合并规则。

需要明确的关键问题：

| 场景                            | 期望行为                       |
| ------------------------------- | ------------------------------ |
| 全局配置覆盖 `slots.th`         | 是**替换**还是**追加** class？ |
| 全局配置新增 `variants.density` | 是否支持？                     |
| 全局配置修改 `defaultVariants`  | 是整体替换还是浅合并？         |
| `compoundVariants` 合并         | 是追加还是按条件去重？         |
| `class` prop 与 `ui.root` 冲突  | 谁的优先级更高？如何合并？     |

**`class` 与 `ui.root` 的冲突问题**：

`class` prop 和 `ui` prop 的 `root` slot 都作用于组件根元素，需要明确优先级。参考 Nuxt UI v4 的做法：

```
优先级从低到高：
默认主题 slots.root → 全局配置 slots.root → ui.root → class
```

即 `class` prop 优先级最高，最终通过 tailwind-merge 智能合并所有层级。示例：

```vue
<!-- 默认主题 root: 'w-full rounded-md' -->
<!-- 全局配置 root: 'rounded-lg' -->
<VTable :ui="{ root: 'shadow-md' }" class="my-4" />

<!-- 最终结果（tailwind-merge 后）: 'w-full rounded-lg shadow-md my-4' -->
<!-- rounded-md 被 rounded-lg 覆盖，其余非冲突 class 全部保留 -->
```

**Nuxt UI v4 的做法**：

- `slots`：使用 tailwind-merge **智能合并**（冲突 class 后者胜，非冲突 class 保留两者）
- `variants`：**深合并**
- `defaultVariants`：**浅合并**（用户配置覆盖默认值）
- `compoundVariants`：**追加**（用户的 compoundVariants 附加到默认列表末尾，优先级更高）

**建议**：在设计文档中明确每个字段的合并策略，否则后续实现 `useTheme` 时容易产生歧义。

**验证清单**：实现 `useTheme` 后，应分别验证以下每个字段的合并行为与优先级：

| 验证项                  | 测试场景                                                          | 预期结果                                 |
| ----------------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| `slots` 合并            | 默认 `th: 'px-4 text-left'`，全局覆盖 `th: 'px-6'`                | tailwind-merge → `px-6 text-left`        |
| `variants` 合并         | 默认有 `size`，全局新增 `density` variant                         | 两个 variant 都可用                      |
| `defaultVariants` 合并  | 默认 `{ size: 'md', bordered: false }`，全局只改 `{ size: 'sm' }` | `{ size: 'sm', bordered: false }`        |
| `compoundVariants` 合并 | 默认有 1 条规则，全局追加 1 条                                    | 两条规则都生效，全局的优先级更高         |
| `compoundSlots` 合并    | 默认有 1 条规则，全局追加 1 条                                    | 两条规则都生效                           |
| `ui` prop 覆盖          | `ui.th` 传入新 class                                              | 与默认+全局的 slots.th 做 tailwind-merge |
| `class` vs `ui.root`    | 同时传 `class="my-4"` 和 `ui.root="shadow-md"`                    | 两者都保留，`class` 优先级最高           |
| 三层完整链路            | 默认 + 全局 + 实例同时存在                                        | 按优先级逐层 merge，最终 class 正确      |

#### 问题 3：缺少类型安全设计（P1）

**现状**：architecture.md 中主题文件用 `export default { ... }` 导出，没有类型约束。

**风险**：

- 用户通过 `ui` prop 传入不存在的 slot 名时不会报错
- 全局配置中传入不存在的 variant 值时不会报错
- 重构 slot 名后，消费端不会有类型错误提示

**建议**：为每个组件的主题定义导出类型：

```typescript
// packages/theme/src/table.ts
import type { VariantProps } from 'tailwind-variants'

export const tableTheme = {
  slots: { ... },
  variants: { ... },
} as const  // ← 关键：as const 保留字面量类型

// 自动推导出 slot 名和 variant 类型
export type TableSlots = keyof typeof tableTheme.slots
export type TableVariants = VariantProps<typeof tableTheme>
```

组件的 `ui` prop 就能获得类型提示：

```typescript
defineProps<{
  ui?: Partial<Record<TableSlots, string>>
}>()
```

#### 问题 4：缺少 `compoundSlots` 的设计考量（P1）

**现状**：architecture.md 中的主题文件只用了 `slots` + `variants` + `compoundVariants`。

**遗漏**：tailwind-variants 提供了 `compoundSlots`，用于给多个 slot 批量应用相同样式，避免重复：

```typescript
// 当前方案（重复）
variants: {
  size: {
    sm: { th: 'px-2 py-1.5 text-xs', td: 'px-2 py-1.5 text-xs' }
  }
}

// 使用 compoundSlots（DRY）
compoundSlots: [
  {
    slots: ['th', 'td'],
    size: 'sm',
    class: 'px-2 py-1.5 text-xs'
  }
]
```

**建议**：在主题文件规范中补充 `compoundSlots` 的使用指导。Table 主题中 `th` 和 `td` 大量共享样式，很适合用这个特性。

#### 问题 5：暗色模式方案未提及（P1）

**现状**：architecture.md 的主题示例中没有任何 `dark:` 前缀的 class。

**两种方案对比**：

| 方案             | 做法                                                                   | 优劣                                                   |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `dark:` 前缀     | 每个 class 写 `dark:` 变体                                             | 简单直接，但主题文件会膨胀                             |
| CSS 变量（推荐） | 用 `@theme` 定义语义化变量（如 `--color-surface`），暗色模式切换变量值 | 主题文件更干净，Tailwind CSS 4 + Nuxt UI v4 的推荐做法 |

**建议**：采用 CSS 变量方案。主题文件中使用 `bg-surface`、`text-on-surface` 等语义化 class，暗色模式只需切换 CSS 变量值，组件不需要写 `dark:` 前缀。

#### 问题 6：`theme` 包对 `core` 使用 peerDependency 值得商榷（P2）

**现状**：`packages/theme/package.json` 将 `@vtable-guild/core` 列为 `peerDependencies`。

**问题**：theme 包是纯数据（导出 JS 对象），当前设计中**不直接调用** core 的任何 API（不 import `tv()`，不 import 类型工具）。如果 theme 只是导出原始对象，它与 core 包实际上没有运行时依赖关系。

**建议**：

- 如果 theme 确实不 import core 的任何东西 → **去掉这个 peerDependency**
- 如果后续 theme 需要 import core 的类型来做类型约束（如问题 3 的方案）→ 改为 `devDependencies`（类型只在构建时需要）

### 4.3 总结

| 项目                            | 评价                                 | 优先级 |
| ------------------------------- | ------------------------------------ | ------ |
| 三层覆盖机制                    | 合理，无需改动                       | —      |
| 纯对象导出                      | 合理，无需改动                       | —      |
| 包拆分策略                      | 合理，无需改动                       | —      |
| 显式安装 tailwind-merge         | **需修复**，否则 class 合并失效      | P0     |
| 明确合并策略                    | **需补充**，否则 useTheme 实现有歧义 | P0     |
| `class` 与 `ui.root` 优先级     | **需明确**，两者都作用于根元素       | P0     |
| 类型安全（as const + 类型导出） | **建议补充**，提升开发体验           | P1     |
| compoundSlots 使用指导          | **建议补充**，减少主题文件冗余       | P1     |
| 暗色模式策略                    | **需明确**，影响所有主题文件的写法   | P1     |
| theme 对 core 的依赖方向        | **需审视**，可能可以去掉             | P2     |
| useTheme 分字段验证             | **需执行**，逐项验证合并行为与优先级 | 实现后 |
