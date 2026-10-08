import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { nextTick, h, cloneVNode, isVNode, reactive, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import { paginationEnUS, elementPlusPaginationEnUS } from '@vtable-guild/theme'
import TablePagination, { paginationItems, elementPlusPaginationItems } from './TablePagination'
import VTable from './VTable.vue'
import { SELECTION_ALL } from '../constants'
import type { TablePaginationConfig, TableProps } from '../types'
import { resetDevWarnedForTest } from '../../../core/src/utils/devWarn'

const wrappers: VueWrapper[] = []
afterEach(() => {
  vi.restoreAllMocks()
  resetDevWarnedForTest()
  wrappers.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
})
const rows = Array.from({ length: 35 }, (_, i) => ({ key: i + 1, name: `Row ${i + 1}` }))
function table(props: Partial<TableProps<(typeof rows)[number]>> = {}) {
  const w = mount(VTable<(typeof rows)[number]>, {
    attachTo: document.body,
    props: {
      columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
      dataSource: rows,
      rowKey: 'key',
      locale: 'en-US',
      ...props,
    },
  })
  wrappers.push(w)
  return w
}
function pager(
  config: TablePaginationConfig = {},
  themePreset: 'antdv' | 'element-plus' = 'antdv',
) {
  const w = mount(TablePagination, {
    attachTo: document.body,
    props: {
      config,
      state: { current: 3, pageSize: 10, total: 200 },
      locale: themePreset === 'element-plus' ? elementPlusPaginationEnUS : paginationEnUS,
    },
    global: { plugins: [createVTableGuild({ themePreset, locale: 'en-US' })] },
  })
  wrappers.push(w)
  return w
}
function numericPages(w: VueWrapper | DOMWrapper<Element>) {
  return w.findAll('button[title]').flatMap((button) => {
    const title = button.attributes('title') ?? ''
    return /^\d+$/.test(title) ? [Number(title)] : []
  })
}

const pagerCountWindows = [
  {
    count: 5,
    first: [1, 2, 3, 4, 50],
    middle: [1, 24, 25, 26, 50],
    last: [1, 47, 48, 49, 50],
  },
  {
    count: 7,
    first: [1, 2, 3, 4, 5, 6, 50],
    middle: [1, 23, 24, 25, 26, 27, 50],
    last: [1, 45, 46, 47, 48, 49, 50],
  },
  {
    count: 9,
    first: [1, 2, 3, 4, 5, 6, 7, 8, 50],
    middle: [1, 22, 23, 24, 25, 26, 27, 28, 50],
    last: [1, 43, 44, 45, 46, 47, 48, 49, 50],
  },
  {
    count: 21,
    first: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 50],
    middle: [1, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 50],
    last: [1, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
  },
]

describe('table pagination integration', () => {
  it.each(['antdv', 'element-plus'] as const)(
    'updates %s pager windows reactively without changing rows or emitting pagination events',
    async (themePreset) => {
      const onChange = vi.fn()
      const onShowSizeChange = vi.fn()
      const pagination = reactive({
        defaultCurrent: 3,
        pageSize: 1,
        position: ['topLeft', 'bottomRight'] as TablePaginationConfig['position'],
        showLessItems: true,
        pagerCount: 9,
        onChange,
        onShowSizeChange,
      })
      const w = mount(VTable<(typeof rows)[number]>, {
        props: {
          columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
          dataSource: rows,
          rowKey: 'key',
          pagination,
        },
        global: { plugins: [createVTableGuild({ themePreset, locale: 'en-US' })] },
      })
      wrappers.push(w)
      const assertWindow = (expected: number[]) => {
        expect(w.findAll('nav')).toHaveLength(2)
        for (const nav of w.findAll('nav')) expect(numericPages(nav)).toEqual(expected)
        expect(w.findAll('[aria-current="page"]').map((node) => node.text())).toEqual(['3', '3'])
        expect(w.findAll('tbody tr').map((row) => row.text())).toEqual(['Row 3'])
        expect(onChange).not.toHaveBeenCalled()
        expect(onShowSizeChange).not.toHaveBeenCalled()
        expect(w.emitted('change')).toBeUndefined()
      }
      assertWindow([1, 2, 3, 4, 5, 6, 7, 8, 35])
      pagination.pagerCount = 5
      await nextTick()
      assertWindow([1, 2, 3, 4, 35])
      pagination.showLessItems = false
      await nextTick()
      assertWindow([1, 2, 3, 4, 35])
      await w.setProps({ pagination: { ...pagination, pagerCount: 21 } })
      assertWindow([...Array.from({ length: 20 }, (_, index) => index + 1), 35])
      await w.setProps({ pagination: { ...pagination, pagerCount: undefined } })
      assertWindow(themePreset === 'antdv' ? [1, 2, 3, 4, 5, 35] : [1, 2, 3, 4, 5, 6, 35])
      await w.setProps({
        pagination: { ...pagination, pagerCount: undefined, showLessItems: true },
      })
      assertWindow([1, 2, 3, 4, 35])
    },
  )

  describe.each(['antdv', 'element-plus'] as const)('%s pagerCount locales', (themePreset) => {
    it.each([
      { locale: 'en-US', previous: 'Previous 7 pages', next: 'Next 7 pages' },
      { locale: 'zh-CN', previous: '向前 7 页', next: '向后 7 页' },
    ])(
      'keeps $locale jump titles and destinations consistent',
      async ({ locale, previous, next }) => {
        const onChange = vi.fn()
        const w = mount(VTable<(typeof rows)[number]>, {
          props: {
            columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
            dataSource: rows,
            rowKey: 'key',
            pagination: { defaultCurrent: 18, pageSize: 1, pagerCount: 9, onChange },
          },
          global: { plugins: [createVTableGuild({ themePreset, locale })] },
        })
        wrappers.push(w)
        expect(w.get(`[aria-label="${previous}"]`).attributes('title')).toBe(previous)
        expect(w.get(`[aria-label="${next}"]`).attributes('title')).toBe(next)
        await w.get(`[aria-label="${previous}"]`).trigger('click')
        expect(onChange).toHaveBeenLastCalledWith(11, 1)
        expect(w.findAll('tbody tr')[0]!.text()).toBe('Row 11')
        await w.get(`[aria-label="${next}"]`).trigger('click')
        expect(onChange).toHaveBeenLastCalledWith(18, 1)
        expect(w.findAll('tbody tr')[0]!.text()).toBe('Row 18')
        expect(w.emitted('change')).toHaveLength(2)
      },
    )
  })

  it('keeps legacy sort events free of pagination and preserves unpaginated scroll', async () => {
    const w = table({ columns: [{ key: 'name', dataIndex: 'name', title: 'Name', sorter: true }] })
    const body = w
      .findComponent({ name: 'VScrollbar' })
      .vm.$el.querySelector('.vtg-overflow-auto') as HTMLElement
    if (body) body.scrollTop = 20
    await w.get('th').trigger('click')
    expect(w.emitted('change')![0]).toHaveLength(3)
    expect(w.emitted('change')![0]![2]).not.toHaveProperty('pagination')
    if (body) expect(body.scrollTop).toBe(20)
  })
  it('retains page on sorting and resets it on a filter with a single action', async () => {
    const onChange = vi.fn()
    const w = table({
      pagination: { defaultCurrent: 3, onChange },
      columns: [
        {
          key: 'name',
          dataIndex: 'name',
          title: 'Name',
          sorter: (a, b) => b.key - a.key,
          filters: [{ text: 'Even', value: 'even' }],
          onFilter: (_value, record) => record.key % 2 === 0,
        },
      ],
    })
    await w.get('th').trigger('click')
    expect(w.emitted('change')![0]![2]).toMatchObject({
      action: 'sort',
      pagination: { current: 3 },
    })
    expect(w.find('tbody').text()).toContain('Row 15')
    await w.get('[aria-label="Filter"]').trigger('click')
    const option = [...document.body.querySelectorAll('li')].find((node) =>
      node.textContent?.includes('Even'),
    )!
    ;(option.firstElementChild ?? option).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    const confirm = [...document.body.querySelectorAll('button')].find(
      (node) => node.textContent === 'OK',
    )!
    confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(w.emitted('change')).toHaveLength(2)
    expect(w.emitted('change')![1]![2]).toMatchObject({
      action: 'filter',
      pagination: { current: 1, total: 17 },
    })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1, 10)
    expect(w.find('tbody').text()).toContain('Row 34')
  })
  it.each([
    'topLeft',
    'topCenter',
    'topRight',
    'bottomLeft',
    'bottomCenter',
    'bottomRight',
  ] as const)('supports %s outside the table scroll wrapper', (position) => {
    const w = table({ pagination: { position: [position] } })
    expect(w.findAll('nav')).toHaveLength(1)
    expect(w.get('nav').element.parentElement).toBe(w.element)
    expect(w.get('nav').classes()).toContain(
      `vtg-justify-${position.endsWith('Left') ? 'start' : position.endsWith('Center') ? 'center' : 'end'}`,
    )
  })
  it('resets only vertical scroll, with an explicit opt out', async () => {
    const w = table({ pagination: {}, scroll: { y: 200 } })
    const body = w
      .findComponent({ name: 'VScrollbar' })
      .vm.$el.querySelector('.vtg-overflow-auto') as HTMLElement
    body.scrollTop = 40
    body.scrollLeft = 30
    await w.get('button[aria-label="Page 2"]').trigger('click')
    await nextTick()
    expect(body.scrollTop).toBe(0)
    expect(body.scrollLeft).toBe(30)
    await w.setProps({ scroll: { y: 200, scrollToFirstRowOnChange: false } })
    body.scrollTop = 40
    await w.get('button[aria-label="Page 3"]').trigger('click')
    expect(body.scrollTop).toBe(40)
  })
  it('drags page rows while returning the full input data', async () => {
    const w = table({ pagination: { defaultCurrent: 2 }, rowDraggable: true })
    const bodyRows = w.findAll('tbody tr')
    const transfer = { setData: vi.fn(), effectAllowed: 'move', dropEffect: 'move' }
    vi.spyOn(bodyRows[2]!.element, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 100, 100),
    )
    await bodyRows[0]!.trigger('dragstart', { dataTransfer: transfer })
    await bodyRows[2]!.trigger('dragover', { dataTransfer: transfer, clientY: 10 })
    await bodyRows[2]!.trigger('drop', { dataTransfer: transfer })
    const result = w.emitted('rowDragEnd')![0]![0] as typeof rows
    expect(result).toHaveLength(35)
    expect(result.slice(0, 10)).toEqual(rows.slice(0, 10))
    expect(result.slice(10, 13).map((row) => row.key)).toEqual([12, 11, 13])
  })
  it('selects tree descendants independently with strict selection', async () => {
    const onChange = vi.fn()
    const dataSource = [
      { key: 1, name: 'Parent', children: [{ key: 101, name: 'Child' }] },
      { key: 2, name: 'Other' },
    ]
    const w = table({
      dataSource,
      pagination: { pageSize: 1 },
      defaultExpandAllRows: true,
      rowSelection: { onChange },
    })
    await w.findAll('tbody [role="checkbox"]')[1]!.trigger('click')
    expect(onChange.mock.lastCall).toEqual([[101], [dataSource[0]!.children![0]]])
  })
  it('initializes remote expanded detail rows when data first arrives and on later pages', async () => {
    const w = table({
      dataSource: [],
      pagination: { current: 1, pageSize: 1, total: 35 },
      expandable: {
        defaultExpandAllRows: true,
        expandedRowRender: (record) => `Details ${record.key}`,
      },
    })
    await w.setProps({ dataSource: [rows[0]!] })
    expect(w.find('tbody').text()).toContain('Details 1')
    await w.setProps({ dataSource: [rows[1]!], pagination: { current: 2, pageSize: 1, total: 35 } })
    expect(w.find('tbody').text()).toContain('Details 2')
  })
  it('does not paginate unless explicitly enabled and preserves the three-argument event', async () => {
    const w = table()
    expect(w.findAll('tbody tr')).toHaveLength(35)
    expect(w.find('nav').exists()).toBe(false)
    await w.setProps({ pagination: {} })
    expect(w.findAll('tbody tr')).toHaveLength(10)
    await w.get('button[aria-label="Page 2"]').trigger('click')
    expect(w.findAll('tbody tr')[0]!.text()).toBe('Row 11')
    const args = w.emitted('change')![0]!
    expect(args).toHaveLength(3)
    expect(args[2]).toMatchObject({
      action: 'paginate',
      pagination: { current: 2, pageSize: 10, total: 35 },
      currentDataSource: rows,
    })
    await w.setProps({ pagination: false })
    expect(w.findAll('tbody tr')).toHaveLength(35)
  })
  it('keeps both pagers synchronized without duplicate changes', async () => {
    const onChange = vi.fn()
    const w = table({ pagination: { position: ['topLeft', 'topRight', 'bottomCenter'], onChange } })
    expect(w.findAll('nav')).toHaveLength(2)
    await w.findAll('button[aria-label="Page 2"]')[0]!.trigger('click')
    expect(w.findAll('[aria-current="page"]').map((node) => node.text())).toEqual(['2', '2'])
    expect(onChange).toHaveBeenCalledOnce()
    expect(w.emitted('change')).toHaveLength(1)
  })
  it('hides UI independently of data slicing', async () => {
    const w = table({ pagination: { position: ['none'] } })
    expect(w.find('nav').exists()).toBe(false)
    expect(w.findAll('tbody tr')).toHaveLength(10)
    await w.setProps({ pagination: { hideOnSinglePage: true, pageSize: 100 } })
    expect(w.find('nav').exists()).toBe(false)
  })
  it('selects only the current page, retaining selections on another page', async () => {
    const onChange = vi.fn()
    const w = table({ pagination: {}, rowSelection: { onChange } })
    await w.get('thead [role="checkbox"]').trigger('click')
    expect(onChange.mock.lastCall?.[0]).toEqual(rows.slice(0, 10).map((r) => r.key))
    await w.get('button[aria-label="Page 2"]').trigger('click')
    expect(w.get('thead [role="checkbox"]').attributes('aria-checked')).toBe('false')
    await w.get('thead [role="checkbox"]').trigger('click')
    expect(onChange.mock.lastCall?.[0]).toHaveLength(20)
  })
  it('preserves selected records across remote pages', async () => {
    const onChange = vi.fn()
    const w = table({
      dataSource: rows.slice(0, 10),
      pagination: { current: 1, total: 35 },
      rowSelection: { preserveSelectedRowKeys: true, onChange },
    })
    await w.get('tbody [role="checkbox"]').trigger('click')
    await w.setProps({ dataSource: rows.slice(10, 20), pagination: { current: 2, total: 35 } })
    await w.get('tbody [role="checkbox"]').trigger('click')
    expect(onChange.mock.lastCall?.[1]).toEqual(expect.arrayContaining([rows[0], rows[10]]))
  })
  describe.each(['antdv', 'element-plus'] as const)('%s selection menus', (themePreset) => {
    it.each(['mousedown', 'touchstart'])(
      'keeps the menu open for %s on the arrow and closes it outside',
      async (eventType) => {
        const w = mount(VTable, {
          attachTo: document.body,
          props: {
            columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
            dataSource: rows,
            rowKey: 'key',
            pagination: {},
            rowSelection: { selections: true },
          },
          global: { plugins: [createVTableGuild({ themePreset, locale: 'en-US' })] },
        })
        wrappers.push(w)
        const trigger = w.get('[aria-label="Selection options"]')
        const getItem = () =>
          [...document.body.querySelectorAll('li')].find(
            (node) => node.textContent === 'Select all data',
          )

        await trigger.trigger('mouseenter')
        expect(getItem()).toBeDefined()
        // The actual pointer target is the nested icon, not the trigger span.
        await trigger.get('svg').trigger(eventType)
        await trigger.get('svg').trigger('click')
        expect(getItem()).toBeDefined()
        expect(w.get('thead [role="checkbox"]').attributes('aria-checked')).toBe('false')

        getItem()!.dispatchEvent(new Event(eventType, { bubbles: true }))
        await nextTick()
        expect(getItem()).toBeDefined()

        document.body.dispatchEvent(new Event(eventType, { bubbles: true }))
        await nextTick()
        expect(getItem()).toBeUndefined()
      },
    )
    it.each([
      { locale: 'zh-CN', text: '全选所有', selections: true as const },
      { locale: 'en-US', text: 'Select all data', selections: [SELECTION_ALL] },
    ])('labels the all-loaded action in $locale', async ({ locale, text, selections }) => {
      const onChange = vi.fn()
      const w = mount(VTable, {
        attachTo: document.body,
        props: {
          columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
          dataSource: rows,
          rowKey: 'key',
          pagination: {},
          rowSelection: { selections, onChange },
        },
        global: { plugins: [createVTableGuild({ themePreset, locale })] },
      })
      wrappers.push(w)
      await w.get('thead [role="checkbox"]').trigger('click')
      expect(onChange.mock.lastCall?.[0]).toHaveLength(10)
      await w.get('[aria-label="Selection options"]').trigger('mouseenter')
      const item = [...document.body.querySelectorAll('li')].find(
        (node) => node.textContent === text,
      )!
      expect(item).toBeDefined()
      item.click()
      expect(onChange.mock.lastCall?.[0]).toEqual(rows.map((row) => row.key))
      expect(onChange.mock.lastCall?.[1]).toEqual(rows)
    })
  })
  it('paginates root records before tree expansion and retains collapse state', async () => {
    const dataSource = rows
      .slice(0, 3)
      .map((r) => ({ ...r, children: [{ key: r.key + 100, name: `Child ${r.key}` }] }))
    const w = table({ dataSource, pagination: { pageSize: 1 }, defaultExpandAllRows: true })
    expect(w.findAll('tbody tr')).toHaveLength(2)
    await w.get('button[aria-label="Page 2"]').trigger('click')
    expect(w.find('tbody').text()).toContain('Child 2')
    expect(w.find('tbody').text()).not.toContain('Child 1')
  })
  it('renders the current page for title/footer and keeps sorting before slicing', async () => {
    const w = table({
      pagination: { defaultCurrent: 2 },
      title: (data) => data[0]?.name,
      columns: [
        {
          key: 'name',
          dataIndex: 'name',
          title: 'Name',
          sorter: (a, b) => b.key - a.key,
          defaultSortOrder: 'ascend',
        },
      ],
    })
    expect(w.findAll('tbody tr')[0]!.text()).toBe('Row 25')
    expect(w.text()).toContain('Row 25')
  })
  it.each(['antdv', 'element-plus'] as const)(
    'supports %s and global/instance locales',
    (themePreset) => {
      const w = mount(VTable, {
        props: {
          columns: [],
          dataSource: rows,
          pagination: { locale: { navigation: 'Local pager' } },
        },
        global: { plugins: [createVTableGuild({ themePreset, locale: 'en-US' })] },
      })
      wrappers.push(w)
      expect(w.get('nav').attributes('aria-label')).toBe('Local pager')
    },
  )
  it('updates pagination behavior and locale when the table preset changes', async () => {
    const preset = ref<'antdv' | 'element-plus'>('antdv')
    const w = mount(VTable, {
      props: {
        columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
        dataSource: rows.slice(0, 10),
        locale: 'en-US',
        size: 'middle',
        pagination: { total: 200, showQuickJumper: true },
      },
      global: {
        provide: {
          [VTABLE_GUILD_INJECTION_KEY as symbol]: {
            get themePreset() {
              return preset.value
            },
            cssMode: 'tailwind4',
            theme: {},
            locale: 'en-US',
            locales: {},
            localeOverrides: {},
          },
        },
      },
    })
    wrappers.push(w)
    expect(w.find('[aria-label="Page 6"]').exists()).toBe(false)
    expect(w.get('input').element.value).toBe('')
    preset.value = 'element-plus'
    await nextTick()
    expect(w.find('[aria-label="Page 6"]').exists()).toBe(true)
    expect(w.get('input').element.value).toBe('1')
    expect(w.find('[aria-label="Go to previous page"]').exists()).toBe(true)
    expect(
      w
        .get('nav')
        .classes()
        .some((c) => c.includes('--vtg-pagination-size:')),
    ).toBe(false)
    await w.setProps({ locale: 'zh-CN' })
    expect(w.find('[aria-label="前往"]').exists()).toBe(true)
    await w.setProps({
      pagination: {
        total: 200,
        showQuickJumper: true,
        locale: { jump_to: '定位', page: '自定义页' },
      },
    })
    expect(w.find('[aria-label="定位"]').exists()).toBe(true)
    expect(w.get('nav').text()).toContain('自定义页')
  })
})
describe('pagination controls', () => {
  describe.each(['antdv', 'element-plus'] as const)('%s pagerCount', (themePreset) => {
    it('preserves the original default and compact windows when pagerCount is omitted', async () => {
      const w = pager({}, themePreset)
      await w.setProps({ state: { current: 1, pageSize: 10, total: 200 } })
      expect(numericPages(w)).toEqual(
        themePreset === 'antdv' ? [1, 2, 3, 4, 5, 20] : [1, 2, 3, 4, 5, 6, 20],
      )
      await w.setProps({ config: { showLessItems: true } })
      expect(numericPages(w)).toEqual(themePreset === 'antdv' ? [1, 2, 3, 20] : [1, 2, 3, 4, 20])
      await w.setProps({ config: { showLessItems: false } })
      expect(numericPages(w)).toEqual(
        themePreset === 'antdv' ? [1, 2, 3, 4, 5, 20] : [1, 2, 3, 4, 5, 6, 20],
      )
      expect(w.emitted('change')).toBeUndefined()
    })
    it.each(pagerCountWindows)(
      'uses $count numeric page buttons at the first, middle and last pages',
      async ({ count, first, middle, last }) => {
        const w = pager({ pagerCount: count, showLessItems: true }, themePreset)
        for (const [current, expected] of [
          [1, first],
          [25, middle],
          [50, last],
        ] as const) {
          await w.setProps({ state: { current, pageSize: 10, total: 500 } })
          expect(numericPages(w)).toEqual(expected)
          expect(w.get('[aria-current="page"]').text()).toBe(String(current))
        }
        await w.setProps({ state: { current: 2, pageSize: 10, total: 40 } })
        expect(numericPages(w)).toEqual([1, 2, 3, 4])
        expect(w.find('[aria-label^="Previous "][aria-label$=" pages"]').exists()).toBe(false)
        expect(w.find('[aria-label^="Next "][aria-label$=" pages"]').exists()).toBe(false)
      },
    )

    it.each([0, 4, 6, 22, -1, 5.5, NaN, Infinity, '9'])(
      'falls back to the original preset window for invalid pagerCount %s and warns only once',
      async (invalidCount) => {
        resetDevWarnedForTest()
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const config = { pagerCount: invalidCount as number }
        const w = pager(config, themePreset)
        expect(numericPages(w)).toEqual(
          themePreset === 'antdv' ? [1, 2, 3, 4, 5, 20] : [1, 2, 3, 4, 5, 6, 20],
        )
        expect(warn).toHaveBeenCalledExactlyOnceWith(
          expect.stringContaining('pagination.pagerCount must be an odd integer from 5 to 21'),
        )
        await w.setProps({ config: { ...config, showLessItems: true } })
        expect(numericPages(w)).toEqual([1, 2, 3, 4, 20])
        expect(warn).toHaveBeenCalledOnce()
        expect(w.emitted('change')).toBeUndefined()
      },
    )

    it('respects legacy jump labels for 3/5 pages and custom templates for other counts', async () => {
      const w = pager({ pagerCount: 5 }, themePreset)
      await w.setProps({
        state: { current: 25, pageSize: 10, total: 500 },
        locale: {
          ...paginationEnUS,
          prev_3: 'Back three',
          next_3: 'Forward three',
          prev_5: 'Back five',
          next_5: 'Forward five',
          prev_pages: 'Back {count} / {count}',
          next_pages: 'Forward {count}',
        },
      })
      const checkJump = async (label: string, target: number) => {
        const control = w.get(`[aria-label="${label}"]`)
        expect(control.attributes('title')).toBe(label)
        await control.trigger('click')
        expect(w.emitted('change')!.at(-1)).toEqual([target])
      }
      await checkJump('Back three', 22)
      await checkJump('Forward three', 28)
      await w.setProps({ config: { pagerCount: 7 } })
      await checkJump('Back five', 20)
      await checkJump('Forward five', 30)
      await w.setProps({ config: { pagerCount: 9 } })
      await checkJump('Back 7 / 7', 18)
      await checkJump('Forward 7', 32)
      await w.setProps({ config: { pagerCount: 21 } })
      await checkJump('Back 19 / 19', 6)
      await checkJump('Forward 19', 44)
    })

    it('uses built-in templates when a complete legacy locale omits the optional templates', async () => {
      const w = pager({ pagerCount: 9 }, themePreset)
      const { prev_pages: _prevPages, next_pages: _nextPages, ...legacyLocale } = paginationEnUS
      await w.setProps({
        state: { current: 25, pageSize: 10, total: 500 },
        locale: legacyLocale,
      })
      const previous = w.get('[aria-label="Previous 7 pages"]')
      const next = w.get('[aria-label="Next 7 pages"]')
      expect(previous.attributes('title')).toBe('Previous 7 pages')
      expect(next.attributes('title')).toBe('Next 7 pages')
      await previous.trigger('click')
      await next.trigger('click')
      expect(w.emitted('change')).toEqual([[18], [32]])
    })

    it('ignores pagerCount and showLessItems in simple mode', async () => {
      const w = pager({ simple: true, pagerCount: 5, showLessItems: true }, themePreset)
      const initial = w.html()
      await w.setProps({ config: { simple: true, pagerCount: 21, showLessItems: false } })
      expect(w.html()).toBe(initial)
      await w.setProps({ config: { simple: true } })
      expect(w.html()).toBe(initial)
      expect(w.findAll('button')).toHaveLength(2)
      expect(w.get('input').element.value).toBe('3')
      expect(w.emitted('change')).toBeUndefined()
    })
  })

  it('keeps every supported window bounded, ordered and free of duplicate or unmarked gaps', () => {
    for (let count = 5; count <= 21; count += 2) {
      for (const pages of [1, count - 1, count, count + 1, count + 2, 50, 1000000]) {
        const currents =
          pages <= 50
            ? Array.from({ length: pages }, (_, index) => index + 1)
            : [1, 2, 25, 50000, pages - 1, pages]
        for (const current of currents) {
          const items = elementPlusPaginationItems(current, pages, count)
          const numeric = items.filter((item) => item.type === 'page').map((item) => item.page)
          expect(numeric).toEqual([...new Set(numeric)].sort((a, b) => a - b))
          expect(numeric).toContain(current)
          expect(numeric[0]).toBe(1)
          expect(numeric.at(-1)).toBe(pages)
          expect(numeric).toHaveLength(Math.min(pages, count))
          expect(items.length).toBeLessThanOrEqual(count + 2)
          for (let index = 1; index < items.length; index++) {
            const previous = items[index - 1]!
            const item = items[index]!
            if (previous.type === 'page' && item.type === 'page')
              expect(item.page).toBe(previous.page + 1)
            if (item.type === 'jump-prev') expect(item.page).toBe(Math.max(1, current - count + 2))
            if (item.type === 'jump-next')
              expect(item.page).toBe(Math.min(pages, current + count - 2))
          }
        }
      }
    }
  })

  it('matches Element Plus page windows at the first, middle and last pages', async () => {
    const pages = (current: number, count = 7) =>
      elementPlusPaginationItems(current, 20, count).map(({ page, type }) =>
        type === 'page' ? page : type,
      )
    expect(pages(1)).toEqual([1, 2, 3, 4, 5, 6, 'jump-next', 20])
    expect(pages(4)).toEqual(pages(1))
    expect(pages(5)).toEqual([1, 'jump-prev', 3, 4, 5, 6, 7, 'jump-next', 20])
    expect(pages(17)).toEqual([1, 'jump-prev', 15, 16, 17, 18, 19, 20])
    expect(pages(3, 5)).toEqual([1, 2, 3, 4, 'jump-next', 20])
    expect(elementPlusPaginationItems(1, 1)).toEqual([{ page: 1, type: 'page' }])
    expect(elementPlusPaginationItems(1, 7)).toHaveLength(7)
    expect(elementPlusPaginationItems(50000, 1000000)).toHaveLength(9)
    const w = pager({ showLessItems: true }, 'element-plus')
    await w.get('[aria-label="Next 3 pages"]').trigger('click')
    expect(w.emitted('change')).toEqual([[6]])
  })
  it('uses native Element Plus jump input while retaining Ant configuration defaults', async () => {
    const w = pager({ showQuickJumper: true }, 'element-plus')
    expect(w.get('input').element.value).toBe('3')
    expect(w.text()).not.toContain('Total')
    expect(w.text()).not.toContain('Page')
    await w.get('[aria-current="page"]').trigger('click')
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('change')).toBeUndefined()
    await w.get('input').setValue('8.9')
    await w.get('input').trigger('blur')
    expect(w.emitted('change')).toEqual([[8]])
    expect(w.get('input').element.value).toBe('3')
    await w.setProps({ state: { current: 8, pageSize: 10, total: 200 } })
    expect(w.get('input').element.value).toBe('8')
    await w.get('input').setValue('999')
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('change')!.at(-1)).toEqual([20])
    await w.get('[aria-haspopup="listbox"]').trigger('click')
    expect(
      [...document.body.querySelectorAll('[role="option"]')].map((node) => node.textContent),
    ).toEqual(['10/page', '20/page', '50/page', '100/page'])
    expect(document.body.querySelector('[role="listbox"]')?.getAttribute('data-vtg-preset')).toBe(
      'element-plus',
    )
    await w.setProps({ config: { disabled: true, showQuickJumper: true } })
    expect(document.body.querySelector('[role="listbox"]')).toBeNull()
    expect(w.get('input').attributes('disabled')).toBeDefined()
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('change')).toHaveLength(2)
  })
  it.each(['antdv', 'element-plus'] as const)(
    'keeps %s visibility defaults and simple extensions',
    async (preset) => {
      const w = pager({}, preset)
      expect(w.find('input').exists()).toBe(false)
      expect(w.find('[aria-haspopup="listbox"]').exists()).toBe(true)
      await w.setProps({ state: { current: 1, pageSize: 10, total: 50 } })
      expect(w.find('[aria-haspopup="listbox"]').exists()).toBe(false)
      await w.setProps({
        config: {
          simple: true,
          showTotal: () => 'Total',
          showSizeChanger: true,
          showQuickJumper: { goButton: 'Go' },
        },
      })
      expect(w.text()).not.toContain('Total')
      expect(w.find('[aria-haspopup="listbox"]').exists()).toBe(false)
      await w.get('input').setValue('3')
      await w
        .findAll('button')
        .find((button) => button.text() === 'Go')!
        .trigger('click')
      expect(w.emitted('change')).toEqual([[3]])
    },
  )
  it.each(['prebuilt', 'tailwind4'] as const)(
    'uses Element Plus theme overrides in %s mode',
    (cssMode) => {
      const w = mount(TablePagination, {
        props: {
          config: { size: 'small', disabled: true, showQuickJumper: true },
          state: { current: 3, pageSize: 10, total: 200 },
          locale: elementPlusPaginationEnUS,
        },
        global: { plugins: [createVTableGuild({ themePreset: 'element-plus', cssMode })] },
      })
      wrappers.push(w)
      const prefix = cssMode === 'prebuilt' ? 'vtg-' : ''
      expect(w.get('[aria-current="page"]').classes()).toContain(`${prefix}cursor-default`)
      expect(w.get('[aria-current="page"]').classes()).not.toContain(`${prefix}cursor-pointer`)
      expect(w.get('[aria-haspopup="listbox"]').classes()).toContain(`${prefix}border`)
      expect(w.get('[aria-haspopup="listbox"]').classes()).not.toContain(`${prefix}border-0`)
      expect(
        w
          .get('nav')
          .classes()
          .some((c) => c.includes('--vtg-pagination-font-size:var(--vtg-pagination-font-size-sm)')),
      ).toBe(true)
    },
  )
  it.each(['prebuilt', 'tailwind4'] as const)(
    'keeps active colors free of conflicting base styles in %s mode',
    (cssMode) => {
      const w = mount(TablePagination, {
        props: {
          config: {},
          state: { current: 3, pageSize: 10, total: 200 },
          locale: paginationEnUS,
        },
        global: { plugins: [createVTableGuild({ cssMode })] },
      })
      wrappers.push(w)
      const prefix = cssMode === 'prebuilt' ? 'vtg-' : ''
      const active = w.get('[aria-current="page"]').classes()
      expect(active).toContain(`${prefix}text-[color:var(--vtg-pagination-active-color)]`)
      expect(active).toContain(`${prefix}border-[color:var(--vtg-pagination-active-border)]`)
      expect(active).not.toContain(`${prefix}text-inherit`)
      expect(active).not.toContain(`${prefix}border-[color:var(--vtg-pagination-border)]`)
      expect(w.get('[aria-label="Page 2"]').classes()).toContain(`${prefix}text-inherit`)
    },
  )
  it('omits total, size changer and quick jumper in simple mode like Ant', () => {
    const showTotal = vi.fn(() => 'Total 200')
    const w = pager({ simple: true, showTotal, showSizeChanger: true, showQuickJumper: true })
    expect(showTotal).not.toHaveBeenCalled()
    expect(w.find('[aria-haspopup="listbox"]').exists()).toBe(false)
    expect(w.findAll('input')).toHaveLength(1)
    expect(w.findAll('button')).toHaveLength(2)
  })
  it('keeps a bounded window for large totals', () => {
    expect(paginationItems(50000, 1000000, false).length).toBeLessThanOrEqual(9)
    expect(paginationItems(50000, 1000000, true).length).toBeLessThanOrEqual(7)
  })
  it('matches Ant page windows near the first, middle and last pages', () => {
    const pages = (current: number, less = false) =>
      paginationItems(current, 20, less).map(({ page, type }) => (type === 'page' ? page : type))
    expect(pages(1)).toEqual([1, 2, 3, 4, 5, 'jump-next', 20])
    expect(pages(4)).toEqual([1, 2, 3, 4, 5, 6, 'jump-next', 20])
    expect(pages(10)).toEqual([1, 'jump-prev', 8, 9, 10, 11, 12, 'jump-next', 20])
    expect(pages(20)).toEqual([1, 'jump-prev', 16, 17, 18, 19, 20])
    expect(pages(3, true)).toEqual([1, 2, 3, 4, 'jump-next', 20])
  })
  it('supports custom rendering, total ranges and quick-jump Go content', async () => {
    const showTotal = vi.fn((total) => `Total ${total}`)
    const itemRender = vi.fn<NonNullable<TablePaginationConfig['itemRender']>>(
      ({ originalElement }) =>
        isVNode(originalElement) ? cloneVNode(originalElement) : originalElement,
    )
    const w = pager({ showTotal, itemRender, showQuickJumper: { goButton: 'Jump' } })
    expect(showTotal).toHaveBeenCalledWith(200, [21, 30])
    await w.get('input').setValue('9')
    await w.get('input').trigger('blur')
    expect(w.emitted('change')).toBeUndefined()
    await w
      .findAll('button')
      .find((b) => b.text() === 'Jump')!
      .trigger('click')
    expect(w.emitted('change')).toEqual([[9]])
    expect(itemRender).toHaveBeenCalled()
    expect(w.find('button button').exists()).toBe(false)
  })
  it('supports simple mode and clamps jump input', async () => {
    const w = pager({ simple: true, showSizeChanger: false })
    await w.get('input').setValue('999')
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('change')).toEqual([[20]])
    await w.setProps({ config: { disabled: true, simple: true } })
    expect(w.get('input').attributes('disabled')).toBeDefined()
  })
  it('uses numeric page titles and accessible jump controls', async () => {
    const w = pager()
    expect(w.get('[aria-label="Page 2"]').attributes('title')).toBe('2')
    const jump = w.get('[aria-label="Next 5 pages"]')
    expect(jump.find('svg').exists()).toBe(true)
    await jump.trigger('click')
    expect(w.emitted('change')).toEqual([[8]])
  })
  it('keeps simple input on blur and supports Go, arrows and invalid input like Ant', async () => {
    const w = pager({ simple: true, showQuickJumper: { goButton: 'Go' } })
    const input = w.get('input')
    await input.setValue('8')
    await input.trigger('blur')
    expect(w.emitted('change')).toBeUndefined()
    await w
      .findAll('button')
      .find((button) => button.text() === 'Go')!
      .trigger('click')
    expect(w.emitted('change')).toEqual([[8]])
    await input.trigger('keydown', { key: 'ArrowUp' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('change')).toEqual([[8], [2], [4]])
    await input.setValue('abc')
    expect(input.element.value).toBe('3')
    await input.setValue('0')
    await input.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('change')!.at(-1)).toEqual([1])
    await w.setProps({
      config: { simple: true, disabled: true, showQuickJumper: { goButton: 'Go' } },
    })
    expect(
      w
        .findAll('button')
        .find((button) => button.text() === 'Go')!
        .attributes('disabled'),
    ).toBeDefined()
  })
  it('repositions the size popup after measuring and on viewport changes', async () => {
    const w = pager({ showSizeChanger: true })
    const trigger = w.get('[aria-haspopup="listbox"]')
    let rect = new DOMRect(100, window.innerHeight - 50, 100, 32)
    vi.spyOn(trigger.element, 'getBoundingClientRect').mockImplementation(() => rect)
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(136)
    await trigger.trigger('click')
    await nextTick()
    const popup = document.body.querySelector<HTMLElement>('[role="listbox"]')!
    expect(popup.style.top).toBe(`${rect.top - 140}px`)
    expect(popup.style.transformOrigin).toBe('bottom center')
    rect = new DOMRect(100, 10, 100, 32)
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(popup.style.top).toBe('46px')
    expect(popup.style.transformOrigin).toBe('top center')
    await trigger.trigger('keydown', { key: 'Escape' })
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })
  it.each(['clip', 'hidden', 'auto', 'scroll'])(
    'keeps a body-mounted size popup within an overflow:%s ancestor',
    async (overflow) => {
      const w = pager({ showSizeChanger: true })
      const card = w.element.parentElement!
      card.style.overflowY = overflow
      vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 50, 800, 250))
      const trigger = w.get('[aria-haspopup="listbox"]')
      let rect = new DOMRect(100, 250, 100, 32)
      vi.spyOn(trigger.element, 'getBoundingClientRect').mockImplementation(() => rect)
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(136)
      await trigger.trigger('click')
      await nextTick()
      const popup = document.body.querySelector<HTMLElement>('[role="listbox"]')!
      expect(card.contains(popup)).toBe(false)
      expect(popup.style.top).toBe('110px')
      expect(popup.style.transformOrigin).toBe('bottom center')
      rect = new DOMRect(100, 80, 100, 32)
      card.dispatchEvent(new Event('scroll'))
      await nextTick()
      expect(popup.style.top).toBe('116px')
      expect(popup.style.transformOrigin).toBe('top center')
      expect(popup.style.maxHeight).toBe('184px')
    },
  )
  it('offers page size options in the configured container with keyboard support', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const w = pager({
      showSizeChanger: true,
      pageSizeOptions: ['10', '25'],
      buildOptionText: ({ value }) => `${value} rows`,
    })
    await w.setProps({ getPopupContainer: () => host })
    await w.get('[aria-haspopup="listbox"]').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(host.querySelector('[role="listbox"]')).not.toBeNull()
    const option = host.querySelectorAll<HTMLElement>('[role="option"]')[1]!
    option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(w.emitted('change')).toEqual([[3, 25]])
    expect(host.querySelector('[role="listbox"]')).toBeNull()
  })
  it('supports custom interactive roots without nesting buttons or double firing', async () => {
    const w = pager({
      itemRender: ({ page }) => h('a', { href: `#page-${page}` }, `${page}`),
      showQuickJumper: { goButton: h('button', 'Custom go') },
    })
    expect(w.find('button button').exists()).toBe(false)
    await w.get('a[aria-label="Page 4"]').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('change')).toEqual([[4]])
    await w.setProps({
      config: { disabled: true, itemRender: ({ page }) => h('a', { href: '#' }, `${page}`) },
    })
    await w.get('a[aria-label="Page 4"]').trigger('click')
    expect(w.emitted('change')).toHaveLength(1)
  })
  it('uses explicit size before responsive and inherited table size', async () => {
    const w = pager({ responsive: true })
    await w.setProps({ narrow: true })
    expect(
      w
        .get('nav')
        .classes()
        .some((name) => name.includes('--vtg-pagination-size:')),
    ).toBe(true)
    await w.setProps({ config: { responsive: true, size: 'default' }, tableSize: 'small' })
    expect(
      w
        .get('nav')
        .classes()
        .some((name) => name.includes('--vtg-pagination-size:')),
    ).toBe(false)
  })
})
