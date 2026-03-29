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
      size: () => 'md',
    })

    expect(api.enabled.value).toBe(false)

    virtual.value = true
    expect(api.enabled.value).toBe(true)

    scrollY.value = undefined
    expect(api.enabled.value).toBe(false)
  })

  it('derives item height from the table size preset', () => {
    const size = ref<'sm' | 'md' | 'lg' | undefined>('sm')

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => 360,
      size: () => size.value,
    })

    expect(api.itemHeight.value).toBe(39)

    size.value = 'md'
    expect(api.itemHeight.value).toBe(47)

    size.value = 'lg'
    expect(api.itemHeight.value).toBe(55)

    size.value = undefined
    expect(api.itemHeight.value).toBe(47)
  })

  it('normalizes numeric and string scroll heights', () => {
    const scrollY = ref<number | string | undefined>(320)

    const api = useVirtual({
      virtual: () => true,
      scrollY: () => scrollY.value,
      size: () => 'md',
    })

    expect(api.listHeight.value).toBe(320)

    scrollY.value = '480px'
    expect(api.listHeight.value).toBe(480)

    scrollY.value = 'bad-value'
    expect(api.listHeight.value).toBe(400)

    scrollY.value = undefined
    expect(api.listHeight.value).toBe(400)
  })
})
