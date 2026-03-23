/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  SlotProps,
  VTableGuildTableLocale,
} from '@vtable-guild/core'
import type { AllowedComponentProps, ComponentCustomProps, VNodeChild, VNodeProps } from 'vue'
import type {
  ColumnsType,
  ColumnType,
  ColumnGroupType,
  ColumnFilterItem,
  Key,
  RowClassName,
  GetComponentProps,
  CellAdditionalProps,
  RenderedCell,
  TableLayout,
  TableSticky,
  TransformCellText,
  SortOrder,
} from './column'
import type { TableSlots } from '@vtable-guild/theme'

// ---- 展开行类型 ----

export interface Expandable<TRecord = Record<string, unknown>> {
  /** 展开行渲染函数 */
  expandedRowRender?: (
    record: TRecord,
    index: number,
    indent: number,
    expanded: boolean,
  ) => VNodeChild
  /** 受控展开行 key 列表 */
  expandedRowKeys?: Key[]
  /** 非受控默认展开行 key 列表 */
  defaultExpandedRowKeys?: Key[]
  /** 点击行展开 */
  expandRowByClick?: boolean
  /** 自定义展开图标 */
  expandIcon?: (props: {
    expanded: boolean
    record: TRecord
    expandable: boolean
    onExpand: (record: TRecord, e: Event) => void
  }) => VNodeChild
  /** 展开/折叠回调 */
  onExpand?: (expanded: boolean, record: TRecord) => void
  /** 展开行变化回调 */
  onExpandedRowsChange?: (expandedKeys: Key[]) => void
  /** 展开列宽度 */
  columnWidth?: number | string
  /** 展开列固定位置 */
  fixed?: 'left' | 'right'
  /** 默认展开所有行 */
  defaultExpandAllRows?: boolean
  /** 判断行是否可展开 */
  rowExpandable?: (record: TRecord) => boolean
  /** 是否显示展开列，默认 true */
  showExpandColumn?: boolean
  /** 展开行 class */
  expandedRowClassName?: string | RowClassName<TRecord>
}

// ---- 行选择类型 ----

export type RowSelectionType = 'checkbox' | 'radio'

export interface SelectionItem {
  key: string
  text: string | VNodeChild
  onSelect?: (changeableRowKeys: Key[]) => void
}

export interface RowSelection<TRecord = Record<string, unknown>> {
  preserveSelectedRowKeys?: boolean
  type?: RowSelectionType
  selectedRowKeys?: Key[]
  defaultSelectedRowKeys?: Key[]
  onChange?: (selectedRowKeys: Key[], selectedRows: TRecord[]) => void
  onSelect?: (record: TRecord, selected: boolean, selectedRows: TRecord[]) => void
  onSelectMultiple?: (selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void
  onSelectAll?: (selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void
  onSelectInvert?: (selectedRowKeys: Key[]) => void
  onSelectNone?: () => void
  getCheckboxProps?: (record: TRecord) => { disabled?: boolean; name?: string }
  columnWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  columnTitle?: string | VNodeChild
  renderCell?: (
    value: boolean,
    record: TRecord,
    index: number,
    originNode: VNodeChild,
  ) => VNodeChild | RenderedCell
  checkStrictly?: boolean
  /** 自定义选择项。true 显示默认项，数组显示自定义项 */
  selections?: boolean | SelectionItem[]
  /** 隐藏全选 checkbox 及自定义选择下拉 */
  hideSelectAll?: boolean
}

/**
 * bodyCell slot 的参数类型。
 */
export interface TableBodyCellSlotProps<TRecord extends object = Record<string, any>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

/**
 * headerCell slot 的参数类型。
 */
export interface TableHeaderCellSlotProps<TRecord extends object = Record<string, any>> {
  title: VNodeChild | undefined
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>
  index: number
}

/**
 * customFilterDropdown slot 的参数类型。
 */
export interface CustomFilterDropdownSlotProps<TRecord extends object = Record<string, any>> {
  column: ColumnType<TRecord>
  selectedKeys: (string | number | boolean)[]
  setSelectedKeys: (keys: (string | number | boolean)[]) => void
  confirm: (options?: { closeDropdown?: boolean }) => void
  clearFilters: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
  filters: ColumnFilterItem[]
  visible: boolean
  close: () => void
}

/**
 * title / footer slot 的参数类型。
 */
export interface TableDataSlotProps<TRecord extends object = Record<string, any>> {
  data: TRecord[]
}

/**
 * Table 组件 slots 声明。
 */
export interface TableSlotsDecl<TRecord extends object = Record<string, any>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
  customFilterDropdown?: (props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild
  customFilterIcon?: (props: { column: ColumnType<TRecord>; filtered: boolean }) => VNodeChild
  title?: (props: TableDataSlotProps<TRecord>) => VNodeChild
  footer?: (props: TableDataSlotProps<TRecord>) => VNodeChild
  summary?: () => VNodeChild
}

/**
 * Table 组件 Props。
 */
export interface TableProps<TRecord extends object = Record<string, any>> {
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

  /** 表格布局模式 */
  tableLayout?: TableLayout

  /** 是否显示表头 */
  showHeader?: boolean

  /** 行 class */
  rowClassName?: string | RowClassName<TRecord>

  /** 自定义行 props */
  customRow?: GetComponentProps<TRecord>

  /** 自定义表头行 props */
  customHeaderRow?: (
    columns: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>,
    index?: number,
  ) => CellAdditionalProps

  /**
   * 表级别控制是否显示排序 tooltip，默认 true。
   * 可被列级别 showSorterTooltip 覆盖。
   */
  showSorterTooltip?: boolean

  /** 表级排序方向列表 */
  sortDirections?: SortOrder[]

  /** 当前激活语言标识，默认继承 provider/plugin，否则为 'zh-CN'。 */
  locale?: LocaleName

  /** 当前实例注册的语言包映射。 */
  locales?: LocaleRegistry

  /** 表级 locale 局部覆写，优先级高于全局 provider / plugin。 */
  localeOverrides?: DeepPartial<VTableGuildTableLocale>

  /** 粘性表头/滚动条 */
  sticky?: boolean | TableSticky

  /** 下拉层挂载容器 */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement

  /** 单元格文本转换 */
  transformCellText?: TransformCellText<TRecord>

  /** 行选择配置 */
  rowSelection?: RowSelection<TRecord>

  /** 展开行配置 */
  expandable?: Expandable<TRecord>

  /** 表格标题渲染函数 */
  title?: (data: TRecord[]) => VNodeChild

  /** 表格页脚渲染函数 */
  footer?: (data: TRecord[]) => VNodeChild

  /** 滚动配置。x 为横向滚动宽度，y 为纵向滚动高度（启用固定表头）。 */
  scroll?: { x?: number | string; y?: number | string }

  /** 是否开启虚拟滚动（需同时设置 scroll.y） */
  virtual?: boolean

  /** 树形数据子节点字段名，默认 'children' */
  childrenColumnName?: string

  /** 树形数据缩进宽度（px），默认 15 */
  indentSize?: number

  /** 树形数据受控展开 key 列表 */
  expandedRowKeys?: Key[]

  /** 树形数据非受控默认展开 key 列表 */
  defaultExpandedRowKeys?: Key[]

  /** 树形数据默认展开所有节点 */
  defaultExpandAllRows?: boolean

  /** 树形数据展开/折叠回调 */
  onExpand?: (expanded: boolean, record: TRecord) => void

  /** 树形数据展开 key 变化回调 */
  onExpandedRowsChange?: (expandedKeys: Key[]) => void
}

// ---- change 事件参数类型 ----

/** change 事件中的 filters 参数 */
export type TableFiltersInfo = Record<string, (string | number | boolean)[] | null>

export interface SorterResultLike<TRecord extends object = Record<string, any>> {
  column: ColumnType<TRecord> | undefined
  columnKey: Key | undefined
  order: SortOrder
  field: ColumnType<TRecord>['dataIndex']
}

/** change 事件中的 extra 参数 */
export interface TableChangeExtra<TRecord extends object = Record<string, any>> {
  /** 触发变化的来源 */
  action: 'sort' | 'filter' | 'select'
  /** 当前显示的数据（经排序/筛选后） */
  currentDataSource: TRecord[]
}

export type VTableSorterResult<TRecord extends object = Record<string, any>> =
  | SorterResultLike<TRecord>
  | Array<SorterResultLike<TRecord>>

export interface VTableEventProps<TRecord extends object = Record<string, any>> {
  onChange?: (
    filters: TableFiltersInfo,
    sorter: VTableSorterResult<TRecord>,
    extra: TableChangeExtra<TRecord>,
  ) => void
  onResizeColumn?: (column: ColumnType<TRecord>, width: number) => void
}

export type VTablePublicProps<TRecord extends object = Record<string, any>> = TableProps<TRecord> &
  VTableEventProps<TRecord>

export declare class VTableGeneric<TRecord extends object = Record<string, any>> {
  readonly $props: VTablePublicProps<TRecord> &
    VNodeProps &
    AllowedComponentProps &
    ComponentCustomProps
  readonly $slots: TableSlotsDecl<TRecord>
  $emit(
    event: 'change',
    filters: TableFiltersInfo,
    sorter: VTableSorterResult<TRecord>,
    extra: TableChangeExtra<TRecord>,
  ): void
  $emit(event: 'resizeColumn', column: ColumnType<TRecord>, width: number): void
}

export type VTableComponent = typeof VTableGeneric
