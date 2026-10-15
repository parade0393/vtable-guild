import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from './table'

// Unlike mutual assignability, this comparison also detects readonly/optional drift.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

interface Row {
  id: number
  name: string
  children?: Row[]
}

// Every declaration is checked against the supported import path. Generic declarations
// are checked both with a concrete row and with their public default type arguments.
export type TableDeclarationContracts = [
  Assert<Equal<Docs.Key, Public.Key>>,
  Assert<Equal<Docs.AlignType, Public.AlignType>>,
  Assert<Equal<Docs.SortOrder, Public.SortOrder>>,
  Assert<Equal<Docs.SorterFn, Public.SorterFn>>,
  Assert<Equal<Docs.SorterFn<Row>, Public.SorterFn<Row>>>,
  Assert<Equal<Docs.ColumnSorterObject, Public.ColumnSorterObject>>,
  Assert<Equal<Docs.ColumnSorterObject<Row>, Public.ColumnSorterObject<Row>>>,
  Assert<Equal<Docs.ColumnSorter, Public.ColumnSorter>>,
  Assert<Equal<Docs.ColumnSorter<Row>, Public.ColumnSorter<Row>>>,
  Assert<Equal<Docs.Breakpoint, Public.Breakpoint>>,
  Assert<Equal<Docs.TableLayout, Public.TableLayout>>,
  Assert<Equal<Docs.RowClassName, Public.RowClassName>>,
  Assert<Equal<Docs.RowClassName<Row>, Public.RowClassName<Row>>>,
  Assert<Equal<Docs.TableSticky, Public.TableSticky>>,
  Assert<Equal<Docs.TransformCellText, Public.TransformCellText>>,
  Assert<Equal<Docs.TransformCellText<Row>, Public.TransformCellText<Row>>>,
  Assert<Equal<Docs.CellAdditionalProps, Public.CellAdditionalProps>>,
  Assert<Equal<Docs.RenderedCell, Public.RenderedCell>>,
  Assert<Equal<Docs.GetComponentProps<Row>, Public.GetComponentProps<Row>>>,
  Assert<Equal<Docs.GetComponentProps<Row, Row>, Public.GetComponentProps<Row, Row>>>,
  Assert<Equal<Docs.ColumnTitleProps, Public.ColumnTitleProps>>,
  Assert<Equal<Docs.ColumnTitleProps<Row>, Public.ColumnTitleProps<Row>>>,
  Assert<Equal<Docs.ColumnTitle, Public.ColumnTitle>>,
  Assert<Equal<Docs.ColumnTitle<Row>, Public.ColumnTitle<Row>>>,
  Assert<Equal<Docs.ColumnType, Public.ColumnType>>,
  Assert<Equal<Docs.ColumnType<Row>, Public.ColumnType<Row>>>,
  Assert<Equal<Docs.DataIndex, Public.DataIndex>>,
  Assert<Equal<Docs.CustomRenderContext, Public.CustomRenderContext>>,
  Assert<Equal<Docs.CustomRenderContext<Row>, Public.CustomRenderContext<Row>>>,
  Assert<Equal<Docs.ColumnGroupType, Public.ColumnGroupType>>,
  Assert<Equal<Docs.ColumnGroupType<Row>, Public.ColumnGroupType<Row>>>,
  Assert<Equal<Docs.ColumnsType, Public.ColumnsType>>,
  Assert<Equal<Docs.ColumnsType<Row>, Public.ColumnsType<Row>>>,
  Assert<Equal<Docs.ColumnFilterItem, Public.ColumnFilterItem>>,
  Assert<Equal<Docs.Expandable, Public.Expandable>>,
  Assert<Equal<Docs.Expandable<Row>, Public.Expandable<Row>>>,
  Assert<Equal<Docs.RowSelectionType, Public.RowSelectionType>>,
  Assert<Equal<Docs.SelectionItem, Public.SelectionItem>>,
  Assert<Equal<Docs.RowSelection, Public.RowSelection>>,
  Assert<Equal<Docs.RowSelection<Row>, Public.RowSelection<Row>>>,
  Assert<Equal<Docs.TableBodyCellSlotProps, Public.TableBodyCellSlotProps>>,
  Assert<Equal<Docs.TableBodyCellSlotProps<Row>, Public.TableBodyCellSlotProps<Row>>>,
  Assert<Equal<Docs.TableHeaderCellSlotProps, Public.TableHeaderCellSlotProps>>,
  Assert<Equal<Docs.TableHeaderCellSlotProps<Row>, Public.TableHeaderCellSlotProps<Row>>>,
  Assert<Equal<Docs.CustomFilterDropdownSlotProps, Public.CustomFilterDropdownSlotProps>>,
  Assert<Equal<Docs.CustomFilterDropdownSlotProps<Row>, Public.CustomFilterDropdownSlotProps<Row>>>,
  Assert<Equal<Docs.TableDataSlotProps, Public.TableDataSlotProps>>,
  Assert<Equal<Docs.TableDataSlotProps<Row>, Public.TableDataSlotProps<Row>>>,
  Assert<Equal<Docs.TableSlotsDecl, Public.TableSlotsDecl>>,
  Assert<Equal<Docs.TableSlotsDecl<Row>, Public.TableSlotsDecl<Row>>>,
  Assert<Equal<Docs.TableProps, Public.TableProps>>,
  Assert<Equal<Docs.TableProps<Row>, Public.TableProps<Row>>>,
  Assert<Equal<Docs.TableFiltersInfo, Public.TableFiltersInfo>>,
  Assert<Equal<Docs.SorterResultLike, Public.SorterResultLike>>,
  Assert<Equal<Docs.SorterResultLike<Row>, Public.SorterResultLike<Row>>>,
  Assert<Equal<Docs.TableChangeExtra, Public.TableChangeExtra>>,
  Assert<Equal<Docs.TableChangeExtra<Row>, Public.TableChangeExtra<Row>>>,
  Assert<Equal<Docs.VTableSorterResult, Public.VTableSorterResult>>,
  Assert<Equal<Docs.VTableSorterResult<Row>, Public.VTableSorterResult<Row>>>,
  Assert<Equal<Docs.RowDragSortInfo, Public.RowDragSortInfo>>,
  Assert<Equal<Docs.VTableEventProps, Public.VTableEventProps>>,
  Assert<Equal<Docs.VTableEventProps<Row>, Public.VTableEventProps<Row>>>,
  Assert<Equal<Docs.VTablePublicProps, Public.VTablePublicProps>>,
  Assert<Equal<Docs.VTablePublicProps<Row>, Public.VTablePublicProps<Row>>>,
  Assert<Equal<Docs.TablePaginationState, Public.TablePaginationState>>,
  Assert<Equal<Docs.TablePaginationPosition, Public.TablePaginationPosition>>,
  Assert<Equal<Docs.PaginationItemType, Public.PaginationItemType>>,
  Assert<Equal<Docs.TablePaginationBuiltinLayoutItem, Public.TablePaginationBuiltinLayoutItem>>,
  Assert<Equal<Docs.TablePaginationLayoutItem, Public.TablePaginationLayoutItem>>,
  Assert<Equal<Docs.TablePaginationLayout, Public.TablePaginationLayout>>,
  Assert<Equal<Docs.TablePaginationSlotProps, Public.TablePaginationSlotProps>>,
  Assert<Equal<Docs.TablePaginationConfig, Public.TablePaginationConfig>>,
  Assert<Equal<Docs.SelectionSentinel, Public.SelectionSentinel>>,
  Assert<Equal<Docs.ExpandColumnSentinel, Public.ExpandColumnSentinel>>,
  Assert<Equal<Docs.SelectionColumnSentinel, Public.SelectionColumnSentinel>>,
  Assert<Equal<Docs.ColumnSentinel, Public.ColumnSentinel>>,
  Assert<Equal<Docs.TableColumnType, Public.TableColumnType>>,
  Assert<Equal<Docs.TableColumnType<Row>, Public.TableColumnType<Row>>>,
  Assert<Equal<Docs.TableColumnGroupType, Public.TableColumnGroupType>>,
  Assert<Equal<Docs.TableColumnGroupType<Row>, Public.TableColumnGroupType<Row>>>,
  Assert<Equal<Docs.TableColumnsType, Public.TableColumnsType>>,
  Assert<Equal<Docs.TableColumnsType<Row>, Public.TableColumnsType<Row>>>,
  Assert<Equal<Docs.VTableComponent, Public.VTableComponent>>,
  Assert<Equal<Docs.SummaryFixed, Public.SummaryFixed>>,
]

// Keep key sets explicit for aggregate declarations so added optional API fields cannot
// silently pass a weaker structural comparison.
export type TableDeclarationKeyContracts = [
  Assert<Equal<keyof Docs.TableProps<Row>, keyof Public.TableProps<Row>>>,
  Assert<Equal<keyof Docs.ColumnType<Row>, keyof Public.ColumnType<Row>>>,
  Assert<Equal<keyof Docs.ColumnGroupType<Row>, keyof Public.ColumnGroupType<Row>>>,
  Assert<Equal<keyof Docs.RowSelection<Row>, keyof Public.RowSelection<Row>>>,
  Assert<Equal<keyof Docs.Expandable<Row>, keyof Public.Expandable<Row>>>,
  Assert<Equal<keyof Docs.TableSlotsDecl<Row>, keyof Public.TableSlotsDecl<Row>>>,
  Assert<Equal<keyof Docs.VTableEventProps<Row>, keyof Public.VTableEventProps<Row>>>,
  Assert<Equal<keyof Docs.TablePaginationConfig, keyof Public.TablePaginationConfig>>,
  Assert<Equal<keyof Docs.TablePaginationSlotProps, keyof Public.TablePaginationSlotProps>>,
]
