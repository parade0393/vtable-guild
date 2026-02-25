# 阶段三：基础 Table 组件（Ant Design Vue 默认主题）— 保姆级操作指南

> 本文档是 [roadmap.md](./roadmap.md) 阶段三的逐步细化，每一步给出具体的文件内容和命令。
> 按顺序执行，不要跳步。
>
> 本阶段新增要求（已纳入实现）：默认主题对齐 **ant-design-vue**，同时预留 **element-plus** 主题扩展能力，使用者可通过 preset 选择主题。
> 本次只实现 antdv 主题，element-plus 先提供可扩展骨架与 fallback。

---

## 前置条件

阶段一和阶段二已完成，且以下条件满足：

- `pnpm build` 全部通过（5 个包）
- `@vtable-guild/core` 已具备 `useTheme`、`createVTableGuild`、`tv`、`cn`
- `@vtable-guild/theme` 已具备 `table.ts`（语义化 token 主题）和 `pagination.ts`
- `playground/` 可运行（`pnpm playground`），三层主题合并验证通过

---

## 本阶段目标

完成后你应该得到：

- `@vtable-guild/table` 拥有可用的基础 Table 渲染能力
- 支持 `dataSource + columns` 基础渲染
- 支持 `bodyCell` / `headerCell` slot（通过 **provide/inject** 跨层传递）
- 支持 `column.customRender`（VNode 通过函数式组件包裹正确渲染）
- 支持列配置：`width`、`align`、`ellipsis`、`className`
- 支持 `loading` / 空数据状态
- 默认视觉风格与 ant-design-vue 基础 Table 对齐（视觉优先）
- 主题系统新增 `themePreset`，可选 `'antdv' | 'element-plus'`
- CSS token 支持亮色 / 暗色模式（`.dark` 覆盖）
- 当前 `'element-plus'` preset 为保留态（fallback 到 antdv 并给出警告）

---

## 非目标（本阶段不做）

- 排序、筛选、分页、行选择
- 固定列、展开行、树形数据、虚拟滚动
- element-plus 具体主题 token 与视觉实现
- `useTheme` 的 `defaultTheme` 响应式改造（见 FAQ Q10）

---

## Part 1：验收基线与主题预设架构（Step 1 – 3）

### Step 1：先锁定"对齐标准"和参考基线

#### 1.1 为什么先做这一步

"和 ant-design-vue 一模一样"如果没有验收口径，会变成主观讨论。先定义"本阶段什么叫一致"，后面就不会反复返工。

#### 1.2 参考源（只用官方一手）

- ant-design-vue 仓库：<https://github.com/vueComponent/ant-design-vue>
- Table 样式 token 参考：`components/table/style/index.ts`
- Table API 参考：`components/table/index.en-US.md`

#### 1.3 本阶段一致性验收口径（视觉优先）

按优先级验收：

1. **默认状态视觉一致**：表头背景、文字颜色、边框色、单元格间距、字号、hover 背景
2. **空态/加载态视觉一致**：空数据区域和 loading 遮罩层结构合理
3. **API 子集一致**：`dataSource`、`columns`、`customRender`、`bodyCell/headerCell`

#### 1.4 关键 token 映射表（阶段三用到的子集）

| Ant token             | 参考值（默认算法）                  | vtable CSS 变量                      |
| --------------------- | ----------------------------------- | ------------------------------------ |
| `headerBg`            | `#fafafa`                           | `--vtg-table-header-bg`              |
| `headerColor`         | `rgba(0,0,0,0.88)`                  | `--vtg-table-header-color`           |
| `colorText`           | `rgba(0,0,0,0.88)`                  | `--vtg-table-text-color`             |
| `colorBgContainer`    | `#ffffff`                           | `--vtg-table-bg`                     |
| `borderColor`         | `#f0f0f0`（`colorBorderSecondary`） | `--vtg-table-border-color`           |
| `rowHoverBg`          | `#fafafa`                           | `--vtg-table-row-hover-bg`           |
| `cellFontSize`        | `14px`                              | `--vtg-table-font-size`              |
| `lineHeight`          | `1.5715`                            | `--vtg-table-line-height`            |
| `cellPaddingInline`   | `16px`                              | `--vtg-table-cell-padding-inline-lg` |
| `cellPaddingBlock`    | `16px`                              | `--vtg-table-cell-padding-block-lg`  |
| `cellPaddingInlineMD` | `8px`                               | `--vtg-table-cell-padding-inline-md` |
| `cellPaddingBlockMD`  | `12px`                              | `--vtg-table-cell-padding-block-md`  |
| `cellPaddingInlineSM` | `8px`                               | `--vtg-table-cell-padding-inline-sm` |
| `cellPaddingBlockSM`  | `8px`                               | `--vtg-table-cell-padding-block-sm`  |

#### 1.5 验证

无代码改动。本步确认验收基线后继续。

---

### Step 2：Core 类型扩展 — `ThemePresetName` 类型、插件 context 注入 `themePreset`

#### 2.1 为什么先做这一步

如果先写死 Table 默认主题，后面再引入 preset 选择会改动 plugin、context、组件入口，代价更高。先把"选择主题"的通道打通，再落具体 antdv 样式。

#### 2.2 修改 `packages/core/src/utils/types.ts`

补充 preset 类型，并把它加入插件上下文：

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

// ---------- 主题预设 ----------

/**
 * 可选的主题预设名称。
 *
 * - 'antdv'：默认预设，视觉对齐 ant-design-vue
 * - 'element-plus'：预留扩展，阶段三未实现时 fallback 到 antdv
 */
export type ThemePresetName = 'antdv' | 'element-plus'

// ---------- 插件配置相关 ----------

/**
 * createVTableGuild() 的配置参数。
 */
export interface VTableGuildOptions {
  /** 全局主题预设，默认 'antdv' */
  themePreset?: ThemePresetName
  /** 全局主题覆盖，key 为组件名（如 'table'、'pagination'） */
  theme?: Record<string, Partial<ThemeConfig>>
}

/**
 * 通过 provide/inject 传递的全局配置。
 */
export interface VTableGuildContext {
  themePreset: ThemePresetName
  theme: Record<string, Partial<ThemeConfig>>
}
````

**关键变更**：

- 新增 `ThemePresetName` 联合类型
- `VTableGuildOptions` 增加 `themePreset` 可选字段
- `VTableGuildContext` 增加 `themePreset` 必填字段（默认 `'antdv'`）

#### 2.3 修改 `packages/core/src/plugin/index.ts`

将 preset 注入全局上下文：

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
 * const vtg = createVTableGuild({
 *   themePreset: 'antdv',
 *   theme: {
 *     table: {
 *       slots: { th: 'bg-blue-50 font-bold' },
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
        themePreset: options.themePreset ?? 'antdv',
        theme: options.theme ?? {},
      }

      app.provide(VTABLE_GUILD_INJECTION_KEY, context)
    },
  }
}
````

**关键变更**：`themePreset` 注入 context，默认值为 `'antdv'`。

#### 2.4 修改 `packages/core/src/index.ts`

导出 `ThemePresetName` 类型：

```typescript
// packages/core/src/index.ts

// ---------- Utils ----------
export { tv, cn } from './utils/tv'
export { optionalProp, requiredProp, optionalBoolProp, optionalStringProp } from './utils/props'

// ---------- Types ----------
export type {
  ThemeConfig,
  SlotProps,
  VTableGuildOptions,
  VTableGuildContext,
  ThemePresetName,
} from './utils/types'

// ---------- Composables ----------
export { useTheme } from './composables/useTheme'

// ---------- Plugin ----------
export { createVTableGuild, VTABLE_GUILD_INJECTION_KEY } from './plugin/index'
```

#### 2.5 验证

```bash
pnpm build
```

预期：5 个包全部通过（此时只改了 core，theme/table 无影响）。

---

### Step 3：Theme 预设架构 — 创建 `presets/` 目录，antdv + element-plus 占位

#### 3.1 为什么现在创建目录

先把预设的文件骨架建好，后面 Step 4–7 逐步填充具体主题。如果等主题写完再建目录，import 路径需要事后调整。

#### 3.2 创建目录结构

```bash
mkdir -p packages/theme/src/presets/antdv
mkdir -p packages/theme/src/presets/element-plus
```

#### 3.3 创建 `packages/theme/src/presets/types.ts`

```typescript
// packages/theme/src/presets/types.ts

import type { ThemeConfig, ThemePresetName } from '@vtable-guild/core'

/**
 * 主题预设接口。
 *
 * 每个 preset 导出一个 ThemePreset 对象，包含各组件的主题配置。
 * 当前仅 table，后续阶段增加 pagination 等。
 */
export interface ThemePreset {
  table: ThemeConfig
}

export type { ThemePresetName }
```

#### 3.4 创建 `packages/theme/src/presets/element-plus/table.ts`（占位）

> 注意：这里只做"可选通道 + fallback"，不实现 element-plus 的具体样式。

```typescript
// packages/theme/src/presets/element-plus/table.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Table 主题占位。
 *
 * 阶段三未实现，运行时 resolveThemePreset() 会 fallback 到 antdv。
 * 后续阶段在此文件中补全 element-plus 的 token 和 slot 样式。
 */
export const elementPlusTableThemePlaceholder = {
  slots: {},
} as const satisfies ThemeConfig

/** 标记 element-plus 主题是否已实现 */
export const ELEMENT_PLUS_THEME_IMPLEMENTED = false
```

#### 3.5 验证

```bash
pnpm build
```

预期：构建通过。`presets/` 目录下有 `types.ts` 和 `element-plus/table.ts` 两个文件。antdv 预设在 Step 5 创建。

---

## Part 2：antdv 主题实现（Step 4 – 7）

### Step 4：CSS Token 实现 — 新增 `--vtg-table-*` 变量 + `.dark` 覆盖

#### 4.1 为什么先写 CSS 变量

antdv 主题的 Tailwind class 会引用这些 CSS 变量（如 `bg-[var(--vtg-table-header-bg)]`）。如果变量不存在，样式不会生效，且 DevTools 中看到的是空值——难以调试。

#### 4.2 修改 `packages/theme/css/tokens.css`

在已有语义 token 基础上新增 Table 专用变量，**包含 `.dark` 暗色覆盖**：

```css
@source '../dist';

/* @vtable-guild/theme/css — tokens.css */

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
  --color-surface: oklch(100% 0 0deg); /* white */
  --color-surface-hover: oklch(97% 0 0deg); /* gray-50 */
  --color-elevated: oklch(95% 0 0deg); /* gray-100 */

  /* 文本 */
  --color-on-surface: oklch(15% 0 0deg); /* gray-900 */
  --color-muted: oklch(55% 0 0deg); /* gray-500 */

  /* 边框 */
  --color-default: oklch(87% 0 0deg); /* gray-300 */

  /* 主题色（可被用户覆盖） */
  --color-primary: oklch(55% 0.25 260deg); /* blue-600 */
  --color-primary-hover: oklch(49% 0.25 260deg); /* blue-700 */

  /* ===== Table 专用 token（antdv 默认值） ===== */
  --vtg-table-bg: #ffffff;
  --vtg-table-header-bg: #fafafa;
  --vtg-table-header-color: rgba(0, 0, 0, 0.88);
  --vtg-table-text-color: rgba(0, 0, 0, 0.88);
  --vtg-table-border-color: #f0f0f0;
  --vtg-table-row-hover-bg: #fafafa;

  --vtg-table-font-size: 14px;
  --vtg-table-line-height: 1.5715;

  /* 三档 size 对应 antdv 的 large/middle/small */
  --vtg-table-cell-padding-inline-lg: 16px;
  --vtg-table-cell-padding-block-lg: 16px;
  --vtg-table-cell-padding-inline-md: 8px;
  --vtg-table-cell-padding-block-md: 12px;
  --vtg-table-cell-padding-inline-sm: 8px;
  --vtg-table-cell-padding-block-sm: 8px;
}

.dark {
  --color-surface: oklch(17% 0 0deg); /* gray-900 */
  --color-surface-hover: oklch(21% 0 0deg); /* gray-800 */
  --color-elevated: oklch(25% 0 0deg); /* gray-700 */
  --color-on-surface: oklch(95% 0 0deg); /* gray-100 */
  --color-muted: oklch(65% 0 0deg); /* gray-400 */
  --color-default: oklch(37% 0 0deg); /* gray-600 */
  --color-primary: oklch(65% 0.25 260deg); /* blue-400 */
  --color-primary-hover: oklch(70% 0.25 260deg); /* blue-300 */

  /* ===== Table 暗色 token（antdv dark 算法参考值） ===== */
  --vtg-table-bg: #141414;
  --vtg-table-header-bg: #1d1d1d;
  --vtg-table-header-color: rgba(255, 255, 255, 0.85);
  --vtg-table-text-color: rgba(255, 255, 255, 0.85);
  --vtg-table-border-color: #303030;
  --vtg-table-row-hover-bg: #1d1d1d;
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

**关键变更**：

- 新增 12 个 `--vtg-table-*` 变量（亮色）
- 新增 6 个 `.dark` 暗色覆盖（字号、行高、padding 亮暗一致，无需覆盖）
- 暗色值参考 ant-design-vue 的 dark 算法输出

#### 4.3 验证

打开 playground，在 DevTools 中检查 `:root` 下是否出现所有 `--vtg-table-*` 变量。添加 `class="dark"` 到 `<html>` 后变量值应切换。

---

### Step 5：antdv Table 主题定义 — `presets/antdv/table.ts`

#### 5.1 为什么这一段最关键

阶段三的视觉核心在这里。需要精确映射 antdv 的 token 到 Tailwind 的任意值语法。

> **⚠️ Tailwind CSS 4 歧义陷阱**
>
> `text-[var(--vtg-table-text-color)]` 在 Tailwind CSS 4 中有歧义——`text-` 前缀既可解析为 `font-size`（`text-sm`）也可解析为 `color`（`text-red-500`）。当值是 CSS 变量时 Tailwind 无法推断意图。
>
> **正确做法**：使用类型消歧语法
>
> - 颜色：`text-[color:var(--vtg-table-text-color)]`
> - 字号：`text-[length:var(--vtg-table-font-size)]`

#### 5.2 创建 `packages/theme/src/presets/antdv/table.ts`

```typescript
// packages/theme/src/presets/antdv/table.ts

import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Table 主题。
 *
 * 使用 --vtg-table-* CSS 变量实现视觉对齐。
 * 亮色/暗色通过 tokens.css 中的 :root / .dark 切换。
 *
 * ⚠️ 注意 Tailwind CSS 4 消歧语法：
 * - text-[color:var(...)] 用于文字颜色
 * - text-[length:var(...)] 用于字号
 * - 不要使用 text-[var(...)]，Tailwind 无法推断意图
 */
export const antdvTableTheme = {
  slots: {
    root: 'relative w-full',
    wrapper: 'w-full overflow-auto',
    table: [
      'w-full border-separate border-spacing-0',
      'bg-[var(--vtg-table-bg)]',
      'text-[length:var(--vtg-table-font-size)]',
      'leading-[var(--vtg-table-line-height)]',
      'text-[color:var(--vtg-table-text-color)]',
    ].join(' '),
    thead: '',
    tbody: '',
    tr: 'group/row transition-colors',
    th: [
      'relative text-left font-medium',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[color:var(--vtg-table-header-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    td: [
      'align-middle',
      'bg-[var(--vtg-table-bg)]',
      'text-[color:var(--vtg-table-text-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    empty: 'py-16 text-center text-[color:rgba(0,0,0,0.25)]',
    loading: [
      'absolute inset-0 z-[2]',
      'flex items-center justify-center',
      'bg-[rgba(255,255,255,0.65)] backdrop-blur-[1px]',
    ].join(' '),
    headerCellInner: 'inline-flex items-center gap-1',
    bodyCellEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',
  },
  variants: {
    size: {
      lg: {},
      md: {},
      sm: {},
    },
    bordered: {
      true: {
        table: 'border border-[var(--vtg-table-border-color)]',
        th: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
        td: 'border-r border-[var(--vtg-table-border-color)] last:border-r-0',
      },
    },
    striped: {
      true: {
        td: 'odd:group-even/row:bg-[rgba(0,0,0,0.02)]',
      },
    },
    hoverable: {
      true: {
        td: 'group-hover/row:bg-[var(--vtg-table-row-hover-bg)]',
      },
    },
  },
  compoundSlots: [
    {
      slots: ['th', 'td'],
      size: 'lg',
      class:
        'px-[var(--vtg-table-cell-padding-inline-lg)] py-[var(--vtg-table-cell-padding-block-lg)]',
    },
    {
      slots: ['th', 'td'],
      size: 'md',
      class:
        'px-[var(--vtg-table-cell-padding-inline-md)] py-[var(--vtg-table-cell-padding-block-md)]',
    },
    {
      slots: ['th', 'td'],
      size: 'sm',
      class:
        'px-[var(--vtg-table-cell-padding-inline-sm)] py-[var(--vtg-table-cell-padding-block-sm)]',
    },
  ],
  defaultVariants: {
    size: 'lg',
    bordered: false,
    striped: false,
    hoverable: true,
  },
} as const satisfies ThemeConfig

// ---------- 类型导出 ----------

export type AntdvTableSlots = keyof typeof antdvTableTheme.slots

export type AntdvTableVariantProps = {
  size?: 'lg' | 'md' | 'sm'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}
```

**关键设计决策**：

| 决策                                                      | 原因                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `border-separate border-spacing-0` 替代 `border-collapse` | 与 antdv 一致，且后续支持 `border-radius` 更灵活                        |
| `text-[color:var(...)]` 消歧                              | Tailwind CSS 4 的 `text-` 前缀同时用于 `font-size` 和 `color`，必须消歧 |
| `text-[length:var(...)]` 消歧                             | 同上，`font-size` 需要 `length` 类型标注                                |
| `group/row` + `group-hover/row`                           | 命名组避免嵌套 table 时 hover 冒泡                                      |
| 默认 `size: 'lg'`                                         | 对应 antdv 默认 spacing（16px），`md`/`sm` 分别映射 middle/small        |

#### 5.3 验证

此时文件仅创建，尚未集成到导出。接 Step 6 创建解析器。

---

### Step 6：预设解析器 — `presets/index.ts`

#### 6.1 为什么需要解析器

组件不直接 import 特定 preset 的主题文件——通过 `resolveThemePreset(name)` 间接获取。这样切换 preset 只需改一个字符串，不改 import 路径。

#### 6.2 创建 `packages/theme/src/presets/index.ts`

```typescript
// packages/theme/src/presets/index.ts

import type { ThemePreset } from './types'
import type { ThemePresetName } from '@vtable-guild/core'
import { antdvTableTheme } from './antdv/table'
import {
  ELEMENT_PLUS_THEME_IMPLEMENTED,
  elementPlusTableThemePlaceholder,
} from './element-plus/table'

/**
 * 预设注册表。
 *
 * 阶段三 element-plus 未实现时 fallback 到 antdv，
 * 避免选择 element-plus preset 后组件裸奔。
 */
const presetMap: Record<ThemePresetName, ThemePreset> = {
  antdv: {
    table: antdvTableTheme,
  },
  'element-plus': {
    table: ELEMENT_PLUS_THEME_IMPLEMENTED ? elementPlusTableThemePlaceholder : antdvTableTheme,
  },
}

/**
 * 解析主题预设。
 *
 * @param name - 预设名称，默认 'antdv'
 * @returns 完整的 ThemePreset 对象
 */
export function resolveThemePreset(name: ThemePresetName = 'antdv'): ThemePreset {
  if (name === 'element-plus' && !ELEMENT_PLUS_THEME_IMPLEMENTED) {
    console.warn(
      '[vtable-guild] element-plus theme preset is not yet implemented, falling back to antdv.',
    )
  }

  return presetMap[name] ?? presetMap.antdv
}

/**
 * 解析特定组件的主题预设。
 *
 * @param name - 预设名称
 * @returns Table 的 ThemeConfig
 */
export function resolveTableThemePreset(name: ThemePresetName = 'antdv') {
  return resolveThemePreset(name).table
}

export type { ThemePresetName } from './types'
```

#### 6.3 验证

文件创建完毕，接 Step 7 更新导出后再统一构建。

---

### Step 7：Theme 包导出更新 + 验证检查点 #1

#### 7.1 为什么需要更新导出

预设文件已就绪，但 theme 包的 `index.ts` 和 `table.ts` 还是阶段二的旧代码。需要把 antdv 主题接入为默认导出，并暴露 resolver 函数。

#### 7.2 修改 `packages/theme/src/table.ts`

把默认导出切到 antdv 主题：

```typescript
// packages/theme/src/table.ts

/**
 * Table 默认主题 — 重导出 antdv 预设。
 *
 * 保持向后兼容：`import { tableTheme } from '@vtable-guild/theme'`
 * 始终返回当前默认 preset（antdv）的 table 主题。
 */
export { antdvTableTheme as tableTheme } from './presets/antdv/table'
export type {
  AntdvTableSlots as TableSlots,
  AntdvTableVariantProps as TableVariantProps,
} from './presets/antdv/table'
```

#### 7.3 修改 `packages/theme/src/index.ts`

新增 preset 导出：

```typescript
// packages/theme/src/index.ts

// ---------- 主题定义 ----------
export { tableTheme } from './table'
export { paginationTheme } from './pagination'

// ---------- 预设解析 ----------
export { resolveThemePreset, resolveTableThemePreset } from './presets'
export type { ThemePresetName } from './presets'

// ---------- 类型导出 ----------
export type { TableSlots, TableVariantProps } from './table'
export type { PaginationSlots, PaginationVariantProps } from './pagination'
```

#### 7.4 验证检查点 #1

```bash
pnpm build
```

预期结果：

- `Tasks: 5 successful, 5 total`
- `packages/theme/dist/index.mjs` 包含 `resolveThemePreset`、`resolveTableThemePreset`
- `packages/theme/dist/index.d.ts` 包含 `ThemePresetName` 类型

如果构建失败，常见原因：

| 错误                                      | 修复                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `Cannot find module './presets'`          | 检查 `presets/index.ts` 是否存在                           |
| `Cannot find module '@vtable-guild/core'` | 确认 theme 的 `devDependencies` 有 `@vtable-guild/core`    |
| 类型不匹配                                | 确认 `antdvTableTheme` 的 `as const satisfies ThemeConfig` |

---

## Part 3：Table 组件类型定义（Step 8 – 9）

### Step 8：Column 类型 — `types/column.ts`

#### 8.1 为什么先写类型

阶段三组件多（8 个 .vue 文件），先把 `columns` / `customRender` / slot 上下文的类型固定住，后面每个组件都可以直接复用，不会反复改签名。

#### 8.2 创建目录

```bash
mkdir -p packages/table/src/types
```

#### 8.3 创建 `packages/table/src/types/column.ts`

```typescript
// packages/table/src/types/column.ts

import type { VNodeChild } from 'vue'

/** 行唯一标识 */
export type Key = string | number

/** 对齐方式 */
export type AlignType = 'left' | 'center' | 'right'

/**
 * 数据索引路径。
 *
 * - `'name'` — 直接取 record.name
 * - `['address', 'city']` — 取 record.address.city
 */
export type DataIndex = string | number | Array<string | number>

/**
 * customRender 回调参数。
 */
export interface CustomRenderContext<TRecord extends Record<string, unknown>> {
  /** 当前单元格的值（通过 dataIndex 取出） */
  text: unknown
  /** 当前行数据 */
  record: TRecord
  /** 行索引 */
  index: number
  /** 列配置 */
  column: ColumnType<TRecord>
}

/**
 * 叶子列配置。
 */
export interface ColumnType<TRecord extends Record<string, unknown>> {
  key?: Key
  title?: string
  dataIndex?: DataIndex
  width?: number | string
  align?: AlignType
  ellipsis?: boolean
  className?: string
  customRender?: (ctx: CustomRenderContext<TRecord>) => VNodeChild
}

/**
 * 列组配置（含 children）。
 */
export interface ColumnGroupType<TRecord extends Record<string, unknown>> extends Omit<
  ColumnType<TRecord>,
  'dataIndex' | 'customRender'
> {
  children: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>
}

/**
 * columns prop 的类型。
 */
export type ColumnsType<TRecord extends Record<string, unknown>> = Array<
  ColumnType<TRecord> | ColumnGroupType<TRecord>
>
```

#### 8.4 验证

文件创建完毕，类型仅在编译时使用。构建验证留到 Step 9 一起。

---

### Step 9：Table 类型 — `types/table.ts`

#### 9.1 创建 `packages/table/src/types/table.ts`

```typescript
// packages/table/src/types/table.ts

import type { ThemePresetName, SlotProps } from '@vtable-guild/core'
import type { VNodeChild } from 'vue'
import type { ColumnsType, ColumnType, Key } from './column'
import type { TableSlots } from '@vtable-guild/theme'

/**
 * bodyCell slot 的参数类型。
 */
export interface TableBodyCellSlotProps<TRecord extends Record<string, unknown>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

/**
 * headerCell slot 的参数类型。
 */
export interface TableHeaderCellSlotProps<TRecord extends Record<string, unknown>> {
  title: string | undefined
  column: ColumnType<TRecord>
  index: number
}

/**
 * Table 组件 slots 声明。
 */
export interface TableSlotsDecl<TRecord extends Record<string, unknown>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
}

/**
 * Table 组件 Props。
 */
export interface TableProps<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  /** 数据源 */
  dataSource: TRecord[]
  /** 列配置 */
  columns: ColumnsType<TRecord>
  /** 行唯一标识 */
  rowKey?: string | ((record: TRecord) => Key)
  /** 加载状态 */
  loading?: boolean
  /** 尺寸：lg(默认) / md / sm */
  size?: 'sm' | 'md' | 'lg'
  /** 显示边框 */
  bordered?: boolean
  /** 斑马纹 */
  striped?: boolean
  /** 行 hover 高亮 */
  hoverable?: boolean
  /** slot 级别样式覆盖 */
  ui?: SlotProps<{ slots: Record<TableSlots, string> }>
  /** 根元素自定义 class */
  class?: string
  /**
   * 实例级 preset override。
   * 未传时使用 createVTableGuild 的全局 preset；再未配置则使用 'antdv'。
   */
  themePreset?: ThemePresetName
}
```

#### 9.2 创建 `packages/table/src/types/index.ts`

```typescript
// packages/table/src/types/index.ts

export type {
  Key,
  AlignType,
  DataIndex,
  CustomRenderContext,
  ColumnType,
  ColumnGroupType,
  ColumnsType,
} from './column'

export type {
  TableProps,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableSlotsDecl,
} from './table'
```

#### 9.3 验证

```bash
pnpm build
```

预期：table 包构建通过（此时 `index.ts` 仍为空导出，类型文件不影响构建产物）。

---

## Part 4：组件基础设施（Step 10 – 11）

### Step 10：useColumns composable — 列解析与取值

#### 10.1 为什么需要这个 composable

`columns` prop 可能包含 `ColumnGroupType`（嵌套 children），但渲染只用叶子列。`useColumns` 提供 `flattenColumns` 把嵌套列拍平，`getByDataIndex` 支持 `['address', 'city']` 这样的嵌套路径取值。

#### 10.2 创建目录

```bash
mkdir -p packages/table/src/composables
```

#### 10.3 创建 `packages/table/src/composables/useColumns.ts`

````typescript
// packages/table/src/composables/useColumns.ts

import { computed } from 'vue'
import type { ColumnGroupType, ColumnType, ColumnsType, DataIndex } from '../types'

/**
 * 类型守卫：判断是否为列组。
 */
function isColumnGroup<TRecord extends Record<string, unknown>>(
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>,
): column is ColumnGroupType<TRecord> {
  return Array.isArray((column as ColumnGroupType<TRecord>).children)
}

/**
 * 递归拍平列组，返回所有叶子列。
 */
function flattenColumns<TRecord extends Record<string, unknown>>(
  columns: ColumnsType<TRecord>,
): ColumnType<TRecord>[] {
  const result: ColumnType<TRecord>[] = []

  for (const column of columns) {
    if (isColumnGroup(column)) {
      result.push(...flattenColumns(column.children))
      continue
    }

    result.push(column)
  }

  return result
}

/**
 * 根据 dataIndex 路径从 record 中取值。
 *
 * @example
 * ```ts
 * getByDataIndex({ address: { city: 'NYC' } }, ['address', 'city'])
 * // => 'NYC'
 *
 * getByDataIndex({ name: 'Alice' }, 'name')
 * // => 'Alice'
 * ```
 */
export function getByDataIndex(record: Record<string, unknown>, dataIndex?: DataIndex): unknown {
  if (dataIndex === undefined || dataIndex === null || dataIndex === '') return undefined

  const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex]

  let current: unknown = record
  for (const segment of path) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[String(segment)]
  }

  return current
}

/**
 * 列解析 composable。
 *
 * @param columns - 响应式列配置 getter
 * @returns { leafColumns } — 拍平后的叶子列
 */
export function useColumns<TRecord extends Record<string, unknown>>(
  columns: () => ColumnsType<TRecord>,
) {
  const leafColumns = computed(() => flattenColumns(columns()))

  return {
    leafColumns,
  }
}
````

#### 10.4 创建 `packages/table/src/composables/index.ts`

```typescript
// packages/table/src/composables/index.ts

export { useColumns, getByDataIndex } from './useColumns'
```

#### 10.5 验证

文件创建完毕。接 Step 11 创建 Table Context。

---

### Step 11：Table Context — 用 provide/inject 传递 bodyCell/headerCell slots

#### 11.1 为什么不能用 `useSlots()` 传递

> **⚠️ 这是草稿文档的核心缺陷**

Vue 的 scoped slots（`useSlots()` 返回值）**不跨组件层级自动传播**。用户在 `<VTable>` 上定义的 `bodyCell` slot 只能在 `Table.vue` 内部通过 `useSlots()` 获取，而 `TableCell.vue` 是 `Table > TableBody > TableRow > TableCell` 的孙组件，直接 `useSlots()` 拿到的是 `TableRow` 传给 `TableCell` 的 slots（空的）。

**解决方案**：在 `Table.vue` 中用 `provide()` 把 slots 注入到 context，所有后代组件通过 `inject()` 获取。

```
用户定义 slots         Table.vue                    孙组件
┌──────────────┐      ┌────────────────┐            ┌──────────────┐
│ <VTable>     │      │ useSlots()     │  provide   │ inject()     │
│   #bodyCell  │ ───► │ ─► slots.body  │ ─────────► │ ─► bodyCell  │
│   #headerCell│      │ ─► slots.head  │            │ ─► headerCell│
│ </VTable>    │      └────────────────┘            └──────────────┘
```

#### 11.2 创建 `packages/table/src/context.ts`

```typescript
// packages/table/src/context.ts

import type { InjectionKey, Slots } from 'vue'

/**
 * Table 内部 context，通过 provide/inject 跨层传递。
 *
 * Table.vue 在 setup 阶段 provide 此 context，
 * 所有后代组件（TableCell、TableHeaderCell 等）通过 inject 获取。
 */
export interface TableContext {
  /**
   * 用户定义的 bodyCell slot 函数。
   * 来自 Table.vue 的 useSlots().bodyCell。
   */
  bodyCell?: Slots['bodyCell']
  /**
   * 用户定义的 headerCell slot 函数。
   * 来自 Table.vue 的 useSlots().headerCell。
   */
  headerCell?: Slots['headerCell']
  /**
   * 用户定义的 empty slot 函数。
   */
  empty?: Slots['empty']
}

/**
 * Table context 的 injection key。
 */
export const TABLE_CONTEXT_KEY: InjectionKey<TableContext> = Symbol('vtable-table-context')
```

**关键说明**：

- `Slots['bodyCell']` 的类型是 `((...args: any[]) => VNode[]) | undefined`
- 使用独立的 Symbol 避免与 `VTABLE_GUILD_INJECTION_KEY` 混淆
- `TABLE_CONTEXT_KEY` 仅在 table 包内部使用，不对外导出

#### 11.3 验证

文件创建完毕。接 Step 12 开始实现子组件。

---

## Part 5：子组件实现（Step 12 – 17）

### Step 12：TableCell.vue — inject 获取 bodyCell slot + VNode 正确渲染

#### 12.1 为什么这个组件最复杂

TableCell 有三层渲染优先级：

1. `column.customRender` → 返回 VNode
2. `bodyCell` slot → 用户自定义插槽（通过 inject 获取）
3. 纯文本 → `text` 值直接输出

前两种都可能返回 VNode，必须正确处理。

> **⚠️ VNode 渲染陷阱**
>
> `<component :is="someVNode">` 无法正确渲染 VNode 对象。`<component :is>` 期望的是组件定义（对象或函数），不是 VNode 实例。
>
> **正确做法**：将 VNode 包裹为函数式组件 `<component :is="() => someVNode" />`。
> 这利用了 Vue 的函数式组件特性——返回 VNode 的函数被视为 render 函数。

#### 12.2 创建目录

```bash
mkdir -p packages/table/src/components
```

#### 12.3 创建 `packages/table/src/components/TableCell.vue`

```vue
<!-- packages/table/src/components/TableCell.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue'
import { getByDataIndex } from '../composables/useColumns'
import { TABLE_CONTEXT_KEY } from '../context'
import type { ColumnType } from '../types'

const props = defineProps<{
  record: Record<string, unknown>
  rowIndex: number
  column: ColumnType<Record<string, unknown>>
  tdClass: string
  bodyCellEllipsisClass: string
}>()

// ---- 通过 inject 获取 Table.vue provide 的 bodyCell slot ----
// ⚠️ 不使用 useSlots()！scoped slots 不跨层级传播。
const tableContext = inject(TABLE_CONTEXT_KEY, {})

const text = computed(() => getByDataIndex(props.record, props.column.dataIndex))

/**
 * 计算最终渲染内容。
 *
 * 优先级：customRender > bodyCell slot > 纯文本
 *
 * 返回值类型：
 * - VNode/VNode[] → 需要用 <component :is="() => content" /> 渲染
 * - string/number → 直接插值 {{ content }}
 */
const cellContent = computed(() => {
  // 优先级 1：column.customRender
  if (props.column.customRender) {
    return props.column.customRender({
      text: text.value,
      record: props.record,
      index: props.rowIndex,
      column: props.column,
    })
  }

  // 优先级 2：bodyCell slot（通过 inject 获取）
  if (tableContext.bodyCell) {
    return tableContext.bodyCell({
      text: text.value,
      record: props.record,
      index: props.rowIndex,
      column: props.column,
    })
  }

  // 优先级 3：纯文本
  return text.value ?? ''
})

/** 是否为 VNode 类型（需要用 component :is 渲染） */
const isVNode = computed(() => {
  const content = cellContent.value
  return content !== null && content !== undefined && typeof content === 'object'
})

const cellClass = computed(() => {
  const alignClass =
    props.column.align === 'center'
      ? 'text-center'
      : props.column.align === 'right'
        ? 'text-right'
        : 'text-left'
  return [props.tdClass, alignClass, props.column.className].filter(Boolean).join(' ')
})

const widthStyle = computed(() => {
  if (!props.column.width) return undefined
  return {
    width: typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
  }
})
</script>

<template>
  <td :class="cellClass" :style="widthStyle">
    <div v-if="column.ellipsis" :class="bodyCellEllipsisClass">
      <!--
        ⚠️ VNode 渲染：() => cellContent 创建函数式组件。
        不能直接 <component :is="cellContent" />，Vue 不接受裸 VNode。
      -->
      <component v-if="isVNode" :is="() => cellContent" />
      <template v-else>{{ cellContent }}</template>
    </div>
    <template v-else>
      <component v-if="isVNode" :is="() => cellContent" />
      <template v-else>{{ cellContent }}</template>
    </template>
  </td>
</template>
```

**关键修正**：

| 草稿写法                          | 修正写法                                | 原因                                |
| --------------------------------- | --------------------------------------- | ----------------------------------- |
| `useSlots()`                      | `inject(TABLE_CONTEXT_KEY)`             | scoped slots 不跨层级传播           |
| `<component :is="customContent">` | `<component :is="() => cellContent" />` | `:is` 期望组件定义/函数，不是 VNode |

#### 12.4 验证

文件创建完毕。接 Step 13 实现 TableHeaderCell。

---

### Step 13：TableHeaderCell.vue — inject 获取 headerCell slot

#### 13.1 创建 `packages/table/src/components/TableHeaderCell.vue`

```vue
<!-- packages/table/src/components/TableHeaderCell.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'
import type { ColumnType } from '../types'

const props = defineProps<{
  column: ColumnType<Record<string, unknown>>
  index: number
  thClass: string
  headerCellInnerClass: string
}>()

// ---- 通过 inject 获取 headerCell slot ----
const tableContext = inject(TABLE_CONTEXT_KEY, {})

const headerContent = computed(() => {
  // 优先级 1：headerCell slot
  if (tableContext.headerCell) {
    return tableContext.headerCell({
      title: props.column.title,
      column: props.column,
      index: props.index,
    })
  }

  // 优先级 2：column.title 纯文本
  return props.column.title ?? ''
})

const isVNode = computed(() => {
  const content = headerContent.value
  return content !== null && content !== undefined && typeof content === 'object'
})

const cellClass = computed(() => {
  const alignClass =
    props.column.align === 'center'
      ? 'text-center'
      : props.column.align === 'right'
        ? 'text-right'
        : 'text-left'
  return [props.thClass, alignClass, props.column.className].filter(Boolean).join(' ')
})

const widthStyle = computed(() => {
  if (!props.column.width) return undefined
  return {
    width: typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
  }
})
</script>

<template>
  <th :class="cellClass" :style="widthStyle">
    <span :class="headerCellInnerClass">
      <!-- 同 TableCell，VNode 通过函数式组件渲染 -->
      <component v-if="isVNode" :is="() => headerContent" />
      <template v-else>{{ headerContent }}</template>
    </span>
  </th>
</template>
```

#### 13.2 验证

文件创建完毕。

---

### Step 14：TableRow.vue — 行容器

#### 14.1 创建 `packages/table/src/components/TableRow.vue`

```vue
<!-- packages/table/src/components/TableRow.vue -->
<script setup lang="ts">
defineProps<{
  rowClass: string
}>()
</script>

<template>
  <tr :class="rowClass">
    <slot />
  </tr>
</template>
```

**关键说明**：`<slot />` 接收 TableBody 传入的 TableCell 列表。这里不需要 inject — 行容器只是布局组件。

#### 14.2 验证

文件创建完毕。

---

### Step 15：TableEmpty.vue — 空状态

#### 15.1 创建 `packages/table/src/components/TableEmpty.vue`

```vue
<!-- packages/table/src/components/TableEmpty.vue -->
<script setup lang="ts">
import { inject } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'

defineProps<{
  colSpan: number
  emptyClass: string
  tdClass: string
}>()

const tableContext = inject(TABLE_CONTEXT_KEY, {})
</script>

<template>
  <tr>
    <td :class="[tdClass, emptyClass]" :colspan="colSpan">
      <!-- 优先使用用户自定义 empty slot -->
      <component v-if="tableContext.empty" :is="() => tableContext.empty!()" />
      <template v-else>No Data</template>
    </td>
  </tr>
</template>
```

#### 15.2 验证

文件创建完毕。

---

### Step 16：TableLoading.vue — 加载遮罩

#### 16.1 创建 `packages/table/src/components/TableLoading.vue`

```vue
<!-- packages/table/src/components/TableLoading.vue -->
<script setup lang="ts">
defineProps<{
  loadingClass: string
}>()
</script>

<template>
  <div :class="loadingClass">
    <slot>Loading...</slot>
  </div>
</template>
```

#### 16.2 验证

文件创建完毕。

---

### Step 17：TableHeader.vue + TableBody.vue — 表头/表体组装

#### 17.1 创建 `packages/table/src/components/TableHeader.vue`

```vue
<!-- packages/table/src/components/TableHeader.vue -->
<script setup lang="ts">
import TableHeaderCell from './TableHeaderCell.vue'
import type { ColumnType } from '../types'

defineProps<{
  columns: ColumnType<Record<string, unknown>>[]
  theadClass: string
  rowClass: string
  thClass: string
  headerCellInnerClass: string
}>()
</script>

<template>
  <thead :class="theadClass">
    <tr :class="rowClass">
      <TableHeaderCell
        v-for="(column, index) in columns"
        :key="column.key ?? String(column.dataIndex ?? index)"
        :column="column"
        :index="index"
        :th-class="thClass"
        :header-cell-inner-class="headerCellInnerClass"
      />
    </tr>
  </thead>
</template>
```

**关键说明**：TableHeader 不需要传递 headerCell slot 给 TableHeaderCell — 因为 TableHeaderCell 自己通过 `inject(TABLE_CONTEXT_KEY)` 获取。

#### 17.2 创建 `packages/table/src/components/TableBody.vue`

```vue
<!-- packages/table/src/components/TableBody.vue -->
<script setup lang="ts">
import TableRow from './TableRow.vue'
import TableCell from './TableCell.vue'
import TableEmpty from './TableEmpty.vue'
import type { ColumnType, Key } from '../types'

const props = defineProps<{
  dataSource: Record<string, unknown>[]
  columns: ColumnType<Record<string, unknown>>[]
  tbodyClass: string
  rowClass: string
  tdClass: string
  emptyClass: string
  bodyCellEllipsisClass: string
  rowKey?: string | ((record: Record<string, unknown>) => Key)
}>()

function getRowKey(record: Record<string, unknown>, index: number): Key {
  if (typeof props.rowKey === 'function') return props.rowKey(record)
  if (typeof props.rowKey === 'string' && props.rowKey in record) {
    return record[props.rowKey] as Key
  }
  return index
}
</script>

<template>
  <tbody :class="tbodyClass">
    <template v-if="dataSource.length > 0">
      <TableRow
        v-for="(record, rowIndex) in dataSource"
        :key="getRowKey(record, rowIndex)"
        :row-class="rowClass"
      >
        <TableCell
          v-for="(column, colIndex) in columns"
          :key="column.key ?? String(column.dataIndex ?? colIndex)"
          :record="record"
          :row-index="rowIndex"
          :column="column"
          :td-class="tdClass"
          :body-cell-ellipsis-class="bodyCellEllipsisClass"
        />
      </TableRow>
    </template>
    <TableEmpty
      v-else
      :col-span="columns.length || 1"
      :empty-class="emptyClass"
      :td-class="tdClass"
    />
  </tbody>
</template>
```

**关键说明**：TableBody 不需要传递 bodyCell slot — TableCell 自行 inject。这简化了中间层的 props 传递。

#### 17.3 验证

所有 8 个子组件文件已创建。接 Step 18 组装主组件。

---

## Part 6：主组件与集成（Step 18 – 20）

### Step 18：Table.vue — preset 解析、useTheme 调用、provide context

#### 18.1 为什么 Table.vue 是枢纽

Table.vue 承担三个核心职责：

1. **Preset 解析**：确定用哪个主题（实例 prop > 全局配置 > 默认 antdv）
2. **主题计算**：调用 `useTheme()` 获得最终 slot class
3. **Context 注入**：通过 `provide(TABLE_CONTEXT_KEY)` 把 bodyCell/headerCell slots 传递给孙组件

#### 18.2 创建 `packages/table/src/components/Table.vue`

```vue
<!-- packages/table/src/components/Table.vue -->
<script setup lang="ts">
import { computed, inject, provide, useSlots } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import { resolveTableThemePreset, tableTheme } from '@vtable-guild/theme'
import { useColumns } from '../composables'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'
import TableLoading from './TableLoading.vue'
import type { TableProps } from '../types'

const props = withDefaults(defineProps<TableProps>(), {
  dataSource: () => [],
  columns: () => [],
  loading: false,
  size: 'lg',
  bordered: false,
  striped: false,
  hoverable: true,
})

defineSlots<{
  bodyCell?: (props: {
    text: unknown
    record: Record<string, unknown>
    index: number
    column: Record<string, unknown>
  }) => unknown
  headerCell?: (props: {
    title: string | undefined
    column: Record<string, unknown>
    index: number
  }) => unknown
  empty?: () => unknown
  loading?: () => unknown
}>()

// ---- Step 1: 解析 preset（实例 > 全局 > 默认） ----
const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)
const effectivePreset = computed(() => props.themePreset ?? globalContext?.themePreset ?? 'antdv')

// ---- Step 2: 根据 preset 获取默认主题 ----
//
// ⚠️ 重要限制：useTheme() 的 defaultTheme 参数为非响应式。
// resolveTableThemePreset() 在 setup 阶段调用一次，后续不会因 effectivePreset 变化而更新。
// 阶段三按"preset 初始化后不动态切换"实现，如需动态切换见 FAQ Q10。
const defaultTheme = resolveTableThemePreset(effectivePreset.value) ?? tableTheme

// ---- Step 3: 构造 useTheme 所需的 props ----
const themeProps = computed(() => ({
  size: props.size,
  bordered: props.bordered,
  striped: props.striped,
  hoverable: props.hoverable,
  ui: props.ui,
  class: props.class,
}))

// ---- Step 4: 三层主题合并 ----
const { slots } = useTheme('table', defaultTheme, themeProps.value)

// ---- Step 5: 拍平列 ----
const { leafColumns } = useColumns(() => props.columns)

// ---- Step 6: 通过 provide 传递 slots 给孙组件 ----
// ⚠️ 核心修正：scoped slots 不跨层级传播，必须用 provide/inject。
const parentSlots = useSlots()

provide<TableContext>(TABLE_CONTEXT_KEY, {
  bodyCell: parentSlots.bodyCell,
  headerCell: parentSlots.headerCell,
  empty: parentSlots.empty,
})
</script>

<template>
  <div :class="slots.root()">
    <div :class="slots.wrapper()">
      <table :class="slots.table()">
        <TableHeader
          :columns="leafColumns"
          :thead-class="slots.thead()"
          :row-class="slots.tr()"
          :th-class="slots.th()"
          :header-cell-inner-class="slots.headerCellInner()"
        />
        <TableBody
          :data-source="props.dataSource"
          :columns="leafColumns"
          :tbody-class="slots.tbody()"
          :row-class="slots.tr()"
          :td-class="slots.td()"
          :empty-class="slots.empty()"
          :body-cell-ellipsis-class="slots.bodyCellEllipsis()"
          :row-key="props.rowKey"
        />
      </table>

      <TableLoading v-if="props.loading" :loading-class="slots.loading()">
        <slot name="loading">Loading...</slot>
      </TableLoading>
    </div>
  </div>
</template>
```

**关键设计**：

| 步骤                                                | 说明                                                   |
| --------------------------------------------------- | ------------------------------------------------------ |
| `provide(TABLE_CONTEXT_KEY, ...)`                   | 把 bodyCell/headerCell/empty slots 注入到 context      |
| `useSlots()`                                        | 在 Table.vue 中获取用户定义的 scoped slots             |
| `resolveTableThemePreset()`                         | 非响应式调用，setup 阶段执行一次                       |
| `useTheme('table', defaultTheme, themeProps.value)` | 三层合并，themeProps 是 computed 保证 variant 变化响应 |

#### 18.3 验证

文件创建完毕。接 Step 19 更新导出。

---

### Step 19：Table 包入口导出 + 验证检查点 #2

#### 19.1 修改 `packages/table/src/index.ts`

```typescript
// packages/table/src/index.ts

export { default as VTable } from './components/Table.vue'

export type {
  Key,
  AlignType,
  DataIndex,
  CustomRenderContext,
  ColumnType,
  ColumnGroupType,
  ColumnsType,
  TableProps,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableSlotsDecl,
} from './types'

export { useColumns, getByDataIndex } from './composables'
```

#### 19.2 验证检查点 #2

```bash
pnpm build
```

预期结果：

- `Tasks: 5 successful, 5 total`
- `packages/table/dist/index.mjs` 包含 `VTable` 组件
- `packages/table/dist/index.d.ts` 包含所有类型导出

如果构建失败，常见原因：

| 错误                                        | 修复                                                  |
| ------------------------------------------- | ----------------------------------------------------- |
| `Cannot find module '../context'`           | 检查 `packages/table/src/context.ts` 是否存在         |
| Vue SFC 编译错误                            | 确认 `vite.config.ts` 中有 `vue()` 和 `vueJsx()` 插件 |
| 类型错误 `Slots['bodyCell']`                | 确认 Vue 版本 ≥ 3.5.0                                 |
| `resolveTableThemePreset is not a function` | 确认 theme 包已先构建（turbo `^build` 自动处理）      |

---

### Step 20：Playground 更新 — 并排对照 antdv

#### 20.1 为什么要并排对照

"视觉一致"不能只看单边效果。最稳妥方式是同一页并排渲染：

- 左边：`<a-table>`（ant-design-vue 原版）
- 右边：`<VTable>`（本项目）

#### 20.2 安装对照依赖（只在 playground 用）

```bash
pnpm add ant-design-vue @vtable-guild/table --filter @vtable-guild/playground
```

#### 20.3 修改 `playground/tsconfig.json`

添加 table 包引用：

```jsonc
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
  "references": [
    { "path": "../packages/core" },
    { "path": "../packages/theme" },
    { "path": "../packages/table" },
  ],
}
```

#### 20.4 修改 `playground/src/main.ts`

```typescript
// playground/src/main.ts

import { createApp } from 'vue'
import App from './App.vue'
import './main.css'
import 'ant-design-vue/dist/reset.css'
import { createVTableGuild } from '@vtable-guild/core'

const app = createApp(App)

app.use(
  createVTableGuild({
    themePreset: 'antdv',
    theme: {},
  }),
)

app.mount('#app')
```

**关键变更**：

- 引入 `ant-design-vue/dist/reset.css`（antd 全局样式重置）
- `themePreset: 'antdv'` 显式声明
- 移除阶段二的全局 theme 覆盖（阶段三对照时不做覆盖）

#### 20.5 修改 `playground/src/App.vue`

```vue
<!-- playground/src/App.vue -->
<script setup lang="ts">
import { h, ref } from 'vue'
import { Table as ATable } from 'ant-design-vue'
import { VTable, type ColumnType } from '@vtable-guild/table'

const columns: ColumnType<Record<string, unknown>>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    align: 'right' as const,
    width: 120,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
  },
]

const dataSource = ref([
  {
    key: 1,
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park, Long Long Long Address That Should Be Ellipsised',
  },
  { key: 2, name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: 3, name: 'Joe Black', age: 29, address: 'Sidney No. 1 Lake Park' },
])

const emptyData = ref<Record<string, unknown>[]>([])
const loading = ref(false)

function toggleLoading() {
  loading.value = !loading.value
}
</script>

<template>
  <main class="p-8 space-y-8">
    <h1 class="text-xl font-semibold text-on-surface">Phase 3 — antdv vs VTable 并排对照</h1>

    <!-- ===== 基础对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">1. 基础渲染对照</h2>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <h3 class="text-sm text-muted">ant-design-vue</h3>
          <ATable :columns="columns" :data-source="dataSource" :pagination="false" />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm text-muted">vtable-guild</h3>
          <VTable :columns="columns" :data-source="dataSource" />
        </div>
      </div>
    </section>

    <!-- ===== 空状态对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">2. 空状态对照</h2>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <h3 class="text-sm text-muted">ant-design-vue</h3>
          <ATable :columns="columns" :data-source="emptyData" :pagination="false" />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm text-muted">vtable-guild</h3>
          <VTable :columns="columns" :data-source="emptyData" />
        </div>
      </div>
    </section>

    <!-- ===== Loading 对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">3. Loading 状态</h2>
      <button class="mb-4 px-3 py-1 border border-default rounded text-sm" @click="toggleLoading">
        Toggle Loading: {{ loading }}
      </button>
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <h3 class="text-sm text-muted">ant-design-vue</h3>
          <ATable
            :columns="columns"
            :data-source="dataSource"
            :loading="loading"
            :pagination="false"
          />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm text-muted">vtable-guild</h3>
          <VTable :columns="columns" :data-source="dataSource" :loading="loading" />
        </div>
      </div>
    </section>

    <!-- ===== bodyCell slot 验证 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">4. bodyCell Slot 验证</h2>
      <VTable :columns="columns" :data-source="dataSource">
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'name'">
            <strong class="text-blue-600">{{ text }}</strong>
          </template>
          <template v-else>{{ text }}</template>
        </template>
      </VTable>
    </section>

    <!-- ===== Size 变体对照 ===== -->
    <section>
      <h2 class="text-lg font-medium text-on-surface mb-4">5. Size 变体</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-2" v-for="size in ['lg', 'md', 'sm'] as const" :key="size">
          <h3 class="text-sm text-muted">{{ size }}</h3>
          <VTable :columns="columns" :data-source="dataSource" :size="size" />
        </div>
      </div>
    </section>
  </main>
</template>
```

#### 20.6 运行

```bash
pnpm build && pnpm playground
```

预期：浏览器打开后可以并排对照 antdv 和 VTable 的视觉效果。

---

## Part 7：验收与 FAQ（Step 21 – 22）

### Step 21：三维度验收清单

#### 21.1 功能验收

| #   | 验证项                          | 操作                                             | 预期结果            |
| --- | ------------------------------- | ------------------------------------------------ | ------------------- |
| 1   | `dataSource + columns` 基础渲染 | 查看对照页第 1 节                                | DOM 行列数量正确    |
| 2   | `dataIndex` 嵌套路径取值        | 添加 `dataIndex: ['address', 'city']` 测试       | 正确显示嵌套字段    |
| 3   | `bodyCell` slot                 | 查看对照页第 4 节                                | Name 列显示蓝色加粗 |
| 4   | `headerCell` slot               | 添加 `#headerCell` slot 测试                     | 能覆盖默认表头渲染  |
| 5   | `column.customRender`           | 添加 `customRender: ({ text }) => h('em', text)` | 优先级高于 bodyCell |
| 6   | `width`                         | 查看 Name 列                                     | 固定 180px 宽度     |
| 7   | `align`                         | 查看 Age 列                                      | 右对齐              |
| 8   | `ellipsis`                      | 查看 Address 列                                  | 超长文本省略号      |
| 9   | `loading`                       | 点击 Toggle Loading 按钮                         | 显示遮罩层          |
| 10  | 空数据                          | 查看对照页第 2 节                                | 展示 "No Data"      |

#### 21.2 主题验收

| #   | 验证项            | 操作                                          | 预期结果                           |
| --- | ----------------- | --------------------------------------------- | ---------------------------------- |
| 1   | 默认 preset       | 不传 `themePreset`                            | 使用 antdv 样式                    |
| 2   | 全局 preset       | `createVTableGuild({ themePreset: 'antdv' })` | 与默认一致                         |
| 3   | 实例覆盖          | `<VTable themePreset="element-plus">`         | 控制台 warning + fallback 到 antdv |
| 4   | 变体: `size`      | 查看对照页第 5 节                             | `lg/md/sm` 三档 padding 不同       |
| 5   | 变体: `bordered`  | 添加 `:bordered="true"`                       | 出现完整边框                       |
| 6   | 变体: `striped`   | 添加 `:striped="true"`                        | 斑马纹                             |
| 7   | 变体: `hoverable` | 默认启用                                      | 行 hover 背景变化                  |
| 8   | 暗色模式          | `<html class="dark">`                         | 整体暗色，颜色切换正确             |

#### 21.3 视觉验收（与 antd 并排）

| #   | 对比项            | 如何检查                  | 预期                     |
| --- | ----------------- | ------------------------- | ------------------------ |
| 1   | Header 背景色     | DevTools 检查 `th` 背景   | 近似 `#fafafa`           |
| 2   | Header 字色/字重  | 目视比较                  | 与 antdv 接近            |
| 3   | Cell padding (lg) | DevTools 检查             | 16px inline + 16px block |
| 4   | Cell padding (md) | 切换 size                 | 8px inline + 12px block  |
| 5   | Cell padding (sm) | 切换 size                 | 8px inline + 8px block   |
| 6   | Border 色         | DevTools 检查 `td` border | 近似 `#f0f0f0`           |
| 7   | Row hover 背景    | 鼠标 hover                | 近似 `#fafafa`           |
| 8   | 字号与行高        | DevTools 检查             | 14px / 1.5715            |

---

### Step 22：FAQ

#### Q1：为什么不直接复用 ant-design-vue 的 Table 组件和样式？

目标是构建自己的可扩展组件库和主题系统，不能把核心实现完全代理给第三方组件。阶段三选择"视觉对齐 + 自主渲染"的路线，后续可继续扩展而不受外部组件实现约束。

#### Q2：为什么 `element-plus` 现在是 fallback？

这是为了先把"主题选择通道"打通，避免未来改插件协议。阶段三先交付 antdv 视觉一致性，element-plus 主题值和组件细节放到后续阶段实现。

#### Q3：为什么默认 size 设为 `lg`？

为了贴合 antdv Table 默认 spacing（`cellPaddingInline=16`, `cellPaddingBlock=16`）。`md`、`sm` 分别映射 antdv 的 middle/small。

#### Q4：为什么 bodyCell/headerCell slot 要用 provide/inject 而不是 useSlots()？

Vue scoped slots **不跨组件层级传播**。`<VTable>` 上定义的 `#bodyCell` 只能在 `Table.vue` 的 `useSlots()` 中拿到，而实际消费它的 `TableCell.vue` 是孙组件（`Table > TableBody > TableRow > TableCell`）。

如果用 `useSlots()`，在 `TableCell.vue` 中拿到的是 `TableRow` 传给它的 slots——是空的。

`provide/inject` 可以跨越任意层级，Table.vue provide 的内容在所有后代中都可以 inject 到。

#### Q5：为什么 VNode 渲染要用 `<component :is="() => vnode" />` 而不是 `<component :is="vnode">`？

`<component :is>` 的 `is` 属性期望的是**组件定义**（对象、函数或字符串标签名），而不是 VNode 实例。

直接传 VNode 会导致 Vue 尝试把它当组件定义解析，结果是渲染错误或空白。

`() => vnode` 是一个**函数式组件**——返回 VNode 的函数被 Vue 视为 render 函数，可以正确渲染。

```typescript
// ❌ 错误：VNode 不是组件定义
<component :is="customRenderResult" />

// ✅ 正确：包裹为函数式组件
<component :is="() => customRenderResult" />
```

#### Q6：为什么 `text-[var(--vtg-table-text-color)]` 不能直接用？

Tailwind CSS 4 中 `text-` 前缀有歧义：

- `text-sm` → `font-size`
- `text-red-500` → `color`

当值是 CSS 变量时（`var(...)`），Tailwind 无法推断意图，可能错误地生成 `font-size` 而不是 `color`。

**消歧语法**：

```css
/* 颜色 */
text-[color:var(--vtg-table-text-color)]

/* 字号 */
text-[length:var(--vtg-table-font-size)]
```

方括号内的 `color:` / `length:` 前缀是 CSS data type hint，告诉 Tailwind 应该生成什么属性。

#### Q7：后续真正实现 element-plus 主题时要改哪些点？

1. `packages/theme/src/presets/element-plus/table.ts`：补全 token 与 slot 样式
2. `packages/theme/css/tokens.css`：补 element 系列 CSS 变量（如果与 antdv 不同）
3. `packages/theme/src/presets/index.ts`：`ELEMENT_PLUS_THEME_IMPLEMENTED` 改为 `true`，去掉 fallback
4. Playground 增加 element 对照页（建议三栏：Ant / Element / VTable）

#### Q8：暗色模式 token 的值是怎么得出来的？

参考 ant-design-vue 的 dark 算法输出。antdv 使用 `@ant-design/cssinjs` 的 dark 算法，对每个 seed token 做颜色反转。本项目直接取了 dark 模式下的计算结果作为 CSS 变量值：

| 亮色               | 暗色                     | 说明            |
| ------------------ | ------------------------ | --------------- |
| `#ffffff`          | `#141414`                | 背景色反转      |
| `#fafafa`          | `#1d1d1d`                | 表头/hover 背景 |
| `rgba(0,0,0,0.88)` | `rgba(255,255,255,0.85)` | 文字颜色        |
| `#f0f0f0`          | `#303030`                | 边框色          |

#### Q9：`themeProps.value` 传给 `useTheme` 是否破坏了响应性？

`useTheme` 的第三个参数 `props` 在内部通过 `computed` 访问属性（`props[key]`），只要 `themeProps` 是 computed，每次 `themeProps.value` 变化时 `useTheme` 内部的 computed 会重新计算。

但注意：传入的是 `.value`（解包后的普通对象），不是 computed ref 本身。这意味着 `useTheme` 内部的 `computed` 会在 `themeProps` 变化时重新计算——因为 Vue 的 `computed` 会追踪 `themeProps` 的依赖。

实际上更精确的做法是传 reactive 对象或 getter，但阶段三的实现已够用。

#### Q10：`defaultTheme` 参数为什么是非响应式的？动态切换 preset 怎么办？

`useTheme(componentName, defaultTheme, props)` 的第二个参数 `defaultTheme` 在当前实现中是**普通对象**（非 ref/computed）。这意味着：

```typescript
// ❌ preset 变化时 defaultTheme 不会更新
const defaultTheme = resolveTableThemePreset(effectivePreset.value)
const { slots } = useTheme('table', defaultTheme, themeProps.value)
```

如果 `effectivePreset` 从 `'antdv'` 变为 `'element-plus'`，`defaultTheme` 仍然是 antdv 的主题——因为 `resolveTableThemePreset()` 只在 setup 阶段执行了一次。

**阶段三的设计决策**：preset 初始化后不动态切换。这是一个合理的约束——绝大多数应用在 `createVTableGuild()` 时就确定了 preset，运行时不会改变。

**如果后续需要动态切换**，有两种方案：

1. **改造 `useTheme`**：让 `defaultTheme` 接受 `Ref<ThemeConfig>` 或 `() => ThemeConfig`
2. **组件级 key 强制重建**：`<VTable :key="preset" :themePreset="preset" />` — 切换 key 强制销毁重建

---

## 最终文件清单

完成阶段三后，新增/修改如下文件：

```text
vtable-guild/
├── docs/
│   └── phase-3-guide.md                                    [新增]
│
├── packages/
│   ├── core/
│   │   ├── src/utils/types.ts                              [修改] 增加 ThemePresetName
│   │   ├── src/plugin/index.ts                             [修改] 注入 themePreset
│   │   └── src/index.ts                                    [修改] 导出 ThemePresetName
│   │
│   ├── theme/
│   │   ├── css/tokens.css                                  [修改] 新增 table token + .dark 覆盖
│   │   └── src/
│   │       ├── table.ts                                    [修改] 重导出 antdv preset
│   │       ├── index.ts                                    [修改] 导出 resolver
│   │       └── presets/
│   │           ├── types.ts                                [新增]
│   │           ├── index.ts                                [新增]
│   │           ├── antdv/
│   │           │   └── table.ts                            [新增]
│   │           └── element-plus/
│   │               └── table.ts                            [新增，占位]
│   │
│   └── table/
│       └── src/
│           ├── index.ts                                    [修改]
│           ├── context.ts                                  [新增]
│           ├── types/
│           │   ├── column.ts                               [新增]
│           │   ├── table.ts                                [新增]
│           │   └── index.ts                                [新增]
│           ├── composables/
│           │   ├── useColumns.ts                           [新增]
│           │   └── index.ts                                [新增]
│           └── components/
│               ├── Table.vue                               [新增]
│               ├── TableHeader.vue                         [新增]
│               ├── TableBody.vue                           [新增]
│               ├── TableRow.vue                            [新增]
│               ├── TableCell.vue                           [新增]
│               ├── TableHeaderCell.vue                     [新增]
│               ├── TableEmpty.vue                          [新增]
│               └── TableLoading.vue                        [新增]
│
└── playground/
    ├── package.json                                        [修改] 添加 ant-design-vue + table
    ├── tsconfig.json                                       [修改] 添加 table 引用
    └── src/
        ├── main.ts                                         [修改] 引入 antd reset + preset
        └── App.vue                                         [修改] 并排对照页
```

共 **新增 16 个文件**，**修改 9 个文件**。

---

## 命令验证与故障排查

### 基础命令

```bash
pnpm install      # 安装新依赖（ant-design-vue）
pnpm build        # 构建所有包
pnpm type-check   # 类型检查
pnpm playground   # 运行 playground
```

### 常见问题

| #   | 错误                                      | 原因                              | 修复                                            |
| --- | ----------------------------------------- | --------------------------------- | ----------------------------------------------- |
| 1   | `slots.headerCellInner is not a function` | 主题中缺少 `headerCellInner` slot | 检查 `presets/antdv/table.ts` 的 `slots`        |
| 2   | `element-plus` preset 选了但样式没变      | 阶段三未实现 element-plus 主题    | 预期行为，控制台有 warning                      |
| 3   | `customRender` 返回 VNode 未渲染          | 用了 `<component :is="vnode">`    | 改为 `<component :is="() => vnode" />`          |
| 4   | bodyCell slot 内容不显示                  | `useSlots()` 无法跨层级           | 确认用了 `provide/inject`                       |
| 5   | 暗色模式下文字看不清                      | `.dark` 中 table token 缺失       | 确认 `tokens.css` 有 `.dark` 内 `--vtg-table-*` |
| 6   | `text-[var(...)]` 应用了错误的 CSS 属性   | Tailwind CSS 4 歧义               | 使用 `text-[color:var(...)]` 消歧               |
| 7   | `pnpm build` 报 Cannot find module        | 包依赖顺序问题                    | 先 `pnpm install`，turbo 会按拓扑序构建         |
