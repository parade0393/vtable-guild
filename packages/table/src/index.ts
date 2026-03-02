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
  TablePaginationInfo,
  TableFiltersInfo,
  TableChangeExtra,
} from './types'

export { useColumns, getByDataIndex } from './composables'
export type { SorterResult } from './composables'
