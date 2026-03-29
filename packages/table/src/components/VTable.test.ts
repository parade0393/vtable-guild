import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import { VTableSummary } from '../index'
import type { ColumnsType } from '../types'

interface DemoRow extends Record<string, unknown> {
  key: string
  name: string
  age: number
  status: 'active' | 'paused'
}

interface MergeRow extends DemoRow {
  group: string
  score: number
  region: string
}

const dataSource: DemoRow[] = [
  { key: '1', name: 'Charlie', age: 30, status: 'active' },
  { key: '2', name: 'Alice', age: 24, status: 'paused' },
  { key: '3', name: 'Bob', age: 27, status: 'active' },
]

const baseColumns: ColumnsType<DemoRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name' },
  { title: 'Age', key: 'age', dataIndex: 'age' },
  { title: 'Status', key: 'status', dataIndex: 'status' },
]

function mountTable(columns: ColumnsType<DemoRow>) {
  return mount(VTable<DemoRow>, {
    attachTo: document.body,
    props: {
      rowKey: 'key',
      columns,
      dataSource,
    },
  })
}

function getBodyRows(wrapper: VueWrapper) {
  return wrapper.findAll('tbody tr')
}

function findTableHeaderCell(wrapper: VueWrapper, title: string) {
  const cell = wrapper.findAll('th').find((item) => item.text().includes(title))
  if (!cell) {
    throw new Error(`Header cell not found: ${title}`)
  }
  return cell
}

function findBodyButton(text: string) {
  const button = Array.from(document.body.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(text),
  )

  if (!button) {
    throw new Error(`Button not found: ${text}`)
  }

  return button
}

function findResizeHandle(wrapper: VueWrapper, title: string) {
  const cell = findTableHeaderCell(wrapper, title)
  const handle = cell.find('.cursor-col-resize')

  if (!handle.exists()) {
    throw new Error(`Resize handle not found: ${title}`)
  }

  return handle
}

function findScrollWrap(wrapper: VueWrapper) {
  const wrap = wrapper
    .findAll('div')
    .find((item) => item.classes().includes('scrollbar-none') && item.classes().includes('h-full'))

  if (!wrap) {
    throw new Error('Scroll wrap not found')
  }

  return wrap
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('VTable', () => {
  it('renders table headers and rows from dataSource and columns', () => {
    const wrapper = mountTable(baseColumns)

    expect(wrapper.findAll('thead th').map((item) => item.text())).toEqual([
      'Name',
      'Age',
      'Status',
    ])
    expect(getBodyRows(wrapper)).toHaveLength(3)
    expect(getBodyRows(wrapper)[0].text()).toContain('Charlie')
    expect(getBodyRows(wrapper)[1].text()).toContain('Alice')

    wrapper.unmount()
  })

  it('emits change with sorted data when clicking a sortable header', async () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name' },
      { title: 'Age', key: 'age', dataIndex: 'age', sorter: true },
    ]

    const wrapper = mountTable(columns)

    await findTableHeaderCell(wrapper, 'Age').trigger('click')
    await nextTick()

    const events = wrapper.emitted('change')
    expect(events).toBeTruthy()
    expect(events).toHaveLength(1)

    const [filters, sorter, extra] = events![0]

    expect(filters).toEqual({ name: null, age: null })
    expect(sorter).toMatchObject({ columnKey: 'age', field: 'age', order: 'ascend' })
    expect(extra).toMatchObject({ action: 'sort' })
    expect(
      (extra as { currentDataSource: DemoRow[] }).currentDataSource.map((row) => row.key),
    ).toEqual(['2', '3', '1'])
    expect(getBodyRows(wrapper).map((row) => row.text())).toEqual([
      expect.stringContaining('Alice'),
      expect.stringContaining('Bob'),
      expect.stringContaining('Charlie'),
    ])

    wrapper.unmount()
  })

  it('emits change with filtered data when confirming a filter', async () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name' },
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        filters: [
          { text: 'Active', value: 'active' },
          { text: 'Paused', value: 'paused' },
        ],
        onFilter: (value, record) => record.status === value,
      },
    ]

    const wrapper = mountTable(columns)

    await wrapper.get('[aria-label="筛选"]').trigger('click')
    await nextTick()

    const filterOption = Array.from(document.body.querySelectorAll('li')).find((item) =>
      item.textContent?.includes('Active'),
    )

    if (!filterOption) {
      throw new Error('Filter option not found: Active')
    }

    ;(filterOption.firstElementChild ?? filterOption).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    findBodyButton('确').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const events = wrapper.emitted('change')
    expect(events).toBeTruthy()
    expect(events).toHaveLength(1)

    const [filters, sorter, extra] = events![0]

    expect(filters).toEqual({ name: null, status: ['active'] })
    expect(sorter).toMatchObject({ columnKey: undefined, order: null, field: undefined })
    expect(extra).toMatchObject({ action: 'filter' })
    expect(
      (extra as { currentDataSource: DemoRow[] }).currentDataSource.map((row) => row.key),
    ).toEqual(['1', '3'])
    expect(getBodyRows(wrapper)).toHaveLength(2)
    expect(getBodyRows(wrapper).every((row) => row.text().includes('active'))).toBe(true)

    wrapper.unmount()
  })

  it('renders expanded content when clicking a row with expandRowByClick', async () => {
    const columns: ColumnsType<DemoRow> = [{ title: 'Name', key: 'name', dataIndex: 'name' }]
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns,
        dataSource,
        expandable: {
          expandRowByClick: true,
          expandedRowRender: (record: DemoRow) => `expanded:${record.name}`,
        },
      },
    })

    await getBodyRows(wrapper)[0].trigger('click')
    await nextTick()

    const rows = getBodyRows(wrapper)
    expect(rows).toHaveLength(4)
    expect(rows[1].text()).toContain('expanded:Charlie')

    wrapper.unmount()
  })

  it('applies sticky positioning styles to fixed columns', () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name', width: 160, fixed: 'left' },
      { title: 'Age', key: 'age', dataIndex: 'age', width: 90 },
      { title: 'Status', key: 'status', dataIndex: 'status', width: 140, fixed: 'right' },
    ]

    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns,
        dataSource,
        scroll: { x: 520 },
      },
    })

    const headerCells = wrapper.findAll('thead th')
    const bodyCells = wrapper.findAll('tbody tr').at(0)?.findAll('td') ?? []

    expect(headerCells[0].attributes('style')).toContain('position: sticky;')
    expect(headerCells[0].attributes('style')).toContain('left: 0px;')
    expect(headerCells[2].attributes('style')).toContain('position: sticky;')
    expect(headerCells[2].attributes('style')).toContain('right: 0px;')
    expect(bodyCells[0].attributes('style')).toContain('position: sticky;')
    expect(bodyCells[0].attributes('style')).toContain('left: 0px;')
    expect(bodyCells[2].attributes('style')).toContain('position: sticky;')
    expect(bodyCells[2].attributes('style')).toContain('right: 0px;')

    wrapper.unmount()
  })

  it('merges plugin theme, instance ui, and root class overrides', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [{ title: 'Name', key: 'name', dataIndex: 'name' }],
        dataSource,
        ui: {
          th: 'bg-emerald-50',
          td: 'uppercase',
        },
        class: 'shadow-lg',
      },
      global: {
        plugins: [
          createVTableGuild({
            theme: {
              table: {
                slots: {
                  root: 'ring-1 ring-sky-500',
                  th: 'text-fuchsia-700',
                  td: 'italic',
                },
              },
            },
          }),
        ],
      },
    })

    expect(wrapper.get('div').classes()).toEqual(
      expect.arrayContaining(['ring-1', 'ring-sky-500', 'shadow-lg']),
    )
    expect(wrapper.get('thead th').classes()).toEqual(
      expect.arrayContaining(['text-fuchsia-700', 'bg-emerald-50']),
    )
    expect(wrapper.get('tbody td').classes()).toEqual(
      expect.arrayContaining(['italic', 'uppercase']),
    )

    wrapper.unmount()
  })

  it('renders title, footer, and summary slot content', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name' },
          { title: 'Age', key: 'age', dataIndex: 'age' },
        ],
        dataSource,
        title: () => 'Table Title',
        footer: () => 'Table Footer',
      },
      slots: {
        summary: '<tr><td colspan="2">Summary Row</td></tr>',
      },
    })

    expect(wrapper.text()).toContain('Table Title')
    expect(wrapper.text()).toContain('Table Footer')
    expect(wrapper.text()).toContain('Summary Row')

    wrapper.unmount()
  })

  it('emits resizeColumn when dragging a resizable header handle', async () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name', width: 120, resizable: true },
          { title: 'Age', key: 'age', dataIndex: 'age', width: 90 },
        ],
        dataSource,
      },
    })

    await findResizeHandle(wrapper, 'Name').trigger('pointerdown', { clientX: 100 })
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 148 }))
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 148 }))
    await nextTick()

    const events = wrapper.emitted('resizeColumn')
    expect(events).toBeTruthy()
    expect(events).toHaveLength(1)
    expect(events![0][0]).toMatchObject({ key: 'name', width: 120, resizable: true })
    expect(events![0][1]).toBe(168)

    wrapper.unmount()
  })

  it('applies custom row/header props and renders headerCell/bodyCell slots', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name' },
          {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            customHeaderCell: () => ({ class: 'status-header' }),
          },
        ],
        dataSource,
        rowClassName: (record, index) => `${record.status}-row row-${index}`,
        customRow: (record) => ({ 'data-status': record.status }),
        customHeaderRow: (_columns, index) => ({ 'data-header-row': String(index ?? 0) }),
      },
      slots: {
        headerCell: ({ title, column }) =>
          column.key === 'status' ? `header:${String(title)}:metric` : String(title),
        bodyCell: ({ text, column }) =>
          column.key === 'status' ? `body:${String(text)}` : String(text),
      },
    })

    const headerRows = wrapper.findAll('thead tr')
    const bodyRows = getBodyRows(wrapper)

    expect(headerRows[0].attributes('data-header-row')).toBe('0')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).toContain('status-header')
    expect(findTableHeaderCell(wrapper, 'Status').text()).toContain('header:Status:metric')
    expect(bodyRows[0].attributes('data-status')).toBe('active')
    expect(bodyRows[0].classes()).toEqual(expect.arrayContaining(['active-row', 'row-0']))
    expect(bodyRows[0].text()).toContain('body:active')

    wrapper.unmount()
  })

  it('renders grouped headers with merged body cells and row selection together', () => {
    const mergeData: MergeRow[] = [
      {
        key: 'm1',
        group: 'North',
        name: 'Charlie',
        age: 30,
        status: 'active',
        score: 88,
        region: 'NA',
      },
      {
        key: 'm2',
        group: 'North',
        name: 'Alice',
        age: 24,
        status: 'paused',
        score: 76,
        region: 'NA',
      },
      { key: 'm3', group: 'Solo', name: 'Bob', age: 27, status: 'active', score: 91, region: 'EU' },
    ]

    const columns: ColumnsType<MergeRow> = [
      {
        title: 'Member',
        key: 'member',
        children: [
          {
            title: 'Group',
            dataIndex: 'group',
            key: 'group',
            customCell: (_record, index) => {
              if (index === 0) return { rowSpan: 2 }
              if (index === 1) return { rowSpan: 0 }
              return {}
            },
          },
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            customRender: ({ text, record, index }) =>
              index === 2
                ? {
                    children: `${String(text)} / ${record.score}`,
                    props: { colSpan: 2 },
                  }
                : String(text),
          },
        ],
      },
      {
        title: 'Workspace',
        key: 'workspace',
        children: [
          { title: 'Score', dataIndex: 'score', key: 'score' },
          { title: 'Region', dataIndex: 'region', key: 'region' },
        ],
      },
    ]

    const wrapper = mount(VTable<MergeRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns,
        dataSource: mergeData,
        rowSelection: { type: 'checkbox' },
      },
    })

    expect(wrapper.findAll('thead tr')).toHaveLength(2)
    expect(wrapper.findAll('[role="checkbox"]').length).toBeGreaterThan(1)

    const rowspanCell = wrapper.find('tbody td[rowspan="2"]')
    expect(rowspanCell.exists()).toBe(true)
    expect(rowspanCell.text()).toContain('North')

    const colspanCell = wrapper.find('tbody td[colspan="2"]')
    expect(colspanCell.exists()).toBe(true)
    expect(colspanCell.text()).toContain('Bob / 91')

    wrapper.unmount()
  })

  it('toggles fixed column shadow classes based on horizontal scroll position', async () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name', width: 160, fixed: 'left' },
      { title: 'Age', key: 'age', dataIndex: 'age', width: 140 },
      { title: 'Status', key: 'status', dataIndex: 'status', width: 180, fixed: 'right' },
    ]

    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns,
        dataSource,
        scroll: { x: 520 },
      },
    })

    const scrollWrap = findScrollWrap(wrapper)
    const wrapElement = scrollWrap.element as HTMLDivElement

    Object.defineProperty(wrapElement, 'scrollWidth', {
      configurable: true,
      value: 720,
    })
    Object.defineProperty(wrapElement, 'clientWidth', {
      configurable: true,
      value: 320,
    })
    Object.defineProperty(wrapElement, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 0,
    })

    await scrollWrap.trigger('scroll')
    await nextTick()

    expect(findTableHeaderCell(wrapper, 'Name').classes()).not.toContain('after:absolute')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).toContain('after:absolute')

    wrapElement.scrollLeft = 120
    await scrollWrap.trigger('scroll')
    await nextTick()

    expect(findTableHeaderCell(wrapper, 'Name').classes()).toContain('after:absolute')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).toContain('after:absolute')

    wrapElement.scrollLeft = 400
    await scrollWrap.trigger('scroll')
    await nextTick()

    expect(findTableHeaderCell(wrapper, 'Name').classes()).toContain('after:absolute')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).not.toContain('after:absolute')

    wrapper.unmount()
  })

  it('renders virtual mode with fixed columns and row selection together', async () => {
    const virtualData = Array.from({ length: 120 }, (_, index) => ({
      key: `v-${index}`,
      name: `User ${index}`,
      age: 20 + (index % 30),
      status: index % 2 === 0 ? 'active' : 'paused',
    })) satisfies DemoRow[]

    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name', width: 160, fixed: 'left' },
      { title: 'Age', key: 'age', dataIndex: 'age', width: 120 },
      { title: 'Status', key: 'status', dataIndex: 'status', width: 160, fixed: 'right' },
    ]

    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns,
        dataSource: virtualData,
        rowSelection: { type: 'checkbox', fixed: true },
        scroll: { y: 220 },
        virtual: true,
      },
    })

    await nextTick()

    const rows = getBodyRows(wrapper)
    const firstRowCells = rows[0]?.findAll('td') ?? []

    expect(wrapper.findAll('[role="checkbox"]').length).toBeGreaterThan(1)
    expect(rows.length).toBeLessThan(virtualData.length)
    expect(firstRowCells[0].attributes('style')).toContain('position: sticky;')
    expect(firstRowCells[firstRowCells.length - 1].attributes('style')).toContain(
      'position: sticky;',
    )

    wrapper.unmount()
  })

  it('renders summary content when using the VTableSummary helper', () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [
          { title: 'Name', key: 'name', dataIndex: 'name', width: 180 },
          { title: 'Age', key: 'age', dataIndex: 'age', width: 100, fixed: 'right' },
        ],
        dataSource,
        scroll: { x: 420, y: 180 },
        sticky: true,
      },
      slots: {
        summary: () =>
          h(VTableSummary, { fixed: 'bottom' }, () =>
            h(VTableSummary.Row, null, () => [
              h(VTableSummary.Cell, { index: 0 }, () => 'Summary Name'),
              h(VTableSummary.Cell, { index: 1, align: 'right' }, () => '99'),
            ]),
          ),
      },
    })

    expect(wrapper.findAll('tfoot')).toHaveLength(1)
    expect(wrapper.find('tfoot').text()).toContain('Summary Name')

    wrapper.unmount()
  })

  it('applies locale overrides to filter trigger labels', async () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: [
          {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            filters: [
              { text: 'Active', value: 'active' },
              { text: 'Paused', value: 'paused' },
            ],
            onFilter: (value, record) => record.status === value,
          },
        ],
        dataSource,
        localeOverrides: {
          header: {
            filterTriggerAriaLabel: 'Open filters',
          },
        },
      },
    })

    expect(wrapper.get('[aria-label="Open filters"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('applies locale overrides to selection dropdown items', async () => {
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: baseColumns,
        dataSource,
        rowSelection: {
          type: 'checkbox',
          selections: true,
        },
        localeOverrides: {
          selection: {
            selectAll: 'Select visible',
            selectInvert: 'Invert visible',
            selectNone: 'Clear selected',
          },
        },
      },
    })

    await wrapper.get('[aria-label="Selection options"]').trigger('mouseenter')
    await nextTick()

    const selectionItems = Array.from(document.body.querySelectorAll('li')).map((item) =>
      item.textContent?.trim(),
    )

    expect(selectionItems).toEqual(
      expect.arrayContaining(['Select visible', 'Invert visible', 'Clear selected']),
    )

    wrapper.unmount()
  })
})
