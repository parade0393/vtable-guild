/**
 * 公平性契约的单一事实来源。
 *
 * 被测库各自的列配置都必须从这里派生（`buildColumns(columnCount)`），
 * 不允许任何一家单独调参——对照页的可信度全押在「各家吃到的是同一份配置」上，
 * 一处不一致，整页的数字就都不算数了。
 *
 * 这里有两个自变量：**行数**与**列数**。列数维度用于复现
 * antdv-next#427（1000×100 / 10000×200 卡顿）那类宽表场景。
 */

import type { PerfRow } from './data'

export interface PerfColumn {
  /** 列唯一标识。基础列等于字段名，合成列是 `col_N`。 */
  key: string
  /** 取数字段，必须是 `PerfRow` 上真实存在的键。 */
  dataKey: keyof PerfRow & string
  title: string
  /** 必须是数字：el-table-v2 不支持 flex 宽度，为对齐各家全部定宽。 */
  width: number
  align?: 'left' | 'right'
  /** 参与 S2 排序场景的列。 */
  sortable?: boolean
}

export const PERF_COLUMNS: readonly PerfColumn[] = [
  { key: 'name', dataKey: 'name', title: 'Name', width: 160 },
  { key: 'age', dataKey: 'age', title: 'Age', width: 90, align: 'right' },
  { key: 'score', dataKey: 'score', title: 'Score', width: 110, align: 'right', sortable: true },
  { key: 'status', dataKey: 'status', title: 'Status', width: 120 },
  { key: 'city', dataKey: 'city', title: 'City', width: 130 },
  { key: 'address', dataKey: 'address', title: 'Address', width: 250 },
]

/** 6 列基准档的总宽度。宽表档请用 `tableWidth(columnCount)`。 */
export const TABLE_WIDTH = PERF_COLUMNS.reduce((sum, c) => sum + c.width, 0)

// ---------------------------------------------------------------------------
// 列数维度
// ---------------------------------------------------------------------------

/** 三档列数。6 就是原有基准档，数字与历史结果直接可比。 */
export const COLUMN_COUNTS = [6, 50, 200] as const
export type ColumnCount = (typeof COLUMN_COUNTS)[number]

/** 合成列宽度。取 100 与 antdv-next#427 的复现用例一致。 */
export const EXTRA_COLUMN_WIDTH = 100

/**
 * 宽表档的可视区宽度。
 *
 * 这个常量是宽表对照能否成立的关键。宿主如果按列总宽撑开（200 列约 20000px），
 * 表格内部就**不会产生横向滚动**，任何库都只是老老实实把 20000px 全画出来——
 * 那测的是「一次性画一张巨宽的表」，不是横向虚拟化。夹到固定视口宽之后，
 * 列数才真正成为「可见单元格数」的变量。
 *
 * 1200 落在常见笔记本可视宽度上；6 列档总宽 860 < 1200，所以基准档的
 * 宿主宽度与改动前**完全一致**，历史数字不受影响。
 */
export const VIEWPORT_WIDTH = 1200

/**
 * 宽表档的合成列。
 *
 * 刻意**不为每一列生成独立数据字段**，而是轮流复用 6 个基础字段。
 *
 * 这个对照要测的是「每个可见单元格的渲染开销 × 列数」，而单元格取值来自
 * `row.city` 还是 `row.col_37`，对渲染开销没有可测量的影响——真正的开销在
 * 组件实例化、computed 建立与 DOM 节点创建上。
 *
 * 反过来，真给 10 万行各配 200 个字段会产生约 1GB 常驻数据，光 GC 压力就
 * 足以污染同一页里的内存增量与 longtask 读数，反而让数字更不可信。
 *
 * 复用还换来一条更强的公平性保证：所有列数档位吃到的是**同一个数组引用**，
 * 数据侧完全不是变量，唯一的自变量就是列数。
 *
 * 已知代价：真实宽表的行对象是 200 个属性的「宽形状」，属性访问的内联缓存
 * 行为与这里不同。该差异停留在纳秒量级，相对每单元格的渲染开销可忽略。
 */
/**
 * 合成列取数用的字段轮换表。
 *
 * 刻意**排除 `address`**：它的值形如 `Block 1 · Building 23 · New York`，
 * 在 100px 列宽下会换行，把行高从 47px 顶到 90px。后果不只是难看——
 * 行高一变，虚拟列表仍按 47px 估算可视行数，会超渲染约 2 倍，
 * 同时 vxe-table（`show-overflow` 省略号）与 el-table-v2（强制定高）不换行，
 * 三家的可视行数直接不可比，这一档的对照就作废了。
 *
 * 这里的每个字段值都 ≤ 9 字符，在 100px 下有充裕余量。
 */
const EXTRA_COLUMN_SOURCES = ['age', 'score', 'status', 'city'] as const

const columnsCache = new Map<number, readonly PerfColumn[]>()

export function buildColumns(columnCount: number): readonly PerfColumn[] {
  const cached = columnsCache.get(columnCount)
  if (cached) return cached

  const base = PERF_COLUMNS
  let result: readonly PerfColumn[]

  if (columnCount <= base.length) {
    result = base.slice(0, columnCount)
  } else {
    const out: PerfColumn[] = base.slice()
    for (let i = 1; i <= columnCount - base.length; i++) {
      const dataKey = EXTRA_COLUMN_SOURCES[i % EXTRA_COLUMN_SOURCES.length] as PerfColumn['dataKey']
      out.push({
        key: `col_${i}`,
        dataKey,
        title: `Column ${i}`,
        width: EXTRA_COLUMN_WIDTH,
        align: dataKey === 'age' || dataKey === 'score' ? 'right' : undefined,
      })
    }
    result = out
  }

  columnsCache.set(columnCount, result)
  return result
}

/** 指定列数下的列总宽。 */
export function tableWidth(columnCount: number): number {
  return buildColumns(columnCount).reduce((sum, c) => sum + c.width, 0)
}

/**
 * 指定列数下的宿主宽度：列总宽与可视区宽取小。
 *
 * 超出可视区时表格必须在内部横向滚动，这样列数才转化为「可见列数」的压力。
 */
export function hostWidth(columnCount: number): number {
  return Math.min(tableWidth(columnCount), VIEWPORT_WIDTH)
}

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

export const SUBJECT_IDS = [
  'vtable-guild',
  'vtable-guild-fixed',
  'antdv',
  'antdv-next',
  'el-table-v2',
  'vxe-table',
] as const
export type SubjectId = (typeof SUBJECT_IDS)[number]

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  'vtable-guild': 'vtable-guild',
  'vtable-guild-fixed': 'vtable-guild（定高 rowHeight）',
  antdv: 'ant-design-vue Table',
  'antdv-next': 'antdv-next Table',
  'el-table-v2': 'el-table-v2',
  'vxe-table': 'vxe-table',
}

/**
 * antdv 4.x 没有虚拟滚动，全部单元格直接进 DOM，超过这个规模就二次确认。
 *
 * 用**单元格数**而不是行数当阈值：加了列数维度之后，1000 行 × 200 列同样是
 * 20 万个单元格，只看行数会放它过去然后把标签页锁死。
 * 60000 相当于原来的 10000 行 × 6 列，阈值语义与改动前一致。
 */
export const ANTDV_GUARD_CELLS = 60_000
