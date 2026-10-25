import type { ColumnType, TableProps } from '@vtable-guild/vtable-guild'
import type * as Docs from './features'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

interface Row {
  id: number
  name: string
  children?: Row[]
}

type SortingKeys =
  | 'key'
  | 'sorter'
  | 'sortOrder'
  | 'defaultSortOrder'
  | 'sortDirections'
  | 'showSorterTooltip'
type FilteringKeys =
  | 'key'
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
type ResizableKeys = 'key' | 'width' | 'resizable' | 'minWidth' | 'maxWidth'
type FixedKeys = 'fixed' | 'width'
type DisplayKeys = 'key' | 'visible' | 'responsive'
type MergedKeys =
  | 'key'
  | 'title'
  | 'dataIndex'
  | 'colSpan'
  | 'customRender'
  | 'customCell'
  | 'customHeaderCell'
type ScrollKeys = 'scroll' | 'sticky' | 'tableLayout'
type VirtualizationKeys = 'rowKey' | 'scroll' | 'virtual' | 'virtualColumn' | 'rowHeight'
type TreeKeys =
  | 'loadData'
  | 'isLeaf'
  | 'onTreeLoadError'
  | 'childrenColumnName'
  | 'rowKey'
  | 'indentSize'
  | 'expandedRowKeys'
  | 'defaultExpandedRowKeys'
  | 'defaultExpandAllRows'
  | 'onExpand'
  | 'onExpandedRowsChange'
type CustomStructureKeys = 'rowClassName' | 'customRow' | 'customHeaderRow' | 'transformCellText'
type TitleFooterKeys = 'title' | 'footer'
type RowDragKeys = 'rowDraggable' | 'rowKey' | 'childrenColumnName'
type ColumnOrderKeys = 'columnOrder'
type FieldRendererColumnKeys = 'valueType' | 'fieldProps'

// Compare exact optional fields and signatures against the public interface excerpts,
// both with the default row type and with a concrete business row.
export type FeatureDeclarationContracts = [
  Assert<Equal<Docs.FieldRendererColumnFields, Pick<ColumnType, FieldRendererColumnKeys>>>,
  Assert<
    Equal<Docs.FieldRendererColumnFields<Row>, Pick<ColumnType<Row>, FieldRendererColumnKeys>>
  >,
  Assert<Equal<Docs.FieldRendererTableFields, Pick<TableProps, 'renderers'>>>,
  Assert<Equal<Docs.FieldRendererTableFields<Row>, Pick<TableProps<Row>, 'renderers'>>>,
  Assert<Equal<Docs.SortingColumnFields, Pick<ColumnType, SortingKeys>>>,
  Assert<Equal<Docs.SortingColumnFields<Row>, Pick<ColumnType<Row>, SortingKeys>>>,
  Assert<Equal<Docs.FilteringColumnFields, Pick<ColumnType, FilteringKeys>>>,
  Assert<Equal<Docs.FilteringColumnFields<Row>, Pick<ColumnType<Row>, FilteringKeys>>>,
  Assert<Equal<Docs.ResizableColumnFields, Pick<ColumnType, ResizableKeys>>>,
  Assert<Equal<Docs.ResizableColumnFields, Pick<ColumnType<Row>, ResizableKeys>>>,
  Assert<Equal<Docs.FixedColumnFields, Pick<ColumnType, FixedKeys>>>,
  Assert<Equal<Docs.FixedColumnFields, Pick<ColumnType<Row>, FixedKeys>>>,
  Assert<Equal<Docs.DisplayColumnFields, Pick<ColumnType, DisplayKeys>>>,
  Assert<Equal<Docs.DisplayColumnFields, Pick<ColumnType<Row>, DisplayKeys>>>,
  Assert<Equal<Docs.MergedColumnFields, Pick<ColumnType, MergedKeys>>>,
  Assert<Equal<Docs.MergedColumnFields<Row>, Pick<ColumnType<Row>, MergedKeys>>>,
  Assert<Equal<Docs.ScrollFields, Pick<TableProps, ScrollKeys>>>,
  Assert<Equal<Docs.ScrollFields, Pick<TableProps<Row>, ScrollKeys>>>,
  Assert<Equal<Docs.VirtualizationFields, Pick<TableProps, VirtualizationKeys>>>,
  Assert<Equal<Docs.VirtualizationFields<Row>, Pick<TableProps<Row>, VirtualizationKeys>>>,
  Assert<Equal<Docs.TreeFields, Pick<TableProps, TreeKeys>>>,
  Assert<Equal<Docs.TreeFields<Row>, Pick<TableProps<Row>, TreeKeys>>>,
  Assert<Equal<Docs.CustomStructureFields, Pick<TableProps, CustomStructureKeys>>>,
  Assert<Equal<Docs.CustomStructureFields<Row>, Pick<TableProps<Row>, CustomStructureKeys>>>,
  Assert<Equal<Docs.TitleFooterFields, Pick<TableProps, TitleFooterKeys>>>,
  Assert<Equal<Docs.TitleFooterFields<Row>, Pick<TableProps<Row>, TitleFooterKeys>>>,
  Assert<Equal<Docs.RowDragFields, Pick<TableProps, RowDragKeys>>>,
  Assert<Equal<Docs.RowDragFields<Row>, Pick<TableProps<Row>, RowDragKeys>>>,
  Assert<Equal<Docs.ColumnOrderFields, Pick<TableProps, ColumnOrderKeys>>>,
  Assert<Equal<Docs.ColumnOrderFields, Pick<TableProps<Row>, ColumnOrderKeys>>>,
]
