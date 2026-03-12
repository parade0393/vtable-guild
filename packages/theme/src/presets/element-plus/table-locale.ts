import type { VTableGuildTableLocale } from '@vtable-guild/core'

export const elementPlusTableLocale = {
  header: {
    sortTriggerAsc: '点击升序',
    sortTriggerDesc: '点击降序',
    cancelSort: '取消排序',
    filterTriggerAriaLabel: '筛选',
  },
  filterDropdown: {
    searchPlaceholder: '搜索筛选项',
    emptyText: '暂无匹配数据',
    resetText: '重置',
    confirmText: '确定',
  },
  empty: {
    text: '暂无数据',
  },
  loading: {
    text: '加载中...',
  },
} as const satisfies VTableGuildTableLocale

export const elementPlusTableEnUSLocale = {
  header: {
    sortTriggerAsc: 'Sort ascending',
    sortTriggerDesc: 'Sort descending',
    cancelSort: 'Cancel sorting',
    filterTriggerAriaLabel: 'Filter',
  },
  filterDropdown: {
    searchPlaceholder: 'Search filters',
    emptyText: 'No matching data',
    resetText: 'Reset',
    confirmText: 'Confirm',
  },
  empty: {
    text: 'No Data',
  },
  loading: {
    text: 'Loading...',
  },
} as const satisfies VTableGuildTableLocale
