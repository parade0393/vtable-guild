/**
 * 对照用数据集。
 *
 * 两条规矩来自 `docs/performance.md` 的基准铁律，这里必须同样遵守：
 *
 * 1. 数据在测量窗口**之外**生成一次（`ensureRows` 必须在开始计时前调用）。
 * 2. 用下标 + 乘法散列伪乱序，**不用 `Math.random()`**——随机数会让排序
 *    基准命中「已有序」最优路径，测出来的数字是假的；同时确定性生成才能
 *    让别人在自己机器上跑出可比的结果。
 *
 * 生成结果按行数缓存，保证同一档位下**三个库拿到的是同一个数组引用**，
 * 排除数据构造耗时混进对照。
 */

export interface PerfRow {
  key: number
  name: string
  age: number
  score: number
  status: 'active' | 'paused' | 'archived'
  city: string
  address: string
}

const CITIES = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin', 'Toronto', 'Madrid']
const STATUSES = ['active', 'paused', 'archived'] as const

/** Knuth 乘法散列，与 packages/table/src/composables/bench-fixtures.ts 同一套。 */
function scramble(i: number): number {
  return (i * 2654435761) >>> 0
}

let pool: PerfRow[] = []

/** 把行池扩到至少 count 行。必须在计时窗口之外调用。 */
export function ensureRows(count: number): void {
  if (pool.length >= count) return
  const next: PerfRow[] = new Array(count)
  for (let i = 0; i < count; i++) {
    const s = scramble(i)
    const city = CITIES[s % CITIES.length] as string
    next[i] = {
      key: i,
      name: `User ${i + 1}`,
      age: 18 + (s % 60),
      score: s % 1000,
      status: STATUSES[s % STATUSES.length] as PerfRow['status'],
      city,
      address: `Block ${(i % 12) + 1} · Building ${(i % 99) + 1} · ${city}`,
    }
  }
  pool = next
}

const sliceCache = new Map<number, PerfRow[]>()

/**
 * 取指定行数的数据集。同一 count 永远返回**同一个数组引用**——
 * 这是公平性契约的第一条，三个库必须吃到完全一样的东西。
 */
export function getRows(count: number): PerfRow[] {
  const cached = sliceCache.get(count)
  if (cached) return cached
  ensureRows(count)
  const rows = pool.slice(0, count)
  sliceCache.set(count, rows)
  return rows
}

/**
 * Score 列的比较函数。
 *
 * 三个库必须用**同一个函数**排序，否则对照不成立。特别注意：
 * vtable-guild 的 `sorter: true` 会回落到内建 `defaultCompare` 真的排数据，
 * 而 antdv 的 `sorter: true` 表示「排序交给服务端」、本地**不做任何排序**。
 * 两边都写 `true` 会让 antdv 因为「没干活」而白赢——所以三家一律显式传
 * 这个比较函数。
 */
export function compareScore(a: PerfRow, b: PerfRow): number {
  return a.score - b.score
}

/** 供 el-table-v2 使用：它不内置排序，应用侧必须自己排（这部分耗时计入它）。 */
export function sortRowsByScore(rows: PerfRow[], order: 'ascend' | 'descend' | null): PerfRow[] {
  if (!order) return rows
  const dir = order === 'ascend' ? 1 : -1
  return rows.slice().sort((a, b) => compareScore(a, b) * dir)
}
