/**
 * 公平性契约的单一事实来源。
 *
 * 三个被测库各自的列配置都必须从这里派生，不允许任何一家单独调参——
 * 对照页的可信度全押在「三家吃到的是同一份配置」上，一处不一致，
 * 整页的数字就都不算数了。
 */

import type { PerfRow } from './data'

export interface PerfColumn {
  key: keyof PerfRow & string
  title: string
  /** 必须是数字：el-table-v2 不支持 flex 宽度，为对齐三家全部定宽。 */
  width: number
  align?: 'left' | 'right'
  /** 参与 S2 排序场景的列。 */
  sortable?: boolean
}

export const PERF_COLUMNS: readonly PerfColumn[] = [
  { key: 'name', title: 'Name', width: 160 },
  { key: 'age', title: 'Age', width: 90, align: 'right' },
  { key: 'score', title: 'Score', width: 110, align: 'right', sortable: true },
  { key: 'status', title: 'Status', width: 120 },
  { key: 'city', title: 'City', width: 130 },
  { key: 'address', title: 'Address', width: 250 },
]

/** 表格总宽度，三家一致。 */
export const TABLE_WIDTH = PERF_COLUMNS.reduce((sum, c) => sum + c.width, 0)

/** 可视区高度，三家一致（vtable-guild scroll.y / antdv scroll.y / el-table-v2 height）。 */
export const VIEWPORT_HEIGHT = 460

/**
 * 行高，三家一致。
 *
 * 47 来自 vtable-guild `size="middle"` 的内建值
 * （packages/table/src/composables/useVirtual.ts 的 SIZE_ITEM_HEIGHT）。
 * el-table-v2 必须显式 `:row-height`；行高不一致会直接改变可视行数与
 * DOM 节点数——这是整个对照里最容易被抓的作弊点，实测阶段要校准。
 */
export const ROW_HEIGHT = 47

/** 三档数据量。 */
export const ROW_COUNTS = [1_000, 10_000, 100_000] as const
export type RowCount = (typeof ROW_COUNTS)[number]

export function formatRowCount(n: number): string {
  if (n >= 10_000) return `${n / 10_000} 万`
  return `${n / 1_000}k`
}

export const SUBJECT_IDS = ['vtable-guild', 'antdv', 'el-table-v2'] as const
export type SubjectId = (typeof SUBJECT_IDS)[number]

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  'vtable-guild': 'vtable-guild',
  antdv: 'ant-design-vue Table',
  'el-table-v2': 'el-table-v2',
}

/**
 * antdv 4.x 没有虚拟滚动：10w 行会渲染约 60 万个单元格，
 * 大概率让标签页长时间无响应。超过这个行数需要二次确认。
 */
export const ANTDV_GUARD_ROWS = 10_000
