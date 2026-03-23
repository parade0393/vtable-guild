/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties, VNodeChild } from 'vue'
import type { CustomFilterDropdownSlotProps } from './table'

/** 行唯一标识 */
export type Key = string | number

/** 对齐方式 */
export type AlignType = 'left' | 'center' | 'right'

/** 排序方向 */
export type SortOrder = 'ascend' | 'descend' | null

/** 排序器：布尔值表示使用默认排序，函数表示自定义比较 */
export type SorterFn<TRecord = Record<string, any>> = (a: TRecord, b: TRecord) => number
export interface ColumnSorterObject<TRecord = Record<string, any>> {
  compare?: SorterFn<TRecord>
  multiple?: number
}
export type ColumnSorter<TRecord = Record<string, any>> =
  | boolean
  | SorterFn<TRecord>
  | ColumnSorterObject<TRecord>
export type Breakpoint = 'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
export type TableLayout = 'auto' | 'fixed'
export type RowClassName<TRecord = Record<string, any>> = (
  record: TRecord,
  index: number,
  indent: number,
) => string
export interface TableSticky {
  offsetHeader?: number
  offsetSummary?: number
  offsetScroll?: number
  getContainer?: () => Window | HTMLElement
}
export type TransformCellText<TRecord extends object = Record<string, any>> = (opt: {
  text: unknown
  column: ColumnType<TRecord>
  record: TRecord
  index: number
}) => unknown

export interface CellAdditionalProps {
  class?: string
  className?: string
  style?: CSSProperties
  colSpan?: number
  rowSpan?: number
  colspan?: number
  rowspan?: number
  onClick?: (event: MouseEvent) => void
  onMouseenter?: (event: MouseEvent) => void
  onMouseleave?: (event: MouseEvent) => void
  [key: string]: unknown
}

export interface RenderedCell {
  props?: CellAdditionalProps
  children?: VNodeChild
}

export type GetComponentProps<TData> = (
  data: TData,
  index?: number,
  column?: ColumnType<any>,
) => CellAdditionalProps | undefined

export interface ColumnTitleProps<TRecord extends object = Record<string, any>> {
  sortOrder?: SortOrder
  sortColumn?: ColumnType<TRecord>
  sortColumns?: Array<{
    column: ColumnType<TRecord>
    order: SortOrder
  }>
  filters?: Record<string, (string | number | boolean)[] | null>
}

export type ColumnTitle<TRecord extends object = Record<string, any>> =
  | VNodeChild
  | ((props: ColumnTitleProps<TRecord>) => VNodeChild)

/**
 * 叶子列配置。
 */
export interface ColumnType<TRecord extends object = Record<string, any>> {
  key?: Key
  title?: ColumnTitle<TRecord>
  dataIndex?: DataIndex
  width?: number | string
  align?: AlignType
  ellipsis?: boolean
  className?: string
  colSpan?: number
  customRender?: (ctx: CustomRenderContext<TRecord>) => VNodeChild | RenderedCell
  customCell?: GetComponentProps<TRecord>
  customHeaderCell?: GetComponentProps<ColumnType<TRecord> | ColumnGroupType<TRecord>>

  /** 固定列。'left' 固定到左侧，'right' 固定到右侧。 */
  fixed?: 'left' | 'right'

  /** 是否可拖拽调整列宽 */
  resizable?: boolean

  /** 最小列宽（拖拽调整时），默认 50 */
  minWidth?: number

  /** 最大列宽（拖拽调整时） */
  maxWidth?: number

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

  /**
   * 筛选搜索框。
   * - `true`：使用默认搜索（text.includes(input)）
   * - `(input, filter) => boolean`：自定义搜索函数
   */
  filterSearch?: boolean | ((input: string, filter: ColumnFilterItem) => boolean)

  /**
   * 筛选模式。
   * - `'menu'`（默认）：平铺列表
   * - `'tree'`：树形嵌套
   */
  filterMode?: 'menu' | 'tree'

  /**
   * 重置时是否恢复为 defaultFilteredValue 而非清空。
   */
  filterResetToDefaultFilteredValue?: boolean

  /**
   * 受控筛选下拉可见性。
   */
  filterDropdownOpen?: boolean

  /**
   * 筛选下拉可见性变化回调。
   */
  onFilterDropdownOpenChange?: (visible: boolean) => void

  /**
   * 外部控制筛选高亮状态（不影响实际筛选逻辑）。
   */
  filtered?: boolean

  /**
   * 自定义筛选图标渲染函数。
   */
  filterIcon?: (opt: { filtered: boolean }) => VNodeChild

  /**
   * 列级别自定义筛选下拉渲染函数。
   * 优先级高于 customFilterDropdown slot。
   */
  filterDropdown?: VNodeChild | ((props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild)

  /**
   * 列级别控制是否显示排序 tooltip。
   * 未设置时使用 Table 级别的 showSorterTooltip。
   */
  showSorterTooltip?: boolean

  /**
   * 响应式可见断点。
   * 当前屏幕命中任一断点时显示该列。
   */
  responsive?: Breakpoint[]
}

/**
 * 数据索引路径
 *
 * - `'name'` - 直接取record.name
 * - `['address', 'city']` — 取 record.address.city
 */
export type DataIndex = string | number | Array<string | number>

/**
 * customRender 回调参数。
 */
export interface CustomRenderContext<TRecord extends object = Record<string, any>> {
  /** 当前单元格的值（通过 dataIndex 取出） */
  text: unknown
  /** 与 ant-design-vue 对齐的 value 别名 */
  value: unknown
  /** 当前行数据 */
  record: TRecord
  /** 行索引 */
  index: number
  /** 当前渲染行索引 */
  renderIndex: number
  /** 列配置 */
  column: ColumnType<TRecord>
}

/**
 * 列组配置（含 children）。
 */
export interface ColumnGroupType<TRecord extends object = Record<string, any>> extends Omit<
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
  | 'filterSearch'
  | 'filterMode'
  | 'filterResetToDefaultFilteredValue'
  | 'filterDropdownOpen'
  | 'onFilterDropdownOpenChange'
  | 'filtered'
  | 'filterIcon'
  | 'filterDropdown'
> {
  children: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>
}

/**
 * columns prop 的类型。
 */
export type ColumnsType<TRecord extends object = Record<string, any>> = Array<
  ColumnType<TRecord> | ColumnGroupType<TRecord>
>

/**
 * 筛选项。
 */
export interface ColumnFilterItem {
  text: string
  value: string | number | boolean
  children?: ColumnFilterItem[]
}
