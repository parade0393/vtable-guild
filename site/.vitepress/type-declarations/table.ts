/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hand-maintained declarations shown in the documentation.
 * Keep these aligned with the public entry point and table.contracts.typecheck.ts.
 */
import type { CSSProperties, VNodeChild } from 'vue'
import type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  SlotProps,
  TableSlots,
  VTableGuildPaginationLocale,
  VTableGuildTableLocale,
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
} from '@vtable-guild/vtable-guild'

// #region Key
export type Key = string | number
// #endregion Key

// #region AlignType
export type AlignType = 'left' | 'center' | 'right'
// #endregion AlignType

// #region SortOrder
export type SortOrder = 'ascend' | 'descend' | null
// #endregion SortOrder

// #region SorterFn
export type SorterFn<TRecord = Record<string, any>> = (a: TRecord, b: TRecord) => number
// #endregion SorterFn

// #region ColumnSorterObject
export interface ColumnSorterObject<TRecord = Record<string, any>> {
  compare?: SorterFn<TRecord>
  multiple?: number
}
// #endregion ColumnSorterObject

// #region ColumnSorter
export type ColumnSorter<TRecord = Record<string, any>> =
  | boolean
  | SorterFn<TRecord>
  | ColumnSorterObject<TRecord>
// #endregion ColumnSorter

// #region Breakpoint
export type Breakpoint = 'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs'
// #endregion Breakpoint

// #region TableLayout
export type TableLayout = 'auto' | 'fixed'
// #endregion TableLayout

// #region RowClassName
export type RowClassName<TRecord = Record<string, any>> = (
  record: TRecord,
  index: number,
  indent: number,
) => string
// #endregion RowClassName

// #region TableSticky
export interface TableSticky {
  offsetHeader?: number
  offsetSummary?: number
  offsetScroll?: number
  getContainer?: () => Window | HTMLElement
}
// #endregion TableSticky

// #region TransformCellText
export type TransformCellText<TRecord extends object = Record<string, any>> = (opt: {
  text: unknown
  column: ColumnType<TRecord>
  record: TRecord
  index: number
}) => unknown
// #endregion TransformCellText

// #region CellAdditionalProps
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
// #endregion CellAdditionalProps

// #region RenderedCell
export interface RenderedCell {
  props?: CellAdditionalProps
  children?: VNodeChild
}
// #endregion RenderedCell

// #region GetComponentProps
export type GetComponentProps<TData, TRecord extends object = Record<string, any>> = (
  data: TData,
  index: number,
  column?: ColumnType<TRecord>,
) => CellAdditionalProps | undefined
// #endregion GetComponentProps

// #region ColumnTitleProps
export interface ColumnTitleProps<TRecord extends object = Record<string, any>> {
  sortOrder?: SortOrder
  sortColumn?: ColumnType<TRecord>
  sortColumns?: Array<{ column: ColumnType<TRecord>; order: SortOrder }>
  filters?: Record<string, (string | number | boolean)[] | null>
}
// #endregion ColumnTitleProps

// #region ColumnTitle
export type ColumnTitle<TRecord extends object = Record<string, any>> =
  | VNodeChild
  | ((props: ColumnTitleProps<TRecord>) => VNodeChild)
// #endregion ColumnTitle

// #region ColumnType
export interface ColumnType<TRecord extends object = Record<string, any>> {
  key?: Key
  title?: ColumnTitle<TRecord>
  dataIndex?: DataIndex
  width?: number | string
  align?: AlignType
  ellipsis?: boolean | { showTitle?: boolean }
  className?: string
  colSpan?: number
  customRender?: (ctx: CustomRenderContext<TRecord>) => VNodeChild | RenderedCell
  customCell?: GetComponentProps<TRecord, TRecord>
  customHeaderCell?: GetComponentProps<ColumnType<TRecord> | ColumnGroupType<TRecord>, TRecord>
  fixed?: 'left' | 'right' | true
  resizable?: boolean
  minWidth?: number
  maxWidth?: number
  sorter?: ColumnSorter<TRecord>
  sortOrder?: SortOrder
  defaultSortOrder?: SortOrder
  sortDirections?: SortOrder[]
  filters?: ColumnFilterItem[]
  onFilter?: (value: string | number | boolean, record: TRecord) => boolean
  filterMultiple?: boolean
  filteredValue?: (string | number | boolean)[] | null
  defaultFilteredValue?: (string | number | boolean)[]
  customFilterDropdown?: boolean
  filterSearch?: boolean | ((input: string, filter: ColumnFilterItem) => boolean)
  filterMode?: 'menu' | 'tree'
  filterResetToDefaultFilteredValue?: boolean
  filterDropdownOpen?: boolean
  onFilterDropdownOpenChange?: (visible: boolean) => void
  filtered?: boolean
  filterIcon?: (opt: { filtered: boolean }) => VNodeChild
  filterDropdown?: VNodeChild | ((props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild)
  showSorterTooltip?: boolean
  visible?: boolean
  responsive?: Breakpoint[]
}
// #endregion ColumnType

// #region DataIndex
export type DataIndex = string | number | Array<string | number>
// #endregion DataIndex

// #region CustomRenderContext
export interface CustomRenderContext<TRecord extends object = Record<string, any>> {
  text: unknown
  value: unknown
  record: TRecord
  index: number
  renderIndex: number
  column: ColumnType<TRecord>
}
// #endregion CustomRenderContext

// #region ColumnGroupType
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
// #endregion ColumnGroupType

// #region ColumnsType
export type ColumnsType<TRecord extends object = Record<string, any>> = Array<
  ColumnType<TRecord> | ColumnGroupType<TRecord> | ColumnSentinel
>
// #endregion ColumnsType

// #region ColumnFilterItem
export interface ColumnFilterItem {
  text: string
  value: string | number | boolean
  children?: ColumnFilterItem[]
}
// #endregion ColumnFilterItem

// #region Expandable
export interface Expandable<TRecord extends object = Record<string, any>> {
  expandedRowRender?: (
    record: TRecord,
    index: number,
    indent: number,
    expanded: boolean,
  ) => VNodeChild
  expandedRowKeys?: Key[]
  defaultExpandedRowKeys?: Key[]
  expandRowByClick?: boolean
  expandIcon?: (props: {
    expanded: boolean
    record: TRecord
    expandable: boolean
    onExpand: (record: TRecord, e: Event) => void
  }) => VNodeChild
  onExpand?: (expanded: boolean, record: TRecord) => void
  onExpandedRowsChange?: (expandedKeys: Key[]) => void
  columnWidth?: number | string
  fixed?: 'left' | 'right' | true
  defaultExpandAllRows?: boolean
  rowExpandable?: (record: TRecord) => boolean
  showExpandColumn?: boolean
  expandedRowClassName?: string | RowClassName<TRecord>
}
// #endregion Expandable

// #region RowSelectionType
export type RowSelectionType = 'checkbox' | 'radio'
// #endregion RowSelectionType

// #region SelectionItem
export interface SelectionItem {
  key: string
  text: string | VNodeChild
  onSelect?: (changeableRowKeys: Key[]) => void
}
// #endregion SelectionItem

// #region RowSelection
export interface RowSelection<TRecord extends object = Record<string, any>> {
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
  selections?: boolean | (SelectionItem | SelectionSentinel)[]
  hideSelectAll?: boolean
}
// #endregion RowSelection

// #region TableBodyCellSlotProps
export interface TableBodyCellSlotProps<TRecord extends object = Record<string, any>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}
// #endregion TableBodyCellSlotProps

// #region TableHeaderCellSlotProps
export interface TableHeaderCellSlotProps<TRecord extends object = Record<string, any>> {
  title: VNodeChild | undefined
  column: ColumnType<TRecord> | ColumnGroupType<TRecord>
  index: number
}
// #endregion TableHeaderCellSlotProps

// #region CustomFilterDropdownSlotProps
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
// #endregion CustomFilterDropdownSlotProps

// #region TableDataSlotProps
export interface TableDataSlotProps<TRecord extends object = Record<string, any>> {
  data: TRecord[]
}
// #endregion TableDataSlotProps

// #region TableSlotsDecl
export interface TableSlotsDecl<TRecord extends object = Record<string, any>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
  customFilterDropdown?: (props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild
  customFilterIcon?: (props: { column: ColumnType<TRecord>; filtered: boolean }) => VNodeChild
  title?: (props: TableDataSlotProps<TRecord>) => VNodeChild
  footer?: (props: TableDataSlotProps<TRecord>) => VNodeChild
  paginationItem?: (props: TablePaginationSlotProps) => VNodeChild
  summary?: () => VNodeChild
}
// #endregion TableSlotsDecl

// #region TableProps
export interface TableProps<TRecord extends object = Record<string, any>> {
  pagination?: false | TablePaginationConfig
  dataSource: TRecord[]
  columns: ColumnsType<TRecord>
  columnOrder?: Key[]
  rowKey?: string | ((record: TRecord) => Key)
  loading?: boolean | { spinning?: boolean; indicator?: VNodeChild; tip?: string }
  size?: 'small' | 'middle' | 'large'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
  rowDraggable?: boolean
  ui?: SlotProps<{ slots: Record<TableSlots, string> }>
  class?: string
  tableLayout?: TableLayout
  showHeader?: boolean
  headerEllipsis?: boolean
  rowClassName?: string | RowClassName<TRecord>
  customRow?: GetComponentProps<TRecord>
  customHeaderRow?: (
    columns: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>,
    index?: number,
  ) => CellAdditionalProps
  showSorterTooltip?: boolean
  sortDirections?: SortOrder[]
  locale?: LocaleName
  locales?: LocaleRegistry
  localeOverrides?: DeepPartial<VTableGuildTableLocale>
  sticky?: boolean | TableSticky
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement
  transformCellText?: TransformCellText<TRecord>
  rowSelection?: RowSelection<TRecord>
  expandable?: Expandable<TRecord>
  title?: (data: TRecord[]) => VNodeChild
  footer?: (data: TRecord[]) => VNodeChild
  scroll?: { x?: number | string; y?: number | string; scrollToFirstRowOnChange?: boolean }
  virtual?: boolean
  rowHeight?: number
  virtualColumn?: boolean
  childrenColumnName?: string
  indentSize?: number
  expandedRowKeys?: Key[]
  defaultExpandedRowKeys?: Key[]
  defaultExpandAllRows?: boolean
  onExpand?: (expanded: boolean, record: TRecord) => void
  onExpandedRowsChange?: (expandedKeys: Key[]) => void
}
// #endregion TableProps

// #region TableFiltersInfo
export type TableFiltersInfo = Record<string, (string | number | boolean)[] | null>
// #endregion TableFiltersInfo

// #region SorterResultLike
export interface SorterResultLike<TRecord extends object = Record<string, any>> {
  column: ColumnType<TRecord> | undefined
  columnKey: Key | undefined
  order: SortOrder
  field: ColumnType<TRecord>['dataIndex']
}
// #endregion SorterResultLike

// #region TableChangeExtra
export interface TableChangeExtra<TRecord extends object = Record<string, any>> {
  action: 'sort' | 'filter' | 'select' | 'paginate'
  /** Available only when pagination is enabled. */
  pagination?: TablePaginationState
  currentDataSource: TRecord[]
}
// #endregion TableChangeExtra

// #region VTableSorterResult
export type VTableSorterResult<TRecord extends object = Record<string, any>> =
  | SorterResultLike<TRecord>
  | Array<SorterResultLike<TRecord>>
// #endregion VTableSorterResult

// #region RowDragSortInfo
export interface RowDragSortInfo {
  draggedKey: Key
  targetKey: Key
  orderedKeys: Key[]
}
// #endregion RowDragSortInfo

// #region VTableEventProps
export interface VTableEventProps<TRecord extends object = Record<string, any>> {
  onChange?: (
    filters: TableFiltersInfo,
    sorter: VTableSorterResult<TRecord>,
    extra: TableChangeExtra<TRecord>,
  ) => void
  onResizeColumn?: (column: ColumnType<TRecord>, width: number) => void
  onRowDragEnd?: (newData: TRecord[], info: RowDragSortInfo) => void
}
// #endregion VTableEventProps

// #region VTablePublicProps
export type VTablePublicProps<TRecord extends object = Record<string, any>> = TableProps<TRecord> &
  VTableEventProps<TRecord>
// #endregion VTablePublicProps

// #region TablePaginationState
export interface TablePaginationState {
  current: number
  pageSize: number
  total: number
}
// #endregion TablePaginationState

// #region TablePaginationPosition
export type TablePaginationPosition =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'none'
// #endregion TablePaginationPosition

// #region PaginationItemType
export type PaginationItemType = 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next'
// #endregion PaginationItemType

// #region TablePaginationBuiltinLayoutItem
export type TablePaginationBuiltinLayoutItem =
  | 'total'
  | 'sizes'
  | 'prev'
  | 'pager'
  | 'next'
  | 'jumper'
// #endregion TablePaginationBuiltinLayoutItem

// #region TablePaginationLayoutItem
export type TablePaginationLayoutItem = TablePaginationBuiltinLayoutItem | { readonly slot: string }
// #endregion TablePaginationLayoutItem

// #region TablePaginationLayout
export type TablePaginationLayout =
  | readonly TablePaginationLayoutItem[]
  | {
      readonly left?: readonly TablePaginationLayoutItem[]
      readonly right?: readonly TablePaginationLayoutItem[]
    }
// #endregion TablePaginationLayout

// #region TablePaginationSlotProps
export type TablePaginationSlotProps = Readonly<
  TablePaginationState & {
    name: string
    pageCount: number
    range: readonly [number, number]
    disabled: boolean
    position: Exclude<TablePaginationPosition, 'none'>
    region: 'inline' | 'left' | 'right'
  }
>
// #endregion TablePaginationSlotProps

// #region TablePaginationConfig
export interface TablePaginationConfig {
  current?: number
  defaultCurrent?: number
  pageSize?: number
  defaultPageSize?: number
  total?: number
  disabled?: boolean
  hideOnSinglePage?: boolean
  showSizeChanger?: boolean
  pageSizeOptions?: (string | number)[]
  totalBoundaryShowSizeChanger?: number
  buildOptionText?: (option: { value: string | number }) => VNodeChild
  showQuickJumper?: boolean | { goButton?: VNodeChild }
  showTotal?: (total: number, range: [number, number]) => VNodeChild
  size?: 'default' | 'small'
  simple?: boolean
  showLessItems?: boolean
  pagerCount?: number
  responsive?: boolean
  itemRender?: (item: {
    page: number
    type: PaginationItemType
    originalElement: VNodeChild
  }) => VNodeChild
  locale?: Partial<VTableGuildPaginationLocale>
  class?: string
  style?: CSSProperties
  position?: TablePaginationPosition[]
  layout?: TablePaginationLayout
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  'onUpdate:current'?: (current: number) => void
  'onUpdate:pageSize'?: (pageSize: number) => void
}
// #endregion TablePaginationConfig

// #region SelectionSentinel
export type SelectionSentinel =
  | typeof SELECTION_ALL
  | typeof SELECTION_INVERT
  | typeof SELECTION_NONE
// #endregion SelectionSentinel

// #region ExpandColumnSentinel
export type ExpandColumnSentinel = typeof EXPAND_COLUMN
// #endregion ExpandColumnSentinel

// #region SelectionColumnSentinel
export type SelectionColumnSentinel = typeof SELECTION_COLUMN
// #endregion SelectionColumnSentinel

// #region ColumnSentinel
export type ColumnSentinel = ExpandColumnSentinel | SelectionColumnSentinel
// #endregion ColumnSentinel

// #region TableColumnType
export type TableColumnType<TRecord extends object = Record<string, any>> = ColumnType<TRecord>
// #endregion TableColumnType

// #region TableColumnGroupType
export type TableColumnGroupType<TRecord extends object = Record<string, any>> =
  ColumnGroupType<TRecord>
// #endregion TableColumnGroupType

// #region TableColumnsType
export type TableColumnsType<TRecord extends object = Record<string, any>> = ColumnsType<TRecord>
// #endregion TableColumnsType

// #region VTableComponent
import type { VTableComponent as PublicVTableComponent } from '@vtable-guild/vtable-guild'

/** The public component type is derived from the generic Vue SFC. */
export type VTableComponent = PublicVTableComponent
// #endregion VTableComponent

// #region SummaryFixed
export type SummaryFixed = boolean | 'top' | 'bottom'
// #endregion SummaryFixed
