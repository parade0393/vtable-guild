import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import type { ColumnsType, TableProps } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  age: number
}

const dataSource: DemoRow[] = [
  { key: '1', name: 'Charlie', age: 30 },
  { key: '2', name: 'Alice', age: 24 },
]

const baseColumns: ColumnsType<DemoRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name' },
  { title: 'Age', key: 'age', dataIndex: 'age' },
]

function mountTable(
  extraProps: Partial<TableProps<DemoRow>> = {},
  options: { compatClass?: boolean } = {},
) {
  return mount(VTable<DemoRow>, {
    props: {
      rowKey: 'key',
      columns: baseColumns,
      dataSource,
      ...extraProps,
    },
    global: {
      plugins: [createVTableGuild({ compatClass: options.compatClass })],
    },
  })
}

describe('antdv compat class', () => {
  it('emits no ant- classes by default', () => {
    const wrapper = mountTable()
    expect(wrapper.html()).not.toContain('ant-')
  })

  it('emits slot-driven compat classes when enabled', () => {
    const wrapper = mountTable({}, { compatClass: true })

    expect(wrapper.get('div').classes()).toEqual(
      expect.arrayContaining(['ant-table-wrapper', 'ant-table']),
    )
    expect(wrapper.get('thead').classes()).toContain('ant-table-thead')
    expect(wrapper.get('tbody').classes()).toContain('ant-table-tbody')
    expect(wrapper.get('tbody tr').classes()).toContain('ant-table-row')
    expect(wrapper.get('th').classes()).toContain('ant-table-cell')
    expect(wrapper.get('tbody td').classes()).toContain('ant-table-cell')
  })

  it('maps size and bordered variants to compat classes', () => {
    expect(mountTable({ size: 'small' }, { compatClass: true }).get('div').classes()).toContain(
      'ant-table-small',
    )
    expect(mountTable({ bordered: true }, { compatClass: true }).get('div').classes()).toContain(
      'ant-table-bordered',
    )
  })

  it('marks selected rows and the selection column', () => {
    const wrapper = mountTable({ rowSelection: { selectedRowKeys: ['1'] } }, { compatClass: true })

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].classes()).toContain('ant-table-row-selected')
    expect(rows[1].classes()).not.toContain('ant-table-row-selected')
    expect(wrapper.get('thead th').classes()).toContain('ant-table-selection-column')
    expect(wrapper.get('tbody td').classes()).toContain('ant-table-selection-column')
  })

  it('marks ellipsis cells on the td, mirroring antdv', () => {
    const wrapper = mountTable(
      { columns: [{ title: 'Name', key: 'name', dataIndex: 'name', ellipsis: true }] },
      { compatClass: true },
    )

    expect(wrapper.get('tbody td').classes()).toContain('ant-table-cell-ellipsis')
  })

  it('marks fixed columns and their boundary position', () => {
    const wrapper = mountTable(
      {
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name', fixed: 'left', width: 100 },
          { title: 'Age', key: 'age', dataIndex: 'age', width: 100 },
        ],
        scroll: { x: 800 },
      },
      { compatClass: true },
    )

    const firstCell = wrapper.get('tbody td')
    expect(firstCell.classes()).toContain('ant-table-cell-fix-left')
    expect(firstCell.classes()).toContain('ant-table-cell-fix-left-last')
    expect(wrapper.get('div').classes()).toContain('ant-table-has-fix-left')
  })

  it('marks tree rows with their level', () => {
    const wrapper = mountTable(
      {
        dataSource: [
          { key: '1', name: 'Parent', age: 30, children: [{ key: '1-1', name: 'Child', age: 5 }] },
        ] as DemoRow[],
        expandedRowKeys: ['1'],
      },
      { compatClass: true },
    )

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].classes()).toContain('ant-table-row-level-0')
    expect(rows[1].classes()).toContain('ant-table-row-level-1')
  })

  it('matches antdv hover and level classes on every body cell', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mountTable({}, { compatClass: true })
      const firstCell = wrapper.get('tbody td')

      expect(wrapper.get('tbody tr').classes()).toContain('ant-table-row-level-0')

      await firstCell.trigger('mouseenter')
      vi.advanceTimersByTime(100)
      await nextTick()

      expect(
        wrapper
          .findAll('tbody tr')[0]
          .findAll('td')
          .every((cell) => cell.classes().includes('ant-table-cell-row-hover')),
      ).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('matches row expand cell and icon state classes', () => {
    const wrapper = mountTable(
      {
        expandable: {
          expandedRowKeys: ['1'],
          expandedRowRender: (record) => `expanded:${record.name}`,
        },
      },
      { compatClass: true },
    )

    const rows = wrapper.findAll('tbody tr')
    const expandedIcon = rows[0].get('button')
    const collapsedIcon = rows[2].get('button')

    expect(rows[0].get('td').classes()).toContain('ant-table-row-expand-icon-cell')
    expect(expandedIcon.classes()).toEqual(
      expect.arrayContaining(['ant-table-row-expand-icon', 'ant-table-row-expand-icon-expanded']),
    )
    expect(collapsedIcon.classes()).toEqual(
      expect.arrayContaining(['ant-table-row-expand-icon', 'ant-table-row-expand-icon-collapsed']),
    )
    expect(rows[1].classes()).toContain('ant-table-expanded-row-level-1')
  })

  it('matches tree indent, append and icon state classes', () => {
    const wrapper = mountTable(
      {
        dataSource: [
          { key: '1', name: 'Parent', age: 30, children: [{ key: '1-1', name: 'Child', age: 5 }] },
        ] as DemoRow[],
        expandedRowKeys: ['1'],
      },
      { compatClass: true },
    )

    const rows = wrapper.findAll('tbody tr')
    const parentCell = rows[0].get('td')
    const childCell = rows[1].get('td')

    expect(parentCell.classes()).toContain('ant-table-cell-with-append')
    expect(parentCell.get('.ant-table-row-indent').classes()).toContain('indent-level-0')
    expect(parentCell.get('button').classes()).toEqual(
      expect.arrayContaining(['ant-table-row-expand-icon', 'ant-table-row-expand-icon-expanded']),
    )
    expect(childCell.classes()).toContain('ant-table-cell-with-append')
    expect(childCell.get('.ant-table-row-indent').classes()).toContain('indent-level-1')
    expect(childCell.get('.ant-table-row-expand-icon').classes()).toContain(
      'ant-table-row-expand-icon-spaced',
    )
  })

  it('matches root state, selection col and resize handle classes', () => {
    const wrapper = mountTable(
      {
        dataSource: [],
        rowSelection: { selectedRowKeys: [] },
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name', resizable: true, width: 120 },
          { title: 'Age', key: 'age', dataIndex: 'age' },
        ],
        scroll: { x: 800, y: 240 },
      },
      { compatClass: true },
    )

    const root = wrapper.get('div')
    expect(root.classes()).toEqual(
      expect.arrayContaining([
        'ant-table-empty',
        'ant-table-fixed-header',
        'ant-table-scroll-horizontal',
        'ant-table-layout-fixed',
      ]),
    )
    expect(wrapper.get('col.ant-table-selection-col')).toBeTruthy()
    expect(wrapper.get('.ant-table-resize-handle-line')).toBeTruthy()
    expect(wrapper.get('tbody tr').classes()).toContain('ant-table-placeholder')
  })

  it('matches sorter and filter sub-classes', () => {
    const wrapper = mountTable(
      {
        columns: [
          {
            title: 'Name',
            key: 'name',
            dataIndex: 'name',
            sorter: true,
            sortOrder: 'ascend',
            filters: [{ text: 'Charlie', value: 'Charlie' }],
            defaultFilteredValue: ['Charlie'],
            filterSearch: true,
          },
          { title: 'Age', key: 'age', dataIndex: 'age' },
        ],
      },
      { compatClass: true },
    )

    const header = wrapper.get('thead th')
    expect(header.classes()).toEqual(
      expect.arrayContaining(['ant-table-column-has-sorters', 'ant-table-column-sort']),
    )
    expect(header.get('.ant-table-column-sorters')).toBeTruthy()
    expect(header.get('.ant-table-column-title')).toBeTruthy()
    expect(header.get('.ant-table-column-sorter-inner')).toBeTruthy()
    expect(header.get('.ant-table-column-sorter-up').classes()).toContain('active')
    expect(header.get('.ant-table-filter-trigger').classes()).toContain('active')
  })
})
