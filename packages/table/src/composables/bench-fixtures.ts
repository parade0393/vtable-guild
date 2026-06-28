// 性能基准专用的确定性数据生成器。
//
// 设计约束：
// - 不使用 Math.random()，数据完全由下标决定，保证基线可复现、可对比。
// - 与 playground 的演示数据相互独立（不跨包引用 src 内部实现）。
//
// 仅供 *.bench.ts 使用，已在 vitest coverage 中排除。

import type { Key } from '../types'

export interface BenchRow extends Record<string, unknown> {
  key: number
  name: string
  age: number
  score: number
  status: 'active' | 'paused' | 'archived'
  city: string
}

export interface BenchTreeRow extends Record<string, unknown> {
  key: string
  name: string
  age: number
  status: 'active' | 'paused'
  children?: BenchTreeRow[]
}

const STATUSES = ['active', 'paused', 'archived'] as const
const CITIES = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin']

/**
 * 乘法散列：把单调下标打散成伪随机但确定的序列，
 * 避免排序基准命中“已经有序”的最优路径，得到贴近真实的耗时。
 */
function scramble(i: number, mod: number): number {
  return ((i * 2654435761) >>> 0) % mod
}

/** 生成平铺行数据，age/score/status/city 经散列打散。 */
export function makeRows(count: number): BenchRow[] {
  const rows: BenchRow[] = new Array(count)
  for (let i = 0; i < count; i++) {
    rows[i] = {
      key: i,
      name: `Row ${i}`,
      age: 18 + scramble(i, 60),
      score: scramble(i, 1000),
      status: STATUSES[scramble(i, STATUSES.length)],
      city: CITIES[scramble(i, CITIES.length)],
    }
  }
  return rows
}

/**
 * 生成两层树形数据：roots 个根，每根 childrenPer 个子节点。
 * 总节点数 = roots * (1 + childrenPer)，所有 key 全局唯一。
 */
export function makeTree(roots: number, childrenPer: number): BenchTreeRow[] {
  const tree: BenchTreeRow[] = new Array(roots)
  for (let r = 0; r < roots; r++) {
    const children: BenchTreeRow[] = new Array(childrenPer)
    for (let c = 0; c < childrenPer; c++) {
      children[c] = {
        key: `r${r}-c${c}`,
        name: `Child ${r}-${c}`,
        age: 18 + scramble(r * childrenPer + c, 60),
        status: c % 2 === 0 ? 'active' : 'paused',
      }
    }
    tree[r] = {
      key: `r${r}`,
      name: `Root ${r}`,
      age: 30,
      status: 'active',
      children,
    }
  }
  return tree
}

/** 收集树中所有节点的 key（DFS 顺序）。 */
export function collectKeys(tree: BenchTreeRow[]): Key[] {
  const keys: Key[] = []
  const walk = (nodes: BenchTreeRow[]) => {
    for (const node of nodes) {
      keys.push(node.key)
      if (node.children) walk(node.children)
    }
  }
  walk(tree)
  return keys
}

/** 把树展平成记录列表（DFS 顺序），用于逐行调用基准。 */
export function flattenRecords(tree: BenchTreeRow[]): BenchTreeRow[] {
  const out: BenchTreeRow[] = []
  const walk = (nodes: BenchTreeRow[]) => {
    for (const node of nodes) {
      out.push(node)
      if (node.children) walk(node.children)
    }
  }
  walk(tree)
  return out
}
