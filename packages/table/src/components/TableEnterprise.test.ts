import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import { resolveBodyCell } from '../utils/cell'
import { getColumnFilters } from '../utils/valueEnum'
import type { ColumnType, CustomFilterDropdownSlotProps, TableProps } from '../types'

interface Row extends Record<string, unknown> {
  key: number
  age: number
  status: number
}
const rows: Row[] = [
  { key: 1, age: 30, status: 1 },
  { key: 2, age: 10, status: 0 },
  { key: 3, age: 20, status: 1 },
]
const wrappers: VueWrapper[] = []
function table(preset: 'antdv' | 'element-plus', props: Partial<TableProps<Row>>, slots = {}) {
  const wrapper = mount(VTable<Row>, {
    attachTo: document.body,
    props: {
      dataSource: rows,
      columns: [{ key: 'age', dataIndex: 'age', title: 'Age' }],
      rowKey: 'key',
      ...props,
    },
    slots,
    global: {
      plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US', cssMode: 'tailwind4' })],
    },
  })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe.each(['antdv', 'element-plus'] as const)('%s enterprise table contracts', (preset) => {
  it('delegates each data stage explicitly while retaining sorter events and local defaults', async () => {
    const columns: ColumnType<Row>[] = [
      { key: 'age', dataIndex: 'age', title: 'Age', sorter: true, defaultSortOrder: 'ascend' },
    ]
    const wrapper = table(preset, {
      columns,
      manual: true,
      pagination: { pageSize: 1, current: 2, total: 3 },
    })
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual(['30', '10', '20'])
    await wrapper.get('th').trigger('click')
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.emitted('change')![0][2]).toMatchObject({
      action: 'sort',
      pagination: { current: 2 },
    })
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual(['30', '10', '20'])
    await wrapper.setProps({ manual: { sort: true }, pagination: false })
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual(['30', '10', '20'])
    await wrapper.setProps({ manual: false })
    expect(wrapper.findAll('tbody tr').map((row) => row.text())).toEqual(['30', '20', '10'])
  })

  it('uses typed enum values for display and generated filters, and lets remote mode bypass filtering', async () => {
    const valueEnum = new Map([
      [0, { text: 'Disabled', status: 'default' as const }],
      [1, { text: 'Enabled', status: 'success' as const }],
    ])
    const column: ColumnType<Row> = {
      key: 'status',
      dataIndex: 'status',
      title: 'Status',
      valueEnum,
      filters: true,
      defaultFilteredValue: [1],
    }
    const wrapper = table(preset, { columns: [column] })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.findAll('[data-status="success"]')).toHaveLength(2)
    expect(getColumnFilters(column).map((item) => item.value)).toEqual([0, 1])
    await wrapper.setProps({ manual: { filter: true } })
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.text()).toContain('Disabled')
    await wrapper.setProps({ manual: false, columns: [{ ...column, onFilter: false }] })
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('copies the scalar source value without selecting or expanding the row', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const rowClick = vi.fn()
    const wrapper = table(preset, {
      columns: [{ key: 'age', dataIndex: 'age', title: 'Age', copyable: true }],
      customRow: () => ({ onClick: rowClick }),
    })
    await wrapper.get('button[aria-label="Copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('30')
    expect(rowClick).not.toHaveBeenCalled()
    expect(wrapper.find('button[aria-label="Copied"]').exists()).toBe(true)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('supports async explicit copy text and reports failures without uncaught rejections', async () => {
    const onError = vi.fn()
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = table(preset, {
      columns: [
        {
          key: 'age',
          dataIndex: 'age',
          copyable: { text: async ({ record }) => `Order-${record.key}`, onError },
        },
      ],
    })
    await wrapper.get('button[aria-label="Copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('Order-1')
    expect(onError).toHaveBeenCalledWith(expect.any(Error), rows[0])
    expect(wrapper.find('button[aria-label="Copy failed"]').exists()).toBe(true)
  })

  it('cancels delayed loading before it flashes and retains wrapper classes', async () => {
    vi.useFakeTimers()
    const wrapper = table(preset, {
      loading: {
        spinning: true,
        delay: 200,
        wrapperClassName: 'orders-loading',
        tip: 'Please wait',
      },
    })
    expect(wrapper.classes()).toContain('orders-loading')
    expect(wrapper.text()).not.toContain('Please wait')
    await vi.advanceTimersByTimeAsync(100)
    await wrapper.setProps({ loading: false })
    await vi.advanceTimersByTimeAsync(200)
    expect(wrapper.text()).not.toContain('Please wait')
    await wrapper.setProps({ loading: { delay: 50, tip: 'Please wait' } })
    await vi.advanceTimersByTimeAsync(50)
    await nextTick()
    expect(wrapper.text()).toContain('Please wait')
  })

  it('places and titles the expansion column without changing the selection column', () => {
    const wrapper = table(
      preset,
      {
        columns: [
          { key: 'age', dataIndex: 'age', title: 'Age' },
          { key: 'status', dataIndex: 'status', title: 'Status' },
        ],
        rowSelection: {},
        expandable: {
          expandedRowRender: () => 'Detail',
          expandIconColumnIndex: 1,
          columnTitle: 'Expand',
        },
      },
      { expandColumnTitle: () => h('strong', 'Details') },
    )
    expect(wrapper.findAll('th').map((cell) => cell.text())).toEqual([
      '',
      'Age',
      'Details',
      'Status',
    ])
  })
})

describe.each(['antdv', 'element-plus'] as const)('%s filter and tooltip contracts', (preset) => {
  it('buffers an unconfirmed clear and submits once without closing a controlled panel', async () => {
    let scope: CustomFilterDropdownSlotProps<Row> | undefined
    const onOpenChange = vi.fn()
    const wrapper = table(
      preset,
      {
        columns: [
          {
            key: 'status',
            dataIndex: 'status',
            title: 'Status',
            customFilterDropdown: true,
            filterDropdownOpen: true,
            defaultFilteredValue: [1],
            onFilterDropdownOpenChange: onOpenChange,
          },
        ],
      },
      {
        customFilterDropdown: (value: CustomFilterDropdownSlotProps<Row>) => {
          scope = value
          return h('div', 'Custom filters')
        },
      },
    )
    scope!.clearFilters({ confirm: false, closeDropdown: false })
    await nextTick()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(scope!.selectedKeys).toEqual([])
    scope!.confirm({ closeDropdown: false })
    await nextTick()
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.emitted('change')![0][0]).toMatchObject({ status: null })
    expect(onOpenChange).not.toHaveBeenCalled()
    scope!.clearFilters()
    await nextTick()
    expect(wrapper.emitted('change')).toHaveLength(2)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('passes sorter tooltip configuration independently from the header help', () => {
    const wrapper = table(preset, {
      columns: [{ key: 'age', dataIndex: 'age', title: 'Age', sorter: true, tooltip: 'Age help' }],
      showSorterTooltip: {
        title: 'Sort ages',
        placement: 'bottom',
        arrow: false,
        mouseEnterDelay: 0.2,
      },
    })
    const sorter = wrapper
      .findAllComponents({ name: 'VTooltip' })
      .find((item) => item.props('title') === 'Sort ages')
    expect(sorter?.props()).toMatchObject({
      placement: 'bottom',
      arrow: false,
      mouseEnterDelay: 0.2,
    })
    expect(
      wrapper
        .findAllComponents({ name: 'VTooltip' })
        .some((item) => item.props('title') === 'Age help'),
    ).toBe(true)
  })
})

describe('default cell presentation', () => {
  function cell(text: unknown, column: ColumnType = {}, extra = {}) {
    return resolveBodyCell({
      text,
      record: {},
      rowIndex: 0,
      column,
      columnEmptyText: '—',
      ...extra,
    })
  }
  it('preserves falsy values and custom renderers while substituting only nullish defaults', () => {
    expect(cell(null).content).toBe('—')
    expect(cell(undefined).content).toBe('—')
    expect(cell(0).content).toBe(0)
    expect(cell(false).content).toBe('false')
    expect(cell('').content).toBe('')
    expect(cell(null, { customRender: () => null }).content).toBeNull()
    expect(cell(null, {}, { bodyCell: () => [h('b', 'Custom')] }).content).toEqual([
      h('b', 'Custom'),
    ])
  })
  it('keeps enum display separate from copy text and preserves unknown values', () => {
    const column: ColumnType = { valueEnum: new Map([[1, { text: 'Enabled', status: 'success' }]]) }
    expect(cell(1, column)).toMatchObject({
      content: 'Enabled',
      tooltipText: 'Enabled',
      copyText: '1',
      status: 'success',
    })
    expect(cell('1', column).content).toBe('1')
    expect(cell(2, column).content).toBe(2)
    expect(cell({}, column).copyText).toBeUndefined()
  })
})
