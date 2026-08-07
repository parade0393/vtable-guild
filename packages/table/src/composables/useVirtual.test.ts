import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useVirtual } from './useVirtual'

describe('useVirtual', () => {
  it('only enables virtual mode when virtual and scroll.y are both provided', () => {
    const virtual = ref(false)
    const scrollY = ref<number | string | undefined>(400)

    const api = useVirtual({
      virtual: () => virtual.value,
      scrollY: () => scrollY.value,
      size: () => 'middle',
    })

    expect(api.enabled.value).toBe(false)

    virtual.value = true
    expect(api.enabled.value).toBe(true)

    scrollY.value = undefined
    expect(api.enabled.value).toBe(false)
  })

  it('derives item height from the table size preset', () => {
    const size = ref<'small' | 'middle' | 'large' | undefined>('small')

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => 360,
      size: () => size.value,
    })

    expect(api.itemHeight.value).toBe(39)

    size.value = 'middle'
    expect(api.itemHeight.value).toBe(47)

    size.value = 'large'
    expect(api.itemHeight.value).toBe(55)

    size.value = undefined
    expect(api.itemHeight.value).toBe(47)
  })

  it('normalizes numeric and string scroll heights', () => {
    const scrollY = ref<number | string | undefined>(320)

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => scrollY.value,
      size: () => 'middle',
    })

    expect(api.listHeight.value).toBe(320)

    scrollY.value = '480px'
    expect(api.listHeight.value).toBe(480)

    scrollY.value = 'bad-value'
    expect(api.listHeight.value).toBe(400)

    scrollY.value = undefined
    expect(api.listHeight.value).toBe(400)
  })

  it('stays on the measured path unless rowHeight is explicitly declared', () => {
    const api = useVirtual({
      virtual: () => true,
      scrollY: () => 460,
      size: () => 'middle',
    })

    // 刻意不做自动探测：没传 rowHeight 就必须走实测路径，支持不定行高。
    expect(api.fixedHeight.value).toBe(false)
    expect(api.itemHeight.value).toBe(47)
  })

  it('enters the fixed-height fast path and overrides the size preset', () => {
    const rowHeight = ref<number | undefined>(32)

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => 460,
      size: () => 'large',
      rowHeight: () => rowHeight.value,
    })

    expect(api.fixedHeight.value).toBe(true)
    // 显式声明优先于 size 预设（large 本来是 55）
    expect(api.itemHeight.value).toBe(32)

    rowHeight.value = undefined
    expect(api.fixedHeight.value).toBe(false)
    expect(api.itemHeight.value).toBe(55)
  })

  it('rejects non-positive or non-finite rowHeight instead of trusting it', () => {
    const rowHeight = ref<number | undefined>(0)

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => 460,
      size: () => 'middle',
      rowHeight: () => rowHeight.value,
    })

    // 0 / 负数 / NaN 会让位置计算除零或错乱，一律不认，回落到预设值。
    expect(api.fixedHeight.value).toBe(false)
    expect(api.itemHeight.value).toBe(47)

    rowHeight.value = -10
    expect(api.fixedHeight.value).toBe(false)

    rowHeight.value = Number.NaN
    expect(api.fixedHeight.value).toBe(false)

    rowHeight.value = 40
    expect(api.fixedHeight.value).toBe(true)
    expect(api.itemHeight.value).toBe(40)
  })
})
