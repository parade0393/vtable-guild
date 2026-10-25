import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import type { TableInstance } from '../types/instance'
import type { TableProps } from '../types/table'

interface Row extends Record<string, unknown> {
  key: number
  name: string
  children?: Row[]
}
const rows: Row[] = Array.from({ length: 100 }, (_, key) => ({ key, name: `Row ${key}` }))
const wrappers: VueWrapper[] = []

function table(preset: 'antdv' | 'element-plus', props: Partial<TableProps<Row>> = {}) {
  const wrapper = mount(VTable<Row>, {
    attachTo: document.body,
    props: {
      dataSource: rows,
      rowKey: 'key',
      columns: [{ dataIndex: 'name', title: 'Name', width: 1000 }],
      scroll: { y: 80, x: 1000 },
      ...props,
    },
    global: { plugins: [createVTableGuild({ themePreset: preset, cssMode: 'tailwind4' })] },
  })
  wrappers.push(wrapper)
  return { wrapper, api: wrapper.vm as unknown as TableInstance }
}

function normalGeometry(wrapper: VueWrapper) {
  const scrollbar = wrapper.getComponent({ name: 'VScrollbar' })
  const wrap = scrollbar.element.firstElementChild as HTMLElement
  Object.defineProperties(wrap, {
    clientHeight: { configurable: true, value: 80 },
    clientWidth: { configurable: true, value: 200 },
    scrollHeight: { configurable: true, value: 2000 },
    scrollWidth: { configurable: true, value: 1000 },
  })
  vi.spyOn(wrap, 'getBoundingClientRect').mockImplementation(
    () => ({ top: 100, height: 80 }) as DOMRect,
  )
  for (const row of wrapper.findAll<HTMLElement>('[data-vtg-row-index]')) {
    vi.spyOn(row.element, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: 100 + Number(row.attributes('data-vtg-row-index')) * 20 - wrap.scrollTop,
          height: 20,
        }) as DOMRect,
    )
  }
  return wrap
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

describe.each(['antdv', 'element-plus'] as const)('%s table instance', (preset) => {
  it('positions measured normal rows by key/index and keeps the horizontal header in sync', async () => {
    const { wrapper, api } = table(preset)
    const wrap = normalGeometry(wrapper)
    expect(await api.scrollTo({ key: 10, index: 1, align: 'top', offset: 5, left: 120 })).toBe(true)
    expect(wrap.scrollTop).toBe(195)
    expect(wrap.scrollLeft).toBe(120)
    const header = wrapper.get('thead').element.closest('table')!.parentElement!.parentElement!
    expect(header.scrollLeft).toBe(120)
    expect(await api.scrollTo({ index: 20, align: 'bottom', offset: 5 })).toBe(true)
    expect(wrap.scrollTop).toBe(345)
    expect(await api.scrollTo({ index: 19, align: 'auto' })).toBe(true)
    expect(wrap.scrollTop).toBe(345)
    expect(await api.scrollTo({ top: 30, left: 40 })).toBe(true)
    expect(wrap.scrollTop).toBe(30)
    expect(wrap.scrollLeft).toBe(40)
    expect(await api.scrollTo({ top: -10, left: 2000 })).toBe(true)
    expect(wrap.scrollTop).toBe(0)
    expect(wrap.scrollLeft).toBe(800)
  })

  it('limits row addressing to the current loaded page and expanded tree rows', async () => {
    const { wrapper, api } = table(preset, {
      dataSource: [
        { key: 1, name: 'Parent', children: [{ key: 11, name: 'Child' }] },
        { key: 2, name: 'Next page' },
      ],
      pagination: { pageSize: 1, current: 1 },
    })
    normalGeometry(wrapper)
    expect(await api.scrollTo({ key: 2 })).toBe(false)
    expect(await api.scrollTo({ index: 1 })).toBe(false)
    expect(await api.scrollTo({ key: 11 })).toBe(false)
    expect(wrapper.emitted('change')).toBeUndefined()
    await wrapper.get('tbody button').trigger('click')
    expect(await api.scrollTo({ key: 11 })).toBe(true)
    expect(wrapper.findAll('[data-vtg-row-index]')).toHaveLength(2)
  })

  it('rejects invalid targets and calls after unmount without modifying scroll position', async () => {
    const { wrapper, api } = table(preset, { scroll: undefined })
    const wrap = normalGeometry(wrapper)
    expect(await api.scrollTo({})).toBe(false)
    expect(await api.scrollTo({ key: 'missing', index: 1 })).toBe(false)
    expect(await api.scrollTo({ index: -1 })).toBe(false)
    expect(await api.scrollTo({ index: 0.5 })).toBe(false)
    expect(await api.scrollTo({ top: NaN })).toBe(false)
    expect(await api.scrollTo({ left: Infinity })).toBe(false)
    expect(wrap.scrollTop).toBe(0)
    expect(await api.scrollTo({ index: 10, align: 'top' })).toBe(true)
    expect(wrap.scrollTop).toBe(200)
    wrapper.unmount()
    expect(await api.scrollTo({ top: 0 })).toBe(false)
  })

  it.each([true, false])('locates offscreen virtual rows with fixedHeight=%s', async (fixed) => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(80)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200)
    const { wrapper, api } = table(preset, { virtual: true, rowHeight: fixed ? 20 : undefined })
    expect(wrapper.find('[data-vtg-row-index="50"]').exists()).toBe(false)
    expect(await api.scrollTo({ key: 50, align: 'top', left: 100 })).toBe(true)
    await nextTick()
    expect(wrapper.find('[data-vtg-row-index="50"]').exists()).toBe(true)
    const header = wrapper.get('thead').element.closest('table')!.parentElement!.parentElement!
    expect(header.scrollLeft).toBe(100)
    expect(
      (wrapper.get('.vtg-virtual-list-holder-inner').element as HTMLElement).style.marginLeft,
    ).toBe('-100px')
    expect(await api.scrollTo({ left: 240 })).toBe(true)
    expect(header.scrollLeft).toBe(240)
    expect(
      (wrapper.get('.vtg-virtual-list-holder-inner').element as HTMLElement).style.marginLeft,
    ).toBe('-240px')
    expect(wrapper.find('[data-vtg-row-index="50"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-vtg-row-index]').length).toBeLessThan(20)
    expect(await api.scrollTo({ key: 1000 })).toBe(false)
    expect(await api.scrollTo({ top: 0 })).toBe(true)
    await nextTick()
    expect(wrapper.find('[data-vtg-row-index="0"]').exists()).toBe(true)
  })
})

it('keeps parent VNode keys and refs on the generic bridge', async () => {
  const parentRef = vi.fn()
  const wrapper = mount({
    setup: () => () =>
      h(VTable<Row>, {
        key: 'parent-table',
        ref: parentRef,
        ref_for: true,
        ref_key: 'tables',
        dataSource: rows,
        columns: [{ dataIndex: 'name' }],
      }),
  })
  wrappers.push(wrapper)
  expect(parentRef).toHaveBeenCalledTimes(1)
  const table = wrapper.getComponent({ name: 'VTable' })
  expect(table.vm.$.subTree.key).toBeNull()
  expect(table.vm.$.subTree.props?.ref_for).toBeUndefined()
  expect(table.vm.$.subTree.props?.ref_key).toBeUndefined()
  const instance = parentRef.mock.calls[0][0] as TableInstance
  expect(await instance.scrollTo({ top: 0 })).toBe(true)
})
