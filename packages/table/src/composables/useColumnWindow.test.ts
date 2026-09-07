import { describe, expect, it } from 'vitest'
import { computed, shallowRef } from 'vue'
import { PrefixSums } from '@vtable-guild/core'
import type { ColumnType } from '../types'
import {
  computeColumnWindow,
  resolveFixedColumnRanges,
  useColumnWindow,
  type ComputeColumnWindowOptions,
} from './useColumnWindow'

type Col = ColumnType<Record<string, unknown>>

describe('useColumnWindow', () => {
  it('updates spacers when widths change without changing the column count or scroll offset', () => {
    const widths = shallowRef(Array.from({ length: 20 }, () => 100))
    const window = useColumnWindow({
      widths: () => widths.value,
      leftFixedCount: () => 2,
      rightFixedStart: () => 18,
      offsetX: () => 1300,
      viewportWidth: () => 700,
    })
    const rendered = computed(() => ({
      start: window.start.value,
      end: window.end.value,
      spacer: window.leftSpacer.value,
    }))
    const before = rendered.value
    // An auto column outside the window absorbs the space released by resizing.
    for (const index of [17, 16, 15]) {
      const next = [...widths.value]
      next[index] -= 50
      next[2] += 50
      widths.value = next
      const expected = computeColumnWindow({
        prefix: makePrefix(next),
        columnCount: next.length,
        leftFixedCount: 2,
        rightFixedStart: 18,
        offsetX: 1300,
        viewportWidth: 700,
        overscan: 2,
      })
      expect(rendered.value).toEqual({
        start: expected.start,
        end: expected.end,
        spacer: expected.leftSpacer,
      })
    }
    expect(rendered.value).not.toEqual(before)
  })
})

function makePrefix(widths: number[]): PrefixSums {
  const p = new PrefixSums()
  p.sync(widths.length, (i) => widths[i], 0)
  return p
}

function offsetOf(widths: number[], index: number): number {
  let sum = 0
  for (let i = 0; i < Math.min(index, widths.length); i += 1) sum += widths[i]
  return sum
}

interface Scenario {
  widths: number[]
  leftFixedCount: number
  rightFixedStart: number
  viewportWidth: number
  overscan: number
}

function run(scenario: Scenario, offsetX: number) {
  const { widths, ...rest } = scenario
  const options: ComputeColumnWindowOptions = {
    prefix: makePrefix(widths),
    columnCount: widths.length,
    offsetX,
    ...rest,
  }
  return computeColumnWindow(options)
}

/**
 * 宽度不变量：五段拼起来必须正好等于列总宽。
 *
 * 这是整个方案的地基——表体靠占位单元格补齐总宽，才能让列 j 在表头与表体里
 * 落在同一个绝对像素位置。差 1px 就是肉眼可见的错位。
 */
function expectWidthInvariant(scenario: Scenario, offsetX: number) {
  const { widths, leftFixedCount, rightFixedStart } = scenario
  const w = run(scenario, offsetX)

  const total = offsetOf(widths, widths.length)
  const leftFixedWidth = offsetOf(widths, leftFixedCount)
  const rightFixedWidth = total - offsetOf(widths, rightFixedStart)
  const windowWidth = w.end < w.start ? 0 : offsetOf(widths, w.end + 1) - offsetOf(widths, w.start)

  expect(leftFixedWidth + w.leftSpacer + windowWidth + w.rightSpacer + rightFixedWidth).toBe(total)
}

describe('resolveFixedColumnRanges', () => {
  function cols(fixed: (Col['fixed'] | undefined)[]): Col[] {
    return fixed.map((f, i) => ({ key: `c${i}`, fixed: f }) as Col)
  }

  it('finds the left prefix and right suffix', () => {
    const r = resolveFixedColumnRanges(
      cols(['left', 'left', undefined, undefined, 'right', 'right']),
    )
    expect(r).toEqual({ leftFixedCount: 2, rightFixedStart: 4, contiguous: true })
  })

  it('treats a table without fixed columns as one big scrollable range', () => {
    const r = resolveFixedColumnRanges(cols([undefined, undefined, undefined]))
    expect(r).toEqual({ leftFixedCount: 0, rightFixedStart: 3, contiguous: true })
  })

  it('handles every column being fixed', () => {
    const r = resolveFixedColumnRanges(cols(['left', 'left']))
    expect(r).toEqual({ leftFixedCount: 2, rightFixedStart: 2, contiguous: true })
  })

  it('reports a fixed column stranded in the scrollable middle', () => {
    // 窗口是一段连续下标区间，夹在中间的固定列会被整段跳过——必须能被检出并降级。
    const r = resolveFixedColumnRanges(cols(['left', undefined, 'left', undefined, 'right']))
    expect(r.contiguous).toBe(false)
  })
})

describe('computeColumnWindow', () => {
  const uniform: Scenario = {
    widths: Array.from({ length: 200 }, () => 100),
    leftFixedCount: 0,
    rightFixedStart: 200,
    viewportWidth: 1200,
    overscan: 2,
  }

  const withFixed: Scenario = {
    // 左固定 2 列（160 + 90）、右固定 1 列（320），中间 197 列不定宽
    widths: [160, 90, ...Array.from({ length: 197 }, (_, i) => 80 + (i % 7) * 30), 320],
    leftFixedCount: 2,
    rightFixedStart: 199,
    viewportWidth: 1200,
    overscan: 2,
  }

  it('keeps the width invariant across the whole scroll range', () => {
    for (const scenario of [uniform, withFixed]) {
      const total = offsetOf(scenario.widths, scenario.widths.length)
      const maxOffset = Math.max(0, total - scenario.viewportWidth)
      for (const offsetX of [0, 1, 37, 999, maxOffset / 2, maxOffset - 1, maxOffset]) {
        expectWidthInvariant(scenario, Math.max(0, Math.round(offsetX)))
      }
    }
  })

  it('renders every column that overlaps the exposed band', () => {
    const scenario = withFixed
    const { widths, leftFixedCount, rightFixedStart, viewportWidth } = scenario
    const total = offsetOf(widths, widths.length)
    const leftFixedWidth = offsetOf(widths, leftFixedCount)
    const rightFixedWidth = total - offsetOf(widths, rightFixedStart)

    for (const offsetX of [0, 250, 4000, 9000, total - viewportWidth]) {
      const x = Math.max(0, Math.round(offsetX))
      const w = run(scenario, x)
      const bandLeft = x + leftFixedWidth
      const bandRight = x + viewportWidth - rightFixedWidth

      for (let i = leftFixedCount; i < rightFixedStart; i += 1) {
        const colLeft = offsetOf(widths, i)
        const colRight = offsetOf(widths, i + 1)
        const overlaps = colRight > bandLeft && colLeft < bandRight
        if (overlaps) {
          expect(i, `column ${i} at offsetX=${x} must be inside the window`).toBeGreaterThanOrEqual(
            w.start,
          )
          expect(i, `column ${i} at offsetX=${x} must be inside the window`).toBeLessThanOrEqual(
            w.end,
          )
        }
      }
    }
  })

  it('never lets the window swallow a fixed column', () => {
    for (const offsetX of [0, 500, 5000, 20000]) {
      const w = run(withFixed, offsetX)
      expect(w.start).toBeGreaterThanOrEqual(withFixed.leftFixedCount)
      expect(w.end).toBeLessThan(withFixed.rightFixedStart)
    }
  })

  it('collapses the left spacer at the start and the right spacer at the end', () => {
    const total = offsetOf(uniform.widths, uniform.widths.length)

    const atStart = run(uniform, 0)
    expect(atStart.start).toBe(0)
    expect(atStart.leftSpacer).toBe(0)

    const atEnd = run(uniform, total - uniform.viewportWidth)
    expect(atEnd.end).toBe(uniform.widths.length - 1)
    expect(atEnd.rightSpacer).toBe(0)
  })

  it('windows far fewer columns than the table has', () => {
    const w = run(uniform, 5000)
    // 1200px 视口 / 100px 列 = 12 列，加两侧 overscan
    expect(w.end - w.start + 1).toBeLessThanOrEqual(17)
    expect(w.end - w.start + 1).toBeGreaterThanOrEqual(12)
  })

  it('returns an empty window with zero spacers when every column is fixed', () => {
    const w = run(
      {
        widths: [100, 100, 100],
        leftFixedCount: 2,
        rightFixedStart: 2,
        viewportWidth: 1200,
        overscan: 2,
      },
      0,
    )
    expect(w.end).toBeLessThan(w.start)
    expect(w.leftSpacer).toBe(0)
    expect(w.rightSpacer).toBe(0)
  })

  it('still renders one column when the viewport is narrower than the fixed columns', () => {
    const scenario: Scenario = {
      widths: [400, 100, 100, 400],
      leftFixedCount: 1,
      rightFixedStart: 3,
      viewportWidth: 300,
      overscan: 0,
    }
    const w = run(scenario, 0)
    expect(w.start).toBeLessThanOrEqual(w.end)
    expectWidthInvariant(scenario, 0)
  })

  it('holds the invariant when the viewport is wider than the whole table', () => {
    const scenario: Scenario = {
      widths: [100, 100, 100],
      leftFixedCount: 0,
      rightFixedStart: 3,
      viewportWidth: 2000,
      overscan: 2,
    }
    const w = run(scenario, 0)
    expect(w.start).toBe(0)
    expect(w.end).toBe(2)
    expect(w.leftSpacer).toBe(0)
    expect(w.rightSpacer).toBe(0)
    expectWidthInvariant(scenario, 0)
  })
})
