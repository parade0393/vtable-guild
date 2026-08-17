// packages/theme/src/compat/antdv-table.ts

/**
 * antdv 兼容类名映射表。
 *
 * 用于在迁移场景下保留用户手写的 `.ant-table-*` 覆盖 CSS，
 * 仅当 `createVTableGuild({ compatClass: true })` 时启用。
 *
 * ⚠️ 注意：
 * - 稳定性边界：类名清单向后兼容，删改走 changelog；但类名之间的 DOM 结构关系不做承诺，
 *   调整 DOM 会让 `.ant-table-thead > tr > th` 这类结构选择器失配（单类选择器不受影响）
 * - antdv 使用 `StyleProvider hashed={false}` 时会产生样式串味
 * - 类名以 ant-design-vue 4.2.6 为准
 */

import type { CompatClassConfig } from '@vtable-guild/core'

export type { CompatClassConfig }

export const antdvTableCompatClasses: CompatClassConfig = {
  slots: {
    root: 'ant-table-wrapper ant-table',
    wrapper: 'ant-table-container ant-table-content',
    thead: 'ant-table-thead',
    tbody: 'ant-table-tbody',
    tr: 'ant-table-row',
    th: 'ant-table-cell',
    td: 'ant-table-cell',
    empty: 'ant-table-placeholder',
    summaryCell: 'ant-table-cell',
    thSortable: 'ant-table-column-has-sorters',
    thSorted: 'ant-table-column-sort',
    tdSorted: 'ant-table-column-sort',
    sortButton: 'ant-table-column-sorter',
    sortIconDown: 'ant-table-column-sorter-down',
    sortAreaWrapper: 'ant-table-column-sorters',
    sortAreaTitle: 'ant-table-column-title',
    filterIcon: 'ant-table-filter-trigger',
    filterDropdown: 'ant-table-filter-dropdown',
    filterDropdownActions: 'ant-table-filter-dropdown-btns',
    filterDropdownSearch: 'ant-table-filter-dropdown-search',
    filterDropdownSearchInput: 'ant-table-filter-dropdown-search-input',
    filterDropdownTreeWrapper: 'ant-table-filter-dropdown-tree',
    filterDropdownTreeCheckAll: 'ant-table-filter-dropdown-checkall',
    title: 'ant-table-title',
    footer: 'ant-table-footer',
    summary: 'ant-table-summary',
    headerWrapper: 'ant-table-header',
    bodyWrapper: 'ant-table-body',
    expandedRow: 'ant-table-expanded-row',
    expandIcon: 'ant-table-row-expand-icon',
    expandIconExpanded: 'ant-table-row-expand-icon-expanded ant-table-row-expanded',
    expandIconCollapsed: 'ant-table-row-expand-icon-collapsed ant-table-row-collapsed',
    expandIconSpaced: 'ant-table-row-expand-icon-spaced ant-table-row-spaced',
    treeExpandIcon: 'ant-table-row-expand-icon',
    treeExpandIconExpanded: 'ant-table-row-expand-icon-expanded ant-table-row-expanded',
    treeExpandIconCollapsed: 'ant-table-row-expand-icon-collapsed ant-table-row-collapsed',
    treeExpandIconSpaced: 'ant-table-row-expand-icon-spaced ant-table-row-spaced',
    resizeHandle: 'ant-table-resize-handle',
    selectionDropdown: 'ant-table-selection',
    selectionExtra: 'ant-table-selection-extra',
    bodyCellEllipsis: 'ant-table-cell-content',
  },
  variants: {
    size: {
      small: { root: 'ant-table-small' },
      middle: { root: 'ant-table-middle' },
    },
    bordered: {
      true: { root: 'ant-table-bordered' },
    },
  },
}
