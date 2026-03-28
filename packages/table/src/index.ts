import _VTable from './components/VTable.vue'
import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from './constants'
import _VTableSummary from './components/VTableSummary'
import _VTableSummaryRow from './components/VTableSummaryRow'
import _VTableSummaryCell from './components/VTableSummaryCell'

const VTable = Object.assign(_VTable, { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } as const)
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
  VTableSorterResult,
  VTableEventProps,
  VTablePublicProps,
  VTableComponent,
  RowSelection,
  RowSelectionType,
  SelectionItem,
  SelectionSentinel,
  Expandable,
} from './types'
export type { SummaryFixed } from './components/VTableSummary'
export type { VTableGuildTableLocale } from '@vtable-guild/core'

export { useColumns, getByDataIndex } from './composables'
export type { SorterResult, SelectionState } from './composables'
export type { FlattenRow } from './composables/useTreeData'
