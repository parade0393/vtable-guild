import type { VTableGuildTableLocale } from '@vtable-guild/core'

export const antdvTableLocale = {
  tree: { expand: '展开行', collapse: '收起行', retry: '加载失败，点击重试' },
  cell: { copy: '复制', copied: '已复制', copyFailed: '复制失败' },
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
    selectAllText: '全选',
  },
  empty: {
    text: '暂无数据',
  },
  loading: {
    text: '加载中...',
  },
  selection: {
    selectAll: '全选所有',
    selectInvert: '反选当页',
    selectNone: '清空所有',
  },
} as const satisfies VTableGuildTableLocale

export const antdvTableEnUSLocale = {
  tree: { expand: 'Expand row', collapse: 'Collapse row', retry: 'Loading failed, retry' },
  cell: { copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed' },
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
    selectAllText: 'Select all items',
  },
  empty: {
    text: 'No Data',
  },
  loading: {
    text: 'Loading...',
  },
  selection: {
    selectAll: 'Select all data',
    selectInvert: 'Invert current page',
    selectNone: 'Clear all',
  },
} as const satisfies VTableGuildTableLocale
