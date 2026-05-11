# 类型参考

这一页只整理公开 TypeScript 类型：查“该导入哪个类型”和“类型之间是什么关系”。组件行为、默认值和事件语义请看 [API Reference](/guide/api-reference)。

所有类型都推荐从 `@vtable-guild/vtable-guild` 导入。

```ts
import type { ColumnsType, ColumnType, RowSelection, Expandable } from '@vtable-guild/vtable-guild'
```

## 表格核心类型

### Key

行、列和内部状态使用的唯一标识。

```ts
type Key = string | number
```

### DataIndex

列读取行数据时使用的字段路径。

```ts
type DataIndex = string | number | Array<string | number>
```

### AlignType

列内容对齐方式。

```ts
type AlignType = 'left' | 'center' | 'right'
```

### Breakpoint

响应式列使用的断点类型。当前公开类型名是 `Breakpoint`，没有 `Breakpoints` 复数类型。

```ts
type Breakpoint = 'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
```

### SortOrder

排序方向。`null` 表示无排序状态。

```ts
type SortOrder = 'ascend' | 'descend' | null
```

### ColumnSorter

列排序器类型。业务代码里通常直接写在 `ColumnType<T>['sorter']` 上。

```ts
type SorterFn<TRecord> = (a: TRecord, b: TRecord) => number

type ColumnSorter<TRecord> =
  | boolean
  | SorterFn<TRecord>
  | {
      compare?: SorterFn<TRecord>
      multiple?: number
    }
```

### ColumnFilterItem

列筛选项，支持树形结构。

```ts
interface ColumnFilterItem {
  text: string
  value: string | number | boolean
  children?: ColumnFilterItem[]
}
```

### ColumnType

叶子列配置。它承载数据读取、渲染、排序、筛选、固定列、列宽拖拽和响应式可见性等能力。

```ts
const columns: ColumnType<UserRow>[] = [
  { title: 'Name', dataIndex: 'name', key: 'name', sorter: true },
]
```

多数业务场景优先使用 [`ColumnsType`](#columnstype)，因为它同时支持列组和占位常量。

### ColumnGroupType

列组配置。`children` 内继续放叶子列或列组。

```ts
const grouped: ColumnGroupType<UserRow> = {
  title: 'Profile',
  children: [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
  ],
}
```

### ColumnsType

`columns` prop 的推荐类型。

```ts
type ColumnsType<TRecord> = Array<ColumnType<TRecord> | ColumnGroupType<TRecord> | ColumnSentinel>
```

```ts
const columns: ColumnsType<UserRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', responsive: ['md', 'lg', 'xl'] },
]
```

### TableColumnType 和 TableColumnsType

兼容命名别名：

```ts
type TableColumnType<TRecord> = ColumnType<TRecord>
type TableColumnGroupType<TRecord> = ColumnGroupType<TRecord>
type TableColumnsType<TRecord> = ColumnsType<TRecord>
```

## 渲染与结构类型

### CellAdditionalProps

用于 `customCell`、`customHeaderCell`、`customRow` 和 `customHeaderRow` 返回额外属性。

```ts
interface CellAdditionalProps {
  class?: string
  className?: string
  style?: CSSProperties
  colSpan?: number
  rowSpan?: number
  onClick?: (event: MouseEvent) => void
  [key: string]: unknown
}
```

### RenderedCell

`customRender` 或选择列 `renderCell` 可返回的对象形态。

```ts
interface RenderedCell {
  props?: CellAdditionalProps
  children?: VNodeChild
}
```

### CustomRenderContext

`column.customRender` 的参数类型。

```ts
interface CustomRenderContext<TRecord> {
  text: unknown
  value: unknown
  record: TRecord
  index: number
  renderIndex: number
  column: ColumnType<TRecord>
}
```

## 交互类型

### RowSelection

`rowSelection` prop 的类型，用于多选、单选、受控选择和选择列渲染。

```ts
const rowSelection: RowSelection<UserRow> = {
  selectedRowKeys,
  onChange: (keys, rows) => {
    selectedRowKeys = keys
  },
}
```

### RowSelectionType

```ts
type RowSelectionType = 'checkbox' | 'radio'
```

### SelectionItem

自定义批量选择菜单项。

```ts
interface SelectionItem {
  key: string
  text: string | VNodeChild
  onSelect?: (changeableRowKeys: Key[]) => void
}
```

### Expandable

`expandable` prop 的类型，用于展开行。

```ts
const expandable: Expandable<UserRow> = {
  expandedRowRender: (record) => record.description,
}
```

### TableFiltersInfo

`change` 事件里的 filters 参数。

```ts
type TableFiltersInfo = Record<string, (string | number | boolean)[] | null>
```

### VTableSorterResult

`change` 事件里的 sorter 参数。

```ts
type VTableSorterResult<TRecord> = SorterResultLike<TRecord> | Array<SorterResultLike<TRecord>>
```

### TableChangeExtra

`change` 事件里的 extra 参数。

```ts
interface TableChangeExtra<TRecord> {
  action: 'sort' | 'filter' | 'select'
  currentDataSource: TRecord[]
}
```

## Slot 类型

### TableBodyCellSlotProps

`bodyCell` slot 参数。

```ts
interface TableBodyCellSlotProps<TRecord> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}
```

### TableHeaderCellSlotProps

`headerCell` slot 参数。

```ts
interface TableHeaderCellSlotProps<TRecord> {
  title: VNodeChild | undefined
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>
  index: number
}
```

### CustomFilterDropdownSlotProps

`customFilterDropdown` slot 参数。

```ts
interface CustomFilterDropdownSlotProps<TRecord> {
  column: ColumnType<TRecord>
  selectedKeys: (string | number | boolean)[]
  setSelectedKeys: (keys: (string | number | boolean)[]) => void
  confirm: (options?: { closeDropdown?: boolean }) => void
  clearFilters: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
  filters: ColumnFilterItem[]
  visible: boolean
  close: () => void
}
```

### TableDataSlotProps

`title` 和 `footer` slot 参数。

```ts
interface TableDataSlotProps<TRecord> {
  data: TRecord[]
}
```

### TableSlotsDecl

`VTable` 的 slot 声明类型，适合需要包装表格组件时使用。

```ts
interface TableSlotsDecl<TRecord> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  customFilterDropdown?: (props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild
}
```

## 常量类型

### SelectionSentinel

`rowSelection.selections` 可用的默认批量选择常量类型。

```ts
import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from '@vtable-guild/vtable-guild'
```

### ColumnSentinel

`columns` 顶层可用的列占位常量类型。

```ts
import { EXPAND_COLUMN, SELECTION_COLUMN } from '@vtable-guild/vtable-guild'

const columns: ColumnsType<UserRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  EXPAND_COLUMN,
  SELECTION_COLUMN,
]
```

`ExpandColumnSentinel` 对应 `EXPAND_COLUMN`，`SelectionColumnSentinel` 对应 `SELECTION_COLUMN`。

## 组件与事件类型

### TableProps

`VTable` props 的完整类型。封装二次组件时优先使用这个类型。

```ts
type MyTableProps<TRecord extends object> = TableProps<TRecord>
```

### VTableEventProps

`change` 与 `resizeColumn` 事件 props 类型。

```ts
interface VTableEventProps<TRecord> {
  onChange?: (filters, sorter, extra) => void
  onResizeColumn?: (column: ColumnType<TRecord>, width: number) => void
}
```

### VTablePublicProps

`TableProps<TRecord>` 与 `VTableEventProps<TRecord>` 的组合类型。

### VTableComponent

泛型化后的 `VTable` 组件类型。

### SummaryFixed

`VTableSummary` 的 fixed 类型。

```ts
type SummaryFixed = boolean | 'top' | 'bottom'
```

## 主题与插件类型

### ThemePresetName

内置主题预设名。

```ts
type ThemePresetName = 'antdv' | 'element-plus'
```

### VTableGuildOptions

`createVTableGuild()` 的配置类型。

```ts
interface VTableGuildOptions {
  themePreset?: ThemePresetName
  theme?: VTableGuildThemeOverrides
  locale?: LocaleName
  locales?: LocaleRegistry
  localeOverrides?: DeepPartial<VTableGuildLocale>
}
```

### LocaleName

语言标识类型。内置语言目前由 preset 提供，业务也可以注册自己的语言标识。

```ts
type LocaleName = string
```

### LocaleRegistry

语言包注册表。

```ts
type LocaleRegistry = Record<LocaleName, VTableGuildLocale>
```

### ThemeOverrideConfig

主题覆盖类型，用于保留 slot、variant 和 default variant 的补全。

```ts
import type { TableThemeConfig, ThemeOverrideConfig } from '@vtable-guild/vtable-guild'

const tableTheme: ThemeOverrideConfig<TableThemeConfig> = {
  slots: {
    th: 'font-semibold',
  },
}
```

### TableSlots 和 TableThemeConfig

Table 主题 slot 名和主题配置类型。完整 slot 行为见 [ui Slot 参考](/guide/ui-slots-reference)。

```ts
import type { TableSlots, TableThemeConfig } from '@vtable-guild/vtable-guild'
```

同类主题类型还包括 `ButtonThemeConfig`、`CheckboxThemeConfig`、`RadioThemeConfig`、`InputThemeConfig`、`TooltipThemeConfig` 和 `ScrollbarThemeConfig`。

## 相关页面

- [API Reference](/guide/api-reference)
- [ui Slot 参考](/guide/ui-slots-reference)
- [三层主题覆盖](/guide/theme-overrides)
