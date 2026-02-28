# 阶段三：基础 Table 组件（Ant Design Vue 默认主题）— 保姆级操作指南

> 本文档是 [roadmap.md](./roadmap.md) 阶段三的逐步细化，每一步给出具体的文件内容和命令。
> 按顺序执行，不要跳步。
>
> 本阶段新增要求（已纳入实现）：默认主题对齐 **ant-design-vue**，同时预留 **element-plus** 主题扩展能力，使用者可通过 preset 选择主题。  
> 本次只实现 antdv 主题，element-plus 先提供可扩展骨架与 fallback。

---

## 前置条件

阶段一和阶段二已完成，且以下条件满足：

- `pnpm build` 全部通过
- `@vtable-guild/core` 已具备 `useTheme`、`createVTableGuild`
- `@vtable-guild/theme` 已具备 `table.ts` 和 `pagination.ts`
- `playground/` 可运行（`pnpm playground`）

---

## 本阶段目标

完成后你应该得到：

- `@vtable-guild/table` 拥有可用的基础 Table 渲染能力
- 支持 `dataSource + columns` 基础渲染
- 支持 `bodyCell` / `headerCell` slot
- 支持 `column.customRender`
- 支持列配置：`width`、`align`、`ellipsis`、`className`
- 默认视觉风格与 ant-design-vue 基础 Table 对齐（视觉优先）
- 主题系统新增 `themePreset`，可选 `'antdv' | 'element-plus'`
- 当前 `'element-plus'` preset 为保留态（fallback 到 antdv 并给出警告）

---

## 非目标（本阶段不做）

- 排序、筛选、分页、行选择
- 固定列、展开行、树形数据、虚拟滚动
- element-plus 具体主题 token 与视觉实现

---

## Step 1：先锁定“对齐标准”和参考基线

### 1.1 为什么先做这一步

“和 ant-design-vue 一模一样”如果没有验收口径，会变成主观讨论。先定义“本阶段什么叫一致”，后面就不会反复返工。

### 1.2 参考源（只用官方一手）

- ant-design-vue 仓库：<https://github.com/vueComponent/ant-design-vue>
- Table 样式 token 参考：`components/table/style/index.ts`
- Table API 参考：`components/table/index.en-US.md`

### 1.3 本阶段一致性验收口径（视觉优先）

按优先级验收：

1. 默认状态视觉一致：表头背景、文字颜色、边框色、单元格间距、字号、hover 背景
2. 空态/加载态视觉一致：空数据区域和 loading 遮罩层结构合理
3. API 子集一致：`dataSource`、`columns`、`customRender`、`bodyCell/headerCell`

### 1.4 关键 token 映射表（阶段三用到的子集）

| Ant token             | 参考值（默认算法）                  | vtable CSS 变量                      |
| --------------------- | ----------------------------------- | ------------------------------------ |
| `headerBg`            | `#fafafa`                           | `--vtg-table-header-bg`              |
| `headerColor`         | `rgba(0,0,0,0.88)`                  | `--vtg-table-header-color`           |
| `borderColor`         | `#f0f0f0`（`colorBorderSecondary`） | `--vtg-table-border-color`           |
| `rowHoverBg`          | `#fafafa`                           | `--vtg-table-row-hover-bg`           |
| `cellFontSize`        | `14px`                              | `--vtg-table-font-size`              |
| `cellPaddingInline`   | `16px`                              | `--vtg-table-cell-padding-inline-lg` |
| `cellPaddingBlock`    | `16px`                              | `--vtg-table-cell-padding-block-lg`  |
| `cellPaddingInlineMD` | `8px`                               | `--vtg-table-cell-padding-inline-md` |
| `cellPaddingBlockMD`  | `12px`                              | `--vtg-table-cell-padding-block-md`  |
| `cellPaddingInlineSM` | `8px`                               | `--vtg-table-cell-padding-inline-sm` |
| `cellPaddingBlockSM`  | `8px`                               | `--vtg-table-cell-padding-block-sm`  |

---

## Step 2：新增主题 preset 抽象（支持 antdv / element-plus）

### 2.1 为什么先做这一步

如果先写死 Table 默认主题，后面再引入 preset 选择会改动 plugin、context、组件入口，代价更高。  
先把“选择主题”的通道打通，再落默认 antdv 样式。

### 2.2 修改 `packages/core/src/utils/types.ts`

补充 preset 类型，并把它加入插件上下文：

```typescript
// packages/core/src/utils/types.ts

export type ThemePresetName = 'antdv' | 'element-plus'

export interface VTableGuildOptions {
  themePreset?: ThemePresetName
  theme?: Record<string, Partial<ThemeConfig>>
}

export interface VTableGuildContext {
  themePreset: ThemePresetName
  theme: Record<string, Partial<ThemeConfig>>
}
```

### 2.3 修改 `packages/core/src/plugin/index.ts`

将 preset 注入全局上下文，默认值为 `'antdv'`：

```typescript
// packages/core/src/plugin/index.ts
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
```

### 2.4 修改 `packages/core/src/index.ts`

导出 preset 类型：

```typescript
export type {
  ThemeConfig,
  SlotProps,
  VTableGuildOptions,
  VTableGuildContext,
  ThemePresetName,
} from './utils/types'
```

### 2.5 在 `packages/theme/src/presets/` 创建目录

```bash
mkdir -p packages/theme/src/presets/antdv
mkdir -p packages/theme/src/presets/element-plus
```

### 2.6 创建 `packages/theme/src/presets/types.ts`

```typescript
// packages/theme/src/presets/types.ts
import type { ThemeConfig, ThemePresetName } from '@vtable-guild/core'

export interface ThemePreset {
  table: ThemeConfig
}

export type { ThemePresetName }
```

### 2.7 创建 element-plus 占位文件

> 注意：这里只做“可选通道 + fallback”，不实现 element-plus 的具体样式。

```typescript
// packages/theme/src/presets/element-plus/table.ts
import type { ThemeConfig } from '@vtable-guild/core'

export const elementPlusTableThemePlaceholder = {
  slots: {},
} as const satisfies ThemeConfig

export const ELEMENT_PLUS_THEME_IMPLEMENTED = false
```

---

## Step 3：实现 Ant 默认 Table 主题（视觉对齐核心）

### 3.1 为什么这一段最关键

阶段三新增的“主题特色”核心就在这里：

- 组件功能只要基础可用即可
- 视觉必须优先贴近 ant-design-vue
- 同时要保证未来可替换为 element-plus 预设

### 3.2 修改 `packages/theme/css/tokens.css`

在已有语义 token 基础上新增 Table 专用变量：

```css
/* packages/theme/css/tokens.css */

:root {
  --vtg-table-bg: #fff;
  --vtg-table-header-bg: #fafafa;
  --vtg-table-header-color: rgba(0, 0, 0, 0.88);
  --vtg-table-text-color: rgba(0, 0, 0, 0.88);
  --vtg-table-border-color: #f0f0f0;
  --vtg-table-row-hover-bg: #fafafa;

  --vtg-table-font-size: 14px;
  --vtg-table-line-height: 1.5715;

  --vtg-table-cell-padding-inline-lg: 16px;
  --vtg-table-cell-padding-block-lg: 16px;
  --vtg-table-cell-padding-inline-md: 8px;
  --vtg-table-cell-padding-block-md: 12px;
  --vtg-table-cell-padding-inline-sm: 8px;
  --vtg-table-cell-padding-block-sm: 8px;
}
```

### 3.3 创建 `packages/theme/src/presets/antdv/table.ts`

> 这一份主题是阶段三的默认主题实现。

```typescript
// packages/theme/src/presets/antdv/table.ts
import type { ThemeConfig } from '@vtable-guild/core'

export const antdvTableTheme = {
  slots: {
    root: 'relative w-full',
    wrapper: 'w-full overflow-auto',
    table: [
      'w-full border-separate border-spacing-0',
      'bg-[var(--vtg-table-bg)]',
      'text-[var(--vtg-table-font-size)]',
      'leading-[var(--vtg-table-line-height)]',
      'text-[var(--vtg-table-text-color)]',
    ].join(' '),
    thead: '',
    tbody: '',
    tr: 'group/row transition-colors',
    th: [
      'relative text-left font-medium',
      'bg-[var(--vtg-table-header-bg)]',
      'text-[var(--vtg-table-header-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    td: [
      'align-middle',
      'bg-[var(--vtg-table-bg)]',
      'text-[var(--vtg-table-text-color)]',
      'border-b border-[var(--vtg-table-border-color)]',
    ].join(' '),
    empty: 'py-16 text-center text-[rgba(0,0,0,0.45)]',
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

export type AntdvTableSlots = keyof typeof antdvTableTheme.slots
export type AntdvTableVariantProps = {
  size?: 'lg' | 'md' | 'sm'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}
```

### 3.4 创建 `packages/theme/src/presets/index.ts`

```typescript
// packages/theme/src/presets/index.ts
import type { ThemePreset, ThemePresetName } from './types'
import { antdvTableTheme } from './antdv/table'
import {
  ELEMENT_PLUS_THEME_IMPLEMENTED,
  elementPlusTableThemePlaceholder,
} from './element-plus/table'

const presetMap: Record<ThemePresetName, ThemePreset> = {
  antdv: {
    table: antdvTableTheme,
  },
  'element-plus': {
    // 阶段三先 fallback 到 antdv，避免断路
    table: ELEMENT_PLUS_THEME_IMPLEMENTED ? elementPlusTableThemePlaceholder : antdvTableTheme,
  },
}

export function resolveThemePreset(name: ThemePresetName = 'antdv'): ThemePreset {
  if (name === 'element-plus' && !ELEMENT_PLUS_THEME_IMPLEMENTED) {
    console.warn(
      '[vtable-guild] element-plus theme preset is not implemented in phase 3 yet, fallback to antdv preset.',
    )
  }

  return presetMap[name] ?? presetMap.antdv
}

export function resolveTableThemePreset(name: ThemePresetName = 'antdv') {
  return resolveThemePreset(name).table
}

export type { ThemePresetName } from './types'
```

### 3.5 修改 `packages/theme/src/table.ts`

把旧默认导出切到 antdv 主题：

```typescript
// packages/theme/src/table.ts
export { antdvTableTheme as tableTheme } from './presets/antdv/table'
export type {
  AntdvTableSlots as TableSlots,
  AntdvTableVariantProps as TableVariantProps,
} from './presets/antdv/table'
```

### 3.6 修改 `packages/theme/src/index.ts`

新增 preset 导出：

```typescript
// packages/theme/src/index.ts
export { tableTheme } from './table'
export { paginationTheme } from './pagination'

export { resolveThemePreset, resolveTableThemePreset } from './presets'
export type { ThemePresetName } from './presets'

export type { TableSlots, TableVariantProps } from './table'
export type { PaginationSlots, PaginationVariantProps } from './pagination'
```

---

## Step 4：定义 Table 类型（types/column.ts + types/table.ts）

### 4.1 为什么先写类型

阶段三组件很多，先把 `columns` / `props` / `slot` 的上下文类型固定住，后面每个组件都可以直接复用，不会反复改签名。

### 4.2 创建 `packages/table/src/types/column.ts`

```typescript
// packages/table/src/types/column.ts
import type { VNodeChild } from 'vue'

export type Key = string | number
export type AlignType = 'left' | 'center' | 'right'
export type DataIndex = string | number | Array<string | number>

export interface CustomRenderContext<TRecord extends Record<string, unknown>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

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

export interface ColumnGroupType<TRecord extends Record<string, unknown>> extends Omit<
  ColumnType<TRecord>,
  'dataIndex' | 'customRender'
> {
  children: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>
}

export type ColumnsType<TRecord extends Record<string, unknown>> = Array<
  ColumnType<TRecord> | ColumnGroupType<TRecord>
>
```

### 4.3 创建 `packages/table/src/types/table.ts`

```typescript
// packages/table/src/types/table.ts
import type { ThemePresetName, SlotProps } from '@vtable-guild/core'
import type { VNodeChild } from 'vue'
import type { ColumnsType, ColumnType, Key } from './column'
import type { TableSlots } from '@vtable-guild/theme'

export interface TableBodyCellSlotProps<TRecord extends Record<string, unknown>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

export interface TableHeaderCellSlotProps<TRecord extends Record<string, unknown>> {
  title: string | undefined
  column: ColumnType<TRecord>
  index: number
}

export interface TableSlotsDecl<TRecord extends Record<string, unknown>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
}

export interface TableProps<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  dataSource: TRecord[]
  columns: ColumnsType<TRecord>
  rowKey?: string | ((record: TRecord) => Key)
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
  ui?: SlotProps<{ slots: Record<TableSlots, string> }>
  class?: string
  /**
   * 实例级 override。
   * 未传时使用 createVTableGuild 的全局 preset；再未配置则使用 antdv。
   */
  themePreset?: ThemePresetName
}
```

### 4.4 创建 `packages/table/src/types/index.ts`

```typescript
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

---

## Step 5：实现 `useColumns`（列解析与取值）

### 5.1 创建目录

```bash
mkdir -p packages/table/src/composables
```

### 5.2 创建 `packages/table/src/composables/useColumns.ts`

```typescript
// packages/table/src/composables/useColumns.ts
import { computed } from 'vue'
import type { ColumnGroupType, ColumnType, ColumnsType, DataIndex } from '../types'

function isColumnGroup<TRecord extends Record<string, unknown>>(
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>,
): column is ColumnGroupType<TRecord> {
  return Array.isArray((column as ColumnGroupType<TRecord>).children)
}

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

export function useColumns<TRecord extends Record<string, unknown>>(
  columns: () => ColumnsType<TRecord>,
) {
  const leafColumns = computed(() => flattenColumns(columns()))

  return {
    leafColumns,
  }
}
```

### 5.3 创建 `packages/table/src/composables/index.ts`

```typescript
export { useColumns, getByDataIndex } from './useColumns'
```

---

## Step 6：实现基础组件骨架（Table/Header/Body/Row/Cell）

### 6.1 创建目录

```bash
mkdir -p packages/table/src/components
```

### 6.2 创建 `packages/table/src/components/TableCell.vue`

```vue
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { getByDataIndex } from '../composables/useColumns'
import type { ColumnType } from '../types'

const props = defineProps<{
  record: Record<string, unknown>
  rowIndex: number
  column: ColumnType<Record<string, unknown>>
  tdClass: string
}>()

const slots = useSlots()

const text = computed(() => getByDataIndex(props.record, props.column.dataIndex))

const customContent = computed(() => {
  if (props.column.customRender) {
    return props.column.customRender({
      text: text.value,
      record: props.record,
      index: props.rowIndex,
      column: props.column,
    })
  }

  if (slots.bodyCell) {
    return slots.bodyCell({
      text: text.value,
      record: props.record,
      index: props.rowIndex,
      column: props.column,
    })
  }

  return text.value ?? ''
})

const cellClass = computed(() => {
  const alignClass =
    props.column.align === 'center'
      ? 'text-center'
      : props.column.align === 'right'
        ? 'text-right'
        : 'text-left'
  const ellipsisClass = props.column.ellipsis
    ? 'overflow-hidden text-ellipsis whitespace-nowrap'
    : ''
  return [props.tdClass, alignClass, ellipsisClass, props.column.className]
    .filter(Boolean)
    .join(' ')
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
    <component :is="customContent" v-if="typeof customContent === 'function'" />
    <template v-else>{{ customContent }}</template>
  </td>
</template>
```

### 6.3 创建 `packages/table/src/components/TableHeaderCell.vue`

```vue
<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { ColumnType } from '../types'

const props = defineProps<{
  column: ColumnType<Record<string, unknown>>
  index: number
  thClass: string
  headerCellInnerClass: string
}>()

const slots = useSlots()

const headerContent = computed(() => {
  if (slots.headerCell) {
    return slots.headerCell({
      title: props.column.title,
      column: props.column,
      index: props.index,
    })
  }

  return props.column.title ?? ''
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
      <component :is="headerContent" v-if="typeof headerContent === 'function'" />
      <template v-else>{{ headerContent }}</template>
    </span>
  </th>
</template>
```

### 6.4 创建 `packages/table/src/components/TableRow.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
  rowClass: string
}>()
</script>

<template>
  <tr :class="props.rowClass">
    <slot />
  </tr>
</template>
```

### 6.5 创建 `packages/table/src/components/TableEmpty.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
  colSpan: number
  emptyClass: string
  tdClass: string
}>()
</script>

<template>
  <tr>
    <td :class="[props.tdClass, props.emptyClass]" :colspan="props.colSpan">No Data</td>
  </tr>
</template>
```

### 6.6 创建 `packages/table/src/components/TableLoading.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
  loadingClass: string
}>()
</script>

<template>
  <div :class="props.loadingClass">
    <slot>Loading...</slot>
  </div>
</template>
```

### 6.7 创建 `packages/table/src/components/TableHeader.vue`

```vue
<script setup lang="ts">
import TableHeaderCell from './TableHeaderCell.vue'
import type { ColumnType } from '../types'

const props = defineProps<{
  columns: ColumnType<Record<string, unknown>>[]
  theadClass: string
  rowClass: string
  thClass: string
  headerCellInnerClass: string
}>()
</script>

<template>
  <thead :class="props.theadClass">
    <tr :class="props.rowClass">
      <TableHeaderCell
        v-for="(column, index) in props.columns"
        :key="column.key ?? String(column.dataIndex ?? index)"
        :column="column"
        :index="index"
        :th-class="props.thClass"
        :header-cell-inner-class="props.headerCellInnerClass"
      />
    </tr>
  </thead>
</template>
```

### 6.8 创建 `packages/table/src/components/TableBody.vue`

```vue
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
  <tbody :class="props.tbodyClass">
    <template v-if="props.dataSource.length > 0">
      <TableRow
        v-for="(record, rowIndex) in props.dataSource"
        :key="getRowKey(record, rowIndex)"
        :row-class="props.rowClass"
      >
        <TableCell
          v-for="(column, colIndex) in props.columns"
          :key="column.key ?? String(column.dataIndex ?? colIndex)"
          :record="record"
          :row-index="rowIndex"
          :column="column"
          :td-class="props.tdClass"
        />
      </TableRow>
    </template>
    <TableEmpty
      v-else
      :col-span="props.columns.length || 1"
      :empty-class="props.emptyClass"
      :td-class="props.tdClass"
    />
  </tbody>
</template>
```

### 6.9 创建 `packages/table/src/components/Table.vue`

```vue
<script setup lang="ts">
import { computed, inject } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import { resolveTableThemePreset, tableTheme } from '@vtable-guild/theme'
import { useColumns } from '../composables'
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

const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)
const effectivePreset = computed(() => props.themePreset ?? globalContext?.themePreset ?? 'antdv')
const defaultTheme = computed(() => resolveTableThemePreset(effectivePreset.value) ?? tableTheme)

const { leafColumns } = useColumns(() => props.columns)
const { slots } = useTheme('table', defaultTheme.value, props)
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

> 关键说明：为了让 `slots` 随 `themePreset` 变化完全响应式，生产代码建议把 `useTheme` 默认主题参数改为 `computed` 版本。  
> 如果暂不改 `useTheme`，阶段三先按“preset 初始化后不动态切换”实现即可。

---

## Step 7：导出入口更新（table 包）

### 7.1 修改 `packages/table/src/index.ts`

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

### 7.2 修改 `packages/table/src/types/index.ts` 和 `packages/table/src/composables/index.ts`

确保 `index.ts` 能完整导出，不需要用户深层 import。

---

## Step 8：Playground 对照验证（与 Ant 并排）

### 8.1 为什么要并排对照

“视觉一致”不能只看单边效果。最稳妥方式是同一页并排渲染：

- 左边：`<a-table>`（ant-design-vue）
- 右边：`<VTable>`（本项目）

### 8.2 安装对照依赖（只在 playground 用）

```bash
pnpm add ant-design-vue --filter @vtable-guild/playground
```

### 8.3 修改 `playground/src/main.ts`

```typescript
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

### 8.4 修改 `playground/src/App.vue`

创建并排对照页（示意）：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Table as ATable } from 'ant-design-vue'
import { VTable } from '@vtable-guild/table'

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
  { title: 'Age', dataIndex: 'age', key: 'age', align: 'right', width: 120 },
  { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
]

const dataSource = ref([
  {
    key: 1,
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park, Long Long Long Address',
  },
  { key: 2, name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: 3, name: 'Joe Black', age: 29, address: 'Sidney No. 1 Lake Park' },
])
</script>

<template>
  <main class="p-8 space-y-6">
    <h1 class="text-xl font-semibold">Antdv vs VTable (Phase 3)</h1>
    <div class="grid grid-cols-2 gap-6">
      <section class="space-y-2">
        <h2 class="font-medium">ant-design-vue</h2>
        <ATable :columns="columns" :data-source="dataSource" :pagination="false" />
      </section>
      <section class="space-y-2">
        <h2 class="font-medium">vtable-guild</h2>
        <VTable :columns="columns" :data-source="dataSource" />
      </section>
    </div>
  </main>
</template>
```

### 8.5 运行

```bash
pnpm build
pnpm playground
```

---

## Step 9：验收清单（必须逐项勾选）

### 9.1 功能验收

| #   | 验证项                                       | 预期结果              |
| --- | -------------------------------------------- | --------------------- |
| 1   | `dataSource + columns` 基础渲染              | DOM 行列数量正确      |
| 2   | `dataIndex` 嵌套路径取值                     | 正确显示嵌套字段      |
| 3   | `bodyCell` slot                              | 能覆盖默认单元格渲染  |
| 4   | `headerCell` slot                            | 能覆盖默认表头渲染    |
| 5   | `column.customRender`                        | 优先级高于 `bodyCell` |
| 6   | `width` / `align` / `ellipsis` / `className` | 样式生效              |
| 7   | `loading`                                    | 显示遮罩层            |
| 8   | 空数据                                       | 展示空态              |

### 9.2 主题验收

| #   | 验证项            | 预期结果                                             |
| --- | ----------------- | ---------------------------------------------------- |
| 1   | 默认 preset       | 未配置时为 `antdv`                                   |
| 2   | 全局 preset       | `createVTableGuild({ themePreset: 'antdv' })` 生效   |
| 3   | 实例 preset 覆盖  | `themePreset` prop 可覆盖全局                        |
| 4   | element-plus 预留 | 选择 `'element-plus'` 时 warning + fallback 到 antdv |
| 5   | 变体              | `size/bordered/striped/hoverable` 生效               |

### 9.3 视觉验收（与 antd 并排）

| #   | 对比项           | 预期                |
| --- | ---------------- | ------------------- |
| 1   | Header 背景色    | 近似 `#fafafa`      |
| 2   | Header 字色/字重 | 与 Ant 接近         |
| 3   | Cell padding     | `lg/md/sm` 三档匹配 |
| 4   | Border 色        | 近似 `#f0f0f0`      |
| 5   | Row hover 背景   | 近似 `#fafafa`      |
| 6   | 字号与行高       | 接近 14px / 1.5715  |

---

## Step 10：命令验证与故障排查

### 10.1 基础命令

```bash
pnpm install
pnpm build
pnpm type-check
pnpm playground
```

### 10.2 常见问题

1. `slots.headerCellInner is not a function`
   - 原因：主题中缺少 `headerCellInner` slot
   - 修复：检查 `packages/theme/src/presets/antdv/table.ts` 的 `slots`

2. `element-plus` preset 选了但样式没变
   - 原因：阶段三还未实现 element-plus 主题，当前是 fallback
   - 修复：这是预期行为，待阶段四/五补齐具体主题

3. `customRender` 返回 VNode 未渲染
   - 原因：组件内把 VNode 当字符串输出
   - 修复：按上文 `TableCell.vue` 处理逻辑输出

---

## 最终文件清单

完成阶段三后，建议新增/修改如下文件（按本指南）：

```text
vtable-guild/
├── docs/
│   └── table-phase-3-guide.md                              [新增]
│
├── packages/
│   ├── core/
│   │   ├── src/utils/types.ts                              [修改] 增加 ThemePresetName
│   │   ├── src/plugin/index.ts                             [修改] 注入 themePreset
│   │   └── src/index.ts                                    [修改] 导出 preset 类型
│   │
│   ├── theme/
│   │   ├── css/tokens.css                                  [修改] 新增 table 专用 token
│   │   └── src/
│   │       ├── table.ts                                    [修改] 默认切到 antdv preset
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
    └── src/
        ├── main.ts                                         [修改] 引入 antd reset + preset
        └── App.vue                                         [修改] 并排对照页
```

---

## FAQ

### Q1：为什么不直接复用 ant-design-vue 的 Table 组件和样式？

目标是构建自己的可扩展组件库和主题系统，不能把核心实现完全代理给第三方组件。  
阶段三选择“视觉对齐 + 自主渲染”的路线，后续可继续扩展而不受外部组件实现约束。

### Q2：为什么 `element-plus` 现在是 fallback？

这是为了先把“主题选择通道”打通，避免未来改插件协议。  
阶段三先交付 antdv 视觉一致性，element-plus 主题值和组件细节放到后续阶段实现。

### Q3：为什么默认 size 设为 `lg`？

为了贴合 antd Table 默认 spacing（`cellPaddingInline=16`, `cellPaddingBlock=16`）。  
`md`、`sm` 分别映射 antd 的 middle/small。

### Q4：后续真正实现 element-plus 主题时要改哪些点？

- `packages/theme/src/presets/element-plus/table.ts`：补全 token 与 slot
- `packages/theme/css/tokens.css`：补 element 变量
- `resolveThemePreset()`：去掉 fallback 警告
- Playground 增加 element 对照页（建议三栏：Ant / Element / VTable）
