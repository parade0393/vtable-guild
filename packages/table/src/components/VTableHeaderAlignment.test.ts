import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import type { ColumnGroupType, ColumnType } from '../types'

interface Row extends Record<string, unknown> {
  key: number
  score: number
}

const rows: Row[] = [
  { key: 1, score: 30 },
  { key: 2, score: 10 },
  { key: 3, score: 20 },
]
const wrappers: VueWrapper[] = []
const title = 'Long sortable and filterable header'
type FilterIconKind = 'default' | 'column' | 'slot'

function column(icon: FilterIconKind): ColumnType<Row> {
  return {
    key: 'score',
    dataIndex: 'score',
    title,
    align: 'center',
    width: 160,
    ellipsis: true,
    sorter: (a, b) => a.score - b.score,
    filters: [{ text: 'At least 20', value: 20 }],
    onFilter: (value, row) => row.score >= Number(value),
    ...(icon === 'column' ? { filterIcon: () => h('span', 'Custom filter') } : {}),
  }
}

function bodyValues(wrapper: VueWrapper) {
  return wrapper.findAll('tbody td').map((cell) => cell.text())
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe.each(['antdv', 'element-plus'] as const)('%s header content alignment', (preset) => {
  it.each(['default', 'column', 'slot'] as const)(
    'keeps %s filter controls independent from sorting with ellipsis and tooltip',
    async (icon) => {
      const wrapper = mount(VTable<Row>, {
        attachTo: document.body,
        props: {
          rowKey: 'key',
          columns: [column(icon)],
          dataSource: rows,
          pagination: false,
          headerEllipsis: true,
          showSorterTooltip: true,
        },
        slots: icon === 'slot' ? { customFilterIcon: () => h('span', 'Custom filter') } : {},
        global: { plugins: [createVTableGuild({ themePreset: preset })] },
      })
      wrappers.push(wrapper)

      const header = wrapper.get('thead th')
      await header.trigger('mouseenter')
      expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('点击升序')

      const filter = header.get('[aria-label="筛选"]')
      // 默认图标有单独的定位外层；自定义图标直接由可点击节点承担定位。
      const filterArea = filter.element.closest('[data-align]')
      expect(filterArea?.getAttribute('data-align')).toBe('center')
      filterArea!.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

      await filter.trigger('click')
      expect(header.attributes('aria-sort')).toBeUndefined()
      expect(wrapper.emitted('change')).toBeUndefined()

      const option = Array.from(document.body.querySelectorAll('li')).find((item) =>
        item.textContent?.includes('At least 20'),
      )
      expect(option).toBeDefined()
      ;(option!.firstElementChild ?? option!).dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      await nextTick()
      const confirm = Array.from(document.body.querySelectorAll('button')).find((button) =>
        button.textContent?.includes(preset === 'element-plus' ? '筛选' : '确'),
      )
      expect(confirm).toBeDefined()
      confirm!.click()
      await nextTick()

      expect(bodyValues(wrapper)).toEqual(['30', '20'])
      expect(wrapper.emitted('change')).toHaveLength(1)
      expect(wrapper.emitted('change')![0][2]).toMatchObject({ action: 'filter' })

      await header.trigger('click')
      expect(header.attributes('aria-sort')).toBe('ascending')
      expect(bodyValues(wrapper)).toEqual(['20', '30'])
      expect(wrapper.emitted('change')).toHaveLength(2)
      expect(wrapper.emitted('change')![1][2]).toMatchObject({ action: 'sort' })

      // 关闭 Tooltip 会切换中间 DOM 结构，排序状态和整组对齐仍应保留。
      await wrapper.setProps({ showSorterTooltip: false })
      await header.trigger('mouseenter')
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
      await header.trigger('click')
      expect(header.attributes('aria-sort')).toBe('descending')
      expect(bodyValues(wrapper)).toEqual(['30', '20'])
    },
  )

  it.each(['default', 'column', 'slot'] as const)(
    'updates %s filter, title and sorter alignment when column alignment changes',
    async (icon) => {
      const score = column(icon)
      const wrapper = mount(VTable<Row>, {
        props: { columns: [score], dataSource: rows, pagination: false },
        slots: icon === 'slot' ? { customFilterIcon: () => h('span', 'Custom filter') } : {},
        global: { plugins: [createVTableGuild({ themePreset: preset })] },
      })
      wrappers.push(wrapper)

      // 每层都有自己的主题槽；不能只更新 th 的 text-align，漏掉中间 wrapper。
      for (const align of ['center', 'right', 'left'] as const) {
        await wrapper.setProps({ columns: [{ ...score, align }] })
        const alignedNodes = wrapper.findAll('thead th [data-align]')
        expect(alignedNodes).toHaveLength(5)
        expect(alignedNodes.every((node) => node.attributes('data-align') === align)).toBe(true)
      }
    },
  )

  it('uses each grouped header alignment independently from its leaf columns', async () => {
    const group: ColumnGroupType<Row> = {
      title: 'Score group',
      align: 'center',
      children: [{ ...column('default'), align: 'left' }],
    }
    const wrapper = mount(VTable<Row>, {
      props: { columns: [group], dataSource: rows, pagination: false },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)

    const headers = wrapper.findAll('thead th')
    expect(headers[0]!.findAll('[data-align]')).toHaveLength(4)
    expect(headers[1]!.findAll('[data-align]')).toHaveLength(5)
    expect(
      headers[0]!
        .findAll('[data-align]')
        .every((node) => node.attributes('data-align') === 'center'),
    ).toBe(true)
    expect(
      headers[1]!.findAll('[data-align]').every((node) => node.attributes('data-align') === 'left'),
    ).toBe(true)

    await wrapper.setProps({ columns: [{ ...group, align: 'right' }] })
    expect(
      headers[0]!
        .findAll('[data-align]')
        .every((node) => node.attributes('data-align') === 'right'),
    ).toBe(true)
    expect(
      headers[1]!.findAll('[data-align]').every((node) => node.attributes('data-align') === 'left'),
    ).toBe(true)
  })
})
