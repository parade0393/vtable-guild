/**
 * 可视区定位用的行位置表：前缀和 + 二分查找，增量维护。
 *
 * 取代原先「每次可视区计算都 `new Array(dataLength)` 重建整表前缀和」的写法。
 * 那个写法的 watch 依赖里含 `offsetTop`，也就是**每个滚动事件**都要
 * 走一遍 O(总行数) 的循环加分配；10 万行时这是每帧几毫秒的固定开销，
 * 且随数据量线性增长——正是「行数越多滚动越贵」的来源。
 *
 * 这里的模型与 TanStack Virtual 一致：位置表是**持久化**的数据结构，
 * 只在真正失效时按「最早脏下标」增量重建；滚动本身只做二分查找。
 *
 * - 滚动（offsetTop 变化）：O(log n)，不重建
 * - 高度实测变化：O(n − dirtyFrom)，且只波及脏点之后的部分
 * - 数据变化：O(n)，整表重建（语义要求）
 *
 * 存储用 `Float64Array` 而非普通数组：避免 10 万个装箱数字与随之而来的 GC 压力。
 */
export class PrefixHeights {
  /** prefix[i] = 第 0..i 行高度之和（即第 i 行的底部偏移）。 */
  private prefix = new Float64Array(0)
  /** 已经算好的行数。 */
  private length = 0
  /** 需要从这个下标开始重算；等于 length 表示整表干净。 */
  private dirtyFrom = 0

  /** 数据本身变了（顺序/长度/内容），整表作废。 */
  markAllDirty(): void {
    this.dirtyFrom = 0
  }

  /**
   * 某个下标起的高度可能变了。
   *
   * 调用方传当前渲染窗口的起点即可：只有渲染出来的行才会被 ResizeObserver 测量，
   * 因此任何高度变更都发生在窗口内，`[0, start)` 的前缀必然仍然有效。
   */
  markDirtyFrom(index: number): void {
    if (index < this.dirtyFrom) this.dirtyFrom = Math.max(0, index)
  }

  /** 惰性同步到最新状态。dataLength 变化会自动触发整表重建。 */
  sync(
    dataLength: number,
    getItemHeight: (index: number) => number | undefined,
    fallbackHeight: number,
  ): void {
    if (dataLength !== this.length) {
      // 长度变了：容量不足才重新分配，能复用就复用（避免每次数据变化都申请新内存）。
      if (dataLength > this.prefix.length) {
        this.prefix = new Float64Array(Math.max(dataLength, this.prefix.length * 2))
      }
      this.length = dataLength
      this.dirtyFrom = 0
    }

    if (this.dirtyFrom >= this.length) return

    const from = this.dirtyFrom
    let running = from === 0 ? 0 : this.prefix[from - 1]
    for (let i = from; i < this.length; i += 1) {
      running += getItemHeight(i) ?? fallbackHeight
      this.prefix[i] = running
    }
    this.dirtyFrom = this.length
  }

  /** 全部行的高度之和。 */
  get totalHeight(): number {
    return this.length === 0 ? 0 : this.prefix[this.length - 1]
  }

  /** 第 index 行的顶部偏移。 */
  offsetOf(index: number): number {
    if (index <= 0) return 0
    return this.prefix[Math.min(index, this.length) - 1]
  }

  /**
   * 首个底部偏移 >= target 的行下标；不存在时返回 length。
   *
   * 前缀和单调不减（高度非负），所以可以二分。
   */
  findIndex(target: number): number {
    let low = 0
    let high = this.length - 1
    let answer = this.length

    while (low <= high) {
      const mid = (low + high) >>> 1
      if (this.prefix[mid] >= target) {
        answer = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    return answer
  }
}
