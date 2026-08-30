import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import { VTableSummary } from '../index'
import type { ColumnsType } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  score: number
}

const dataSource: DemoRow[] = [
  { key: '1', name: 'Charlie', score: 30 },
  { key: '2', name: 'Alice', score: 24 },
]

const alignColumns: ColumnsType<DemoRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name', width: 160 },
  { title: 'Score', key: 'score', dataIndex: 'score', width: 120, align: 'center' },
  { title: 'Total', key: 'total', dataIndex: 'score', width: 120, align: 'right' },
]

function hasClassToken(root: Element, token: string): boolean {
  return Array.from(root.querySelectorAll('*')).some(
    (el) => typeof el.className === 'string' && el.className.split(/\s+/).includes(token),
  )
}

afterEach(() => {
  document.documentElement.removeAttribute('data-vtg-preset')
})

describe('VTable prebuilt css mode', () => {
  it('emits prefixed align utilities for th/td by default (prebuilt)', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: { rowKey: 'key', columns: alignColumns, dataSource },
    })

    const headerCells = wrapper.findAll('thead th')
    expect(headerCells[1]?.classes()).toContain('vtg-text-center')
    expect(headerCells[1]?.classes()).not.toContain('text-center')
    expect(headerCells[2]?.classes()).toContain('vtg-text-right')
    expect(headerCells[2]?.classes()).not.toContain('text-right')

    const bodyCells = wrapper.findAll('tbody td')
    expect(bodyCells[1]?.classes()).toContain('vtg-text-center')
    expect(bodyCells[1]?.classes()).not.toContain('text-center')
    expect(bodyCells[2]?.classes()).toContain('vtg-text-right')
    expect(bodyCells[2]?.classes()).not.toContain('text-right')

    wrapper.unmount()
  })

  it('keeps bare align utilities in tailwind4 css mode', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: { rowKey: 'key', columns: alignColumns, dataSource },
      global: { plugins: [createVTableGuild({ cssMode: 'tailwind4' })] },
    })

    const headerCells = wrapper.findAll('thead th')
    expect(headerCells[1]?.classes()).toContain('text-center')
    expect(headerCells[1]?.classes()).not.toContain('vtg-text-center')
    expect(headerCells[2]?.classes()).toContain('text-right')

    const bodyCells = wrapper.findAll('tbody td')
    expect(bodyCells[1]?.classes()).toContain('text-center')
    expect(bodyCells[2]?.classes()).toContain('text-right')

    wrapper.unmount()
  })

  it('emits prefixed align utility on summary cells (prebuilt)', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: { rowKey: 'key', columns: alignColumns, dataSource },
      slots: {
        summary: () =>
          h(VTableSummary, null, () =>
            h(VTableSummary.Row, null, () =>
              h(VTableSummary.Cell, { index: 2, align: 'right' }, () => '99'),
            ),
          ),
      },
    })

    const summaryCell = wrapper.findAll('td').find((cell) => cell.text() === '99')
    expect(summaryCell).toBeDefined()
    expect(summaryCell?.classes()).toContain('vtg-text-right')
    expect(summaryCell?.classes()).not.toContain('text-right')

    wrapper.unmount()
  })

  it('prefixes element-plus preset classes injected into core sub-components', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [{ title: 'Name', key: 'name', dataIndex: 'name' }],
        dataSource,
        rowSelection: {},
      },
      global: { plugins: [createVTableGuild({ themePreset: 'element-plus' })] },
    })

    // ep checkbox 根元素独有 duration-[250ms]，antdv 默认主题为 duration-300
    expect(hasClassToken(wrapper.element, 'vtg-duration-[250ms]')).toBe(true)
    expect(hasClassToken(wrapper.element, 'duration-[250ms]')).toBe(false)

    wrapper.unmount()
  })

  it('prefixes antdv preset classes injected into core sub-components', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [{ title: 'Name', key: 'name', dataIndex: 'name' }],
        dataSource,
        rowSelection: {},
      },
    })

    expect(hasClassToken(wrapper.element, 'vtg-duration-300')).toBe(true)
    expect(hasClassToken(wrapper.element, 'duration-300')).toBe(false)

    wrapper.unmount()
  })

  it('keeps table width 100% when fixed columns exist without scroll.x', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name', width: 200 },
          { title: 'Action', key: 'action', width: 120, fixed: 'right' },
        ],
        dataSource,
      },
    })

    const table = wrapper.find('table')
    expect(table.attributes('style')).toContain('table-layout: fixed;')
    expect(table.attributes('style')).toContain('width: 100%;')
    expect(table.attributes('style')).not.toContain('max-content')

    wrapper.unmount()
  })

  it('uses scroll.x as table width with min-width 100%', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: alignColumns,
        dataSource,
        scroll: { x: 800 },
      },
    })

    const style = wrapper.find('table').attributes('style')
    expect(style).toContain('width: 800px;')
    expect(style).toContain('min-width: 100%;')

    wrapper.unmount()
  })

  it('honors scroll.x = max-content opt-in', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: alignColumns,
        dataSource,
        scroll: { x: 'max-content' },
      },
    })

    const style = wrapper.find('table').attributes('style')
    expect(style).toContain('width: max-content;')
    expect(style).toContain('min-width: 100%;')

    wrapper.unmount()
  })
})
