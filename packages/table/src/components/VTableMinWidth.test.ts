import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import VTableSummary from './VTableSummary'
import type { ColumnType } from '../types'

const columns: ColumnType[] = [
  { key: 'a', dataIndex: 'a', title: 'A', minWidth: 160, resizable: true },
  { key: 'b', dataIndex: 'b', title: 'B', width: 60, minWidth: 100 },
  { key: 'c', dataIndex: 'c', title: 'C', minWidth: 240, resizable: true },
]
const dataSource = [{ key: '1', a: 'a', b: 'b', c: 'c' }]

describe.each(['antdv', 'element-plus'] as const)('minWidth rendering / %s', (themePreset) => {
  it.each([
    ['without minima', false, undefined],
    ['with adjacent minima', true, undefined],
    ['with an action minimum', true, 100],
  ] as const)(
    'resizes the keyless leaf after a merged header %s',
    async (_case, hasMinima, minWidth) => {
      const wrapper = mount(VTable, {
        props: {
          columns: [
            {
              key: 'a',
              title: 'Merged',
              colSpan: 2,
              width: 100,
              minWidth: hasMinima ? 60 : undefined,
            },
            { title: 'Actions', resizable: true, width: 120, minWidth },
            {
              key: 'c',
              title: 'C',
              colSpan: 0,
              width: 100,
              minWidth: hasMinima ? 240 : undefined,
            },
          ],
          dataSource: [{ key: 'r1' }],
          pagination: false,
          tableLayout: 'fixed',
        },
        global: { plugins: [createVTableGuild({ themePreset })] },
      })
      try {
        const resizer = wrapper.findComponent({ name: 'ResizeHandle' })
        const header = wrapper.find('th[data-vtg-leaf-col="1"]')
        expect(resizer.props('colIndex')).toBe(1)
        expect(header.attributes('style')).toContain('width: 120px')
        expect(wrapper.find('th[data-vtg-leaf-col="0"]').attributes('style')).toContain(
          `width: ${hasMinima ? 220 : 100}px`,
        )

        await resizer.trigger('pointerdown', { clientX: 100 })
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 130 }))
        document.dispatchEvent(new PointerEvent('pointerup', { clientX: 130 }))
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('resizeColumn')?.[0]?.[1]).toBe(150)
        expect(wrapper.emitted('resizeColumn')?.[0]?.[0]).toMatchObject({ title: 'Actions' })
        expect(header.attributes('style')).toContain('width: 150px')
        expect(wrapper.find('td[data-vtg-col="1"]').attributes('style')).toContain('width: 150px')
        expect(wrapper.find('td[data-vtg-col="2"]').attributes('style')).toContain(
          `width: ${hasMinima ? 240 : 100}px`,
        )
        expect(wrapper.find('th[data-vtg-leaf-col="0"]').attributes('style')).toContain(
          `width: ${hasMinima ? 250 : 100}px`,
        )
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('keeps auto intrinsic and enforces every column despite custom width styles', async () => {
    const wrapper = mount(VTable, {
      props: {
        columns: columns.map((column) => ({
          ...column,
          customCell: () => ({ style: { width: '1px', minWidth: '0px' } }),
        })),
        dataSource,
        tableLayout: 'auto',
        pagination: false,
      },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      expect(wrapper.find('table').attributes('style')).toContain('table-layout: auto')
      expect(wrapper.findAll('[data-vtg-track]')).toHaveLength(3)
      expect(wrapper.find('td[data-vtg-col="1"]').attributes('style')).toContain('min-width: 100px')
      expect(wrapper.find('td[data-vtg-col="1"]').attributes('style')).toContain('width: 100px')
      const handle = wrapper.find('th[data-vtg-leaf-col="0"] .cursor-col-resize')
      // Preset class prefix is determined by the test environment; find ResizeHandle directly.
      const resizer = handle.exists() ? handle : wrapper.findComponent({ name: 'ResizeHandle' })
      await resizer.trigger('pointerdown', { clientX: 100 })
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 300 }))
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 300 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('resizeColumn')?.[0]?.[1]).toBe(360)
      expect(wrapper.find('td[data-vtg-col="1"]').attributes('style')).toContain('min-width: 100px')
      expect(wrapper.find('td[data-vtg-col="2"]').attributes('style')).toContain('min-width: 240px')
    } finally {
      wrapper.unmount()
    }
  })

  it('shares fixed pixels across split header, body, summary and virtual rows', () => {
    const wrapper = mount(VTable, {
      props: {
        columns,
        dataSource,
        tableLayout: 'fixed',
        scroll: { y: 200 },
        virtual: true,
        pagination: false,
      },
      slots: {
        summary: () =>
          h(
            VTableSummary,
            { fixed: 'bottom' },
            {
              default: () =>
                h(VTableSummary.Row, null, {
                  default: () =>
                    columns.map((_c, i) => h(VTableSummary.Cell, { index: i }, () => 'total')),
                }),
            },
          ),
      },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      const tables = wrapper.findAll('table[data-vtg-table]')
      expect(tables.length).toBeGreaterThan(1)
      for (const table of tables) expect(table.attributes('style')).toContain('width: 500px')
      for (const cell of wrapper.findAll('[data-vtg-col="1"], th[data-vtg-leaf-col="1"]')) {
        expect(cell.attributes('style')).toContain('width: 100px')
        expect(cell.attributes('class')).toContain('box-border')
      }
      expect(wrapper.find('tr[data-vtg-virtual-row]').exists()).toBe(true)
      expect(
        wrapper
          .find('tr[data-vtg-virtual-row]')
          .element.closest('table')
          ?.querySelector('colgroup'),
      ).toBeNull()
    } finally {
      wrapper.unmount()
    }
  })

  it('retains leaf tracks for headless empty tables and releases them when minima are removed', async () => {
    const wrapper = mount(VTable, {
      props: { columns, dataSource: [], showHeader: false, tableLayout: 'auto', pagination: false },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      expect(wrapper.findAll('[data-vtg-track]')).toHaveLength(3)
      expect(wrapper.find('table').attributes('style')).toContain('500px')
      await wrapper.setProps({
        columns: columns.map((column) => ({ ...column, minWidth: undefined })),
      })
      expect(wrapper.find('[data-vtg-width-row]').exists()).toBe(false)
      expect(wrapper.find('table').attributes('style')).not.toContain('min-width')
    } finally {
      wrapper.unmount()
    }
  })

  it('includes selection and expansion cells in virtual reference tracks', () => {
    const wrapper = mount(VTable, {
      props: {
        columns,
        dataSource,
        tableLayout: 'fixed',
        scroll: { y: 200 },
        virtual: true,
        pagination: false,
        rowSelection: { columnWidth: 48 },
        expandable: { columnWidth: 48, expandedRowRender: () => 'details' },
      },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      const row = wrapper.find('tr[data-vtg-virtual-row]')
      expect(row.findAll('td[data-vtg-col]')).toHaveLength(5)
      for (const index of [0, 1]) {
        expect(row.find(`[data-vtg-col="${index}"]`).attributes('style')).toContain('width: 48px')
      }
    } finally {
      wrapper.unmount()
    }
  })

  // 回归：hasStickyHeader（现 constrainedBody）曾把 showHeader 也算进「是否进入
  // 分离表体」的判定，于是 showHeader: false + 数字 scroll.y + 无 minWidth 时
  // 虚拟化被静默关闭，表体退回全量渲染。1 万行实测 DOM 节点 277 → 40217。
  it('keeps the virtual body when the header is hidden and no column has minWidth', () => {
    const rows = Array.from({ length: 500 }, (_, key) => ({
      key,
      a: `a${key}`,
      b: `b${key}`,
      c: `c${key}`,
    }))
    const bareColumns = columns.map(({ minWidth: _minWidth, ...rest }) => rest)

    const wrapper = mount(VTable, {
      props: {
        columns: bareColumns,
        dataSource: rows,
        scroll: { y: 200 },
        virtual: true,
        pagination: false,
        showHeader: false,
        rowHeight: 40,
      },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      // 表体行数远小于数据行数 —— 虚拟化真的在窗口化。
      expect(wrapper.findAll('tbody tr').length).toBeLessThan(30)
      expect(wrapper.find('tr[data-vtg-virtual-row]').exists()).toBe(true)
      expect(wrapper.find('.vtg-virtual-list-holder').exists()).toBe(true)
      // 表头确实没有渲染
      expect(wrapper.find('thead').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('still windows the virtual body when a hidden header is paired with minWidth', () => {
    const rows = Array.from({ length: 500 }, (_, key) => ({
      key,
      a: `a${key}`,
      b: `b${key}`,
      c: `c${key}`,
    }))

    const wrapper = mount(VTable, {
      props: {
        columns,
        dataSource: rows,
        scroll: { y: 200 },
        virtual: true,
        pagination: false,
        showHeader: false,
        rowHeight: 40,
      },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      expect(wrapper.findAll('tbody tr').length).toBeLessThan(30)
      expect(wrapper.find('thead').exists()).toBe(false)
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps sticky gated on a visible header', () => {
    // sticky 是与 showHeader 唯一相关的项：没有表头就无从粘附，仍走单表模式。
    const wrapper = mount(VTable, {
      props: {
        columns: columns.map(({ minWidth: _minWidth, ...rest }) => rest),
        dataSource,
        tableLayout: 'auto',
        sticky: true,
        showHeader: false,
        pagination: false,
      },
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    try {
      expect(wrapper.find('.vtg-virtual-list-holder').exists()).toBe(false)
      expect(wrapper.find('thead').exists()).toBe(false)
      expect(wrapper.findAll('table[data-vtg-table]').length).toBe(1)
    } finally {
      wrapper.unmount()
    }
  })
})
