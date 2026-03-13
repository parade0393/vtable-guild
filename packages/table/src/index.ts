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
  RowSelection,
  RowSelectionType,
} from './types'
export type { VTableGuildTableLocale } from '@vtable-guild/core'

export { useColumns, getByDataIndex } from './composables'
export type { SorterResult } from './composables'
