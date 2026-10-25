import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import type { TableProps } from '../types/table'

interface Row extends Record<string, unknown> {
  key: string
  name: string
  leaf?: boolean
}

describe.each(['antdv', 'element-plus'] as const)('%s lazy tree', (preset) => {
  function table(props: Partial<TableProps<Row>> = {}) {
    return mount(VTable<Row>, {
      props: {
        columns: [{ dataIndex: 'name', title: 'Name' }],
        dataSource: [{ key: 'root', name: 'Root' }],
        rowKey: 'key',
        isLeaf: (row: Row) => row.leaf === true,
        ...props,
      },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
  }

  it('loads on expand, keeps collapsed responses cached and includes children in cascading selection', async () => {
    let resolve!: (rows: Row[]) => void
    const load = vi.fn(
      () =>
        new Promise<Row[]>((done) => {
          resolve = done
        }),
    )
    const onChange = vi.fn()
    const wrapper = table({ loadData: load, rowSelection: { checkStrictly: false, onChange } })
    await wrapper.get('button[aria-expanded]').trigger('click')
    expect(wrapper.find('[aria-busy=true]').exists()).toBe(true)
    await wrapper.get('button[aria-expanded]').trigger('click')
    resolve([{ key: 'child', name: 'Child', leaf: true }])
    await flushPromises()
    expect(wrapper.text()).not.toContain('Child')
    await wrapper.get('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(load).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Child')
    await wrapper.get('tbody [role=checkbox]').trigger('click')
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(['root', 'child'])
    wrapper.unmount()
  })

  it('loads default expanded rows and retries a failed request once per click', async () => {
    const error = vi.fn()
    const load = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([])
    const wrapper = table({
      loadData: load,
      defaultExpandedRowKeys: ['root'],
      onTreeLoadError: error,
    })
    await flushPromises()
    expect(load).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledTimes(1)
    await wrapper.get('button[data-load-error=true]').trigger('click')
    await flushPromises()
    expect(load).toHaveBeenCalledTimes(2)
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('keeps controlled expansion under business ownership in virtual mode', async () => {
    const expanded = vi.fn()
    const load = vi.fn().mockResolvedValue([{ key: 'child', name: 'Child', leaf: true }])
    const wrapper = table({
      loadData: load,
      virtual: true,
      rowHeight: 40,
      scroll: { y: 200 },
      expandedRowKeys: [],
      onExpandedRowsChange: expanded,
    })
    await wrapper.get('button[aria-expanded]').trigger('click')
    expect(expanded).toHaveBeenCalledWith(['root'])
    expect(load).not.toHaveBeenCalled()
    await wrapper.setProps({ expandedRowKeys: ['root'] })
    await flushPromises()
    expect(wrapper.text()).toContain('Child')
    wrapper.unmount()
  })

  it('expands new lazy descendants by default and preserves user collapse across paged loads', async () => {
    const load = vi.fn(async (row: Row) =>
      row.key === 'root'
        ? [{ key: 'branch', name: 'Branch' }]
        : [{ key: `${row.key}-leaf`, name: `${row.name} leaf`, leaf: true }],
    )
    const wrapper = table({
      dataSource: [
        { key: 'root', name: 'Root' },
        { key: 'other', name: 'Other' },
      ],
      loadData: load,
      defaultExpandAllRows: true,
      pagination: { defaultPageSize: 1 },
    })
    await flushPromises()
    expect(wrapper.get('tbody').text()).toContain('Branch leaf')
    expect(load.mock.calls.map(([row]) => row.key)).toEqual(['root', 'branch'])
    await wrapper.findAll('button[aria-expanded]')[0]!.trigger('click')
    expect(wrapper.get('tbody').text()).not.toContain('Branch')
    await wrapper.get('button[title="2"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('tbody').text()).toContain('Other leaf')
    await wrapper.get('button[title="1"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('tbody').text()).not.toContain('Branch')
    expect(load).toHaveBeenCalledTimes(3)
    expect(wrapper.get('button[aria-expanded]').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })
})
