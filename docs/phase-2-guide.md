# 阶段二：核心层实现 — 保姆级操作指南

> 本文档是 [roadmap.md](./roadmap.md) 阶段二的逐步细化，每一步给出具体的文件内容和命令。
> 按顺序执行，不要跳步。

### 前置条件

阶段一已完成：5 个子包骨架 + turborepo + TypeScript 项目引用，`pnpm build` 全部通过。

### 本阶段目标

实现主题系统和核心工具，为组件开发提供基础设施。完成后：

- `@vtable-guild/core` 提供 `tv()` 封装、`useTheme` composable、Vue 插件
- `@vtable-guild/theme` 提供 Table 和 Pagination 的默认主题
- Playground 可视化验证三层主题覆盖

---

## Step 1：依赖修正

### 1.1 为什么先做这一步

阶段一遗留了 3 个依赖问题，如果不先修正，后续代码会编译失败或依赖关系混乱：

| 问题                                          | 风险                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `theme` 包对 `core` 有不必要的 peerDependency | theme 是纯数据包，不 import core 的任何 API，这个 peerDep 会造成虚假的依赖关系                           |
| `tailwind-merge` 未安装                       | tailwind-variants 的 `twMerge` 功能依赖 `tailwind-merge`（optional peer dependency），不安装则运行时报错 |
| `tailwind-variants` 版本需确认                | 需要 `^3.2.2` 以使用 `createTV`、`cn`、`cnMerge` 等最新 API                                              |

### 1.2 修正 theme 包依赖

编辑 `packages/theme/package.json`，**删除整个 `peerDependencies` 块**：

```diff
- "peerDependencies": {
-   "@vtable-guild/core": "workspace:*"
- },
```

theme 包当前只导出纯 JS 对象，不 import `@vtable-guild/core` 的任何东西。如果后续需要 import core 的类型来做约束，再添加为 `devDependencies`。

同时编辑 `packages/theme/tsconfig.json`，**删除 `references` 块**：

```diff
- "references": [{ "path": "../core" }]
```

### 1.3 安装 tailwind-merge

`tailwind-merge` 是 tailwind-variants 的 optional peer dependency（v2 起），标准构建**要求**它被安装，但不自带。

```bash
pnpm add tailwind-merge --filter @vtable-guild/core
```

安装后 `packages/core/package.json` 的 `dependencies` 应包含：

```jsonc
"dependencies": {
  "tailwind-variants": "^3.2.2",
  "tailwind-merge": "^3.x"    // 版本号以实际安装为准
}
```

### 1.4 更新 vite external

编辑 `packages/core/vite.config.ts`，在 `build.rollupOptions.external` 中添加 `tailwind-merge`：

```diff
  external: [
    'vue',
    'tailwind-variants',
+   'tailwind-merge',
  ],
```

> `tailwind-merge` 是运行时依赖，由使用者安装（或通过 core 的 dependencies 自动安装），构建时不应打包进产物。

### 1.5 验证

```bash
pnpm install && pnpm build
```

预期结果：

- 无报错
- `packages/theme/package.json` 中无 `peerDependencies`
- `packages/core/package.json` 的 `dependencies` 中有 `tailwind-variants: "^3.2.2"`（确认版本 ≥ 3.2.2）
- `packages/core/package.json` 的 `dependencies` 中有 `tailwind-merge`
- `packages/core/vite.config.ts` 的 `external` 列表中包含 `tailwind-merge`

---

## Step 2：暗色模式基础设施

### 2.1 为什么在写代码之前做

暗色模式策略决定了**所有主题文件的写法**。如果不先确定方案，后续主题文件中的 class 可能全部需要返工。

### 2.2 方案选择：CSS 变量

| 方案                 | 做法                                                          | 优劣                                                   |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `dark:` 前缀         | 每个 class 写 `dark:` 变体                                    | 简单直接，但主题文件膨胀一倍                           |
| **CSS 变量**（采用） | 用 Tailwind CSS 4 `@theme` 定义语义化变量，暗色模式切换变量值 | 主题文件更干净，Tailwind CSS 4 + Nuxt UI v4 的推荐做法 |

采用 CSS 变量方案后，主题文件中使用语义化 class（如 `bg-surface`、`text-on-surface`、`border-default`），组件不需要写 `dark:` 前缀。

### 2.3 创建项目级 CSS 文件

在项目根目录创建 `assets/css/main.css`：

```bash
mkdir -p assets/css
```

```css
/* assets/css/main.css */

/*
 * vtable-guild 语义化颜色 token
 *
 * 使用 Tailwind CSS 4 的 @theme 指令注册自定义颜色，
 * 这样在 class 中可以直接使用 bg-surface、text-on-surface 等。
 *
 * 亮色/暗色模式通过 CSS 变量切换：
 * - :root 定义亮色值
 * - .dark 选择器定义暗色值（兼容 Tailwind 的 class 策略）
 */

/* ===== 1. 语义化变量定义 ===== */

:root {
  /* 表面/背景 */
  --color-surface: oklch(1 0 0); /* white */
  --color-surface-hover: oklch(0.97 0 0); /* gray-50 */
  --color-elevated: oklch(0.95 0 0); /* gray-100 */

  /* 文本 */
  --color-on-surface: oklch(0.15 0 0); /* gray-900 */
  --color-muted: oklch(0.55 0 0); /* gray-500 */

  /* 边框 */
  --color-default: oklch(0.87 0 0); /* gray-300 */

  /* 主题色（可被用户覆盖） */
  --color-primary: oklch(0.55 0.25 260); /* blue-600 */
  --color-primary-hover: oklch(0.49 0.25 260); /* blue-700 */
}

.dark {
  --color-surface: oklch(0.17 0 0); /* gray-900 */
  --color-surface-hover: oklch(0.21 0 0); /* gray-800 */
  --color-elevated: oklch(0.25 0 0); /* gray-700 */

  --color-on-surface: oklch(0.95 0 0); /* gray-100 */
  --color-muted: oklch(0.65 0 0); /* gray-400 */

  --color-default: oklch(0.37 0 0); /* gray-600 */

  --color-primary: oklch(0.65 0.25 260); /* blue-400 */
  --color-primary-hover: oklch(0.7 0.25 260); /* blue-300 */
}

/* ===== 2. 注册为 Tailwind 主题色 ===== */

@theme {
  --color-surface: var(--color-surface);
  --color-surface-hover: var(--color-surface-hover);
  --color-elevated: var(--color-elevated);
  --color-on-surface: var(--color-on-surface);
  --color-muted: var(--color-muted);
  --color-default: var(--color-default);
  --color-primary: var(--color-primary);
  --color-primary-hover: var(--color-primary-hover);
}
```

**关键说明**：

- `@theme` 是 Tailwind CSS 4 的新指令，将 CSS 变量注册为 Tailwind 可用的 theme token
- 注册后，`bg-surface`、`text-muted`、`border-default` 等 class 直接可用
- 暗色模式只需在 `<html>` 上添加 `class="dark"` 即可全局切换
- 使用 oklch 色彩空间，提供更均匀的亮度感知

### 2.4 Playground 引用此 CSS

> 完整的 playground 设置见 Step 12。此处先说明 CSS 引入方式。

Playground 的入口文件（如 `src/main.ts`）中引入：

```typescript
import '../assets/css/main.css'
```

这样 Tailwind 会处理 `@theme` 指令，使语义化 class 在 playground 中可用。

---

## Step 3：`core/utils/types.ts` — 公共类型

### 3.1 为什么先写类型

类型定义是 Step 4–11 所有代码的基础。先定义好 `ThemeConfig`、`SlotProps` 等泛型，后续代码可以直接使用，IDE 也能提供正确的类型提示。

### 3.2 创建文件

创建 `packages/core/src/utils/types.ts`：

````typescript
// packages/core/src/utils/types.ts

// ---------- 主题配置相关 ----------

/**
 * 组件主题的原始配置对象（传给 tv() 之前的形态）。
 *
 * 这是 @vtable-guild/theme 中每个文件导出的结构：
 * ```ts
 * export const tableTheme = {
 *   slots: { root: '...', table: '...' },
 *   variants: { size: { sm: {...}, md: {...} } },
 *   defaultVariants: { size: 'md' },
 * } as const satisfies ThemeConfig
 * ```
 */
export interface ThemeConfig {
  /** slot 名 → 默认 class 字符串 */
  slots: Record<string, string>
  /** variant 名 → 值 → slot class 覆盖 */
  variants?: Record<string, Record<string, Record<string, string> | string>>
  /** 默认 variant 值 */
  defaultVariants?: Record<string, string | boolean>
  /** 复合 variant 规则（当多个 variant 同时匹配时应用） */
  compoundVariants?: Array<Record<string, unknown>>
  /** 批量 slot 样式规则（多个 slot 共享相同条件下的样式） */
  compoundSlots?: Array<Record<string, unknown>>
}

/**
 * 组件 `ui` prop 的类型：每个 slot 可传入自定义 class 字符串。
 *
 * ```vue
 * <VTable :ui="{ root: 'shadow-lg', th: 'bg-blue-50' }" />
 * ```
 */
export type SlotProps<T extends ThemeConfig> = Partial<Record<keyof T['slots'] & string, string>>

// ---------- 插件配置相关 ----------

/**
 * createVTableGuild() 的配置参数。
 */
export interface VTableGuildOptions {
  /** 全局主题覆盖，key 为组件名（如 'table'、'pagination'） */
  theme?: Record<string, Partial<ThemeConfig>>
}

/**
 * 通过 provide/inject 传递的全局配置。
 */
export interface VTableGuildContext {
  theme: Record<string, Partial<ThemeConfig>>
}
````

**关键说明**：

- `ThemeConfig` 是一个宽松接口，用于约束主题文件的基本结构，但不限制具体的 slot 名和 variant 名
- `SlotProps<T>` 使用泛型从具体的主题配置中提取 slot 名，为组件的 `ui` prop 提供类型安全
- `as const satisfies ThemeConfig` 是推荐的主题文件写法——`as const` 保留字面量类型供 `SlotProps` 推导，`satisfies` 确保结构合规

---

## Step 4：`core/utils/tv.ts` — tv() 封装

### 4.1 为什么要封装

直接使用 `tailwind-variants` 的 `tv()` 有两个问题：

1. 每次调用都要手动配置 `twMerge`、`twMergeConfig` 等选项
2. 如果项目中有自定义的 Tailwind class（如 Step 2 的 `bg-surface`），tailwind-merge 可能无法正确识别冲突

tailwind-variants v3 提供了 4 个主要 API：

| API        | 用途                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `tv`       | 核心函数，创建带 slots/variants 的组件样式                              |
| `createTV` | 创建预配置的 `tv` 实例，统一 twMerge 设置                               |
| `cn`       | class 拼接工具（类似 clsx），标准构建下通过 tailwind-merge 实现冲突合并 |
| `cnMerge`  | 同 `cn`，但支持传入自定义 twMerge 配置                                  |

我们用 `createTV` 创建统一配置的 `tv` 实例，同时 re-export `cn` 供 `useTheme` 中的三层合并使用。

### 4.2 创建文件

创建 `packages/core/src/utils/tv.ts`：

````typescript
// packages/core/src/utils/tv.ts

import { createTV, cn as cnBase, type TV } from 'tailwind-variants'

/**
 * 项目统一的 tv() 实例。
 *
 * 通过 createTV 预配置 tailwind-merge，所有组件共用一份 merge 规则。
 * 所有组件的主题定义都应通过此函数创建，而非直接使用 tailwind-variants 的 tv()。
 *
 * @example
 * ```ts
 * const table = tv({
 *   slots: {
 *     root: 'w-full',
 *     cell: 'px-4 py-3',
 *   },
 *   variants: {
 *     size: {
 *       sm: { cell: 'px-2 py-1.5 text-xs' },
 *       md: { cell: 'px-4 py-3 text-sm' },
 *     },
 *   },
 * })
 * ```
 */
export const tv: TV = createTV({
  twMerge: true,
  twMergeConfig: {
    // 在此扩展 tailwind-merge 的 class 分组。
    // 如果项目中定义了自定义的 Tailwind 工具类且需要正确的冲突合并，
    // 可以在这里注册。
    //
    // 示例：如果有自定义的 shadow 工具类
    // classGroups: {
    //   shadow: [{ shadow: ['surface', 'elevated'] }],
    // },
  },
})

/**
 * class 拼接 + tailwind-merge 智能合并。
 *
 * 用于 useTheme 中的三层配置合并——合并发生在 tv() 调用之前/之后，
 * 需要手动处理 class 冲突。cn() 是 tailwind-variants 提供的工具函数，
 * 底层调用 tailwind-merge 实现冲突合并。
 *
 * @example
 * ```ts
 * cn('px-4 text-left', 'px-6')  // => 'text-left px-6'
 * cn('text-muted', 'text-primary')  // => 'text-primary'
 * cn('w-full', undefined, 'shadow-md')  // => 'w-full shadow-md'
 * ```
 */
export { cnBase as cn }
````

**关键说明**：

- **`createTV`** — tailwind-variants v3.2.0+ 提供的工厂函数，创建一个预配置的 `tv` 实例。比手动包裹 `tvBase(options, config)` 更简洁
- **`cn`** — tailwind-variants 提供的 class 拼接工具函数，底层调用 `tailwind-merge` 实现冲突合并。`cn('px-4', 'px-6')` 返回 `'px-6'`。注意 `tailwind-merge` 需作为 peer dependency 单独安装（见 Step 1.3）
- `twMergeConfig` 预留了扩展点。当前语义化颜色（`bg-surface` 等）属于标准 Tailwind 类型，tailwind-merge 能自动处理，无需额外配置

---

## Step 5：`core/utils/props.ts` — prop 定义辅助函数

### 5.1 为什么需要这个工具

Vue 3 的 `defineProps` 在 `<script setup>` 中使用时只接受类型参数（编译期宏），不能引用运行时对象。但在某些场景下（如 JSX 组件、带默认值的 prop），需要运行时的 prop 定义对象。此辅助函数简化重复的 prop 声明。

### 5.2 创建文件

创建 `packages/core/src/utils/props.ts`：

````typescript
// packages/core/src/utils/props.ts

import type { PropType } from 'vue'

/**
 * 定义一个可选的 prop，提供类型推导和默认值支持。
 *
 * @example
 * ```ts
 * export const tableProps = {
 *   size: optionalProp<'sm' | 'md' | 'lg'>('md'),
 *   bordered: optionalBoolProp(false),
 * }
 * ```
 */
export function optionalProp<T>(defaultValue?: T) {
  return {
    type: [String, Number, Boolean, Object, Array, Function] as unknown as PropType<T>,
    required: false as const,
    default: defaultValue,
  }
}

/**
 * 定义一个必选的 prop。
 */
export function requiredProp<T>() {
  return {
    type: [String, Number, Boolean, Object, Array, Function] as unknown as PropType<T>,
    required: true as const,
  }
}

/**
 * 定义一个可选的 boolean prop。
 */
export function optionalBoolProp(defaultValue = false) {
  return {
    type: Boolean,
    required: false as const,
    default: defaultValue,
  }
}

/**
 * 定义一个可选的 string prop。
 */
export function optionalStringProp(defaultValue?: string) {
  return {
    type: String,
    required: false as const,
    default: defaultValue,
  }
}
````

**关键说明**：

- 这些辅助函数的主要价值是**减少 `as PropType<T>` 的样板代码**
- 在 `<script setup>` 中推荐直接使用 TypeScript 类型声明 `defineProps<{...}>()`，这些辅助函数主要用于 JSX 组件或需要运行时 prop 定义的场景

---

## Step 6：`theme/src/table.ts` — Table 默认主题

### 6.1 为什么这个文件这样写

主题文件有 3 个关键设计决策：

1. **`as const`** — 保留字面量类型，让 `SlotProps<typeof tableTheme>` 能推导出具体的 slot 名（`'root' | 'wrapper' | 'table' | ...`），而不是宽泛的 `string`
2. **`satisfies ThemeConfig`** — 编译期检查结构是否合规（有 `slots`、`variants` 格式正确等），同时不丢失 `as const` 的字面量类型
3. **`compoundSlots`** — 用于给 `th` 和 `td` 批量应用相同的 size 样式，避免在 `variants.size` 中重复写两遍

### 6.2 创建文件

创建 `packages/theme/src/table.ts`：

```typescript
// packages/theme/src/table.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Table 组件的默认主题定义。
 *
 * 使用语义化颜色 token（bg-surface、text-muted、border-default 等），
 * 暗色模式通过 CSS 变量切换，无需 dark: 前缀。
 */
export const tableTheme = {
  slots: {
    root: 'w-full',
    wrapper: 'overflow-auto',
    table: 'w-full border-collapse text-sm text-on-surface',
    thead: '',
    tbody: '',
    tr: 'border-b border-default transition-colors',
    th: 'px-4 py-3 text-left font-medium text-muted',
    td: 'px-4 py-3',
    empty: 'py-8 text-center text-muted',
    loading: 'absolute inset-0 flex items-center justify-center bg-surface/60',
    sortIcon: 'ml-1 inline-block size-4 text-muted',
    filterIcon: 'ml-1 inline-block size-4 text-muted',
    selectionCell: 'w-12 px-4 py-3 text-center',
    expandIcon: 'inline-flex size-4 cursor-pointer text-muted',
    resizeHandle: 'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary',
  },
  variants: {
    size: {
      sm: {}, // 具体样式由 compoundSlots 统一定义
      md: {},
      lg: {},
    },
    bordered: {
      true: {
        table: 'border border-default',
        th: 'border border-default',
        td: 'border border-default',
      },
    },
    striped: {
      true: { tr: 'even:bg-elevated/50' },
    },
    hoverable: {
      true: { tr: 'hover:bg-surface-hover' },
    },
  },
  // ---------- compoundSlots ----------
  // th 和 td 在各 size 下共享相同的 padding 和字号，
  // 使用 compoundSlots 避免在 variants.size 中重复写两遍。
  compoundSlots: [
    {
      slots: ['th', 'td'],
      size: 'sm',
      class: 'px-2 py-1.5 text-xs',
    },
    {
      slots: ['th', 'td'],
      size: 'md',
      class: 'px-4 py-3 text-sm',
    },
    {
      slots: ['th', 'td'],
      size: 'lg',
      class: 'px-6 py-4 text-base',
    },
  ],
  compoundVariants: [
    // bordered + sm 时缩小 padding
    {
      bordered: true,
      size: 'sm',
      class: { th: 'px-2 py-1', td: 'px-2 py-1' },
    },
  ],
  defaultVariants: {
    size: 'md',
    bordered: false,
    striped: false,
    hoverable: true,
  },
} as const satisfies ThemeConfig

// ---------- 类型导出 ----------

/** Table 主题的 slot 名联合类型 */
export type TableSlots = keyof typeof tableTheme.slots

/** Table 主题的 variant props 类型（size, bordered, striped, hoverable） */
export type TableVariantProps = {
  size?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}
```

**关键说明**：

- `import type { ThemeConfig }` — theme 只在编译期使用 core 的类型，运行时无依赖。这就是 Step 1 中去掉 `peerDependencies` 的原因
- 所有颜色都使用 Step 2 定义的语义化 token（`text-on-surface`、`border-default`、`bg-surface-hover`），暗色模式无需额外处理
- `compoundSlots` 示范：`th` 和 `td` 在 `size: 'sm'` 时都应用 `px-2 py-1.5 text-xs`，只写一次
- 类型导出 `TableSlots` 和 `TableVariantProps` 供组件的 `ui` prop 和 variant prop 使用

> **注意**：theme 包 import core 的类型后，需要将 `@vtable-guild/core` 添加为 `devDependencies`，并恢复 tsconfig 中的 `references`。见下方 6.3。

### 6.3 更新 theme 包的开发依赖和 TypeScript 引用

由于 `table.ts` 使用了 `import type { ThemeConfig } from '@vtable-guild/core'`，需要：

**1. 添加 core 为 devDependency**（仅类型使用，非运行时依赖）：

```bash
pnpm add @vtable-guild/core --filter @vtable-guild/theme --save-dev
```

安装后 `packages/theme/package.json` 应有：

```jsonc
"devDependencies": {
  "@vtable-guild/core": "workspace:*"
}
```

**2. 恢复 tsconfig references**（让 TypeScript 能找到 core 的类型）：

编辑 `packages/theme/tsconfig.json`：

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo",
  },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../core" }], // ← 恢复，TypeScript 需要此引用来解析 core 的类型
}
```

**与 Step 1 删除 peerDependency 的区别**：

| Step 1 删除的                                               | Step 6 添加的                                              | 区别                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| `peerDependencies: { "@vtable-guild/core": "workspace:*" }` | `devDependencies: { "@vtable-guild/core": "workspace:*" }` | peerDep 意味着运行时依赖，devDep 意味着仅构建/开发时需要 |

theme 包发布后，使用者不需要额外安装 core（因为不是 peerDep）。类型引用只在源码开发时需要。

---

## Step 7：`theme/src/pagination.ts` — Pagination 默认主题

### 7.1 创建文件

创建 `packages/theme/src/pagination.ts`：

```typescript
// packages/theme/src/pagination.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Pagination 组件的默认主题定义。
 */
export const paginationTheme = {
  slots: {
    root: 'flex items-center gap-1 text-sm text-on-surface',
    item: [
      'inline-flex items-center justify-center',
      'min-w-8 h-8 px-2 rounded',
      'text-muted hover:bg-surface-hover hover:text-on-surface',
      'transition-colors cursor-pointer select-none',
    ].join(' '),
    itemActive: [
      'inline-flex items-center justify-center',
      'min-w-8 h-8 px-2 rounded',
      'bg-primary text-white cursor-default',
    ].join(' '),
    prev: [
      'inline-flex items-center justify-center',
      'size-8 rounded',
      'text-muted hover:bg-surface-hover hover:text-on-surface',
      'transition-colors cursor-pointer select-none',
    ].join(' '),
    next: [
      'inline-flex items-center justify-center',
      'size-8 rounded',
      'text-muted hover:bg-surface-hover hover:text-on-surface',
      'transition-colors cursor-pointer select-none',
    ].join(' '),
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    ellipsis: 'inline-flex items-center justify-center size-8 text-muted',
    jumper: 'inline-flex items-center gap-2 text-sm text-muted',
    jumperInput: [
      'w-12 h-8 px-2 rounded border border-default',
      'text-center text-sm text-on-surface bg-surface',
      'outline-none focus:border-primary',
    ].join(' '),
    sizeChanger: [
      'h-8 px-2 rounded border border-default',
      'text-sm text-on-surface bg-surface',
      'outline-none focus:border-primary cursor-pointer',
    ].join(' '),
    total: 'text-sm text-muted',
  },
  variants: {
    size: {
      sm: {},
      md: {},
    },
    simple: {
      true: {
        root: 'gap-2',
      },
    },
  },
  compoundSlots: [
    {
      slots: ['item', 'itemActive', 'prev', 'next'],
      size: 'sm',
      class: 'min-w-6 h-6 px-1 text-xs',
    },
  ],
  defaultVariants: {
    size: 'md',
    simple: false,
  },
} as const satisfies ThemeConfig

// ---------- 类型导出 ----------

export type PaginationSlots = keyof typeof paginationTheme.slots

export type PaginationVariantProps = {
  size?: 'sm' | 'md'
  simple?: boolean
}
```

**关键说明**：

- 长 class 字符串使用 `[].join(' ')` 拼接，提升可读性。tailwind-variants 接受标准字符串，join 在模块加载时执行，无运行时开销
- `prev` 和 `next` 的禁用状态由 `disabled` slot 的 class 叠加实现（组件中条件拼接）

---

## Step 8：`theme/src/index.ts` — 统一导出

### 8.1 更新文件

替换 `packages/theme/src/index.ts` 的内容：

```typescript
// packages/theme/src/index.ts

// ---------- 主题定义 ----------
export { tableTheme } from './table'
export { paginationTheme } from './pagination'

// ---------- 类型导出 ----------
export type { TableSlots, TableVariantProps } from './table'
export type { PaginationSlots, PaginationVariantProps } from './pagination'
```

**关键说明**：

- 使用具名导出（`export { tableTheme }`），不使用 `export default`——方便使用者按需导入
- 类型使用 `export type` 显式标记，确保被 TypeScript 正确擦除，不出现在运行时产物中

---

## Step 9：`core/composables/useTheme.ts` — 三层合并逻辑

### 9.1 为什么这是核心

`useTheme` 是整个主题系统的枢纽——它负责将三层配置（默认主题 → 全局配置 → 实例级）合并为最终的 slot class 函数。合并策略的正确性直接决定了用户自定义主题的体验。

### 9.2 合并策略说明

在写代码之前，先明确每个字段的合并规则（参考 Nuxt UI v4）：

| 字段               | 合并策略                           | 说明                                                                 |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------- |
| `slots`            | **tailwind-merge 智能合并**        | 冲突 class 后者胜（`px-4` + `px-6` → `px-6`），非冲突 class 保留两者 |
| `variants`         | **深合并**                         | 同名 variant 的同名值做 tailwind-merge 合并，新 variant 直接加入     |
| `defaultVariants`  | **浅合并**（`Object.assign`）      | 用户配置覆盖默认值                                                   |
| `compoundVariants` | **追加**                           | 用户的规则附加到默认列表末尾，优先级更高                             |
| `compoundSlots`    | **追加**                           | 同上                                                                 |
| `ui` prop          | **tailwind-merge 合并到 slots**    | 对应 slot 的 class 做 tailwind-merge 合并                            |
| `class` prop       | **最高优先级，merge 到 root slot** | 通过 tailwind-merge 合并到 `slots.root`                              |

**优先级链**（从低到高）：

```
默认主题 slots.xxx → 全局配置 slots.xxx → ui.xxx → class（仅 root slot）
```

### 9.3 创建文件

创建 `packages/core/src/composables/useTheme.ts`：

````typescript
// packages/core/src/composables/useTheme.ts

import { computed, inject } from 'vue'
import { cn } from '../utils/tv'
import { tv } from '../utils/tv'
import { VTABLE_GUILD_INJECTION_KEY } from '../plugin/index'
import type { ThemeConfig, SlotProps, VTableGuildContext } from '../utils/types'

/**
 * 三层主题合并 composable。
 *
 * 将默认主题 → 全局配置 → 实例级 props 合并为最终的 slot class 函数。
 *
 * @param componentName - 组件名（如 'table'），用于查找全局配置中对应的主题
 * @param defaultTheme  - 来自 @vtable-guild/theme 的默认主题配置
 * @param props         - 组件 props（含 variant props + ui + class）
 *
 * @returns `{ slots }` — slots 是一个对象，每个 key 是 slot 名，值是返回 class 字符串的函数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@vtable-guild/core'
 * import { tableTheme } from '@vtable-guild/theme'
 *
 * const props = defineProps<{
 *   size?: 'sm' | 'md' | 'lg'
 *   bordered?: boolean
 *   ui?: Partial<Record<string, string>>
 *   class?: string
 * }>()
 *
 * const { slots } = useTheme('table', tableTheme, props)
 * </script>
 *
 * <template>
 *   <div :class="slots.root()">
 *     <table :class="slots.table()">...</table>
 *   </div>
 * </template>
 * ```
 */
export function useTheme<T extends ThemeConfig>(
  componentName: string,
  defaultTheme: T,
  props: Record<string, unknown>,
) {
  // ========== Layer 2: 通过 inject 获取全局配置 ==========
  const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

  const slots = computed(() => {
    // 获取该组件的全局主题覆盖
    const globalTheme = globalContext?.theme?.[componentName] as Partial<ThemeConfig> | undefined

    // ========== 合并三层配置 ==========
    const merged = mergeThemeConfigs(defaultTheme, globalTheme)

    // ========== 调用 tv() 生成 slot class 函数 ==========
    const tvResult = tv(merged as Parameters<typeof tv>[0])

    // ========== 提取 variant props ==========
    const variantProps: Record<string, unknown> = {}
    if (merged.variants) {
      for (const key of Object.keys(merged.variants)) {
        if (key in props && props[key] !== undefined) {
          variantProps[key] = props[key]
        }
      }
    }

    // 调用 tv 结果获取各 slot 的 class 函数
    const slotFns = tvResult(variantProps) as Record<string, () => string>

    // ========== Layer 3: 实例级 ui prop 和 class prop 覆盖 ==========
    const ui = (props.ui ?? {}) as SlotProps<T>
    const classProp = (props.class ?? '') as string

    // 构建最终的 slots 对象
    const result: Record<string, () => string> = {}

    for (const slotName of Object.keys(defaultTheme.slots)) {
      result[slotName] = () => {
        const base =
          typeof slotFns[slotName] === 'function'
            ? slotFns[slotName]()
            : ((slotFns[slotName] as string) ?? '')

        // ui prop 覆盖对应 slot
        const uiClass = (ui as Record<string, string>)[slotName] ?? ''

        // class prop 仅作用于 root slot
        const extraClass = slotName === 'root' ? classProp : ''

        // 通过 cn() 合并（cn 底层调用 tailwind-merge 处理 class 冲突）
        return cn(base, uiClass, extraClass)
      }
    }

    return result
  })

  return {
    slots: slots as unknown as {
      value: Record<keyof T['slots'] & string, () => string>
    },
  }
}

// ---------- 内部辅助函数 ----------

/**
 * 合并两层主题配置（默认主题 + 全局配置）。
 *
 * 合并策略（逐字段）：
 * - slots:           tailwind-merge 智能合并（冲突后者胜，非冲突保留）
 * - variants:        深合并（同名 variant 的同名值做 tailwind-merge 合并）
 * - defaultVariants: 浅合并（Object.assign，用户覆盖默认）
 * - compoundVariants: 追加（用户规则在后，优先级更高）
 * - compoundSlots:   追加（同上）
 */
function mergeThemeConfigs(base: ThemeConfig, override?: Partial<ThemeConfig>): ThemeConfig {
  if (!override) return base

  return {
    // ---- slots: cn() 智能合并 ----
    // 示例：base.th = 'px-4 text-left', override.th = 'px-6'
    //     → cn('px-4 text-left', 'px-6') → 'text-left px-6'
    slots: mergeSlots(base.slots, override.slots),

    // ---- variants: 深合并 ----
    // 示例：base.variants.size.sm = { th: 'px-2' },
    //       override.variants.size.sm = { th: 'px-3' }
    //     → { th: cn('px-2', 'px-3') } → { th: 'px-3' }
    variants: mergeVariants(base.variants, override.variants),

    // ---- defaultVariants: 浅合并 ----
    // 示例：base = { size: 'md', bordered: false },
    //       override = { size: 'sm' }
    //     → { size: 'sm', bordered: false }
    defaultVariants: {
      ...base.defaultVariants,
      ...override.defaultVariants,
    },

    // ---- compoundVariants: 追加 ----
    // 用户的规则追加到末尾，tailwind-variants 按顺序处理，后者优先级更高
    compoundVariants: [...(base.compoundVariants ?? []), ...(override.compoundVariants ?? [])],

    // ---- compoundSlots: 追加 ----
    compoundSlots: [...(base.compoundSlots ?? []), ...(override.compoundSlots ?? [])],
  }
}

/**
 * 合并 slots：对每个同名 slot 做 cn() 合并。
 */
function mergeSlots(
  base: Record<string, string>,
  override?: Record<string, string>,
): Record<string, string> {
  if (!override) return base

  const result = { ...base }
  for (const [key, value] of Object.entries(override)) {
    result[key] = key in base ? cn(base[key], value) : value
  }
  return result
}

/**
 * 合并 variants：对同名 variant 的同名值做深合并。
 */
function mergeVariants(
  base?: Record<string, Record<string, Record<string, string> | string>>,
  override?: Record<string, Record<string, Record<string, string> | string>>,
): Record<string, Record<string, Record<string, string> | string>> | undefined {
  if (!base && !override) return undefined
  if (!base) return override
  if (!override) return base

  const result = { ...base }

  for (const [variantName, variantValues] of Object.entries(override)) {
    if (!(variantName in result)) {
      // 新 variant，直接加入
      result[variantName] = variantValues
    } else {
      // 同名 variant，逐值合并
      const baseValues = result[variantName]
      const merged = { ...baseValues }

      for (const [valueName, slotClasses] of Object.entries(variantValues)) {
        if (!(valueName in merged)) {
          merged[valueName] = slotClasses
        } else {
          const baseSlot = merged[valueName]
          if (typeof baseSlot === 'string' && typeof slotClasses === 'string') {
            // 都是字符串，cn() 合并
            merged[valueName] = cn(baseSlot, slotClasses)
          } else if (typeof baseSlot === 'object' && typeof slotClasses === 'object') {
            // 都是对象（slot → class），逐 slot 合并
            const mergedSlot = { ...baseSlot }
            for (const [slot, cls] of Object.entries(slotClasses)) {
              mergedSlot[slot] = slot in mergedSlot ? cn(mergedSlot[slot], cls) : cls
            }
            merged[valueName] = mergedSlot
          } else {
            // 类型不同，后者覆盖
            merged[valueName] = slotClasses
          }
        }
      }

      result[variantName] = merged
    }
  }

  return result
}
````

**关键说明**：

- `inject(VTABLE_GUILD_INJECTION_KEY, null)` — 如果组件不在 `createVTableGuild` 的 `app.use()` 范围内，`inject` 返回 `null`，不会报错，此时只有默认主题生效
- `computed` 包裹合并逻辑 — 确保全局配置或 props 变化时自动重新计算
- `cn()` 用于 slots 合并 — `cn` 是 tailwind-variants 提供的工具函数，底层调用 `tailwind-merge` 实现 class 冲突合并。`tv()` 内部的 merge 只处理 `tv()` 层面的合并，而三层配置的合并发生在 `tv()` 调用之前，`ui` prop 覆盖发生在之后，这两步都需要通过 `cn()` 手动处理
- `class` prop 仅作用于 `root` slot — 与 Vue 组件的 `class` attribute 语义一致

---

## Step 10：`core/plugin/index.ts` — Vue 插件

### 10.1 为什么需要插件

Vue 插件通过 `provide` 注入全局主题配置，所有后代组件都可以通过 `inject` 获取。这是三层覆盖中 Layer 2（全局配置）的注入机制。

### 10.2 创建文件

创建 `packages/core/src/plugin/index.ts`：

````typescript
// packages/core/src/plugin/index.ts

import type { InjectionKey, Plugin } from 'vue'
import type { VTableGuildOptions, VTableGuildContext } from '../utils/types'

/**
 * 全局配置的 injection key。
 *
 * 使用 Symbol 确保唯一性，避免多实例冲突。
 * 导出供 useTheme 中 inject 使用。
 */
export const VTABLE_GUILD_INJECTION_KEY: InjectionKey<VTableGuildContext> = Symbol('vtable-guild')

/**
 * 创建 vtable-guild 的 Vue 插件。
 *
 * @example
 * ```ts
 * // main.ts
 * import { createApp } from 'vue'
 * import { createVTableGuild } from '@vtable-guild/core'
 *
 * const app = createApp(App)
 *
 * const vtg = createVTableGuild({
 *   theme: {
 *     table: {
 *       slots: { th: 'bg-blue-50 font-bold' },
 *       defaultVariants: { size: 'sm' },
 *     },
 *   },
 * })
 *
 * app.use(vtg)
 * ```
 */
export function createVTableGuild(options: VTableGuildOptions = {}): Plugin {
  return {
    install(app) {
      const context: VTableGuildContext = {
        theme: options.theme ?? {},
      }

      app.provide(VTABLE_GUILD_INJECTION_KEY, context)
    },
  }
}
````

**关键说明**：

- `InjectionKey<VTableGuildContext>` — 带类型的 injection key，`inject` 时自动推导出 `VTableGuildContext` 类型
- `Symbol('vtable-guild')` — 使用 Symbol 而非字符串，避免与其他库的 injection key 冲突
- 插件仅做 `provide`，不注册全局组件——组件注册由各组件包自行处理或由用户按需导入

---

## Step 11：`core/src/index.ts` — 更新统一导出

### 11.1 更新文件

替换 `packages/core/src/index.ts` 的内容：

```typescript
// packages/core/src/index.ts

// ---------- Utils ----------
export { tv, cn } from './utils/tv'
export { optionalProp, requiredProp, optionalBoolProp, optionalStringProp } from './utils/props'

// ---------- Types ----------
export type { ThemeConfig, SlotProps, VTableGuildOptions, VTableGuildContext } from './utils/types'

// ---------- Composables ----------
export { useTheme } from './composables/useTheme'

// ---------- Plugin ----------
export { createVTableGuild, VTABLE_GUILD_INJECTION_KEY } from './plugin/index'
```

---

## Step 12：验证

### 12.1 构建验证

```bash
pnpm build
```

预期结果（turbo 输出）：

```
 Tasks:    5 successful, 5 total
```

构建顺序应为：`core`（先构建，因为 theme 的 tsconfig references 指向 core）→ `theme` + `pagination`（并行）→ `table` → `vtable-guild`。

### 12.2 Playground 设置

当前项目根目录就是一个 Vite 应用（`src/main.ts`、`src/App.vue`），可以直接作为 playground 使用。

**1. 安装 playground 需要的依赖**：

```bash
# 将组件库作为依赖安装到根项目
pnpm add @vtable-guild/core @vtable-guild/theme -w
```

> 使用 `workspace:*` 协议自动链接本地包。

**2. 确保 `src/main.ts` 引入 CSS 并安装插件**：

```typescript
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/core'

// 引入语义化颜色 token
import '../assets/css/main.css'

const app = createApp(App)

// ---- 全局主题配置（Layer 2） ----
const vtg = createVTableGuild({
  theme: {
    table: {
      // 全局覆盖 th 样式，验证合并逻辑
      slots: { th: 'uppercase tracking-wider' },
    },
  },
})

app.use(vtg)
app.mount('#app')
```

**3. 创建验证页面 `src/App.vue`**：

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useTheme } from '@vtable-guild/core'
import { tableTheme } from '@vtable-guild/theme'

// 模拟组件 props
const props = {
  size: 'md' as const,
  bordered: false,
  striped: true,
  hoverable: true,
  // Layer 3: 实例级 ui 覆盖
  ui: {
    th: 'text-primary', // 覆盖 th 的文本颜色
    root: 'shadow-md', // 给 root 加阴影
  },
  class: 'my-8 rounded-lg overflow-hidden', // class prop 作用于 root
}

const { slots } = useTheme('table', tableTheme, props)

const columns = ['Name', 'Email', 'Role']
const data = [
  { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'User' },
  { name: 'Carol', email: 'carol@example.com', role: 'User' },
]
</script>

<template>
  <div class="p-8 bg-surface min-h-screen">
    <h1 class="text-2xl font-bold text-on-surface mb-4">Theme System Verification</h1>

    <div :class="slots.value.root()">
      <div :class="slots.value.wrapper()">
        <table :class="slots.value.table()">
          <thead :class="slots.value.thead()">
            <tr :class="slots.value.tr()">
              <th v-for="col in columns" :key="col" :class="slots.value.th()">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody :class="slots.value.tbody()">
            <tr v-for="row in data" :key="row.email" :class="slots.value.tr()">
              <td :class="slots.value.td()">{{ row.name }}</td>
              <td :class="slots.value.td()">{{ row.email }}</td>
              <td :class="slots.value.td()">{{ row.role }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 调试：展示各 slot 的最终 class -->
    <details class="mt-8">
      <summary class="cursor-pointer text-muted">Show slot classes</summary>
      <pre class="mt-2 p-4 bg-elevated rounded text-xs overflow-auto">{{
        JSON.stringify(
          Object.fromEntries(Object.entries(slots.value).map(([k, fn]) => [k, fn()])),
          null,
          2,
        )
      }}</pre>
    </details>
  </div>
</template>
```

### 12.3 运行 playground

```bash
pnpm dev
```

### 12.4 三层覆盖验证清单

用浏览器打开 playground，对照以下清单逐项检查：

| #   | 验证项                         | 如何检查                                                                               | 预期结果                                                                                |
| --- | ------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **默认主题生效**               | 表格渲染正常，有边框分隔线、hover 变色                                                 | `tr` 有 `border-b border-default`，hover 时背景变化                                     |
| 2   | **slots 合并**                 | 展开 "Show slot classes"，检查 `th` 的 class                                           | 同时包含默认的 `px-4 py-3 text-left font-medium` 和全局的 `uppercase tracking-wider`    |
| 3   | **ui prop 覆盖**               | 检查 `th` 是否有 `text-primary`                                                        | `text-muted` 被 `text-primary` 通过 cn() 替换                                           |
| 4   | **class prop 仅作用于 root**   | 检查 `root` 的 class                                                                   | 包含 `my-8 rounded-lg overflow-hidden`（来自 class prop）和 `shadow-md`（来自 ui.root） |
| 5   | **class prop 不影响其他 slot** | 检查 `th`、`td` 等 slot                                                                | 不包含 `my-8` 等 class prop 的值                                                        |
| 6   | **variants 生效**              | `striped: true` → 偶数行有背景色                                                       | 交替行可见背景色                                                                        |
| 7   | **compoundSlots 生效**         | `size: 'md'` → th 和 td 都是 `px-4 py-3 text-sm`                                       | padding 和字号一致                                                                      |
| 8   | **cn() 冲突合并**              | 默认 th `text-left`，全局无覆盖 → 保留；默认 `text-muted`，ui 传 `text-primary` → 替换 | 无冲突 class 保留，冲突 class 被后者替换                                                |
| 9   | **暗色模式**                   | 在 `<html>` 上添加 `class="dark"`（DevTools 手动加）                                   | 整个页面切换为暗色，无需改动任何组件代码                                                |
| 10  | **无全局配置时降级**           | 注释掉 `app.use(vtg)`，刷新页面                                                        | 只有默认主题生效，不报错                                                                |

---

## 最终文件清单

完成阶段二后，新增/修改的文件：

```
vtable-guild/
├── assets/
│   └── css/
│       └── main.css                                [新增] CSS 变量 + 语义化 token
│
├── packages/
│   ├── core/
│   │   ├── package.json                            [修改] 添加 tailwind-merge 依赖
│   │   ├── vite.config.ts                          [修改] external 添加 tailwind-merge
│   │   └── src/
│   │       ├── index.ts                            [修改] 更新统一导出
│   │       ├── utils/
│   │       │   ├── types.ts                        [新增] 公共类型定义
│   │       │   ├── tv.ts                           [新增] tv() 封装
│   │       │   └── props.ts                        [新增] prop 辅助函数
│   │       ├── composables/
│   │       │   └── useTheme.ts                     [新增] 三层主题合并
│   │       └── plugin/
│   │           └── index.ts                        [新增] Vue 插件
│   │
│   └── theme/
│       ├── package.json                            [修改] 删除 peerDep，添加 devDep
│       ├── tsconfig.json                           [修改] 保留 references（类型引用）
│       └── src/
│           ├── index.ts                            [修改] 统一导出主题
│           ├── table.ts                            [新增] Table 默认主题
│           └── pagination.ts                       [新增] Pagination 默认主题
│
├── src/
│   ├── main.ts                                     [修改] playground 入口
│   └── App.vue                                     [修改] 验证页面
```

共 **新增 7 个文件**，**修改 7 个文件**。

---

## 常见问题

### Q: 为什么 `tailwind-merge` 要单独安装？

`tailwind-merge` 是 tailwind-variants 的 **optional peer dependency**（v2 起）。标准构建（`import { tv, cn } from 'tailwind-variants'`）的 `twMerge` 功能和 `cn()` 函数底层都调用 `tailwind-merge`，但 tailwind-variants 并不自带它——需要使用者自行安装。只有 lite 构建（`import from 'tailwind-variants/lite'`）完全不依赖 tailwind-merge。

### Q: `tv`、`createTV`、`cn`、`cnMerge` 分别什么时候用？

| API        | 用途                                                         | 本项目中的使用                             |
| ---------- | ------------------------------------------------------------ | ------------------------------------------ |
| `tv`       | 创建带 slots/variants 的组件样式                             | 不直接使用，通过 `createTV` 创建的实例代替 |
| `createTV` | 创建预配置的 `tv` 实例                                       | Step 4 中使用，统一 twMergeConfig          |
| `cn`       | class 拼接 + 冲突合并（底层调用 tailwind-merge），返回字符串 | Step 9 中 useTheme 合并三层配置时使用      |
| `cnMerge`  | 同 `cn`，支持传入自定义 twMerge 配置                         | 暂未使用，备用                             |

### Q: 为什么 `useTheme` 中要手动调用 `cn()`，不是 `tv()` 内部已经有了吗？

`tv()` 内部的 tailwind-merge 只处理**同一个 `tv()` 调用内部**的 class 冲突（例如 slot 默认值与 variant 应用的冲突）。但三层配置的合并发生在 `tv()` 调用**之前**（合并后的配置才传给 `tv()`），而 `ui` prop 的覆盖发生在 `tv()` 调用**之后**。这两步都需要通过 `cn()` 手动处理。

### Q: `as const satisfies ThemeConfig` 两个关键字都要写吗？去掉一个会怎样？

- 只写 `as const`：TypeScript 保留字面量类型（好），但不检查结构是否合规——你可以少写 `slots` 字段而不报错
- 只写 `satisfies ThemeConfig`：TypeScript 检查结构（好），但类型被拓宽为 `ThemeConfig`——`SlotProps<typeof tableTheme>` 推导出的 slot 名是 `string` 而不是 `'root' | 'table' | 'th' | ...`
- 两个都写：既保留字面量类型，又确保结构合规。这是最佳实践

### Q: theme 包不依赖 core 了吗？它 import 了 core 的类型啊。

`import type` 是纯编译期行为——TypeScript 编译后这行代码会被完全删除，运行时不存在。所以 theme 的运行时产物不包含任何对 core 的引用。`devDependencies` 确保开发时 TypeScript 能找到类型定义，但不影响发布后的依赖图。

### Q: `class` prop 和 `ui.root` 有什么区别？

两者都作用于根元素，但语义不同：

- `class` — Vue 的原生 attribute，用于从外部给组件加 class（如布局用的 `my-4`、`w-1/2`）
- `ui.root` — 主题系统的 slot 覆盖，用于改变组件的视觉样式（如 `shadow-lg`、`rounded-xl`）

优先级：`ui.root` 先与默认主题合并，然后 `class` 以最高优先级通过 cn() 合并。实际效果是两者的非冲突 class 全部保留，冲突 class 由 `class` 胜出。
