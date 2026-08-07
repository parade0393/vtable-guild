import { describe, expect, it } from 'vitest'
import { PrefixHeights } from './PrefixHeights'

/** 逐行累加的朴素实现，作为增量版本的正确性参照。 */
function naive(heights: number[]): { total: number; prefix: number[] } {
  const prefix: number[] = []
  let running = 0
  for (const h of heights) {
    running += h
    prefix.push(running)
  }
  return { total: running, prefix }
}

describe('PrefixHeights', () => {
  it('builds a correct prefix sum and locates rows by offset', () => {
    const heights = [20, 20, 20, 80, 30, 30]
    const p = new PrefixHeights()
    p.sync(heights.length, (i) => heights[i], 20)

    expect(p.totalHeight).toBe(naive(heights).total)
    expect(p.offsetOf(0)).toBe(0)
    expect(p.offsetOf(3)).toBe(60)
    // 首个底部偏移 >= target 的行
    expect(p.findIndex(0)).toBe(0)
    expect(p.findIndex(60)).toBe(2)
    expect(p.findIndex(61)).toBe(3)
    // 超出末尾返回 length，调用方据此判定越界
    expect(p.findIndex(10_000)).toBe(heights.length)
  })

  it('falls back to the estimated height for unmeasured rows', () => {
    const measured = new Map([
      [0, 50],
      [3, 10],
    ])
    const p = new PrefixHeights()
    p.sync(5, (i) => measured.get(i), 20)

    // 50 + 20 + 20 + 10 + 20
    expect(p.totalHeight).toBe(120)
  })

  it('rebuilds only the suffix after markDirtyFrom, matching a full rebuild', () => {
    const heights: number[] = Array.from({ length: 200 }, (_, i) => (i % 3 === 0 ? 30 : 20))
    const incremental = new PrefixHeights()
    incremental.sync(heights.length, (i) => heights[i], 20)

    // 模拟「窗口内某几行被实测，高度变了」
    heights[120] = 90
    heights[123] = 70
    incremental.markDirtyFrom(120)
    incremental.sync(heights.length, (i) => heights[i], 20)

    const fromScratch = new PrefixHeights()
    fromScratch.sync(heights.length, (i) => heights[i], 20)

    expect(incremental.totalHeight).toBe(fromScratch.totalHeight)
    expect(incremental.totalHeight).toBe(naive(heights).total)
    for (const i of [0, 119, 120, 121, 150, 199]) {
      expect(incremental.offsetOf(i)).toBe(fromScratch.offsetOf(i))
    }
  })

  it('ignores a dirty mark that is later than an already-pending one', () => {
    const heights = Array.from({ length: 50 }, () => 20)
    const p = new PrefixHeights()
    p.sync(heights.length, (i) => heights[i], 20)

    heights[5] = 100
    heights[40] = 100
    // 先标脏 5，再标脏 40：必须保留更早的 5，否则 [5,40) 的前缀不会被修正
    p.markDirtyFrom(5)
    p.markDirtyFrom(40)
    p.sync(heights.length, (i) => heights[i], 20)

    expect(p.totalHeight).toBe(naive(heights).total)
    expect(p.offsetOf(6)).toBe(naive(heights).prefix[5])
  })

  it('does a full rebuild when the row count changes', () => {
    const p = new PrefixHeights()
    p.sync(3, () => 20, 20)
    expect(p.totalHeight).toBe(60)

    // 变长：新行必须被计入，且不能读到旧缓冲区的残值
    p.sync(5, () => 20, 20)
    expect(p.totalHeight).toBe(100)

    // 变短：totalHeight 必须只算前 2 行，缓冲区可以复用但逻辑长度要收缩
    p.sync(2, () => 20, 20)
    expect(p.totalHeight).toBe(40)
    expect(p.findIndex(10_000)).toBe(2)
  })

  it('treats an empty list as zero height without reading the buffer', () => {
    const p = new PrefixHeights()
    p.sync(0, () => 20, 20)
    expect(p.totalHeight).toBe(0)
    expect(p.offsetOf(0)).toBe(0)
    expect(p.findIndex(0)).toBe(0)
  })
})
