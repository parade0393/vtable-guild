import { describe, expect, it } from 'vitest'
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
})
