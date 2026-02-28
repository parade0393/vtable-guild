import type { InjectionKey, Slots } from 'vue'

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
}

/**
 * Table context 的 injection key。
 */
export const TABLE_CONTEXT_KEY: InjectionKey<TableContext> = Symbol('vtable-table-context')
