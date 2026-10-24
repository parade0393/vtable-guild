/* eslint-disable @typescript-eslint/no-explicit-any */
/** Hand-maintained feature excerpts; full declarations live in table.ts. */
import type { VNodeChild } from 'vue'
import type {
  Breakpoint,
  CellAdditionalProps,
  ColumnFilterItem,
  ColumnGroupType,
  ColumnSorter,
  ColumnTitle,
  ColumnType,
  CustomFilterDropdownSlotProps,
  CustomRenderContext,
  DataIndex,
  GetComponentProps,
  Key,
  RenderedCell,
  RowClassName,
  SortOrder,
  TableLayout,
  TableSticky,
  TransformCellText,
  TableTooltipConfig,
} from '@vtable-guild/vtable-guild'

// #region SortingColumnFields
/** ColumnType 节选；文档辅助接口，不是包导出。 */
export interface SortingColumnFields<TRecord extends object = Record<string, any>> {
  key?: Key
  sorter?: ColumnSorter<TRecord>
  sortOrder?: SortOrder
  defaultSortOrder?: SortOrder
  sortDirections?: SortOrder[]
  showSorterTooltip?: boolean | TableTooltipConfig
}
// #endregion SortingColumnFields

// #region FilteringColumnFields
/** ColumnType 节选；文档辅助接口，不是包导出。 */
export interface FilteringColumnFields<TRecord extends object = Record<string, any>> {
  key?: Key
  filters?: ColumnFilterItem[] | boolean
  onFilter?: boolean | ((value: string | number | boolean, record: TRecord) => boolean)
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
}
// #endregion FilteringColumnFields

// #region ResizableColumnFields
/** ColumnType 节选；文档辅助接口，不是包导出。 */
export interface ResizableColumnFields {
  key?: Key
  width?: number | string
  resizable?: boolean
  minWidth?: number
  maxWidth?: number
}
// #endregion ResizableColumnFields

// #region FixedColumnFields
/** ColumnType 节选；文档辅助接口，不是包导出。 */
export interface FixedColumnFields {
  fixed?: 'left' | 'right' | true
  width?: number | string
}
// #endregion FixedColumnFields

// #region DisplayColumnFields
/** ColumnType 节选；文档辅助接口，不是包导出。 */
export interface DisplayColumnFields {
  key?: Key
  visible?: boolean
  responsive?: Breakpoint[]
}
// #endregion DisplayColumnFields

// #region MergedColumnFields
/** ColumnType 节选；文档辅助接口，不是包导出。 */
export interface MergedColumnFields<TRecord extends object = Record<string, any>> {
  key?: Key
  title?: ColumnTitle<TRecord>
  dataIndex?: DataIndex
  colSpan?: number
  customRender?: (ctx: CustomRenderContext<TRecord>) => VNodeChild | RenderedCell
  customCell?: GetComponentProps<TRecord, TRecord>
  customHeaderCell?: GetComponentProps<ColumnType<TRecord> | ColumnGroupType<TRecord>, TRecord>
}
// #endregion MergedColumnFields

// #region ScrollFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface ScrollFields {
  scroll?: { x?: number | string; y?: number | string; scrollToFirstRowOnChange?: boolean }
  sticky?: boolean | TableSticky
  tableLayout?: TableLayout
}
// #endregion ScrollFields

// #region VirtualizationFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface VirtualizationFields<TRecord extends object = Record<string, any>> {
  rowKey?: string | ((record: TRecord) => Key)
  scroll?: { x?: number | string; y?: number | string; scrollToFirstRowOnChange?: boolean }
  virtual?: boolean
  virtualColumn?: boolean
  rowHeight?: number
}
// #endregion VirtualizationFields

// #region TreeFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface TreeFields<TRecord extends object = Record<string, any>> {
  childrenColumnName?: string
  rowKey?: string | ((record: TRecord) => Key)
  indentSize?: number
  expandedRowKeys?: Key[]
  defaultExpandedRowKeys?: Key[]
  defaultExpandAllRows?: boolean
  onExpand?: (expanded: boolean, record: TRecord) => void
  onExpandedRowsChange?: (expandedKeys: Key[]) => void
}
// #endregion TreeFields

// #region CustomStructureFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface CustomStructureFields<TRecord extends object = Record<string, any>> {
  rowClassName?: string | RowClassName<TRecord>
  customRow?: GetComponentProps<TRecord>
  customHeaderRow?: (
    columns: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>,
    index?: number,
  ) => CellAdditionalProps
  transformCellText?: TransformCellText<TRecord>
}
// #endregion CustomStructureFields

// #region TitleFooterFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface TitleFooterFields<TRecord extends object = Record<string, any>> {
  title?: (data: TRecord[]) => VNodeChild
  footer?: (data: TRecord[]) => VNodeChild
}
// #endregion TitleFooterFields

// #region RowDragFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface RowDragFields<TRecord extends object = Record<string, any>> {
  rowDraggable?: boolean
  rowKey?: string | ((record: TRecord) => Key)
  childrenColumnName?: string
}
// #endregion RowDragFields

// #region ColumnOrderFields
/** TableProps 节选；文档辅助接口，不是包导出。 */
export interface ColumnOrderFields {
  columnOrder?: Key[]
}
// #endregion ColumnOrderFields
