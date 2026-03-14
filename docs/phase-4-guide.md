# 阶段四：交互功能 — 保姆级操作指南

> 本文档是 [roadmap.md](./roadmap.md) 阶段四的逐步细化，每一步给出具体的文件内容和命令。
> 按顺序执行，不要跳步。
>
> 本阶段在阶段三（基础 Table 组件）基础上，实现**排序、筛选、行选择**三大交互功能，并统一 `change` 事件签名，与 ant-design-vue 的 API 对齐。
>
> **延续 TSX 决策**：本阶段所有新增组件继续使用 TSX（`.tsx`）格式，理由同阶段三。

---

## 前置条件

阶段一至阶段三已完成，且以下条件满足：

- `pnpm build` 全部通过（5 个包）
- `@vtable-guild/table` 基础 Table 可用：`dataSource + columns` 渲染、`bodyCell`/`headerCell` slot、`customRender`、`loading`/空状态
- 组件结构：`Table.tsx` → `TableHeader.tsx`/`TableBody.tsx` → `TableHeaderCell.tsx`/`TableCell.tsx`/`TableRow.tsx`
- 主题系统完备：`useTheme` + antdv preset + CSS token（亮/暗模式）

---

## 本阶段目标

完成后你应该得到：

- **排序**：点击表头排序列，支持受控（`sortOrder`）和非受控（内部 `ref`）两种模式
- **筛选**：表头下拉菜单筛选数据，支持单选/多选、自定义筛选 UI
- **行选择**：checkbox/radio 两种模式，支持全选/反选
- **统一 change 事件**：`(filters, sorter, extra)` 三参数签名，与 antdv 对齐
- 所有交互功能支持受控/非受控两种模式

---

## 非目标（本阶段不做）

- 固定列、展开行、树形数据、虚拟滚动（阶段五/六）
- 多列排序（本阶段仅单列排序）
- 拖拽排序
- 列筛选弹窗的动画过渡效果

---

## Part 1：排序（Step 1 – 5）

### Step 1：扩展 Column 类型 — 排序相关字段

#### 1.1 为什么先做这一步

排序功能需要在 `ColumnType` 上增加多个配置字段（`sorter`、`sortOrder` 等）。先把类型固定住，后续 composable 和组件都可以直接复用，不会反复改签名。

#### 1.2 修改 `packages/table/src/types/column.ts`

在 `ColumnType` 接口中新增排序相关字段：

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

/** 排序方向 */
export type SortOrder = 'ascend' | 'descend' | null

/** 排序器：布尔值表示使用默认排序，函数表示自定义比较 */
export type SorterFn<TRecord> = (a: TRecord, b: TRecord) => number
export type ColumnSorter<TRecord> = boolean | SorterFn<TRecord>

/**
 * customRender 回调参数。
 */
export interface CustomRenderContext<TRecord extends Record<string, unknown>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

/**
 * 筛选项。
 */
export interface ColumnFilterItem {
  text: string
  value: string | number | boolean
  children?: ColumnFilterItem[]
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

  // ---- 排序相关（Step 1 新增） ----

  /**
   * 排序器。
   * - `true`：使用默认比较（字符串/数字自动判断）
   * - `(a, b) => number`：自定义比较函数（与 Array.sort 签名一致）
   * - 不传或 `undefined`：该列不可排序
   */
  sorter?: ColumnSorter<TRecord>

  /**
   * 受控排序方向。
   * 传入后组件不再自行管理排序状态，完全由外部控制。
   */
  sortOrder?: SortOrder

  /**
   * 非受控默认排序方向。
   * 仅在组件首次渲染时生效，后续由内部状态管理。
   */
  defaultSortOrder?: SortOrder

  /**
   * 可用排序方向列表。
   * 点击表头时按此数组循环切换。
   * 默认 ['ascend', 'descend']（不含 null 则不回到"无排序"状态）。
   */
  sortDirections?: SortOrder[]

  // ---- 筛选相关（Step 6 新增） ----

  /**
   * 筛选项列表。传入后该列表头显示筛选图标。
   */
  filters?: ColumnFilterItem[]

  /**
   * 筛选函数。返回 true 表示该行匹配当前筛选值。
   * @param value - 当前选中的筛选值
   * @param record - 行数据
   */
  onFilter?: (value: string | number | boolean, record: TRecord) => boolean

  /**
   * 是否支持多选筛选。默认 true。
   */
  filterMultiple?: boolean

  /**
   * 受控筛选值。传入后组件不再自行管理筛选状态。
   */
  filteredValue?: (string | number | boolean)[] | null

  /**
   * 非受控默认筛选值。
   */
  defaultFilteredValue?: (string | number | boolean)[]

  /**
   * 自定义筛选下拉菜单。
   * 设为 true 时，使用 Table 的 customFilterDropdown slot。
   */
  customFilterDropdown?: boolean
}

/**
 * 列组配置（含 children）。
 */
export interface ColumnGroupType<TRecord extends Record<string, unknown>> extends Omit<
  ColumnType<TRecord>,
  | 'dataIndex'
  | 'customRender'
  | 'sorter'
  | 'sortOrder'
  | 'defaultSortOrder'
  | 'sortDirections'
  | 'filters'
  | 'onFilter'
  | 'filterMultiple'
  | 'filteredValue'
  | 'defaultFilteredValue'
  | 'customFilterDropdown'
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

**关键变更**：

| 新增字段               | 类型                                      | 说明                                 |
| ---------------------- | ----------------------------------------- | ------------------------------------ |
| `sorter`               | `boolean \| (a, b) => number`             | 启用排序，`true` 为默认排序          |
| `sortOrder`            | `'ascend' \| 'descend' \| null`           | 受控模式排序方向                     |
| `defaultSortOrder`     | `SortOrder`                               | 非受控默认值                         |
| `sortDirections`       | `SortOrder[]`                             | 循环切换列表                         |
| `filters`              | `ColumnFilterItem[]`                      | 筛选项（同时加入，减少类型改动次数） |
| `onFilter`             | `(value, record) => boolean`              | 筛选匹配函数                         |
| `filterMultiple`       | `boolean`                                 | 多选筛选                             |
| `filteredValue`        | `(string \| number \| boolean)[] \| null` | 受控筛选值                           |
| `defaultFilteredValue` | `(string \| number \| boolean)[]`         | 非受控默认筛选值                     |
| `customFilterDropdown` | `boolean`                                 | 启用自定义筛选 UI                    |

> **一次性加完排序 + 筛选字段**：虽然筛选在 Part 2 才实现，但类型定义先到位可以避免后续再改 `ColumnGroupType` 的 `Omit` 列表。

#### 1.3 验证

```bash
pnpm build
```

预期：构建通过。新增类型字段全部为可选，不影响已有代码。

---

### Step 2：useSorter composable — 排序状态管理

#### 2.1 为什么需要 composable

排序逻辑涉及：受控/非受控模式判断、排序方向循环切换、数据排序计算。抽成 composable 可以让 Table.tsx 保持精简，也方便后续单元测试。

#### 2.2 创建 `packages/table/src/composables/useSorter.ts`

```typescript
// packages/table/src/composables/useSorter.ts

import { computed, ref, watch, type Ref } from 'vue'
import type { ColumnType, Key, SortOrder, SorterFn } from '../types'
import { getByDataIndex } from './useColumns'

/** 排序状态 */
export interface SorterState {
  /** 排序列的 key */
  columnKey: Key | undefined
  /** 排序方向 */
  order: SortOrder
  /** 排序列配置 */
  column: ColumnType<Record<string, unknown>> | undefined
}

/** change 事件中的 sorter 参数 */
export interface SorterResult {
  column: ColumnType<Record<string, unknown>> | undefined
  columnKey: Key | undefined
  order: SortOrder
  field: ColumnType<Record<string, unknown>>['dataIndex']
}

/**
 * 获取列的唯一标识。
 * 优先使用 key，其次 dataIndex 转字符串。
 */
function getColumnKey(column: ColumnType<Record<string, unknown>>): Key | undefined {
  if (column.key !== undefined) return column.key
  if (column.dataIndex !== undefined) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex)
  }
  return undefined
}

/**
 * 默认比较函数。
 * 数字按大小排，字符串按 localeCompare，其余转字符串比较。
 */
function defaultCompare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}

/**
 * 获取列的可用排序方向列表。
 * 默认 ['ascend', 'descend']，用户可通过 sortDirections 自定义。
 */
function getSortDirections(column: ColumnType<Record<string, unknown>>): SortOrder[] {
  return column.sortDirections ?? ['ascend', 'descend']
}

/**
 * 计算下一个排序方向。
 * 在 sortDirections 数组中循环，超出末尾回到 null（无排序）。
 */
function getNextSortOrder(current: SortOrder, directions: SortOrder[]): SortOrder {
  const index = directions.indexOf(current)
  // 当前方向不在列表中或已是最后一个 → 回到 null
  if (index === -1 || index >= directions.length - 1) return null
  return directions[index + 1]
}

export interface UseSorterOptions {
  /** 响应式列配置 getter */
  columns: () => ColumnType<Record<string, unknown>>[]
  /** 排序变化回调（用于触发 change 事件） */
  onSorterChange?: (sorterResult: SorterResult) => void
}

/**
 * 排序状态管理 composable。
 *
 * 支持受控（column.sortOrder）和非受控（内部 ref）两种模式：
 * - 受控：column.sortOrder 不为 undefined 时，组件不管理排序状态
 * - 非受控：首次使用 column.defaultSortOrder，后续内部维护
 *
 * 返回值：
 * - sortedData：排序后的数据（computed）
 * - sorterState：当前排序状态（computed）
 * - toggleSortOrder：切换排序方向（表头点击时调用）
 * - getSortOrder：获取某列的当前排序方向
 */
export function useSorter(options: UseSorterOptions) {
  const { columns, onSorterChange } = options

  // ---- 非受控模式的内部状态 ----
  const innerSortColumnKey = ref<Key | undefined>(undefined) as Ref<Key | undefined>
  const innerSortOrder = ref<SortOrder>(null) as Ref<SortOrder>

  // 初始化：查找第一个有 defaultSortOrder 的列
  const initColumn = columns().find((col) => col.defaultSortOrder && col.sorter)
  if (initColumn) {
    innerSortColumnKey.value = getColumnKey(initColumn)
    innerSortOrder.value = initColumn.defaultSortOrder!
  }

  /**
   * 判断某列是否处于受控模式。
   * column.sortOrder 不为 undefined 即视为受控。
   */
  function isControlled(column: ColumnType<Record<string, unknown>>): boolean {
    return column.sortOrder !== undefined
  }

  /**
   * 获取某列的当前排序方向。
   */
  function getSortOrder(column: ColumnType<Record<string, unknown>>): SortOrder {
    const key = getColumnKey(column)
    // 受控模式直接返回 column.sortOrder
    if (isControlled(column)) return column.sortOrder!
    // 非受控模式：只有当前活跃排序列才有方向
    if (key !== undefined && key === innerSortColumnKey.value) return innerSortOrder.value
    return null
  }

  /**
   * 切换排序方向。
   * 表头点击时调用。
   */
  function toggleSortOrder(column: ColumnType<Record<string, unknown>>): void {
    if (!column.sorter) return

    const key = getColumnKey(column)
    const currentOrder = getSortOrder(column)
    const directions = getSortDirections(column)
    const nextOrder = getNextSortOrder(currentOrder, directions)

    // 非受控模式：更新内部状态
    if (!isControlled(column)) {
      if (nextOrder === null) {
        innerSortColumnKey.value = undefined
        innerSortOrder.value = null
      } else {
        innerSortColumnKey.value = key
        innerSortOrder.value = nextOrder
      }
    }

    // 触发回调（无论受控/非受控）
    onSorterChange?.({
      column: nextOrder ? column : undefined,
      columnKey: nextOrder ? key : undefined,
      order: nextOrder,
      field: column.dataIndex,
    })
  }

  /**
   * 当前排序状态（computed）。
   */
  const sorterState = computed<SorterState>(() => {
    // 优先查找受控列
    const controlledCol = columns().find(
      (col) => col.sorter && isControlled(col) && col.sortOrder !== null,
    )
    if (controlledCol) {
      return {
        columnKey: getColumnKey(controlledCol),
        order: controlledCol.sortOrder!,
        column: controlledCol,
      }
    }

    // 非受控模式
    if (innerSortColumnKey.value !== undefined && innerSortOrder.value !== null) {
      const col = columns().find((c) => getColumnKey(c) === innerSortColumnKey.value)
      return {
        columnKey: innerSortColumnKey.value,
        order: innerSortOrder.value,
        column: col,
      }
    }

    return { columnKey: undefined, order: null, column: undefined }
  })

  /**
   * 排序数据。
   *
   * @param data - 原始数据数组
   * @returns 排序后的新数组（不修改原数组）
   */
  function sortData<TRecord extends Record<string, unknown>>(data: TRecord[]): TRecord[] {
    const { column, order } = sorterState.value
    if (!column || !order || !column.sorter) return data

    const compareFn: SorterFn<TRecord> =
      typeof column.sorter === 'function'
        ? (column.sorter as SorterFn<TRecord>)
        : (a, b) =>
            defaultCompare(getByDataIndex(a, column.dataIndex), getByDataIndex(b, column.dataIndex))

    const multiplier = order === 'descend' ? -1 : 1

    return [...data].sort((a, b) => compareFn(a, b) * multiplier)
  }

  return {
    sorterState,
    getSortOrder,
    toggleSortOrder,
    sortData,
  }
}

export { getColumnKey }
```

**关键设计决策**：

| 决策                                     | 原因                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| 受控/非受控双模式                        | 与 antdv API 一致。受控模式让用户完全掌控排序状态           |
| `sortDirections` 循环切换                | 用户可配 `['ascend', 'descend']`（两态）或加 `null`（三态） |
| `sortData` 返回新数组                    | 不修改原始 `dataSource`，遵循不可变数据原则                 |
| `getColumnKey` 兼容 `key` 和 `dataIndex` | antdv 同逻辑：优先 `key`，其次 `dataIndex` 转字符串         |
| 初始化查找 `defaultSortOrder`            | 仅在 setup 阶段执行一次，符合非受控默认值语义               |

#### 2.3 更新 `packages/table/src/composables/index.ts`

```typescript
// packages/table/src/composables/index.ts

export { useColumns, getByDataIndex } from './useColumns'
export { useSorter, getColumnKey } from './useSorter'
export type { SorterState, SorterResult } from './useSorter'
```

#### 2.4 验证

```bash
pnpm build
```

预期：构建通过（composable 尚未被组件引用，不影响渲染）。

---

### Step 3：SortButton.tsx — 排序图标组件

#### 3.1 为什么需要独立组件

排序图标有三态（升序/降序/无排序），点击交互需要事件处理。抽成独立组件让 TableHeaderCell 保持简洁，也方便后续主题化。

#### 3.2 创建 `packages/table/src/components/SortButton.tsx`

```tsx
// packages/table/src/components/SortButton.tsx

import { defineComponent, type PropType } from 'vue'
import type { SortOrder } from '../types'

/**
 * 排序图标组件。
 *
 * 三态显示：
 * - null：上下箭头均为浅色（无排序）
 * - 'ascend'：上箭头高亮
 * - 'descend'：下箭头高亮
 *
 * 使用纯 CSS border 绘制三角形，避免引入图标库。
 */
export default defineComponent({
  name: 'SortButton',
  props: {
    sortOrder: { type: [String, null] as PropType<SortOrder>, default: null },
    sortButtonClass: { type: String, default: '' },
  },
  emits: ['click'],
  setup(props, { emit }) {
    function handleClick(e: MouseEvent) {
      e.stopPropagation()
      emit('click')
    }

    return () => (
      <span
        class={[
          'inline-flex flex-col items-center justify-center gap-[1px] cursor-pointer ml-1',
          props.sortButtonClass,
        ]}
        onClick={handleClick}
        role="button"
        aria-label="Sort"
      >
        {/* 上箭头（ascend） */}
        <span
          class={[
            'w-0 h-0',
            'border-l-[4px] border-l-transparent',
            'border-r-[4px] border-r-transparent',
            'border-b-[5px]',
            props.sortOrder === 'ascend'
              ? 'border-b-[var(--color-primary)]'
              : 'border-b-[var(--color-muted)]',
          ]}
        />
        {/* 下箭头（descend） */}
        <span
          class={[
            'w-0 h-0',
            'border-l-[4px] border-l-transparent',
            'border-r-[4px] border-r-transparent',
            'border-t-[5px]',
            props.sortOrder === 'descend'
              ? 'border-t-[var(--color-primary)]'
              : 'border-t-[var(--color-muted)]',
          ]}
        />
      </span>
    )
  },
})
```

**关键设计**：

| 决策                   | 原因                                       |
| ---------------------- | ------------------------------------------ |
| CSS border 三角形      | 零依赖，不引入图标库，体积小               |
| `--color-primary`      | 高亮色引用语义 token，暗色模式自动跟随     |
| `--color-muted`        | 非活跃色引用语义 token                     |
| `e.stopPropagation()`  | 避免事件冒泡到 `<th>` 上触发其他交互       |
| `sortButtonClass` prop | 预留主题化入口，后续可通过 theme slot 覆盖 |

#### 3.3 验证

文件创建完毕。接 Step 4 集成到 TableHeaderCell。

---

### Step 4：TableHeaderCell 集成排序

#### 4.1 为什么改 TableHeaderCell 而不是 TableHeader

排序图标和表头文字紧密关联（同一个 `<th>` 内），交互也在单元格级别。在 TableHeaderCell 中处理最自然。

#### 4.2 扩展 Table Context — 传递排序状态

修改 `packages/table/src/context.ts`，新增排序相关字段：

```typescript
// packages/table/src/context.ts

import type { InjectionKey, Slots } from 'vue'
import type { ColumnType, SortOrder } from './types'

/**
 * Table 内部 context，通过 provide/inject 跨层传递。
 */
export interface TableContext {
  // ---- Slot 传递 ----
  bodyCell?: Slots['bodyCell']
  headerCell?: Slots['headerCell']
  empty?: Slots['empty']

  // ---- 排序（Step 4 新增） ----
  /** 获取某列的当前排序方向 */
  getSortOrder?: (column: ColumnType<Record<string, unknown>>) => SortOrder
  /** 切换某列的排序方向 */
  toggleSortOrder?: (column: ColumnType<Record<string, unknown>>) => void

  // ---- 筛选（Step 9 新增） ----
  /** 获取某列的当前筛选值 */
  getFilteredValue?: (column: ColumnType<Record<string, unknown>>) => (string | number | boolean)[]
  /** 确认筛选 */
  confirmFilter?: (
    column: ColumnType<Record<string, unknown>>,
    values: (string | number | boolean)[],
  ) => void
  /** 重置筛选 */
  resetFilter?: (column: ColumnType<Record<string, unknown>>) => void

  // ---- 行选择（Step 14 新增） ----
  /** 自定义筛选下拉菜单 slot */
  customFilterDropdown?: Slots['customFilterDropdown']
}

export const TABLE_CONTEXT_KEY: InjectionKey<TableContext> = Symbol('vtable-table-context')
```

**关键说明**：排序和筛选的方法函数通过 context 传递，避免 TableHeaderCell 需要知道 composable 的内部细节。一次性加入筛选字段，减少后续改动。

#### 4.3 修改 `packages/table/src/components/TableHeaderCell.tsx`

集成排序图标和点击交互：

```tsx
// packages/table/src/components/TableHeaderCell.tsx

import { computed, defineComponent, inject, type PropType } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'
import type { ColumnType } from '../types'
import SortButton from './SortButton'

export default defineComponent({
  name: 'TableHeaderCell',
  props: {
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    index: { type: Number, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    // ---- 排序状态 ----
    const sortOrder = computed(() => {
      if (!props.column.sorter) return null
      return tableContext.getSortOrder?.(props.column) ?? null
    })

    const isSortable = computed(() => !!props.column.sorter)

    function handleHeaderClick() {
      if (isSortable.value) {
        tableContext.toggleSortOrder?.(props.column)
      }
    }

    // ---- 渲染内容 ----
    const headerContent = computed(() => {
      if (tableContext.headerCell) {
        return tableContext.headerCell({
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
      const cursorClass = isSortable.value ? 'cursor-pointer select-none' : ''
      return [props.thClass, alignClass, cursorClass, props.column.className]
        .filter(Boolean)
        .join(' ')
    })

    const widthStyle = computed(() => {
      if (!props.column.width) return undefined
      return {
        width:
          typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
      }
    })

    return () => (
      <th class={cellClass.value} style={widthStyle.value} onClick={handleHeaderClick}>
        <span class={props.headerCellInnerClass}>
          {headerContent.value}
          {isSortable.value && <SortButton sortOrder={sortOrder.value} />}
        </span>
      </th>
    )
  },
})
```

**关键变更**：

| 变更                      | 说明                                             |
| ------------------------- | ------------------------------------------------ |
| 新增 `SortButton` 渲染    | 当 `column.sorter` 有值时显示排序图标            |
| `getSortOrder` via inject | 通过 context 获取排序方向，不直接引用 composable |
| `handleHeaderClick`       | 点击 `<th>` 触发排序切换                         |
| `cursor-pointer`          | 可排序列显示手型光标                             |

#### 4.4 验证

```bash
pnpm build
```

预期：构建通过。此时排序图标会渲染，但还没有排序逻辑——需要 Step 5 在 Table.tsx 中接入 useSorter 并 provide context。

---

### Step 5：Table.tsx 集成排序 + change 事件骨架

#### 5.1 为什么现在改 Table.tsx

TableHeaderCell 已经通过 inject 消费排序 context，现在需要 Table.tsx 作为提供方，创建 useSorter 实例并 provide 排序方法。

#### 5.2 扩展 Table 类型 — change 事件签名

修改 `packages/table/src/types/table.ts`，新增 change 事件相关类型：

```typescript
// packages/table/src/types/table.ts

import type { ThemePresetName, SlotProps } from '@vtable-guild/core'
import type { VNodeChild } from 'vue'
import type { ColumnsType, ColumnType, Key, SortOrder, ColumnFilterItem } from './column'
import type { TableSlots } from '@vtable-guild/theme'
import type { SorterResult } from '../composables/useSorter'

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
 * customFilterDropdown slot 的参数类型。
 */
export interface CustomFilterDropdownSlotProps<TRecord extends Record<string, unknown>> {
  column: ColumnType<TRecord>
  selectedKeys: (string | number | boolean)[]
  setSelectedKeys: (keys: (string | number | boolean)[]) => void
  confirm: () => void
  clearFilters: () => void
}

/**
 * Table 组件 slots 声明。
 */
export interface TableSlotsDecl<TRecord extends Record<string, unknown>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
  customFilterDropdown?: (props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild
}

// ---- change 事件参数类型 ----

/** change 事件中的 filters 参数 */
export type TableFiltersInfo = Record<string, (string | number | boolean)[] | null>

/** change 事件中的 extra 参数 */
export interface TableChangeExtra<TRecord extends Record<string, unknown>> {
  /** 触发变化的来源 */
  action: 'sort' | 'filter'
  /** 当前显示的数据（经排序/筛选后） */
  currentDataSource: TRecord[]
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
  /** 主题预设 */
  themePreset?: ThemePresetName
}
```

#### 5.3 更新 `packages/table/src/types/index.ts`

新增导出类型：

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
  SortOrder,
  SorterFn,
  ColumnSorter,
  ColumnFilterItem,
} from './column'

export type {
  TableProps,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableSlotsDecl,
  CustomFilterDropdownSlotProps,
  TableFiltersInfo,
  TableChangeExtra,
} from './table'
```

#### 5.4 修改 `packages/table/src/components/Table.tsx`

接入 useSorter，provide 排序方法到 context：

```tsx
// packages/table/src/components/Table.tsx

import { computed, defineComponent, inject, provide, type PropType, type SlotsType } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import {
  resolveTableThemePreset,
  tableTheme,
  type TableSlots,
  type TableThemeConfig,
} from '@vtable-guild/theme'
import type { SlotProps, ThemePresetName } from '@vtable-guild/core'
import { useColumns } from '../composables/useColumns'
import { useSorter } from '../composables/useSorter'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import TableLoading from './TableLoading'
import type {
  ColumnsType,
  ColumnType,
  Key,
  SorterResult,
  TableFiltersInfo,
  TableChangeExtra,
} from '../types'

export default defineComponent({
  name: 'VTable',
  props: {
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    columns: { type: Array as PropType<ColumnsType<Record<string, unknown>>>, default: () => [] },
    rowKey: {
      type: [String, Function] as PropType<string | ((record: Record<string, unknown>) => Key)>,
      default: undefined,
    },
    loading: { type: Boolean, default: false },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'lg' },
    bordered: { type: Boolean, default: false },
    striped: { type: Boolean, default: false },
    hoverable: { type: Boolean, default: true },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<TableSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
    themePreset: { type: String as PropType<ThemePresetName>, default: undefined },
  },
  emits: {
    change: (
      _filters: TableFiltersInfo,
      _sorter: SorterResult,
      _extra: TableChangeExtra<Record<string, unknown>>,
    ) => true,
  },
  slots: Object as SlotsType<{
    bodyCell: {
      text: unknown
      record: Record<string, unknown>
      index: number
      column: ColumnType<Record<string, unknown>>
    }
    headerCell: {
      title: string | undefined
      column: ColumnType<Record<string, unknown>>
      index: number
    }
    empty: object
    loading: object
    customFilterDropdown: {
      column: ColumnType<Record<string, unknown>>
      selectedKeys: (string | number | boolean)[]
      setSelectedKeys: (keys: (string | number | boolean)[]) => void
      confirm: () => void
      clearFilters: () => void
    }
  }>,
  setup(props, { slots, emit }) {
    // ---- Preset 解析 ----
    const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)
    const effectivePreset = computed(
      () => props.themePreset ?? globalContext?.themePreset ?? 'antdv',
    )

    const defaultTheme = resolveTableThemePreset(effectivePreset.value) ?? tableTheme
    const { slots: themeSlots } = useTheme('table', defaultTheme, props)

    // ---- 列解析 ----
    const { leafColumns } = useColumns(() => props.columns)

    // ---- 排序（Step 5 新增） ----
    const { sorterState, getSortOrder, toggleSortOrder, sortData } = useSorter({
      columns: () => leafColumns.value,
      onSorterChange(sorterResult) {
        // 构造 change 事件参数
        const processedData = sortData(props.dataSource)
        emit('change', {}, sorterResult, { action: 'sort', currentDataSource: processedData })
      },
    })

    // ---- 处理后数据：排序 → (后续筛选) ----
    const processedData = computed(() => {
      let data = props.dataSource
      data = sortData(data)
      return data
    })

    // ---- provide context ----
    provide<TableContext>(TABLE_CONTEXT_KEY, {
      bodyCell: slots.bodyCell,
      headerCell: slots.headerCell,
      empty: slots.empty,
      getSortOrder,
      toggleSortOrder,
    })

    return () => (
      <div class={themeSlots.root()}>
        <div class={themeSlots.wrapper()}>
          <table class={themeSlots.table()}>
            <TableHeader
              columns={leafColumns.value}
              theadClass={themeSlots.thead()}
              rowClass={themeSlots.tr()}
              thClass={themeSlots.th()}
              headerCellInnerClass={themeSlots.headerCellInner()}
            />
            <TableBody
              dataSource={processedData.value}
              columns={leafColumns.value}
              tbodyClass={themeSlots.tbody()}
              rowClass={themeSlots.tr()}
              tdClass={themeSlots.td()}
              emptyClass={themeSlots.empty()}
              bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
              rowKey={props.rowKey}
            />
          </table>

          {props.loading && (
            <TableLoading loadingClass={themeSlots.loading()}>
              {slots.loading?.() ?? 'Loading...'}
            </TableLoading>
          )}
        </div>
      </div>
    )
  },
})
```

**关键变更**：

| 变更                     | 说明                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| 新增 `useSorter`         | 管理排序状态，提供 `getSortOrder`/`toggleSortOrder`              |
| `processedData` computed | 排序后的数据传给 TableBody（替代直接传 `props.dataSource`）      |
| `emits.change`           | 定义 change 事件签名，排序变化时触发                             |
| context 新增排序方法     | provide `getSortOrder`/`toggleSortOrder` 给 TableHeaderCell 消费 |

#### 5.5 更新 `packages/table/src/index.ts`

新增排序相关类型导出：

```typescript
// packages/table/src/index.ts

export { default as VTable } from './components/Table'

export type {
  Key,
  AlignType,
  DataIndex,
  CustomRenderContext,
  ColumnType,
  ColumnGroupType,
  ColumnsType,
  SortOrder,
  SorterFn,
  ColumnSorter,
  ColumnFilterItem,
  TableProps,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableSlotsDecl,
  CustomFilterDropdownSlotProps,
  TableFiltersInfo,
  TableChangeExtra,
} from './types'

export { useColumns, getByDataIndex } from './composables'
export type { SorterResult } from './composables'
```

#### 5.6 验证检查点 #1 — 排序功能

```bash
pnpm build
```

预期：`Tasks: 5 successful, 5 total`

**功能验证**（在 playground 中测试）：

```vue
<VTable
  :columns="[
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: true },
    { title: 'Age', dataIndex: 'age', key: 'age', sorter: (a, b) => a.age - b.age },
    { title: 'Address', dataIndex: 'address', key: 'address' },
  ]"
  :data-source="dataSource"
  @change="(f, s, e) => console.log('change', { s, e })"
/>
```

验证项：

| #   | 验证项             | 操作               | 预期                         |
| --- | ------------------ | ------------------ | ---------------------------- |
| 1   | 排序图标显示       | 查看 Name/Age 列   | 显示上下箭头                 |
| 2   | 非排序列无图标     | 查看 Address 列    | 无箭头                       |
| 3   | 点击升序           | 点击 Name 列       | 上箭头高亮，数据升序排列     |
| 4   | 再次点击降序       | 再点击 Name 列     | 下箭头高亮，数据降序排列     |
| 5   | 第三次点击取消排序 | 再点击 Name 列     | 箭头均灰色，数据回到原始顺序 |
| 6   | 自定义 sorter 函数 | 点击 Age 列        | 按数值排序                   |
| 7   | change 事件        | 点击排序后看控制台 | 打印 sorter 信息             |

---

## Part 2：筛选（Step 6 – 10）

### Step 6：筛选类型已就绪

#### 6.1 说明

在 Step 1 中，筛选相关的类型字段（`filters`、`onFilter`、`filterMultiple`、`filteredValue`、`defaultFilteredValue`、`customFilterDropdown`）已经一并添加到 `ColumnType` 中。无需额外修改类型文件。

#### 6.2 验证

确认 `packages/table/src/types/column.ts` 中包含以下字段即可：

- `filters?: ColumnFilterItem[]`
- `onFilter?: (value, record) => boolean`
- `filterMultiple?: boolean`
- `filteredValue?: (string | number | boolean)[] | null`
- `defaultFilteredValue?: (string | number | boolean)[]`
- `customFilterDropdown?: boolean`

---

### Step 7：useFilter composable — 筛选状态管理

#### 7.1 为什么需要 composable

筛选逻辑与排序类似，需要受控/非受控双模式管理。抽成 composable 保持关注点分离。

#### 7.2 创建 `packages/table/src/composables/useFilter.ts`

```typescript
// packages/table/src/composables/useFilter.ts

import { computed, reactive } from 'vue'
import type { ColumnType, Key } from '../types'
import { getColumnKey } from './useSorter'

/** change 事件中的 filters 参数 */
export type FiltersRecord = Record<string, (string | number | boolean)[] | null>

export interface UseFilterOptions {
  /** 响应式列配置 getter */
  columns: () => ColumnType<Record<string, unknown>>[]
  /** 筛选变化回调 */
  onFilterChange?: (filters: FiltersRecord) => void
}

/**
 * 筛选状态管理 composable。
 *
 * 支持受控（column.filteredValue）和非受控（内部 reactive）两种模式。
 */
export function useFilter(options: UseFilterOptions) {
  const { columns, onFilterChange } = options

  // ---- 非受控模式的内部状态 ----
  // key: columnKey, value: 选中的筛选值数组
  const innerFilterState = reactive<Record<string, (string | number | boolean)[]>>({})

  // 初始化：查找有 defaultFilteredValue 的列
  for (const col of columns()) {
    const key = getColumnKey(col)
    if (key !== undefined && col.defaultFilteredValue?.length) {
      innerFilterState[String(key)] = [...col.defaultFilteredValue]
    }
  }

  /**
   * 判断某列是否处于受控模式。
   */
  function isControlled(column: ColumnType<Record<string, unknown>>): boolean {
    return column.filteredValue !== undefined
  }

  /**
   * 获取某列的当前筛选值。
   */
  function getFilteredValue(
    column: ColumnType<Record<string, unknown>>,
  ): (string | number | boolean)[] {
    if (isControlled(column)) return column.filteredValue ?? []
    const key = getColumnKey(column)
    if (key === undefined) return []
    return innerFilterState[String(key)] ?? []
  }

  /**
   * 确认筛选。
   * @param column - 目标列
   * @param values - 选中的筛选值
   */
  function confirmFilter(
    column: ColumnType<Record<string, unknown>>,
    values: (string | number | boolean)[],
  ): void {
    const key = getColumnKey(column)
    if (key === undefined) return

    // 非受控模式：更新内部状态
    if (!isControlled(column)) {
      if (values.length > 0) {
        innerFilterState[String(key)] = values
      } else {
        delete innerFilterState[String(key)]
      }
    }

    // 触发回调
    onFilterChange?.(getAllFilters())
  }

  /**
   * 重置筛选。
   */
  function resetFilter(column: ColumnType<Record<string, unknown>>): void {
    confirmFilter(column, [])
  }

  /**
   * 获取所有列的筛选状态。
   */
  function getAllFilters(): FiltersRecord {
    const result: FiltersRecord = {}
    for (const col of columns()) {
      const key = getColumnKey(col)
      if (key === undefined) continue
      const values = getFilteredValue(col)
      result[String(key)] = values.length > 0 ? values : null
    }
    return result
  }

  /**
   * 筛选数据。
   *
   * @param data - 原始数据数组
   * @returns 筛选后的新数组
   */
  function filterData<TRecord extends Record<string, unknown>>(data: TRecord[]): TRecord[] {
    const cols = columns()
    // 收集所有有活跃筛选的列
    const activeFilters = cols.filter((col) => {
      if (!col.onFilter) return false
      const values = getFilteredValue(col)
      return values.length > 0
    })

    if (activeFilters.length === 0) return data

    return data.filter((record) =>
      activeFilters.every((col) => {
        const values = getFilteredValue(col)
        // filterMultiple 默认 true → 任意一个值匹配即通过
        const multiple = col.filterMultiple !== false
        if (multiple) {
          return values.some((v) => col.onFilter!(v, record as Record<string, unknown>))
        }
        // 单选模式：第一个值匹配
        return values.length > 0 && col.onFilter!(values[0], record as Record<string, unknown>)
      }),
    )
  }

  return {
    getFilteredValue,
    confirmFilter,
    resetFilter,
    getAllFilters,
    filterData,
  }
}
```

**关键设计**：

| 决策                            | 原因                                           |
| ------------------------------- | ---------------------------------------------- |
| `reactive` 存储筛选状态         | 多列可同时筛选，reactive 对象按 key 存储更直观 |
| `filterMultiple` 默认 `true`    | 与 antdv 行为一致，多选是更常见场景            |
| `confirmFilter` + `resetFilter` | 对应筛选弹窗的"确定"和"重置"按钮               |
| `getAllFilters` 返回全量        | change 事件需要全部列的筛选状态                |

#### 7.3 更新 `packages/table/src/composables/index.ts`

```typescript
// packages/table/src/composables/index.ts

export { useColumns, getByDataIndex } from './useColumns'
export { useSorter, getColumnKey } from './useSorter'
export type { SorterState, SorterResult } from './useSorter'
export { useFilter } from './useFilter'
export type { FiltersRecord } from './useFilter'
```

#### 7.4 验证

```bash
pnpm build
```

预期：构建通过。

---

### Step 8：FilterDropdown.tsx + FilterIcon.tsx — 筛选 UI 组件

#### 8.1 为什么拆成两个组件

- `FilterIcon.tsx`：筛选图标，显示在表头中，点击切换弹窗
- `FilterDropdown.tsx`：筛选弹窗，包含筛选项列表、确定/重置按钮

拆开后 FilterIcon 可以独立主题化，FilterDropdown 可以通过 Teleport 渲染到 body 外。

#### 8.2 创建 `packages/table/src/components/FilterIcon.tsx`

```tsx
// packages/table/src/components/FilterIcon.tsx

import { defineComponent, type PropType } from 'vue'

/**
 * 筛选图标组件。
 *
 * 有筛选值活跃时高亮，否则灰色。
 * 使用 SVG 渲染漏斗图标。
 */
export default defineComponent({
  name: 'FilterIcon',
  props: {
    active: { type: Boolean, default: false },
    filterIconClass: { type: String, default: '' },
  },
  emits: ['click'],
  setup(props, { emit }) {
    function handleClick(e: MouseEvent) {
      e.stopPropagation()
      emit('click')
    }

    return () => (
      <span
        class={[
          'inline-flex items-center justify-center cursor-pointer ml-1',
          props.filterIconClass,
        ]}
        onClick={handleClick}
        role="button"
        aria-label="Filter"
      >
        <svg
          viewBox="64 64 896 896"
          width="12"
          height="12"
          fill={props.active ? 'var(--color-primary)' : 'var(--color-muted)'}
        >
          <path d="M349 838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V642H349v196zm531.1-684H143.9c-24.5 0-39.8 26.7-27.5 48l221.3 376.4V842c0 12.7 10.3 22 22 22h305c11.7 0 22-9.3 22-22V578.4L907.7 202c12.2-21.3-3.1-48-27.6-48z" />
        </svg>
      </span>
    )
  },
})
```

#### 8.3 创建 `packages/table/src/components/FilterDropdown.tsx`

```tsx
// packages/table/src/components/FilterDropdown.tsx

import {
  defineComponent,
  ref,
  computed,
  Teleport,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  type PropType,
} from 'vue'
import type { ColumnFilterItem } from '../types'

/**
 * 筛选下拉菜单组件。
 *
 * 通过 Teleport 渲染到 body，避免被 table overflow 裁切。
 * 使用绝对定位 + 锚点元素的位置计算。
 */
export default defineComponent({
  name: 'FilterDropdown',
  props: {
    visible: { type: Boolean, required: true },
    filters: { type: Array as PropType<ColumnFilterItem[]>, default: () => [] },
    selectedKeys: { type: Array as PropType<(string | number | boolean)[]>, default: () => [] },
    filterMultiple: { type: Boolean, default: true },
    /** 锚点元素，用于计算弹窗位置 */
    anchorEl: { type: Object as PropType<HTMLElement | null>, default: null },
  },
  emits: ['confirm', 'reset', 'update:selectedKeys', 'close'],
  setup(props, { emit }) {
    const dropdownRef = ref<HTMLElement | null>(null)
    const localSelectedKeys = ref<(string | number | boolean)[]>([...props.selectedKeys])

    // 同步外部 selectedKeys
    watch(
      () => props.selectedKeys,
      (keys) => {
        localSelectedKeys.value = [...keys]
      },
    )

    // ---- 定位逻辑 ----
    const position = ref({ top: 0, left: 0 })

    function updatePosition() {
      if (!props.anchorEl) return
      const rect = props.anchorEl.getBoundingClientRect()
      position.value = {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      }
    }

    watch(
      () => props.visible,
      (visible) => {
        if (visible) {
          nextTick(updatePosition)
        }
      },
    )

    // ---- 点击外部关闭 ----
    function handleClickOutside(e: MouseEvent) {
      if (!props.visible) return
      const target = e.target as HTMLElement
      if (dropdownRef.value?.contains(target)) return
      if (props.anchorEl?.contains(target)) return
      emit('close')
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })

    // ---- 交互 ----
    function handleSelect(value: string | number | boolean) {
      if (props.filterMultiple) {
        const idx = localSelectedKeys.value.indexOf(value)
        if (idx > -1) {
          localSelectedKeys.value.splice(idx, 1)
        } else {
          localSelectedKeys.value.push(value)
        }
      } else {
        // 单选模式
        localSelectedKeys.value = [value]
      }
    }

    function handleConfirm() {
      emit('update:selectedKeys', [...localSelectedKeys.value])
      emit('confirm', [...localSelectedKeys.value])
      emit('close')
    }

    function handleReset() {
      localSelectedKeys.value = []
      emit('update:selectedKeys', [])
      emit('reset')
      emit('close')
    }

    return () => (
      <Teleport to="body">
        {props.visible && (
          <div
            ref={dropdownRef}
            class={[
              'fixed z-[1050] min-w-[120px] max-h-[300px]',
              'bg-[var(--color-surface)] border border-[var(--color-default)]',
              'rounded shadow-lg overflow-hidden',
              'text-[color:var(--color-on-surface)] text-sm',
            ]}
            style={{
              top: `${position.value.top}px`,
              left: `${position.value.left}px`,
            }}
          >
            {/* 筛选项列表 */}
            <div class="max-h-[200px] overflow-y-auto py-1">
              {props.filters.map((item) => {
                const isSelected = localSelectedKeys.value.includes(item.value)
                return (
                  <label
                    key={String(item.value)}
                    class={[
                      'flex items-center gap-2 px-3 py-1.5 cursor-pointer',
                      'hover:bg-[var(--color-surface-hover)]',
                    ]}
                  >
                    {props.filterMultiple ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelect(item.value)}
                        class="accent-[var(--color-primary)]"
                      />
                    ) : (
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleSelect(item.value)}
                        name="filter-radio"
                        class="accent-[var(--color-primary)]"
                      />
                    )}
                    <span>{item.text}</span>
                  </label>
                )
              })}
            </div>

            {/* 操作按钮 */}
            <div class="flex items-center justify-between border-t border-[var(--color-default)] px-2 py-1.5">
              <button
                class="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-on-surface)] disabled:opacity-50"
                disabled={localSelectedKeys.value.length === 0}
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                class={[
                  'text-xs px-2 py-0.5 rounded',
                  'bg-[var(--color-primary)] text-white',
                  'hover:bg-[var(--color-primary-hover)]',
                ]}
                onClick={handleConfirm}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </Teleport>
    )
  },
})
```

**关键设计**：

| 决策                           | 原因                                                      |
| ------------------------------ | --------------------------------------------------------- |
| `Teleport to="body"`           | 弹窗渲染到 body，避免被 table 的 `overflow: auto` 裁切    |
| 固定定位 + 锚点计算            | 弹窗始终出现在筛选图标下方                                |
| 点击外部关闭                   | 标准弹窗交互模式                                          |
| `localSelectedKeys`            | 编辑中的临时状态，确认后才同步到外部                      |
| 多选用 checkbox / 单选用 radio | 视觉上清晰区分两种模式                                    |
| 语义 token                     | `--color-surface`、`--color-primary` 等，暗色模式自动跟随 |

#### 8.4 验证

文件创建完毕。接 Step 9 集成到 TableHeaderCell。

---

### Step 9：TableHeaderCell 集成筛选

#### 9.1 修改 `packages/table/src/components/TableHeaderCell.tsx`

在已有排序逻辑基础上，增加筛选图标和弹窗：

```tsx
// packages/table/src/components/TableHeaderCell.tsx

import { computed, defineComponent, inject, ref, type PropType } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'
import type { ColumnType } from '../types'
import SortButton from './SortButton'
import FilterIcon from './FilterIcon'
import FilterDropdown from './FilterDropdown'

export default defineComponent({
  name: 'TableHeaderCell',
  props: {
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    index: { type: Number, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    // ---- 排序 ----
    const sortOrder = computed(() => {
      if (!props.column.sorter) return null
      return tableContext.getSortOrder?.(props.column) ?? null
    })

    const isSortable = computed(() => !!props.column.sorter)

    function handleHeaderClick() {
      if (isSortable.value) {
        tableContext.toggleSortOrder?.(props.column)
      }
    }

    // ---- 筛选 ----
    const hasFilters = computed(() => {
      return (
        (props.column.filters && props.column.filters.length > 0) ||
        props.column.customFilterDropdown
      )
    })

    const filteredValue = computed(() => {
      return tableContext.getFilteredValue?.(props.column) ?? []
    })

    const isFiltered = computed(() => filteredValue.value.length > 0)

    const filterDropdownVisible = ref(false)
    const filterAnchorRef = ref<HTMLElement | null>(null)

    function toggleFilterDropdown() {
      filterDropdownVisible.value = !filterDropdownVisible.value
    }

    function handleFilterConfirm(values: (string | number | boolean)[]) {
      tableContext.confirmFilter?.(props.column, values)
    }

    function handleFilterReset() {
      tableContext.resetFilter?.(props.column)
    }

    // ---- 渲染 ----
    const headerContent = computed(() => {
      if (tableContext.headerCell) {
        return tableContext.headerCell({
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
      const cursorClass = isSortable.value ? 'cursor-pointer select-none' : ''
      return [props.thClass, alignClass, cursorClass, props.column.className]
        .filter(Boolean)
        .join(' ')
    })

    const widthStyle = computed(() => {
      if (!props.column.width) return undefined
      return {
        width:
          typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
      }
    })

    return () => (
      <th class={cellClass.value} style={widthStyle.value} onClick={handleHeaderClick}>
        <span class={props.headerCellInnerClass}>
          {headerContent.value}

          {/* 排序图标 */}
          {isSortable.value && <SortButton sortOrder={sortOrder.value} />}

          {/* 筛选图标 + 弹窗 */}
          {hasFilters.value && (
            <span ref={filterAnchorRef}>
              <FilterIcon active={isFiltered.value} onClick={toggleFilterDropdown} />
              {/* 自定义筛选 UI */}
              {props.column.customFilterDropdown && tableContext.customFilterDropdown ? (
                filterDropdownVisible.value &&
                tableContext.customFilterDropdown({
                  column: props.column,
                  selectedKeys: filteredValue.value,
                  setSelectedKeys: (keys: (string | number | boolean)[]) => {
                    tableContext.confirmFilter?.(props.column, keys)
                  },
                  confirm: () => {
                    filterDropdownVisible.value = false
                  },
                  clearFilters: () => {
                    tableContext.resetFilter?.(props.column)
                    filterDropdownVisible.value = false
                  },
                })
              ) : (
                <FilterDropdown
                  visible={filterDropdownVisible.value}
                  filters={props.column.filters ?? []}
                  selectedKeys={filteredValue.value}
                  filterMultiple={props.column.filterMultiple !== false}
                  anchorEl={filterAnchorRef.value}
                  onConfirm={handleFilterConfirm}
                  onReset={handleFilterReset}
                  onClose={() => {
                    filterDropdownVisible.value = false
                  }}
                />
              )}
            </span>
          )}
        </span>
      </th>
    )
  },
})
```

**关键变更**：

| 变更                        | 说明                                                    |
| --------------------------- | ------------------------------------------------------- |
| `FilterIcon` 渲染           | 有 `filters` 或 `customFilterDropdown` 的列显示筛选图标 |
| `FilterDropdown` 弹窗       | 默认筛选 UI，通过 Teleport 渲染到 body                  |
| `customFilterDropdown` 分支 | 支持用户自定义筛选 UI（通过 Table 的 slot 传入）        |
| `filterAnchorRef`           | 用于 FilterDropdown 定位的锚点元素                      |

#### 9.2 验证

```bash
pnpm build
```

预期：构建通过。

---

### Step 10：Table.tsx 集成筛选 + 验证检查点 #2

#### 10.1 修改 `packages/table/src/components/Table.tsx`

接入 useFilter，扩展 context 和 processedData：

```tsx
// packages/table/src/components/Table.tsx — 筛选集成差异（在 Step 5 基础上追加）

// 新增 import
import { useFilter } from '../composables/useFilter'

// ---- 在 setup 函数中，useSorter 之后添加 ----

// ---- 筛选（Step 10 新增） ----
const { getFilteredValue, confirmFilter, resetFilter, getAllFilters, filterData } = useFilter({
  columns: () => leafColumns.value,
  onFilterChange(filters) {
    const processedResult = filterData(props.dataSource)
    const sorted = sortData(processedResult)
    emit(
      'change',
      filters,
      {
        column: sorterState.value.column,
        columnKey: sorterState.value.columnKey,
        order: sorterState.value.order,
        field: sorterState.value.column?.dataIndex,
      },
      { action: 'filter', currentDataSource: sorted },
    )
  },
})

// ---- 更新 processedData ----
const processedData = computed(() => {
  let data = props.dataSource
  data = filterData(data) // 先筛选
  data = sortData(data) // 再排序
  return data
})

// ---- 更新 provide context ----
provide<TableContext>(TABLE_CONTEXT_KEY, {
  bodyCell: slots.bodyCell,
  headerCell: slots.headerCell,
  empty: slots.empty,
  customFilterDropdown: slots.customFilterDropdown,
  getSortOrder,
  toggleSortOrder,
  getFilteredValue,
  confirmFilter,
  resetFilter,
})
```

> **注意**：上面是差异片段，不是完整文件。请在 Step 5 的 Table.tsx 基础上合并这些改动。完整的数据处理管道是：`dataSource → filterData → sortData → processedData`。

**关键变更**：

| 变更                        | 说明                                             |
| --------------------------- | ------------------------------------------------ |
| `useFilter` 接入            | 管理筛选状态                                     |
| `processedData` 更新        | 数据管道：筛选 → 排序                            |
| context 新增筛选方法        | `getFilteredValue`/`confirmFilter`/`resetFilter` |
| `customFilterDropdown` slot | 传入 context 供自定义筛选 UI 使用                |
| 筛选触发 change 事件        | 包含当前 filters + sorter 状态                   |

#### 10.2 更新 composables/index.ts 导出

```typescript
// packages/table/src/composables/index.ts

export { useColumns, getByDataIndex } from './useColumns'
export { useSorter, getColumnKey } from './useSorter'
export type { SorterState, SorterResult } from './useSorter'
export { useFilter } from './useFilter'
export type { FiltersRecord } from './useFilter'
```

#### 10.3 验证检查点 #2 — 筛选功能

```bash
pnpm build
```

预期：`Tasks: 5 successful, 5 total`

**功能验证**（在 playground 中测试）：

```vue
<VTable
  :columns="[
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      filters: [
        { text: '< 30', value: 'young' },
        { text: '30-40', value: 'middle' },
        { text: '> 40', value: 'old' },
      ],
      onFilter: (value, record) => {
        if (value === 'young') return record.age < 30
        if (value === 'middle') return record.age >= 30 && record.age <= 40
        return record.age > 40
      },
    },
    { title: 'Address', dataIndex: 'address', key: 'address' },
  ]"
  :data-source="dataSource"
  @change="(f, s, e) => console.log('change', { f, e })"
/>
```

验证项：

| #   | 验证项          | 操作                   | 预期                       |
| --- | --------------- | ---------------------- | -------------------------- |
| 1   | 筛选图标显示    | 查看 Age 列            | 显示漏斗图标               |
| 2   | 非筛选列无图标  | 查看 Name/Address 列   | 无漏斗                     |
| 3   | 点击打开弹窗    | 点击 Age 的漏斗        | 弹窗出现，显示筛选项       |
| 4   | 多选筛选        | 勾选 `< 30` + `> 40`   | 确认后只显示符合条件的行   |
| 5   | 筛选图标高亮    | 确认筛选后             | 漏斗图标变为 primary 色    |
| 6   | 重置筛选        | 打开弹窗点 Reset       | 数据恢复全部显示           |
| 7   | 点击外部关闭    | 弹窗打开时点击其他区域 | 弹窗关闭                   |
| 8   | change 事件     | 筛选操作后看控制台     | 打印 filters 信息          |
| 9   | 排序 + 筛选组合 | 先筛选再排序           | 数据先筛选再排序，结果正确 |

---

## Part 3：行选择（Step 11 – 14）

### Step 11：rowSelection 类型定义

#### 11.1 为什么 rowSelection 是一个配置对象

与 antdv 对齐：行选择的所有配置项（类型、选中 keys、回调、禁用等）聚合在 `rowSelection` prop 对象中，而不是散布在多个 prop 上。这样做的好处：

- 不传 `rowSelection` → 不启用选择功能（零开销）
- 传入 `rowSelection` 即启用，所有配置集中管理
- 便于受控/非受控模式判断

#### 11.2 修改 `packages/table/src/types/table.ts`

新增 `RowSelection` 接口和 Table props 扩展：

```typescript
// 在 packages/table/src/types/table.ts 中新增（在 TableProps 之前）

import type { Key } from './column'

/** 行选择类型 */
export type RowSelectionType = 'checkbox' | 'radio'

/**
 * 行选择配置。
 */
export interface RowSelection<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  /** 选择类型：checkbox（多选）或 radio（单选） */
  type?: RowSelectionType

  /**
   * 受控模式：选中行的 key 数组。
   * 传入后组件不再自行管理选中状态。
   */
  selectedRowKeys?: Key[]

  /**
   * 非受控默认选中行。
   */
  defaultSelectedRowKeys?: Key[]

  /**
   * 选中行变化回调。
   * @param selectedRowKeys - 所有选中行的 key
   * @param selectedRows - 所有选中行的数据
   */
  onChange?: (selectedRowKeys: Key[], selectedRows: TRecord[]) => void

  /**
   * 单行选中/取消选中回调。
   * @param record - 当前行数据
   * @param selected - 是否选中
   * @param selectedRows - 所有选中行
   */
  onSelect?: (record: TRecord, selected: boolean, selectedRows: TRecord[]) => void

  /**
   * 全选/取消全选回调。
   * @param selected - 是否全选
   * @param selectedRows - 所有选中行
   * @param changeRows - 本次变化的行
   */
  onSelectAll?: (selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void

  /**
   * 行选择框是否可选。
   * 返回 true 表示该行可选，false 表示禁用。
   */
  getCheckboxProps?: (record: TRecord) => { disabled?: boolean; name?: string }

  /**
   * 选择列宽度。
   */
  columnWidth?: number | string

  /**
   * 选择列固定位置。
   */
  fixed?: boolean | 'left' | 'right'

  /**
   * 是否在子数据全选时自动选中父行（树形数据）。
   * 本阶段不实现，预留字段。
   */
  checkStrictly?: boolean
}
```

#### 11.3 在 TableProps 中新增 rowSelection

```typescript
// 在 TableProps 接口中新增字段

export interface TableProps<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  // ... 已有字段 ...

  /**
   * 行选择配置。
   * 不传则不启用选择功能。
   */
  rowSelection?: RowSelection<TRecord>
}
```

#### 11.4 更新 `packages/table/src/types/index.ts`

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
  SortOrder,
  SorterFn,
  ColumnSorter,
  ColumnFilterItem,
} from './column'

export type {
  TableProps,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableSlotsDecl,
  CustomFilterDropdownSlotProps,
  TableFiltersInfo,
  TableChangeExtra,
  RowSelection,
  RowSelectionType,
} from './table'
```

#### 11.5 验证

```bash
pnpm build
```

预期：构建通过。新增类型不影响已有代码。

---

### Step 12：useSelection composable — 选中状态管理

#### 12.1 为什么用 Set 管理选中状态

`Set<Key>` 的 `has`/`add`/`delete` 操作均为 O(1)，适合频繁查询某行是否选中。与数组相比，大数据量下性能优势明显。

#### 12.2 创建 `packages/table/src/composables/useSelection.ts`

```typescript
// packages/table/src/composables/useSelection.ts

import { computed, ref, watch, type Ref } from 'vue'
import type { Key, RowSelection } from '../types'

export interface UseSelectionOptions {
  /** 行选择配置 getter */
  rowSelection: () => RowSelection | undefined
  /** 获取行 key 的函数 */
  getRowKey: (record: Record<string, unknown>, index: number) => Key
  /** 当前页面数据 getter */
  data: () => Record<string, unknown>[]
}

/**
 * 行选择状态管理 composable。
 *
 * 使用 Set<Key> 管理选中状态，支持 checkbox/radio 两种模式。
 * 支持受控（selectedRowKeys）和非受控（内部 Set）两种模式。
 */
export function useSelection(options: UseSelectionOptions) {
  const { rowSelection: getRowSelection, getRowKey, data } = options

  // ---- 内部状态 ----
  const innerSelectedKeys = ref(new Set<Key>()) as Ref<Set<Key>>

  // 初始化默认值
  const initial = getRowSelection()
  if (initial?.defaultSelectedRowKeys) {
    innerSelectedKeys.value = new Set(initial.defaultSelectedRowKeys)
  }

  /**
   * 判断是否受控模式。
   */
  function isControlled(): boolean {
    return getRowSelection()?.selectedRowKeys !== undefined
  }

  /**
   * 获取当前选中的 key 集合。
   */
  const selectedKeySet = computed<Set<Key>>(() => {
    const sel = getRowSelection()
    if (sel?.selectedRowKeys) return new Set(sel.selectedRowKeys)
    return innerSelectedKeys.value
  })

  /**
   * 获取选中行的数据。
   */
  function getSelectedRows(): Record<string, unknown>[] {
    const keys = selectedKeySet.value
    return data().filter((record, index) => keys.has(getRowKey(record, index)))
  }

  /**
   * 触发 onChange 回调。
   */
  function triggerChange(keys: Key[]) {
    const sel = getRowSelection()
    const rows = data().filter((record, index) => {
      const key = getRowKey(record, index)
      return keys.includes(key)
    })
    sel?.onChange?.(keys, rows)
  }

  /**
   * 判断某行是否选中。
   */
  function isSelected(key: Key): boolean {
    return selectedKeySet.value.has(key)
  }

  /**
   * 判断某行的选择框是否禁用。
   */
  function isDisabled(record: Record<string, unknown>): boolean {
    const sel = getRowSelection()
    if (!sel?.getCheckboxProps) return false
    return sel.getCheckboxProps(record)?.disabled ?? false
  }

  /**
   * 选中/取消选中单行。
   */
  function toggleRow(record: Record<string, unknown>, index: number): void {
    const sel = getRowSelection()
    if (!sel) return

    const key = getRowKey(record, index)
    const type = sel.type ?? 'checkbox'

    let newKeys: Key[]

    if (type === 'radio') {
      // radio 模式：始终只选一个
      newKeys = [key]
    } else {
      // checkbox 模式：切换
      const currentKeys = [...selectedKeySet.value]
      const idx = currentKeys.indexOf(key)
      if (idx > -1) {
        currentKeys.splice(idx, 1)
      } else {
        currentKeys.push(key)
      }
      newKeys = currentKeys
    }

    // 非受控模式：更新内部状态
    if (!isControlled()) {
      innerSelectedKeys.value = new Set(newKeys)
    }

    // 触发回调
    const selected = newKeys.includes(key)
    sel.onSelect?.(record, selected, getSelectedRows())
    triggerChange(newKeys)
  }

  /**
   * 全选/取消全选。
   */
  function toggleAll(selected: boolean): void {
    const sel = getRowSelection()
    if (!sel || sel.type === 'radio') return

    const currentData = data()
    let newKeys: Key[]
    let changeRows: Record<string, unknown>[]

    if (selected) {
      // 全选：添加所有可选行
      const currentKeys = new Set(selectedKeySet.value)
      changeRows = []
      for (let i = 0; i < currentData.length; i++) {
        const record = currentData[i]
        if (isDisabled(record)) continue
        const key = getRowKey(record, i)
        if (!currentKeys.has(key)) {
          currentKeys.add(key)
          changeRows.push(record)
        }
      }
      newKeys = [...currentKeys]
    } else {
      // 取消全选：移除当前所有可选行
      const currentKeys = new Set(selectedKeySet.value)
      changeRows = []
      for (let i = 0; i < currentData.length; i++) {
        const record = currentData[i]
        if (isDisabled(record)) continue
        const key = getRowKey(record, i)
        if (currentKeys.has(key)) {
          currentKeys.delete(key)
          changeRows.push(record)
        }
      }
      newKeys = [...currentKeys]
    }

    // 非受控模式
    if (!isControlled()) {
      innerSelectedKeys.value = new Set(newKeys)
    }

    sel.onSelectAll?.(selected, getSelectedRows(), changeRows)
    triggerChange(newKeys)
  }

  /**
   * 全选状态：checked / indeterminate / unchecked。
   */
  const allCheckedState = computed<'all' | 'partial' | 'none'>(() => {
    const currentData = data()
    if (currentData.length === 0) return 'none'

    const selectableData = currentData.filter((r) => !isDisabled(r))
    if (selectableData.length === 0) return 'none'

    const selectedCount = selectableData.filter((record, index) =>
      selectedKeySet.value.has(getRowKey(record, index)),
    ).length

    if (selectedCount === 0) return 'none'
    if (selectedCount === selectableData.length) return 'all'
    return 'partial'
  })

  return {
    selectedKeySet,
    isSelected,
    isDisabled,
    toggleRow,
    toggleAll,
    allCheckedState,
  }
}
```

**关键设计**：

| 决策                     | 原因                                         |
| ------------------------ | -------------------------------------------- |
| `Set<Key>` 存储          | O(1) 查询，大数据量下性能好                  |
| radio 模式始终只选一个   | 与 antdv radio 行为一致                      |
| `allCheckedState` 三态   | 全选 checkbox 需要显示全选/半选/未选三种状态 |
| `isDisabled` 判断        | `getCheckboxProps` 可禁用某些行的选择框      |
| 全选只影响当前可见可选行 | 全选不应影响不可见的数据                     |

#### 12.3 更新 `packages/table/src/composables/index.ts`

```typescript
// packages/table/src/composables/index.ts

export { useColumns, getByDataIndex } from './useColumns'
export { useSorter, getColumnKey } from './useSorter'
export type { SorterState, SorterResult } from './useSorter'
export { useFilter } from './useFilter'
export type { FiltersRecord } from './useFilter'
export { useSelection } from './useSelection'
```

#### 12.4 验证

```bash
pnpm build
```

预期：构建通过。

---

### Step 13：SelectionCheckbox.tsx + SelectionRadio.tsx

#### 13.1 为什么拆成两个组件

checkbox 和 radio 的渲染逻辑、aria 属性、事件处理略有不同。拆开后每个组件职责单一，代码清晰。

#### 13.2 创建 `packages/table/src/components/SelectionCheckbox.tsx`

```tsx
// packages/table/src/components/SelectionCheckbox.tsx

import { defineComponent, type PropType } from 'vue'

/**
 * 行选择 Checkbox 组件。
 *
 * 用于 checkbox 模式的行选择和全选框。
 */
export default defineComponent({
  name: 'SelectionCheckbox',
  props: {
    checked: { type: Boolean, required: true },
    indeterminate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    selectionCellClass: { type: String, default: '' },
  },
  emits: ['change'],
  setup(props, { emit }) {
    function handleChange(e: Event) {
      e.stopPropagation()
      if (!props.disabled) {
        emit('change', !props.checked)
      }
    }

    return () => (
      <label
        class={[
          'inline-flex items-center cursor-pointer',
          props.disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]}
      >
        <input
          type="checkbox"
          checked={props.checked}
          // Vue 3 TSX 中 indeterminate 需要通过 ref 设置
          ref={(el: any) => {
            if (el) el.indeterminate = props.indeterminate
          }}
          disabled={props.disabled}
          onChange={handleChange}
          class={['accent-[var(--color-primary)]', props.selectionCellClass]}
        />
      </label>
    )
  },
})
```

#### 13.3 创建 `packages/table/src/components/SelectionRadio.tsx`

```tsx
// packages/table/src/components/SelectionRadio.tsx

import { defineComponent } from 'vue'

/**
 * 行选择 Radio 组件。
 *
 * 用于 radio 模式的行选择。
 */
export default defineComponent({
  name: 'SelectionRadio',
  props: {
    checked: { type: Boolean, required: true },
    disabled: { type: Boolean, default: false },
    selectionCellClass: { type: String, default: '' },
  },
  emits: ['change'],
  setup(props, { emit }) {
    function handleChange(e: Event) {
      e.stopPropagation()
      if (!props.disabled) {
        emit('change')
      }
    }

    return () => (
      <label
        class={[
          'inline-flex items-center cursor-pointer',
          props.disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]}
      >
        <input
          type="radio"
          checked={props.checked}
          disabled={props.disabled}
          onChange={handleChange}
          class={['accent-[var(--color-primary)]', props.selectionCellClass]}
        />
      </label>
    )
  },
})
```

#### 13.4 验证

文件创建完毕。接 Step 14 集成到 Table。

---

### Step 14：Table 集成行选择

#### 14.1 集成策略

行选择需要在以下位置插入 UI：

1. **表头第一列**：全选 checkbox（checkbox 模式）或空白（radio 模式）
2. **每行第一列**：行选择 checkbox 或 radio

实现方式：不修改 TableHeader/TableBody 的 API，而是在 Table.tsx 中**动态注入选择列**到 leafColumns 前面。

#### 14.2 扩展 Table Context

在 `context.ts` 中新增选择相关字段（已在 Step 4 预留）：

```typescript
// 在 TableContext 接口中追加

export interface TableContext {
  // ... 已有字段 ...

  // ---- 行选择（Step 14 新增） ----
  /** 行选择配置 */
  rowSelection?: () => RowSelection | undefined
  /** 判断某行是否选中 */
  isSelected?: (key: Key) => boolean
  /** 判断某行选择框是否禁用 */
  isDisabledRow?: (record: Record<string, unknown>) => boolean
  /** 切换某行选中状态 */
  toggleRow?: (record: Record<string, unknown>, index: number) => void
  /** 全选/取消全选 */
  toggleAll?: (selected: boolean) => void
  /** 全选状态 */
  allCheckedState?: () => 'all' | 'partial' | 'none'
}
```

#### 14.3 修改 Table.tsx — 接入 useSelection + 注入选择列

> 以下为在之前 Table.tsx 基础上的增量修改。

```tsx
// ---- 在 Table.tsx setup 中追加 ----

// 新增 import
import { useSelection } from '../composables/useSelection'
import SelectionCheckbox from './SelectionCheckbox'
import SelectionRadio from './SelectionRadio'
import type { RowSelection, Key } from '../types'

// ---- 在 props 中新增 ----
// rowSelection: { type: Object as PropType<RowSelection>, default: undefined },

// ---- 在 setup 中，processedData 之后添加 ----

// ---- rowKey 辅助函数 ----
function getRowKeyFn(record: Record<string, unknown>, index: number): Key {
  if (typeof props.rowKey === 'function') return props.rowKey(record)
  if (typeof props.rowKey === 'string' && props.rowKey in record) {
    return record[props.rowKey] as Key
  }
  return index
}

// ---- 行选择（Step 14 新增） ----
const {
  selectedKeySet,
  isSelected,
  isDisabled: isDisabledRow,
  toggleRow,
  toggleAll,
  allCheckedState,
} = useSelection({
  rowSelection: () => props.rowSelection,
  getRowKey: getRowKeyFn,
  data: () => processedData.value,
})

// ---- 选择列注入 ----
const displayColumns = computed(() => {
  const sel = props.rowSelection
  if (!sel) return leafColumns.value

  const selectionColumnWidth = sel.columnWidth ?? 48

  // 构造选择列
  const selectionColumn: ColumnType<Record<string, unknown>> = {
    key: '__vtg_selection__',
    title: '',
    width: selectionColumnWidth,
    align: 'center',
    // customRender 由 TableBody 侧通过特殊 key 处理
    // 表头由 TableHeader 侧通过特殊 key 处理
  }

  return [selectionColumn, ...leafColumns.value]
})

// ---- 更新 provide context ----
provide<TableContext>(TABLE_CONTEXT_KEY, {
  bodyCell: slots.bodyCell,
  headerCell: slots.headerCell,
  empty: slots.empty,
  customFilterDropdown: slots.customFilterDropdown,
  getSortOrder,
  toggleSortOrder,
  getFilteredValue,
  confirmFilter,
  resetFilter,
  rowSelection: () => props.rowSelection,
  isSelected: (key) => isSelected(key),
  isDisabledRow,
  toggleRow,
  toggleAll,
  allCheckedState: () => allCheckedState.value,
})

// ---- 在 render 中，将 leafColumns.value 改为 displayColumns.value ----
// TableHeader 和 TableBody 的 columns prop 都改为 displayColumns.value
```

#### 14.4 修改 TableHeaderCell.tsx — 支持选择列表头

在 `TableHeaderCell.tsx` 中识别选择列（`key === '__vtg_selection__'`），渲染全选 checkbox：

```tsx
// 在 TableHeaderCell.tsx 的 setup 中追加

// ---- 行选择表头 ----
const isSelectionColumn = computed(() => props.column.key === '__vtg_selection__')

// 在 return 的 JSX 中，包裹一层判断：
// if (isSelectionColumn.value) → 渲染 SelectionCheckbox
// else → 原有逻辑

return () => {
  // 选择列特殊渲染
  if (isSelectionColumn.value) {
    const sel = tableContext.rowSelection?.()
    const type = sel?.type ?? 'checkbox'

    return (
      <th class={cellClass.value} style={widthStyle.value}>
        <span class={props.headerCellInnerClass}>
          {type === 'checkbox' && (
            <SelectionCheckbox
              checked={tableContext.allCheckedState?.() === 'all'}
              indeterminate={tableContext.allCheckedState?.() === 'partial'}
              onChange={(checked: boolean) => tableContext.toggleAll?.(checked)}
            />
          )}
        </span>
      </th>
    )
  }

  // 原有渲染逻辑...
  return (
    <th class={cellClass.value} style={widthStyle.value} onClick={handleHeaderClick}>
      {/* ... */}
    </th>
  )
}
```

#### 14.5 修改 TableCell.tsx — 支持选择列单元格

在 `TableCell.tsx` 中识别选择列，渲染 checkbox/radio：

```tsx
// 在 TableCell.tsx 的 setup 中追加

const isSelectionColumn = computed(() => props.column.key === '__vtg_selection__')

// 在 return 的 JSX 中，包裹选择列判断：

return () => {
  if (isSelectionColumn.value) {
    const sel = tableContext.rowSelection?.()
    const type = sel?.type ?? 'checkbox'
    const key = /* 从 context 获取 rowKey */ props.rowIndex
    const recordKey = getRowKey(props.record, props.rowIndex) // 需要注入 getRowKey

    return (
      <td class={cellClass.value} style={widthStyle.value}>
        {type === 'checkbox' ? (
          <SelectionCheckbox
            checked={tableContext.isSelected?.(recordKey) ?? false}
            disabled={tableContext.isDisabledRow?.(props.record) ?? false}
            onChange={() => tableContext.toggleRow?.(props.record, props.rowIndex)}
          />
        ) : (
          <SelectionRadio
            checked={tableContext.isSelected?.(recordKey) ?? false}
            disabled={tableContext.isDisabledRow?.(props.record) ?? false}
            onChange={() => tableContext.toggleRow?.(props.record, props.rowIndex)}
          />
        )}
      </td>
    )
  }

  // 原有渲染逻辑...
  return (
    <td class={cellClass.value} style={widthStyle.value}>
      {/* ... */}
    </td>
  )
}
```

> **注意**：TableCell 中需要获取行的 key。有两种方案：
>
> 1. 在 Table.tsx 中把 `getRowKeyFn` 也 provide 到 context
> 2. 通过 `rowKey` prop 传给 TableBody → TableCell
>
> 推荐方案 1，在 context 中新增 `getRowKey` 函数。

#### 14.6 验证

```bash
pnpm build
```

预期：构建通过。

**功能验证**（在 playground 中测试）：

```vue
<script setup lang="ts">
import { ref } from 'vue'
const selectedRowKeys = ref<(string | number)[]>([])

function onSelectChange(keys: (string | number)[], rows: Record<string, unknown>[]) {
  selectedRowKeys.value = keys
  console.log('Selected:', keys, rows)
}
</script>

<template>
  <!-- Checkbox 模式 -->
  <VTable
    :columns="columns"
    :data-source="dataSource"
    row-key="key"
    :row-selection="{
      type: 'checkbox',
      selectedRowKeys,
      onChange: onSelectChange,
    }"
  />

  <!-- Radio 模式 -->
  <VTable
    :columns="columns"
    :data-source="dataSource"
    row-key="key"
    :row-selection="{
      type: 'radio',
      onChange: onSelectChange,
    }"
  />
</template>
```

验证项：

| #   | 验证项       | 操作                     | 预期                             |
| --- | ------------ | ------------------------ | -------------------------------- |
| 1   | 选择列显示   | 查看表格第一列           | checkbox/radio 渲染正确          |
| 2   | 行选择       | 点击行的 checkbox        | 选中行，onChange 触发            |
| 3   | 行取消选择   | 再次点击 checkbox        | 取消选中                         |
| 4   | 全选         | 点击表头 checkbox        | 所有行选中                       |
| 5   | 取消全选     | 再次点击表头 checkbox    | 所有行取消                       |
| 6   | 半选态       | 选中部分行               | 表头 checkbox 显示 indeterminate |
| 7   | Radio 单选   | 点击 radio               | 只有一行选中                     |
| 8   | Radio 无全选 | 查看 radio 表头          | 无全选框                         |
| 9   | 禁用行       | 配置 getCheckboxProps    | 禁用行的 checkbox 灰色不可点     |
| 10  | 受控模式     | 外部传入 selectedRowKeys | 选中状态与外部同步               |

---

## Part 4：主题优化（Step 15）

### Step 15：主题 slots 扩展（可选优化）

#### 15.1 antdv table 主题新增 slots

在 `packages/theme/src/presets/antdv/table.ts` 的 slots 中，可以新增以下 slot 以支持交互组件的主题化：

```typescript
// 在 antdvTableTheme.slots 中追加

selectionCell: 'flex items-center justify-center',
sortIcon: 'inline-flex flex-col items-center',
filterIcon: 'inline-flex items-center',
```

#### 15.2 antdv.css 新增组件 token

在 `packages/theme/css/presets/antdv.css` 的 `:root` 中追加：

```css
/* ===== 交互组件 token（阶段四新增） ===== */
--vtg-table-sort-icon-active: var(--color-primary);
--vtg-table-sort-icon-inactive: var(--color-muted);
--vtg-table-filter-icon-active: var(--color-primary);
--vtg-table-filter-icon-inactive: var(--color-muted);
--vtg-table-selection-column-width: 48px;
```

> **注意**：这些 token 是可选优化。阶段四的核心功能不依赖这些 token——组件内部已使用 `--color-primary` 和 `--color-muted` 等语义 token。这些组件级 token 提供了更细粒度的主题控制入口。

#### 15.3 验证

```bash
pnpm build
```

预期：构建通过。

---

## Part 5：验收与 FAQ（Step 16 – 17）

### Step 16：五维度验收清单

#### 16.1 功能验收

| #   | 验证项                          | 操作                                    | 预期                                  |
| --- | ------------------------------- | --------------------------------------- | ------------------------------------- |
| 1   | 排序：默认 sorter               | 列配置 `sorter: true`                   | 使用默认比较函数排序                  |
| 2   | 排序：自定义 sorter             | 列配置 `sorter: (a, b) => ...`          | 使用自定义函数排序                    |
| 3   | 排序：受控模式                  | 外部传入 `sortOrder`                    | 排序方向与外部状态同步                |
| 4   | 排序：非受控 + defaultSortOrder | 列配置 `defaultSortOrder: 'ascend'`     | 首次渲染即排序                        |
| 5   | 排序：sortDirections            | 配置 `['ascend', 'descend']`（无 null） | 点击只在升序/降序间切换，不回到无排序 |
| 6   | 筛选：多选筛选                  | 勾选多个筛选项                          | 匹配任意一个即通过                    |
| 7   | 筛选：单选筛选                  | 配置 `filterMultiple: false`            | 只能选一个筛选值                      |
| 8   | 筛选：受控模式                  | 外部传入 `filteredValue`                | 筛选值与外部同步                      |
| 9   | 筛选：customFilterDropdown      | 使用 slot 自定义筛选 UI                 | 自定义 UI 正常渲染和交互              |
| 10  | 选择：checkbox 多选             | 点击行 checkbox                         | 选中/取消正确                         |
| 11  | 选择：radio 单选                | 配置 `type: 'radio'`                    | 只能选一行                            |
| 12  | 选择：全选/取消全选             | 点击表头 checkbox                       | 全部行选中/取消                       |
| 13  | 选择：半选态                    | 选中部分行                              | 表头 checkbox 显示 indeterminate      |
| 14  | 选择：禁用行                    | getCheckboxProps 返回 disabled          | 禁用行不可选                          |
| 15  | 选择：受控模式                  | 外部传入 selectedRowKeys                | 选中状态与外部同步                    |

#### 16.2 事件验收

| #   | 验证项                    | 操作           | 预期                               |
| --- | ------------------------- | -------------- | ---------------------------------- |
| 1   | change 事件 — 排序触发    | 点击排序       | `extra.action === 'sort'`          |
| 2   | change 事件 — 筛选触发    | 确认筛选       | `extra.action === 'filter'`        |
| 3   | change 事件 — 三参数完整  | 任意操作后检查 | filters/sorter/extra 均有值        |
| 4   | change 事件 — currentData | 检查 extra     | currentDataSource 为当前显示的数据 |

#### 16.3 主题验收

| #   | 验证项       | 操作         | 预期                     |
| --- | ------------ | ------------ | ------------------------ |
| 1   | 排序图标颜色 | 检查 CSS     | 使用语义 token           |
| 2   | 筛选弹窗样式 | 打开筛选弹窗 | 与 antdv 视觉接近        |
| 3   | 选择列宽度   | 检查第一列   | 默认 48px                |
| 4   | 暗色模式     | 切换 `.dark` | 所有交互组件颜色正确切换 |

#### 16.4 组合场景验收

| #   | 验证项      | 操作         | 预期             |
| --- | ----------- | ------------ | ---------------- |
| 1   | 排序 + 筛选 | 先筛选再排序 | 数据先筛选再排序 |

#### 16.5 构建验收

| #   | 验证项       | 命令              | 预期                   |
| --- | ------------ | ----------------- | ---------------------- |
| 1   | 全量构建     | `pnpm build`      | 4 包全部成功           |
| 2   | 类型检查     | `pnpm type-check` | 无类型错误             |
| 3   | Table 包产物 | 检查 dist/        | 包含所有新增组件和类型 |
| 4   | 聚合包导出   | 检查 vtable-guild | re-export 正确         |

---

### Step 17：FAQ

#### Q1：为什么本阶段只做单列排序，不做多列排序？

多列排序增加的复杂度（优先级管理、UI 显示第几排序）与收益不成比例。antdv 的多列排序也需要通过 `multiple` 配置显式开启，不是默认行为。单列排序覆盖了 80% 的使用场景，多列排序放到后续需求驱动时再加。

#### Q2：筛选弹窗为什么要 Teleport 到 body？

Table 通常带 `overflow: auto`（wrapper 需要支持横向滚动）。如果筛选弹窗渲染在 table 内部，会被 overflow 裁切，导致弹窗看不到或部分被遮挡。Teleport 到 body 可以绕开所有祖先元素的 overflow 限制。

#### Q3：为什么行选择用"注入选择列"而不是"特殊渲染表头/行"？

注入选择列（在 `displayColumns` 数组前面插入一个虚拟列）的好处：

1. TableHeader 和 TableBody 的渲染逻辑不需要特殊处理——统一遍历 columns
2. 列宽、对齐等配置统一通过 ColumnType 管理
3. 后续固定列（`fixed: 'left'`）实现时，选择列自然享受固定逻辑

#### Q4：`change` 事件为什么统一为三参数？

与 antdv 的 `change(filters, sorter, extra)` 签名对齐：

```typescript
function handleTableChange(
  filters: TableFiltersInfo,
  sorter: SorterResult,
  extra: TableChangeExtra,
) {
  // 无论哪种操作触发，都能拿到完整的 filters/sorter 状态
  // extra.action 告诉你是哪种操作触发的
}
```

这种设计让使用方只需监听一个事件就能处理所有交互变化，不需要分别监听 `onSort`、`onFilter` 等。

#### Q5：useSorter 的 `defaultCompare` 为什么要区分数字和字符串？

```typescript
function defaultCompare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}
```

- 数字用 `a - b`：确保按数值大小排序（`9 < 10`），而不是字符串排序（`'9' > '10'`）
- 字符串用 `localeCompare`：支持中文等多语言排序
- 其他类型强转字符串：兜底，不报错

#### Q6：受控/非受控模式是怎么判断的？

统一规则：**prop 不为 `undefined` 即视为受控**。

```typescript
// 排序
column.sortOrder !== undefined → 受控

// 筛选
column.filteredValue !== undefined → 受控

// 行选择
rowSelection.selectedRowKeys !== undefined → 受控
```

非受控模式下：

- 使用 `defaultXxx` 作为初始值
- 组件内部用 `ref` 管理状态
- 变化时触发回调，使用方可在回调中决定是否同步

#### Q7：筛选和排序的执行顺序为什么是"先筛选再排序"？

从用户视角理解：

1. 用户先设置筛选条件 → 缩小数据集
2. 然后在筛选结果中排序 → 看到有序的子集

如果反过来（先排序再筛选），排序后筛选掉部分数据，用户感知到的排序结果可能不完整。

数据管道：`dataSource → filter → sort → render`

#### Q8：全选只影响当前可见数据吗？

是的。这与 antdv 行为一致。全选按钮的作用范围是当前可见且可选的行。全选操作应该是可视化确认的，用户能看到哪些行被选中。

#### Q9：FilterDropdown 的位置计算为什么不用 `position: absolute`？

因为弹窗已经 Teleport 到 body 了，它的位置参照物是 viewport 而不是某个父元素。所以使用 `position: fixed` + `getBoundingClientRect()` 计算锚点位置。

> **注意**：如果 Table 在滚动容器中，弹窗位置可能需要额外处理。阶段四先用这个简单方案，后续可引入 `@floating-ui` 等定位库优化。

---

## 最终文件清单

完成阶段四后，新增/修改的文件：

```
packages/table/src/
├── types/
│   ├── column.ts                        [修改] 新增排序 + 筛选字段
│   ├── table.ts                         [修改] 新增 change 事件类型 + RowSelection
│   └── index.ts                         [修改] 新增类型导出
├── composables/
│   ├── useSorter.ts                     [新增] 排序状态管理
│   ├── useFilter.ts                     [新增] 筛选状态管理
│   ├── useSelection.ts                  [新增] 行选择状态管理
│   └── index.ts                         [修改] 新增导出
├── components/
│   ├── Table.tsx                        [修改] 集成三大交互功能
│   ├── TableHeaderCell.tsx              [修改] 集成排序 + 筛选
│   ├── TableCell.tsx                    [修改] 集成行选择
│   ├── SortButton.tsx                   [新增] 排序图标
│   ├── FilterIcon.tsx                   [新增] 筛选图标
│   ├── FilterDropdown.tsx               [新增] 筛选弹窗
│   ├── SelectionCheckbox.tsx            [新增] 行选择 Checkbox
│   └── SelectionRadio.tsx               [新增] 行选择 Radio
├── context.ts                           [修改] 新增排序/筛选/选择 context
└── index.ts                             [修改] 新增类型导出

packages/theme/
├── src/presets/antdv/table.ts           [修改] 可选新增 interaction slots
└── css/presets/antdv.css                [修改] 可选新增交互组件 token
```

共 **新增约 8 个文件**，**修改约 11 个文件**。
