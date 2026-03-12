import type { VTableGuildTableLocale } from '@vtable-guild/core'

export const antdvTableLocale = {
  header: {
    sortTriggerAsc: '点击升序',
    sortTriggerDesc: '点击降序',
    cancelSort: '取消排序',
    filterTriggerAriaLabel: '筛选',
  },
  filterDropdown: {
    searchPlaceholder: '在筛选项中搜索',
    emptyText: 'Not Found',
    resetText: '重置',
    confirmText: '确 定',
  },
  empty: {
    text: '暂无数据',
  },
  loading: {
    text: '加载中...',
  },
} as const satisfies VTableGuildTableLocale

export const antdvTableEnUSLocale = {
  header: {
    sortTriggerAsc: 'Click to sort ascending',
    sortTriggerDesc: 'Click to sort descending',
    cancelSort: 'Click to cancel sorting',
    filterTriggerAriaLabel: 'Filter',
  },
  filterDropdown: {
    searchPlaceholder: 'Search in filters',
    emptyText: 'Not Found',
    resetText: 'Reset',
    confirmText: 'OK',
  },
  empty: {
    text: 'No Data',
  },
  loading: {
    text: 'Loading...',
  },
} as const satisfies VTableGuildTableLocale
