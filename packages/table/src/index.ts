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

const VTable = Object.assign(_VTable, {
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
} as const)
const VTableSummary = _VTableSummary
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
  ColumnType,
  ColumnType as TableColumnType,
  ColumnGroupType,
  ColumnGroupType as TableColumnGroupType,
  ColumnsType,
  ColumnsType as TableColumnsType,
  SortOrder,
  SorterFn,
  ColumnSorter,
  ColumnFilterItem,
  TableProps,
  TableBodyCellSlotProps,
  TableHeaderCellSlotProps,
  TableDataSlotProps,
  TableSlotsDecl,
  CustomFilterDropdownSlotProps,
  TableFiltersInfo,
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
