import type { VTablePublicProps, TablePaginationConfig, TableChangeExtra } from '../types'

interface Row {
  id: number
  name: string
}

const _pagination: TablePaginationConfig = {
  current: 1,
  pageSizeOptions: ['10', 20],
  position: ['topCenter', 'bottomRight', 'none'],
  showQuickJumper: { goButton: true },
  itemRender: ({ originalElement }) => originalElement,
  onChange: (_page: number, _pageSize: number) => {},
  'onUpdate:current': (_page: number) => {},
}

export const paginationProps: VTablePublicProps<Row> = {
  columns: [{ dataIndex: 'name', key: 'name', title: 'Name' }],
  dataSource: [],
  pagination: _pagination,
  scroll: { scrollToFirstRowOnChange: false },
  onChange(filters, sorter, extra) {
    const _record: Row | undefined = extra.currentDataSource[0]
    const _page: number | undefined = extra.pagination?.current
    const _action: TableChangeExtra<Row>['action'] = 'paginate'
    const _filters = filters
    const _sorter = sorter
    void [_record, _page, _action, _filters, _sorter]
  },
}

// @ts-expect-error Pagination requires an object to opt in.
export const invalidPagination: VTablePublicProps<Row>['pagination'] = true
