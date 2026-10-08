import type { CSSProperties, VNodeChild } from 'vue'
import type { VTableGuildPaginationLocale } from '@vtable-guild/core'

export interface TablePaginationState {
  current: number
  pageSize: number
  total: number
}

export type TablePaginationPosition =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'none'

export type PaginationItemType = 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next'

export interface TablePaginationConfig {
  current?: number
  defaultCurrent?: number
  pageSize?: number
  defaultPageSize?: number
  total?: number
  disabled?: boolean
  hideOnSinglePage?: boolean
  showSizeChanger?: boolean
  pageSizeOptions?: (string | number)[]
  totalBoundaryShowSizeChanger?: number
  buildOptionText?: (option: { value: string | number }) => VNodeChild
  showQuickJumper?: boolean | { goButton?: VNodeChild }
  showTotal?: (total: number, range: [number, number]) => VNodeChild
  size?: 'default' | 'small'
  simple?: boolean
  showLessItems?: boolean
  /** Numeric page buttons including first/last; odd integer from 5 to 21. Overrides showLessItems. */
  pagerCount?: number
  responsive?: boolean
  itemRender?: (item: {
    page: number
    type: PaginationItemType
    originalElement: VNodeChild
  }) => VNodeChild
  locale?: Partial<VTableGuildPaginationLocale>
  class?: string
  style?: CSSProperties
  position?: TablePaginationPosition[]
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  'onUpdate:current'?: (current: number) => void
  'onUpdate:pageSize'?: (pageSize: number) => void
}
