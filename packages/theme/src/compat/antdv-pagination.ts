import type { CompatClassConfig } from '@vtable-guild/core'

/** Ant Design Vue 4.2.6 pagination classes; appended without changing the DOM or styles. */
export const antdvPaginationCompatClasses: CompatClassConfig = {
  slots: {
    root: 'ant-pagination ant-table-pagination',
    total: 'ant-pagination-total-text',
    simpleControls: 'ant-pagination-simple-pager',
    slash: 'ant-pagination-slash',
    jumpEllipsis: 'ant-pagination-item-ellipsis',
    jumpIcon: 'ant-pagination-item-link-icon',
  },
  variants: {
    align: {
      left: { root: 'ant-table-pagination-left' },
      center: { root: 'ant-table-pagination-center' },
      right: { root: 'ant-table-pagination-right' },
    },
    size: {
      small: { root: 'ant-pagination-mini' },
    },
    simple: {
      true: { root: 'ant-pagination-simple' },
    },
    disabled: {
      true: { root: 'ant-pagination-disabled' },
    },
  },
}
