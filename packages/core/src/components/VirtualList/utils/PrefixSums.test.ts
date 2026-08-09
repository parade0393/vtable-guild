import { describe, expect, it } from 'vitest'
import { PrefixSums } from './PrefixSums'

/** 逐项累加的朴素实现，作为增量版本的正确性参照。 */
function naive(sizes: number[]): { total: number; prefix: number[] } {
  const prefix: number[] = []
  let running = 0
  for (const h of sizes) {
    running += h
    prefix.push(running)
  }
  return { total: running, prefix }
}

describe('PrefixSums', () => {
  it('builds a correct prefix sum and locates items by offset', () => {
    const sizes = [20, 20, 20, 80, 30, 30]
    const p = new PrefixSums()
    p.sync(sizes.length, (i) => sizes[i], 20)

    expect(p.total).toBe(naive(sizes).total)
    expect(p.offsetOf(0)).toBe(0)
    expect(p.offsetOf(3)).toBe(60)
    // 首个结束偏移 >= target 的项
    expect(p.findIndex(0)).toBe(0)
    expect(p.findIndex(60)).toBe(2)
    expect(p.findIndex(61)).toBe(3)
    // 超出末尾返回 length，调用方据此判定越界
    expect(p.findIndex(10_000)).toBe(sizes.length)
  })

  it('falls back to the estimated size for unmeasured items', () => {
    const measured = new Map([
      [0, 50],
      [3, 10],
    ])
    const p = new PrefixSums()
    p.sync(5, (i) => measured.get(i), 20)

    // 50 + 20 + 20 + 10 + 20
    expect(p.total).toBe(120)
  })

  it('rebuilds only the suffix after markDirtyFrom, matching a full rebuild', () => {
    const sizes: number[] = Array.from({ length: 200 }, (_, i) => (i % 3 === 0 ? 30 : 20))
    const incremental = new PrefixSums()
    incremental.sync(sizes.length, (i) => sizes[i], 20)

    // 模拟「窗口内某几项被实测，尺寸变了」
    sizes[120] = 90
    sizes[123] = 70
    incremental.markDirtyFrom(120)
    incremental.sync(sizes.length, (i) => sizes[i], 20)

    const fromScratch = new PrefixSums()
    fromScratch.sync(sizes.length, (i) => sizes[i], 20)

    expect(incremental.total).toBe(fromScratch.total)
    expect(incremental.total).toBe(naive(sizes).total)
    for (const i of [0, 119, 120, 121, 150, 199]) {
      expect(incremental.offsetOf(i)).toBe(fromScratch.offsetOf(i))
    }
  })

  it('ignores a dirty mark that is later than an already-pending one', () => {
    const sizes = Array.from({ length: 50 }, () => 20)
    const p = new PrefixSums()
    p.sync(sizes.length, (i) => sizes[i], 20)

    sizes[5] = 100
    sizes[40] = 100
    // 先标脏 5，再标脏 40：必须保留更早的 5，否则 [5,40) 的前缀不会被修正
    p.markDirtyFrom(5)
    p.markDirtyFrom(40)
    p.sync(sizes.length, (i) => sizes[i], 20)

    expect(p.total).toBe(naive(sizes).total)
    expect(p.offsetOf(6)).toBe(naive(sizes).prefix[5])
  })

  it('does a full rebuild when the item count changes', () => {
    const p = new PrefixSums()
    p.sync(3, () => 20, 20)
    expect(p.total).toBe(60)

    // 变长：新项必须被计入，且不能读到旧缓冲区的残值
    p.sync(5, () => 20, 20)
    expect(p.total).toBe(100)

    // 变短：total 必须只算前 2 项，缓冲区可以复用但逻辑长度要收缩
    p.sync(2, () => 20, 20)
    expect(p.total).toBe(40)
    expect(p.findIndex(10_000)).toBe(2)
  })

  it('treats an empty list as zero size without reading the buffer', () => {
    const p = new PrefixSums()
    p.sync(0, () => 20, 20)
    expect(p.total).toBe(0)
    expect(p.offsetOf(0)).toBe(0)
    expect(p.findIndex(0)).toBe(0)
  })
})
