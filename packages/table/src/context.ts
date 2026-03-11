import type { ComputedRef, InjectionKey, Slots } from 'vue'
import type { ThemePresetName } from '@vtable-guild/core'
import type { ColumnType, SortOrder } from './types'

/** 子组件主题 slot class 映射 */
export interface SubThemeSlots {
  thSortable: string
  sortButton: string
  sortIconDown: string
  sortAreaOuter: string
  sortAreaWrapper: string
  sortAreaTitle: string
  filterIconWrapper: string
  filterIcon: string
  filterDropdown: string
  filterDropdownList: string
  filterDropdownItem: string
  filterDropdownItemSelected: string
  filterDropdownItemHover: string
  filterDropdownActions: string
  filterDropdownSearch: string
  filterDropdownSearchField: string
  filterDropdownSearchIcon: string
  filterDropdownSearchInput: string
  filterDropdownListEmpty: string
}

/**
 * Table 内部 context，通过 provide/inject 跨层传递。
 *
 * Table.vue 在 setup 阶段 provide 此 context，
 * 所有后代组件（TableCell、TableHeaderCell 等）通过 inject 获取。
 */
export interface TableContext {
  /**
   * 用户定义的 bodyCell slot 函数。
   * 来自 Table.vue 的 useSlots().bodyCell。
   */
  bodyCell?: Slots['bodyCell']
  /**
   * 用户定义的 headerCell slot 函数。
   * 来自 Table.vue 的 useSlots().headerCell。
   */
  headerCell?: Slots['headerCell']
  /**
   * 用户定义的 empty slot 函数。
   */
  empty?: Slots['empty']

  /** 获取某列的当前排序方向 */
  getSortOrder?: (column: ColumnType<Record<string, unknown>>) => SortOrder
  /** 切换某列的排序方向 */
  toggleSortOrder?: (column: ColumnType<Record<string, unknown>>) => void

  /** 获取某列的当前筛选值 */
  getFilteredValue?: (column: ColumnType<Record<string, unknown>>) => (string | number | boolean)[]
  /** 确认筛选 */
  confirmFilter?: (
    column: ColumnType<Record<string, unknown>>,
    values: (string | number | boolean)[],
  ) => void
  /** 重置筛选 */
  resetFilter?: (column: ColumnType<Record<string, unknown>>) => void

  /** 自定义筛选下拉菜单 slot */
  customFilterDropdown?: Slots['customFilterDropdown']

  /** 自定义筛选图标 slot */
  customFilterIcon?: Slots['customFilterIcon']

  /** 表级别 showSorterTooltip 配置 */
  showSorterTooltip?: boolean

  /** 子组件主题 slot class 映射 */
  subThemeSlots?: ComputedRef<SubThemeSlots>

  /** 当前主题预设名称 */
  themePreset?: ThemePresetName
}

/**
 * Table context 的 injection key。
 */
export const TABLE_CONTEXT_KEY: InjectionKey<TableContext> = Symbol('vtable-table-context')
