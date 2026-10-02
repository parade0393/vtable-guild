import { effectScope, nextTick, ref, shallowRef } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePagination } from './usePagination'
import type { TablePaginationConfig } from '../types/pagination'

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
function setup(value: false | TablePaginationConfig | undefined = {}, count = 35) {
  const scope = effectScope()
  scopes.push(scope)
  const config = shallowRef(value)
  const data = ref(Array.from({ length: count }, (_, i) => i + 1))
  const onChange = vi.fn()
  const pagination = scope.run(() =>
    usePagination({ pagination: () => config.value, data: () => data.value, onChange }),
  )!
  return { ...pagination, config, data, onChange }
}
describe('usePagination', () => {
  it('initializes page size before clamping a high default page', () => {
    const p = setup({ defaultCurrent: 20, defaultPageSize: 1 }, 35)
    expect(p.state.value).toEqual({ current: 20, pageSize: 1, total: 35 })
    expect(p.pageData.value).toEqual([20])
  })
  it('preserves the data reference when disabled and initializes on first enable', async () => {
    const p = setup(false)
    expect(p.pageData.value).toBe(p.data.value)
    p.config.value = { defaultCurrent: 2, defaultPageSize: 5 }
    expect(p.pageData.value).toEqual([6, 7, 8, 9, 10])
    p.change(3)
    p.config.value = false
    p.config.value = { defaultCurrent: 1, defaultPageSize: 10 }
    await nextTick()
    expect(p.state.value).toMatchObject({ current: 3, pageSize: 5 })
  })
  it('slices local data, clamps after deletion and does not emit on data updates', async () => {
    const p = setup({ defaultCurrent: 4 })
    expect(p.pageData.value).toEqual([31, 32, 33, 34, 35])
    p.data.value = [1, 2]
    await nextTick()
    expect(p.state.value.current).toBe(1)
    expect(p.onChange).not.toHaveBeenCalled()
    p.data.value = []
    expect(p.state.value).toEqual({ current: 1, pageSize: 10, total: 0 })
  })
  it('keeps remote page two intact and accepts empty loading pages', () => {
    const p = setup({ current: 2, total: 100 }, 8)
    expect(p.pageData.value).toBe(p.data.value)
    p.data.value = []
    expect(p.state.value.current).toBe(2)
    expect(p.pageData.value).toEqual([])
  })
  it('warns and slices inconsistent remote data', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const p = setup({ current: 2, total: 100 }, 25)
    expect(p.pageData.value).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
  it('reports requested controlled values without changing props or displayed page', () => {
    const onChange = vi.fn()
    const p = setup({ current: 2, pageSize: 10, onChange })
    p.change(3, 5)
    expect(p.state.value).toMatchObject({ current: 2, pageSize: 10 })
    expect(onChange).toHaveBeenCalledWith(3, 5)
    expect(p.onChange).toHaveBeenCalledOnce()
    expect(p.onChange).toHaveBeenCalledWith({ current: 3, pageSize: 5, total: 35 })
  })
  it('supports independently controlled current and pageSize', () => {
    const p = setup({ pageSize: 10 })
    p.change(2, 5)
    expect(p.state.value).toMatchObject({ current: 2, pageSize: 10 })
    const q = setup({ current: 2 })
    q.change(3, 5)
    expect(q.state.value).toMatchObject({ current: 2, pageSize: 5 })
  })
  it('retains or clamps current on resize and emits callbacks once in order', () => {
    const calls: string[] = []
    const p = setup({
      defaultCurrent: 4,
      onShowSizeChange: () => calls.push('size'),
      onChange: () => calls.push('change'),
    })
    p.change(4, 20)
    expect(p.state.value.current).toBe(2)
    expect(calls).toEqual(['size', 'change'])
    expect(p.onChange).toHaveBeenCalledOnce()
    p.change(2, 20)
    expect(p.onChange).toHaveBeenCalledOnce()
  })
  it('resets for filtering without emitting a second paginate action', () => {
    const callback = vi.fn()
    const p = setup({ current: 3, onChange: callback })
    expect(p.resetForFilter()?.current).toBe(1)
    expect(p.state.value.current).toBe(3)
    expect(callback).toHaveBeenCalledWith(1, 10)
    expect(p.onChange).not.toHaveBeenCalled()
  })
  it('normalizes invalid numbers and ignores disabled navigation', () => {
    const p = setup({ current: -1, pageSize: NaN, total: Infinity, disabled: true })
    expect(p.state.value).toEqual({ current: 1, pageSize: 10, total: 35 })
    p.change(2)
    expect(p.onChange).not.toHaveBeenCalled()
  })
})
