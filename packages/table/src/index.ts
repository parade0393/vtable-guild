export { default as VTable } from './components/VTable.vue'

export type {
  Key,
  AlignType,
  DataIndex,
  CellAdditionalProps,
  CustomRenderContext,
  RenderedCell,
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
  Expandable,
} from './types'
export type { VTableGuildTableLocale } from '@vtable-guild/core'

export { useColumns, getByDataIndex } from './composables'
export type { SorterResult, SelectionState } from './composables'
export type { FlattenRow } from './composables/useTreeData'
