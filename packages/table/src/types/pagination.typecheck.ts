import type {
  VTablePublicProps,
  TablePaginationConfig,
  TableChangeExtra,
  TableSlotsDecl,
} from '../types'
import type {
  TablePaginationBuiltinLayoutItem,
  TablePaginationLayout,
  TablePaginationLayoutItem,
  TablePaginationSlotProps,
} from '../index'

interface Row {
  id: number
  name: string
}

const _pagination: TablePaginationConfig = {
  current: 1,
  pagerCount: 9,
  locale: { prev_pages: 'Back {count} pages', next_pages: 'Forward {count} pages' },
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

// @ts-expect-error pagerCount must be numeric.
export const invalidPagerCount: TablePaginationConfig['pagerCount'] = '9'

export const builtinPaginationItem: TablePaginationBuiltinLayoutItem = 'pager'
export const customPaginationItem: TablePaginationLayoutItem = { slot: 'refresh' }
export const readonlyPaginationLayout = [
  'total',
  { slot: 'selection' },
  'prev',
  'pager',
  'next',
] as const satisfies TablePaginationLayout

export const splitPagination: TablePaginationConfig = {
  layout: {
    left: ['total', { slot: 'selection' }],
    right: ['sizes', 'prev', 'pager', 'next', 'jumper', { slot: 'refresh' }],
  } as const,
}

export const inlinePagination: TablePaginationConfig = { layout: readonlyPaginationLayout }

export const paginationSlots: TableSlotsDecl<Row> = {
  paginationItem(props) {
    const _props: TablePaginationSlotProps = props
    const _name: string = props.name
    const _state: { current: number; pageSize: number; total: number } = props
    const _count: number = props.pageCount
    const _range: readonly [number, number] = props.range
    const _disabled: boolean = props.disabled
    const _position:
      | 'topLeft'
      | 'topCenter'
      | 'topRight'
      | 'bottomLeft'
      | 'bottomCenter'
      | 'bottomRight' = props.position
    const _region: 'inline' | 'left' | 'right' = props.region
    // @ts-expect-error Pagination context is readonly.
    props.current = 2
    // @ts-expect-error Pagination ranges cannot be mutated by slots.
    props.range[0] = 0
    // @ts-expect-error Pagination slots have no row-specific context.
    const _record = props.record
    void [_props, _state, _count, _range, _disabled, _position, _region, _record]
    return _name
  },
}

// @ts-expect-error Element's string grammar is not part of the layout API.
export const invalidStringLayout: TablePaginationLayout = 'prev,pager,next'

// @ts-expect-error Unknown layout tokens are rejected.
export const invalidLayoutToken: TablePaginationLayoutItem = '->'

// @ts-expect-error Custom content requires a named slot object.
export const invalidBareSlot: TablePaginationLayoutItem = 'slot'

// @ts-expect-error Slot names must be strings.
export const invalidLayoutSlot: TablePaginationLayoutItem = { slot: 42 }

// @ts-expect-error Regions must be arrays.
export const invalidLayoutRegion: TablePaginationLayout = { left: 'total' }

// @ts-expect-error A rendered pagination slot never has the hidden position.
export const invalidSlotPosition: TablePaginationSlotProps['position'] = 'none'
