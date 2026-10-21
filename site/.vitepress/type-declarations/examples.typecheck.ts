// These examples are included by the docs and checked through the public package entry.

// #region PaginationChangeExample
import { ref } from 'vue'
import type { VTableEventProps } from '@vtable-guild/vtable-guild'

interface Row {
  key: number
  name: string
}

const current = ref(1)
const pageSize = ref(10)

const handleChange: NonNullable<VTableEventProps<Row>['onChange']> = (_filters, _sorter, extra) => {
  if (extra.action !== 'paginate' || !extra.pagination) return
  current.value = extra.pagination.current
  pageSize.value = extra.pagination.pageSize
}
// #endregion PaginationChangeExample

// #region CustomRenderExample
import type { TableColumnType } from '@vtable-guild/vtable-guild'

interface NameRow {
  key: number
  name: string
}

const nameColumn: TableColumnType<NameRow> = {
  key: 'name',
  dataIndex: 'name',
  customRender: ({ text, index }) =>
    index === 0
      ? { children: String(text), props: { colSpan: 2, style: { fontWeight: 'bold' } } }
      : String(text),
}
// #endregion CustomRenderExample

export { handleChange, nameColumn }

import type {
  ColumnType,
  Expandable,
  GetComponentProps,
  RowSelection,
  TableFiltersInfo,
  TablePaginationConfig,
  TableSlotsDecl,
  VTableSorterResult,
} from '@vtable-guild/vtable-guild'

export const handlePageChange: NonNullable<TablePaginationConfig['onChange']> = (page, size) => {
  const _page: number = page
  const _size: number = size
  void [_page, _size]
}

export const handleSort: NonNullable<VTableEventProps<Row>['onChange']> = (
  filters,
  sorter,
  extra,
) => {
  const _filters: TableFiltersInfo = filters
  const _result: VTableSorterResult<Row> = sorter
  if (extra.action !== 'sort') return
  const results = Array.isArray(sorter) ? sorter : [sorter]
  const _column: ColumnType<Row> | undefined = results[0]?.column
  const _value: string | number | boolean | undefined = filters.name?.[0]
  void [_filters, _result, _column, _value]
}

export const selection: RowSelection<Row> = {
  onChange(keys, rows) {
    const _key: string | number | undefined = keys[0]
    const _row: Row | undefined = rows[0]
    void [_key, _row]
  },
}

export const expandable: Expandable<Row> = {
  onExpand(expanded, record) {
    const _expanded: boolean = expanded
    const _name: string = record.name
    void [_expanded, _name]
  },
  expandedRowRender: (record) => record.name,
}

export const customCell: GetComponentProps<Row, Row> = (_record, index) =>
  index === 0 ? { colSpan: 2 } : undefined

export const handleResize: NonNullable<VTableEventProps<Row>['onResizeColumn']> = (
  column,
  width,
) => {
  const _column: ColumnType<Row> = column
  const _width: number = width
  void [_column, _width]
}

export const slots: TableSlotsDecl<Row> = {
  bodyCell({ text, record }) {
    // text is unknown; record keeps the business row type.
    const _name: string = record.name
    void _name
    return typeof text === 'string' ? text.toUpperCase() : String(text)
  },
  customFilterDropdown({ selectedKeys, setSelectedKeys, confirm, clearFilters, close }) {
    setSelectedKeys(selectedKeys)
    confirm({ closeDropdown: false })
    clearFilters({ confirm: true, closeDropdown: false })
    close()
    return null
  },
  paginationItem(props) {
    const _range: readonly [number, number] = props.range
    // @ts-expect-error Pagination slot state is readonly.
    props.current = 2
    // @ts-expect-error Slot context contains no business row.
    const _record = props.record
    void [_range, _record]
    return props.name
  },
}

// @ts-expect-error The table change event does not receive page and pageSize.
export const invalidChange: NonNullable<VTableEventProps<Row>['onChange']> = handlePageChange
