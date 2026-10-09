import { mount, type VueWrapper } from '@vue/test-utils'
import { Comment, Fragment, Text, h, nextTick, shallowReactive, ref, type VNodeChild } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createVTableGuild,
  type ThemePresetName,
  type VTableGuildOptions,
} from '@vtable-guild/core'
import { elementPlusPaginationEnUS, paginationEnUS } from '@vtable-guild/theme'
import TablePagination from './TablePagination'
import VTable from './VTable.vue'
import type {
  TablePaginationConfig,
  TablePaginationLayout,
  TablePaginationSlotProps,
  TableProps,
} from '../types'
import { resetDevWarnedForTest } from '../../../core/src/utils/devWarn'

const wrappers: VueWrapper[] = []
const presets = ['antdv', 'element-plus'] as const
const rows = Array.from({ length: 35 }, (_, i) => ({ key: i + 1, name: `Row ${i + 1}` }))
type Row = (typeof rows)[number]
type PaginationSlot = (scope: TablePaginationSlotProps) => VNodeChild

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  resetDevWarnedForTest()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

function plugin(themePreset: ThemePresetName, options: VTableGuildOptions = {}) {
  return createVTableGuild({
    themePreset,
    locale: 'en-US',
    cssMode: 'tailwind4',
    theme: {
      pagination: {
        slots: {
          layout: 'pagination-layout',
          left: 'pagination-left',
          right: 'pagination-right',
          extension: 'pagination-extension',
          pages: 'pagination-pages',
          total: 'pagination-total',
          controls: 'pagination-jumper',
        },
      },
    },
    ...options,
  })
}

function pager(
  themePreset: ThemePresetName,
  config: TablePaginationConfig,
  paginationItem?: PaginationSlot,
  options: VTableGuildOptions = {},
) {
  const wrapper = mount(TablePagination, {
    attachTo: document.body,
    props: {
      config,
      state: { current: 3, pageSize: 10, total: 200 },
      locale: themePreset === 'element-plus' ? elementPlusPaginationEnUS : paginationEnUS,
    },
    slots: paginationItem ? { paginationItem } : {},
    global: { plugins: [plugin(themePreset, options)] },
  })
  wrappers.push(wrapper)
  return wrapper
}

function table(
  themePreset: ThemePresetName,
  pagination: TableProps<Row>['pagination'],
  paginationItem?: PaginationSlot,
  dataSource: Row[] = rows,
) {
  const wrapper = mount(VTable<Row>, {
    attachTo: document.body,
    props: {
      columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
      dataSource,
      rowKey: 'key',
      pagination,
    },
    slots: paginationItem ? { paginationItem } : {},
    global: { plugins: [plugin(themePreset)] },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe.each(presets)('%s pagination layouts', (preset) => {
  it('retains the preset default order and a single navigation group', () => {
    const wrapper = pager(preset, {
      showTotal: (total) => `Total ${total}`,
      showSizeChanger: true,
      showQuickJumper: true,
    })
    const total = wrapper.get('.pagination-total').element
    const navigation = wrapper.get('.pagination-pages').element
    const sizes = wrapper.get('[aria-haspopup="listbox"]').element
    const jumper = wrapper.get('.pagination-jumper').element
    expect(Array.from(wrapper.get('nav').element.children)).toEqual(
      preset === 'element-plus'
        ? [total, sizes, navigation, jumper]
        : [total, navigation, sizes, jumper],
    )
    expect(wrapper.find('.pagination-layout').exists()).toBe(false)
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Pagination')
  })

  it('reorders controls and keeps navigation groups on either side of custom content', async () => {
    const itemRender = vi.fn<NonNullable<TablePaginationConfig['itemRender']>>(({ page, type }) =>
      h('a', { href: `#page-${page}` }, `${type} ${page}`),
    )
    const wrapper = pager(
      preset,
      {
        layout: ['jumper', 'sizes', 'next', { slot: 'status' }, 'pager', 'prev', 'total'],
        showTotal: () => 'Total 200',
        showSizeChanger: true,
        showQuickJumper: true,
        itemRender,
      },
      ({ name }) => h('div', { 'data-content': name }, 'Status'),
    )
    const groups = wrapper.findAll('.pagination-pages')
    expect(groups).toHaveLength(2)
    expect(Array.from(wrapper.get('nav').element.children)).toEqual([
      wrapper.get('.pagination-jumper').element,
      wrapper.get('[aria-haspopup="listbox"]').element,
      groups[0]!.element,
      wrapper.get('.pagination-extension').element,
      groups[1]!.element,
      wrapper.get('.pagination-total').element,
    ])
    expect(groups[0]!.findAll('a')).toHaveLength(1)
    expect(groups[0]!.text()).toBe('next 4')
    expect(groups[1]!.findAll('a').at(-1)!.text()).toBe('prev 2')
    expect(wrapper.find('span > .pagination-extension').exists()).toBe(false)
    await groups[0]!.get('a').trigger('click')
    await wrapper.get('[aria-label="Page 5"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('change')).toEqual([[4], [5]])
    expect(itemRender.mock.calls.map(([scope]) => scope.type)).toContain('page')
  })

  it('requires both the layout token and existing show options for optional controls', async () => {
    const showTotal = vi.fn(() => 'Total')
    const wrapper = pager(preset, {
      layout: ['total', 'sizes', 'jumper'],
      showSizeChanger: false,
      showQuickJumper: false,
    })
    expect(wrapper.find('nav').exists()).toBe(false)
    await wrapper.setProps({
      config: {
        layout: ['total', 'sizes', 'jumper'],
        showTotal,
        showSizeChanger: true,
        showQuickJumper: true,
      },
    })
    expect(wrapper.get('.pagination-total').text()).toBe('Total')
    expect(wrapper.find('[aria-haspopup="listbox"]').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
    showTotal.mockClear()
    await wrapper.setProps({
      config: {
        layout: ['prev', 'next'],
        showTotal,
        showSizeChanger: true,
        showQuickJumper: true,
      },
    })
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.find('[aria-haspopup="listbox"]').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(showTotal).not.toHaveBeenCalled()
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it.each([
    { total: 50, boundary: undefined, explicit: undefined, visible: false },
    { total: 51, boundary: undefined, explicit: undefined, visible: true },
    { total: 80, boundary: 80, explicit: undefined, visible: false },
    { total: 81, boundary: 80, explicit: undefined, visible: true },
    { total: 50, boundary: undefined, explicit: true, visible: true },
    { total: 200, boundary: undefined, explicit: false, visible: false },
  ])(
    'respects size visibility for total=$total, boundary=$boundary and explicit=$explicit',
    async ({ total, boundary, explicit, visible }) => {
      const wrapper = pager(preset, {
        layout: ['sizes'],
        totalBoundaryShowSizeChanger: boundary,
        showSizeChanger: explicit,
      })
      await wrapper.setProps({ state: { current: 1, pageSize: 10, total } })
      expect(wrapper.find('[aria-haspopup="listbox"]').exists()).toBe(visible)
      expect(wrapper.find('nav').exists()).toBe(visible)
    },
  )

  it('supports simple Go before its pager and hides an orphaned Go without hiding custom content', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const showTotal = vi.fn(() => 'Total')
    const config: TablePaginationConfig = {
      simple: true,
      showTotal,
      showSizeChanger: true,
      showQuickJumper: { goButton: 'Go' },
      layout: ['total', 'sizes', 'jumper', { slot: 'status' }],
    }
    const wrapper = pager(preset, config, () => 'Status')
    expect(wrapper.text()).toBe('Status')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(showTotal).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pager'))
    await wrapper.setProps({
      config: { ...config, layout: ['jumper', 'pager', { slot: 'status' }] },
    })
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.find('[aria-haspopup="listbox"]').exists()).toBe(false)
    await wrapper.get('input').setValue('8')
    await wrapper.get('.pagination-jumper button').trigger('click')
    expect(wrapper.emitted('change')).toEqual([[8]])
    await wrapper.setProps({ config: { ...config, disabled: true } })
    expect(wrapper.text()).toBe('Status')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('deduplicates controls and named slots across regions, retaining the first region', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const slot = vi.fn<PaginationSlot>(({ name }) => h('div', name))
    const wrapper = pager(
      preset,
      {
        layout: {
          left: [{ slot: 'status' }, 'prev', { slot: 'status' }],
          right: ['prev', { slot: 'status' }, { slot: 'refresh' }, 'next'],
        },
      },
      slot,
    )
    expect(slot.mock.calls.map(([scope]) => [scope.name, scope.region])).toEqual([
      ['status', 'left'],
      ['refresh', 'right'],
    ])
    expect(wrapper.get('.pagination-left').text()).toContain('status')
    expect(wrapper.get('.pagination-right').text()).not.toContain('status')
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.findAll('.pagination-extension')).toHaveLength(2)
  })

  it('filters empty Vue content without invoking slots twice and preserves numeric zero', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const content: Record<string, VNodeChild> = {
      absent: undefined,
      nil: null,
      false: false,
      whitespace: '  ',
      emptyArray: [],
      comment: h(Comment),
      fragment: h(Fragment, null, [h(Comment), h(Text, null, ' ')]),
      nested: [null, [h(Comment), false, ' ']],
      zero: 0,
    }
    const slot = vi.fn<PaginationSlot>(({ name }) => content[name])
    const wrapper = pager(
      preset,
      { layout: Object.keys(content).map((name) => ({ slot: name })) },
      slot,
    )
    expect(slot).toHaveBeenCalledTimes(Object.keys(content).length)
    expect(wrapper.findAll('.pagination-extension')).toHaveLength(1)
    expect(wrapper.text()).toBe('0')
    slot.mockClear()
    await wrapper.setProps({
      config: {
        layout: Object.keys(content)
          .filter((name) => name !== 'zero')
          .map((slot) => ({ slot })),
      },
    })
    expect(slot).toHaveBeenCalledTimes(Object.keys(content).length - 1)
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it('omits empty split regions and hides the complete nav when both regions are empty', async () => {
    const wrapper = pager(
      preset,
      { layout: { left: [{ slot: 'empty' }], right: ['next'] } },
      () => null,
    )
    expect(wrapper.find('.pagination-left').exists()).toBe(false)
    expect(wrapper.find('.pagination-right').exists()).toBe(true)
    await wrapper.setProps({ config: { layout: { left: ['prev'], right: [{ slot: 'empty' }] } } })
    expect(wrapper.find('.pagination-left').exists()).toBe(true)
    expect(wrapper.find('.pagination-right').exists()).toBe(false)
    await wrapper.setProps({ config: { layout: { left: [], right: [{ slot: 'empty' }] } } })
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('skips a missing paginationItem slot and warns once across rerenders and instances', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = pager(preset, { layout: [{ slot: 'first' }, { slot: 'second' }] })
    expect(wrapper.find('nav').exists()).toBe(false)
    await wrapper.setProps({ state: { current: 4, pageSize: 10, total: 200 } })
    const other = pager(preset, { layout: { right: [{ slot: 'third' }] } })
    expect(other.find('nav').exists()).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('#paginationItem'))
  })
})

describe.each(presets)('%s public VTable pagination slots', (preset) => {
  it('forwards current state and placement to both pagers, keeping business actions independent', async () => {
    const selection = ref(2)
    const reload = vi.fn()
    const onChange = vi.fn()
    const onShowSizeChange = vi.fn()
    const pagination: TablePaginationConfig = {
      defaultCurrent: 2,
      defaultPageSize: 10,
      position: ['topLeft', 'topRight', 'bottomRight'],
      showSizeChanger: true,
      pageSizeOptions: [10, 20],
      onChange,
      onShowSizeChange,
      layout: {
        left: [{ slot: 'status' }],
        right: ['prev', 'pager', 'next', 'sizes', { slot: 'refresh' }],
      },
    }
    const wrapper = table(preset, pagination, (scope) =>
      scope.name === 'refresh'
        ? h(
            'button',
            {
              'data-refresh': scope.position,
              disabled: scope.disabled,
              onClick: () => reload(scope.current, scope.pageSize),
            },
            'Refresh',
          )
        : h('div', [
            h('output', { 'data-context': scope.position }, JSON.stringify(scope)),
            h('span', { 'data-selection': '' }, `Selected ${selection.value}`),
          ]),
    )
    const expectContexts = (current: number, pageSize: number, disabled = false) => {
      const pageCount = Math.ceil(rows.length / pageSize)
      expect(wrapper.findAll('[data-context]').map((node) => JSON.parse(node.text()))).toEqual(
        ['topLeft', 'bottomRight'].map((position) => ({
          name: 'status',
          current,
          pageSize,
          total: rows.length,
          pageCount,
          range: [(current - 1) * pageSize + 1, Math.min(current * pageSize, rows.length)],
          disabled,
          position,
          region: 'left',
        })),
      )
    }
    expectContexts(2, 10)
    await wrapper.get('[data-refresh="bottomRight"]').trigger('click')
    expect(reload).toHaveBeenCalledExactlyOnceWith(2, 10)
    selection.value = 3
    await nextTick()
    expect(wrapper.findAll('[data-selection]').map((node) => node.text())).toEqual([
      'Selected 3',
      'Selected 3',
    ])
    expect(onChange).not.toHaveBeenCalled()
    expect(wrapper.emitted('change')).toBeUndefined()

    await wrapper.findAll('nav')[0]!.get('[aria-label="Page 4"]').trigger('click')
    expectContexts(4, 10)
    expect(wrapper.findAll('[aria-current="page"]').map((node) => node.text())).toEqual(['4', '4'])
    expect(wrapper.findAll('tbody tr').map((node) => node.text())).toEqual(
      rows.slice(30).map((row) => row.name),
    )
    expect(onChange).toHaveBeenCalledExactlyOnceWith(4, 10)

    await wrapper.findAll('nav')[1]!.get('[aria-haspopup="listbox"]').trigger('click')
    document.body.querySelectorAll<HTMLElement>('[role="option"]')[1]!.click()
    await nextTick()
    expectContexts(2, 20)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(2, 20)
    expect(onShowSizeChange).toHaveBeenCalledExactlyOnceWith(2, 20)
    expect(wrapper.emitted('change')).toHaveLength(2)
    await wrapper.setProps({ pagination: { ...pagination, disabled: true } })
    expectContexts(2, 20, true)
    expect(wrapper.get('[data-refresh="bottomRight"]').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('change')).toHaveLength(2)
  })

  it.each([false, true])(
    'changes layout without changing rows, state or events (controlled=%s)',
    async (controlled) => {
      const onChange = vi.fn()
      const onShowSizeChange = vi.fn()
      const onUpdateCurrent = vi.fn()
      const pagination = shallowReactive<TablePaginationConfig>({
        ...(controlled ? { current: 2 } : { defaultCurrent: 2 }),
        pageSize: 10,
        position: ['topCenter', 'bottomLeft'],
        layout: [{ slot: 'status' }, 'prev', 'pager', 'next'],
        onChange,
        onShowSizeChange,
        'onUpdate:current': onUpdateCurrent,
      })
      const wrapper = table(preset, pagination, (scope) =>
        h('output', { 'data-state': '' }, `${scope.current}:${scope.pageSize}:${scope.region}`),
      )
      const originalRows = wrapper.findAll('tbody tr').map((node) => node.text())
      const layouts: TablePaginationLayout[] = [
        ['next', { slot: 'status' }, 'prev'],
        { left: [{ slot: 'status' }], right: ['prev', 'pager', 'next'] },
        [],
        {},
        { right: [] },
      ]
      for (const layout of layouts) {
        pagination.layout = layout
        await nextTick()
        expect(wrapper.findAll('tbody tr').map((node) => node.text())).toEqual(originalRows)
        expect(onChange).not.toHaveBeenCalled()
        expect(onShowSizeChange).not.toHaveBeenCalled()
        expect(onUpdateCurrent).not.toHaveBeenCalled()
        expect(wrapper.emitted('change')).toBeUndefined()
      }
      pagination.layout = [{ slot: 'status' }, 'prev', 'pager', 'next']
      await nextTick()
      expect(wrapper.findAll('[data-state]').map((node) => node.text())).toEqual([
        '2:10:inline',
        '2:10:inline',
      ])
      await wrapper.findAll('nav')[1]!.get('[aria-label="Page 3"]').trigger('click')
      expect(onChange).toHaveBeenCalledExactlyOnceWith(3, 10)
      expect(onUpdateCurrent).toHaveBeenCalledExactlyOnceWith(3)
      if (controlled) {
        expect(wrapper.findAll('tbody tr').map((node) => node.text())).toEqual(originalRows)
        expect(wrapper.findAll('[data-state]').map((node) => node.text())).toEqual([
          '2:10:inline',
          '2:10:inline',
        ])
        pagination.current = 3
        await nextTick()
      }
      expect(wrapper.findAll('tbody tr')[0]!.text()).toBe('Row 21')
      expect(wrapper.findAll('[data-state]').map((node) => node.text())).toEqual([
        '3:10:inline',
        '3:10:inline',
      ])
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('change')).toHaveLength(1)
    },
  )

  it.each([
    { label: 'disabled pagination', config: false, rowCount: 35 },
    { label: 'none position', config: { position: ['none'] }, rowCount: 10 },
    { label: 'no positions', config: { position: [] }, rowCount: 10 },
    {
      label: 'hidden single page',
      config: { hideOnSinglePage: true, pageSize: 100 },
      rowCount: 35,
    },
    { label: 'empty inline layout', config: { layout: [] }, rowCount: 10 },
    { label: 'empty split layout', config: { layout: { left: [], right: [] } }, rowCount: 10 },
  ] satisfies { label: string; config: false | TablePaginationConfig; rowCount: number }[])(
    'hides custom content with $label while retaining the existing data-slicing behavior',
    ({ config, rowCount }) => {
      const slot = vi.fn<PaginationSlot>(() => 'Custom content')
      const wrapper = table(
        preset,
        config === false ? false : { layout: [{ slot: 'status' }], ...config },
        slot,
      )
      expect(wrapper.find('nav').exists()).toBe(false)
      expect(wrapper.findAll('tbody tr')).toHaveLength(rowCount)
      expect(slot).not.toHaveBeenCalled()
      expect(wrapper.emitted('change')).toBeUndefined()
    },
  )

  it('hides custom content when the effective total is zero', () => {
    const slot = vi.fn<PaginationSlot>(() => 'Custom content')
    const wrapper = table(preset, { layout: [{ slot: 'status' }] }, slot, [])
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(slot).not.toHaveBeenCalled()
    expect(wrapper.emitted('change')).toBeUndefined()
  })
})

describe.each(presets)('%s pagination layout themes', (preset) => {
  it.each([
    { cssMode: 'prebuilt', classPrefix: 'vtg', prefix: 'vtg-' },
    { cssMode: 'prebuilt', classPrefix: 'app', prefix: 'app-' },
    { cssMode: 'tailwind3', classPrefix: 'vtg', prefix: '' },
    { cssMode: 'tailwind4', classPrefix: 'vtg', prefix: '' },
  ] as const)(
    'keeps structure and overrides in $cssMode with $classPrefix prefix',
    ({ cssMode, classPrefix, prefix }) => {
      const wrapper = pager(
        preset,
        { layout: { left: [{ slot: 'status' }], right: ['prev', 'pager', 'next'] } },
        () => h('div', 'Custom content'),
        { cssMode, classPrefix },
      )
      const layout = wrapper.get('.pagination-layout')
      const left = layout.get('.pagination-left')
      const right = layout.get('.pagination-right')
      const extension = left.get('.pagination-extension')
      expect(layout.classes()).toEqual(
        expect.arrayContaining([
          `${prefix}flex-wrap`,
          `${prefix}w-full`,
          `${prefix}min-w-0`,
          `${prefix}gap-[var(--vtg-pagination-gap)]`,
        ]),
      )
      expect(left.classes()).toContain(`${prefix}flex-wrap`)
      expect(right.classes()).toEqual(
        expect.arrayContaining([`${prefix}ml-auto`, `${prefix}justify-end`, `${prefix}flex-wrap`]),
      )
      expect(extension.classes()).toEqual(
        expect.arrayContaining([`${prefix}min-w-0`, `${prefix}max-w-full`, `${prefix}break-words`]),
      )
      const pageGap =
        preset === 'element-plus' ? '--vtg-pagination-page-gap' : '--vtg-pagination-gap'
      expect(right.get('.pagination-pages').classes()).toContain(`${prefix}gap-[var(${pageGap})]`)
      expect(wrapper.get('nav').classes().includes(`${prefix}flex-wrap`)).toBe(preset === 'antdv')
    },
  )
})
