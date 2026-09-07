import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import {
  INVALID_SCROLL_Y_FALLBACK,
  MIN_VIRTUAL_VIEWPORT,
  resolveScrollY,
  useVirtual,
} from './useVirtual'

describe('resolveScrollY', () => {
  it('classifies numbers: positive finite vs zero / negative / non-finite', () => {
    expect(resolveScrollY(420)).toEqual({ kind: 'fixed-number', value: 420 })
    expect(resolveScrollY(0)).toEqual({ kind: 'invalid-number' })
    expect(resolveScrollY(-5)).toEqual({ kind: 'invalid-number' })
    expect(resolveScrollY(Number.NaN)).toEqual({ kind: 'invalid-number' })
    expect(resolveScrollY(Number.POSITIVE_INFINITY)).toEqual({ kind: 'invalid-number' })
  })

  it('classifies the auto sentinel, including surrounding whitespace', () => {
    expect(resolveScrollY('auto')).toEqual({ kind: 'auto' })
    expect(resolveScrollY('  auto  ')).toEqual({ kind: 'auto' })
  })

  it('only accepts trimmed positive decimal px strings as compat', () => {
    expect(resolveScrollY('480px')).toEqual({ kind: 'compat-px', value: 480 })
    expect(resolveScrollY(' 480px ')).toEqual({ kind: 'compat-px', value: 480 })
    expect(resolveScrollY('480.5px')).toEqual({ kind: 'compat-px', value: 480.5 })

    // 0px / 负号 / 裸数字 / 其他单位 / 表达式都不能进虚拟路径
    expect(resolveScrollY('0px')).toEqual({ kind: 'invalid-string' })
    expect(resolveScrollY('-5px')).toEqual({ kind: 'invalid-string' })
    expect(resolveScrollY('480')).toEqual({ kind: 'invalid-string' })
    expect(resolveScrollY('480foo')).toEqual({ kind: 'invalid-string' })
    expect(resolveScrollY('100%')).toEqual({ kind: 'invalid-string' })
    expect(resolveScrollY('50vh')).toEqual({ kind: 'invalid-string' })
    expect(resolveScrollY('calc(100% - 20px)')).toEqual({ kind: 'invalid-string' })
  })

  it('treats missing values as missing instead of guessing', () => {
    expect(resolveScrollY(undefined)).toEqual({ kind: 'missing' })
    expect(resolveScrollY(null)).toEqual({ kind: 'missing' })
    expect(resolveScrollY('')).toEqual({ kind: 'missing' })
    expect(resolveScrollY('   ')).toEqual({ kind: 'missing' })
  })
})

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
    // 兜底必须跟主题的 defaultVariants.size 一致（antdv 预设是 large）：
    // size prop 默认就是 undefined，这里猜错等于**所有默认表格**都按错的行高估算。
    expect(api.itemHeight.value).toBe(55)
  })

  it('normalizes numeric and compat-px scroll heights and falls back for invalid ones', () => {
    const scrollY = ref<number | string | undefined>(320)

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => scrollY.value,
      size: () => 'middle',
    })

    expect(api.listHeight.value).toBe(320)

    scrollY.value = '480px'
    expect(api.listHeight.value).toBe(480)

    // 无法解析的字符串与非法数字：保持虚拟可用，视口回落 400（issue #38 语义，
    // 不回落全量渲染的普通表体——万行宽表上那是秒级冻结）。
    scrollY.value = 'bad-value'
    expect(api.listHeight.value).toBe(INVALID_SCROLL_Y_FALLBACK)

    scrollY.value = '100%'
    expect(api.listHeight.value).toBe(INVALID_SCROLL_Y_FALLBACK)

    scrollY.value = -5
    expect(api.listHeight.value).toBe(INVALID_SCROLL_Y_FALLBACK)

    scrollY.value = undefined
    expect(api.listHeight.value).toBe(INVALID_SCROLL_Y_FALLBACK)
  })

  it('drives the virtual viewport from measured height in auto mode', () => {
    const measured = ref<number | undefined>(517)

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => 'auto',
      size: () => 'middle',
      measuredHeight: () => measured.value,
    })

    expect(api.enabled.value).toBe(true)
    expect(api.listHeight.value).toBe(517)

    // 未测得（ref 异常等边缘）钳到 1px，绝不让 core 的 falsy 检查关闭窗口化。
    measured.value = undefined
    expect(api.listHeight.value).toBe(MIN_VIRTUAL_VIEWPORT)
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
