import _VTable from './components/VTable.vue'
import {
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
} from './constants'
import _VTableSummary from './components/VTableSummary'
import _VTableSummaryRow from './components/VTableSummaryRow'
import _VTableSummaryCell from './components/VTableSummaryCell'

export { default as VTableColumnSettings } from './components/VTableColumnSettings.vue'
export type {
  TableColumnSettingsProps,
  TableColumnSettingsSize,
  TableColumnSettingsSlots,
  TableColumnSettingsOptions,
} from './types/column-settings'
export { default as VTableToolbar } from './components/VTableToolbar.vue'
export { default as VTableSelectionAlert } from './components/VTableSelectionAlert.vue'
export type {
  TableSelectionAlertProps,
  TableSelectionAlertSlotProps,
  TableSelectionAlertSlots,
} from './types/selection-alert'
export type { TableToolbarSearchConfig } from './types/toolbar'
export { useTableRequest } from './composables/useTableRequest'
export { createTableDictionary, useTableDictionary } from './composables/useTableDictionary'
export { useTableEditable } from './composables/useTableEditable'
export { default as VTableEditCell } from './components/VTableEditCell.vue'
export { default as VTableQuery } from './components/VTableQuery.vue'
export { deriveTableQueryFields } from './utils/queryFields'
export type * from './types/query-form'
export { createAntdvTableControls, createElementPlusTableControls } from './controls'
export type * from './types/controls'
export type * from './types/editable'
export type * from './types/dictionary'
export { useTableQuery } from './composables/useTableQuery'
export { useTableEdit } from './composables/useTableEdit'
export { createTableRenderers } from './renderers'
export type * from './types/query'
export type * from './types/editing'
export type * from './types/renderers'
export type * from './types/instance'
export type * from './types/tree'
export type * from './types/request'
export { useColumnState } from './composables/useColumnState'
export type {
  TableColumnState,
  TableColumnStateValue,
  UseColumnStateOptions,
} from './composables/useColumnState'
export type * from './types/presentation'
export type {
  TableToolbarProps,
  TableToolbarOptions,
  TableToolbarSlots,
  TableToolbarSlotProps,
} from './types/toolbar'

const VTable = Object.assign(_VTable, {
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
} as const)
const VTableSummary: typeof _VTableSummary = _VTableSummary
const VTableSummaryRow = _VTableSummaryRow
const VTableSummaryCell = _VTableSummaryCell

export {
  VTable,
  VTableSummary,
  VTableSummaryRow,
  VTableSummaryCell,
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
}

export type {
  Key,
  AlignType,
  Breakpoint,
  DataIndex,
  CellAdditionalProps,
  CustomRenderContext,
  RenderedCell,
  GetComponentProps,
  ColumnTitleProps,
  ColumnTitle,
  ColumnType,
  ColumnType as TableColumnType,
  ColumnGroupType,
  ColumnGroupType as TableColumnGroupType,
  ColumnsType,
  ColumnsType as TableColumnsType,
  SortOrder,
  SorterFn,
  ColumnSorterObject,
  ColumnSorter,
  ColumnFilterItem,
  TableLayout,
  TableSticky,
  RowClassName,
  TransformCellText,
  TableProps,
  TablePaginationConfig,
  TablePaginationState,
  TablePaginationPosition,
  TablePaginationBuiltinLayoutItem,
  TablePaginationLayoutItem,
  TablePaginationLayout,
  TablePaginationSlotProps,
  PaginationItemType,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableDataSlotProps,
  TableSlotsDecl,
  CustomFilterDropdownSlotProps,
  TableFiltersInfo,
  SorterResultLike,
  TableChangeExtra,
  RowDragSortInfo,
  VTableSorterResult,
  VTableEventProps,
  VTablePublicProps,
  RowSelection,
  RowSelectionType,
  SelectionItem,
  SelectionSentinel,
  ColumnSentinel,
  ExpandColumnSentinel,
  SelectionColumnSentinel,
  Expandable,
} from './types'

/**
 * 直接从真实导出（泛型 SFC）派生组件类型，而不是在 types/ 里手写一份
 * declare class——手写副本会随 props/emit 演进静默漂移。
 */
export type VTableComponent = typeof _VTable
export type { SummaryFixed } from './components/VTableSummary'
export type { VTableGuildTableLocale } from '@vtable-guild/core'

export { useColumns, getByDataIndex } from './composables'
export { useRowDragSort, moveTreeNode } from './composables'
export type {
  SorterResult,
  SelectionState,
  DropPosition,
  RowDragBindings,
  RowDragDropTarget,
} from './composables'
export type { FlattenRow } from './composables/useTreeData'
