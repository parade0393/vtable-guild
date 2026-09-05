import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'
import { VTableSummary, EXPAND_COLUMN, SELECTION_COLUMN, VTable as VTableExport } from '../index'
import type { ColumnsType, TableProps } from '../types'

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

function mountTable(columns: ColumnsType<DemoRow>, extraProps: Partial<TableProps<DemoRow>> = {}) {
  return mount(VTable<DemoRow>, {
    attachTo: document.body,
    props: {
      rowKey: 'key',
      columns,
      dataSource,
      ...extraProps,
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

function hasHeaderEllipsisClass(wrapper: VueWrapper, title: string) {
  return findTableHeaderCell(wrapper, title).find('.vtg-whitespace-nowrap').exists()
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
  const handle = cell.find('.vtg-cursor-col-resize')

  if (!handle.exists()) {
    throw new Error(`Resize handle not found: ${title}`)
  }

  return handle
}

function findScrollWrap(wrapper: VueWrapper) {
  const wrap = wrapper
    .findAll('div')
    .find(
      (item) =>
        item.classes().includes('vtg-scrollbar-none') && item.classes().includes('vtg-h-full'),
    )

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

  it('keeps header text wrapping by default when column ellipsis is enabled', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Long Long Long Header',
        key: 'name',
        dataIndex: 'name',
        ellipsis: true,
      },
    ]

    const wrapper = mountTable(columns)

    expect(hasHeaderEllipsisClass(wrapper, 'Long Long Long Header')).toBe(false)

    wrapper.unmount()
  })

  it('applies header ellipsis only to ellipsis columns when headerEllipsis is enabled', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Long Long Long Header',
        key: 'name',
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: 'Another Long Long Long Header',
        key: 'status',
        dataIndex: 'status',
      },
    ]

    const wrapper = mountTable(columns, {
      headerEllipsis: true,
    })

    expect(hasHeaderEllipsisClass(wrapper, 'Long Long Long Header')).toBe(true)
    expect(hasHeaderEllipsisClass(wrapper, 'Another Long Long Long Header')).toBe(false)

    wrapper.unmount()
  })

  it('keeps sorter and filter controls visible when header ellipsis is enabled', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Sortable Long Long Long Header',
        key: 'name',
        dataIndex: 'name',
        ellipsis: true,
        sorter: true,
      },
      {
        title: 'Filterable Long Long Long Header',
        key: 'status',
        dataIndex: 'status',
        ellipsis: true,
        filters: [
          { text: 'Active', value: 'active' },
          { text: 'Paused', value: 'paused' },
        ],
        onFilter: (value, record) => record.status === value,
      },
    ]

    const wrapper = mountTable(columns, {
      headerEllipsis: true,
    })

    const sortableHeader = findTableHeaderCell(wrapper, 'Sortable Long Long Long Header')
    const filterableHeader = findTableHeaderCell(wrapper, 'Filterable Long Long Long Header')

    expect(hasHeaderEllipsisClass(wrapper, 'Sortable Long Long Long Header')).toBe(true)
    expect(sortableHeader.find('[aria-hidden="true"]').exists()).toBe(true)
    expect(hasHeaderEllipsisClass(wrapper, 'Filterable Long Long Long Header')).toBe(true)
    expect(filterableHeader.find('[aria-label="筛选"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('does not apply header ellipsis to grouped header cells', () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Grouped Long Long Long Header',
        key: 'group',
        children: [
          {
            title: 'Child Long Long Long Header',
            key: 'name',
            dataIndex: 'name',
            ellipsis: true,
          },
        ],
      },
    ]

    const wrapper = mountTable(columns, {
      headerEllipsis: true,
    })

    expect(hasHeaderEllipsisClass(wrapper, 'Grouped Long Long Long Header')).toBe(false)
    expect(hasHeaderEllipsisClass(wrapper, 'Child Long Long Long Header')).toBe(true)

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

  it('applies antdv sorted background classes to the active sort column', async () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name' },
      { title: 'Age', key: 'age', dataIndex: 'age', sorter: true },
    ]

    const wrapper = mountTable(columns)

    await findTableHeaderCell(wrapper, 'Age').trigger('click')
    await nextTick()

    const ageHeader = findTableHeaderCell(wrapper, 'Age')
    const ageCells = getBodyRows(wrapper).map((row) => row.findAll('td')[1])
    const sortedBodyCells = ageCells.every((cell) =>
      cell.classes().includes('vtg-bg-[color:var(--vtg-table-body-sort-bg)]'),
    )

    expect(ageHeader.classes()).toContain('vtg-bg-[color:var(--vtg-table-header-sort-bg)]')
    expect(sortedBodyCells).toBe(true)

    wrapper.unmount()
  })

  it('shows sorter tooltip from the whole grouped header leaf cell', async () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Profile',
        key: 'profile',
        children: [
          {
            title: 'Age',
            key: 'age',
            dataIndex: 'age',
            sorter: true,
            filters: [
              { text: 'Active', value: 'active' },
              { text: 'Paused', value: 'paused' },
            ],
            onFilter: (value, record) => record.status === value,
          },
        ],
      },
    ]

    const wrapper = mountTable(columns)

    await findTableHeaderCell(wrapper, 'Age').trigger('mouseenter')
    await nextTick()

    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('点击升序')

    const filterTrigger = wrapper.get('[aria-label="筛选"]').element.parentElement
    if (!filterTrigger) {
      throw new Error('Filter trigger wrapper not found')
    }

    filterTrigger.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

    filterTrigger.dispatchEvent(new MouseEvent('mouseleave'))
    await nextTick()

    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('点击升序')

    await findTableHeaderCell(wrapper, 'Age').trigger('mouseleave')
    await nextTick()

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

    wrapper.unmount()
  })

  it('uses clickable hover styling for custom filter icons without sorter', () => {
    const columns: ColumnsType<DemoRow> = [
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

    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns,
        dataSource,
      },
      slots: {
        customFilterIcon: () => h('span', { 'data-testid': 'custom-filter-icon' }, 'filter'),
      },
    })

    const trigger = wrapper.get('[aria-label="筛选"]')
    expect(trigger.classes()).toEqual(
      expect.arrayContaining(['vtg-cursor-pointer', 'hover:vtg-bg-black/6']),
    )

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

  it('keeps tree filter search data intact and highlights matching nodes only', async () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        filters: [
          {
            text: 'Active group',
            value: 'active-group',
            children: [{ text: 'Active', value: 'active' }],
          },
          {
            text: 'Paused group',
            value: 'paused-group',
            children: [{ text: 'Paused', value: 'paused' }],
          },
        ],
        filterMode: 'tree',
        filterSearch: true,
        onFilter: (value, record) => record.status === value,
      },
    ]

    const wrapper = mountTable(columns)

    await wrapper.get('[aria-label="筛选"]').trigger('click')
    await nextTick()

    const input = document.body.querySelector('input')
    if (!input) {
      throw new Error('Filter search input not found')
    }

    input.value = 'Active'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    const optionTexts = Array.from(document.body.querySelectorAll('li')).map((item) =>
      item.textContent?.trim(),
    )
    const activeLabel = Array.from(document.body.querySelectorAll('span')).find(
      (item) => item.textContent?.trim() === 'Active',
    )

    expect(optionTexts).toEqual(
      expect.arrayContaining(['Active group', 'Active', 'Paused group', 'Paused']),
    )
    expect(activeLabel?.classList.contains('vtg-font-medium')).toBe(true)

    wrapper.unmount()
  })

  it('continues to filter menu mode options when filterSearch is enabled', async () => {
    const columns: ColumnsType<DemoRow> = [
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        filters: [
          { text: 'Active', value: 'active' },
          { text: 'Paused', value: 'paused' },
        ],
        filterSearch: true,
        onFilter: (value, record) => record.status === value,
      },
    ]

    const wrapper = mountTable(columns)

    await wrapper.get('[aria-label="筛选"]').trigger('click')
    await nextTick()

    const input = document.body.querySelector('input')
    if (!input) {
      throw new Error('Filter search input not found')
    }

    input.value = 'Active'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    const optionTexts = Array.from(document.body.querySelectorAll('li')).map((item) =>
      item.textContent?.trim(),
    )

    expect(optionTexts).toEqual(['Active'])

    wrapper.unmount()
  })

  it('closes table-level custom filter dropdown when clicking outside', async () => {
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
            filters: [
              { text: 'Active', value: 'active' },
              { text: 'Paused', value: 'paused' },
            ],
            customFilterDropdown: true,
            onFilter: (value, record) => record.status === value,
          },
        ],
        dataSource,
      },
      slots: {
        customFilterDropdown: () =>
          h('div', { 'data-testid': 'table-custom-filter' }, 'Table custom filter'),
      },
    })

    await wrapper.get('[aria-label="筛选"]').trigger('click')
    await nextTick()
    await nextTick()

    expect(document.body.querySelector('[data-testid="table-custom-filter"]')).not.toBeNull()

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()

    expect(document.body.querySelector('[data-testid="table-custom-filter"]')).toBeNull()

    wrapper.unmount()
  })

  it('closes column-level custom filter dropdown when clicking outside', async () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name' },
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        filterDropdown: () =>
          h('div', { 'data-testid': 'column-custom-filter' }, 'Column custom filter'),
      },
    ]
    const wrapper = mountTable(columns)

    await wrapper.get('[aria-label="筛选"]').trigger('click')
    await nextTick()
    await nextTick()

    expect(document.body.querySelector('[data-testid="column-custom-filter"]')).not.toBeNull()

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()

    expect(document.body.querySelector('[data-testid="column-custom-filter"]')).toBeNull()

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

    expect(findTableHeaderCell(wrapper, 'Name').classes()).not.toContain('after:vtg-absolute')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).toContain('after:vtg-absolute')

    wrapElement.scrollLeft = 120
    await scrollWrap.trigger('scroll')
    await nextTick()

    expect(findTableHeaderCell(wrapper, 'Name').classes()).toContain('after:vtg-absolute')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).toContain('after:vtg-absolute')

    wrapElement.scrollLeft = 400
    await scrollWrap.trigger('scroll')
    await nextTick()

    expect(findTableHeaderCell(wrapper, 'Name').classes()).toContain('after:vtg-absolute')
    expect(findTableHeaderCell(wrapper, 'Status').classes()).not.toContain('after:vtg-absolute')

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

  it('preserves row dividers for virtual windows, expanded rows, and the actual last item', async () => {
    const virtualData = Array.from({ length: 120 }, (_, index) => ({
      key: `divider-${index}`,
      name: `User ${index}`,
      age: 20 + (index % 30),
      status: index % 2 === 0 ? 'active' : 'paused',
    })) satisfies DemoRow[]
    const wrapper = mount(VTable<DemoRow>, {
      attachTo: document.body,
      props: {
        rowKey: 'key',
        columns: baseColumns,
        dataSource: virtualData,
        bordered: true,
        scroll: { y: 220 },
        virtual: true,
        expandable: {
          expandRowByClick: true,
          expandedRowRender: (record) => `expanded:${record.name}`,
        },
      },
    })

    await nextTick()

    let bodySections = wrapper.findAll('tbody')
    expect(bodySections.length).toBeLessThan(virtualData.length)
    expect(
      bodySections.every((tbody) => tbody.attributes('data-vtg-preserve-last-border') === ''),
    ).toBe(true)

    await bodySections[0].get('tr').trigger('click')
    await nextTick()

    bodySections = wrapper.findAll('tbody')
    expect(bodySections[0].findAll('tr')).toHaveLength(2)
    expect(bodySections[0].attributes('data-vtg-preserve-last-border')).toBe('')

    const virtualList = wrapper.findComponent({ name: 'VirtualList' })
    const exposed = virtualList.vm.$.exposed as { scrollTo: (config: { top: number }) => void }
    exposed.scrollTo({ top: 999_999 })
    await nextTick()

    bodySections = wrapper.findAll('tbody')
    expect(bodySections.at(-1)?.text()).toContain('User 119')
    expect(bodySections.at(-1)?.attributes('data-vtg-preserve-last-border')).toBeUndefined()

    await bodySections.at(-1)?.get('tr').trigger('click')
    await nextTick()
    expect(wrapper.findAll('tbody').at(-1)?.findAll('tr')).toHaveLength(2)
    expect(
      wrapper.findAll('tbody').at(-1)?.attributes('data-vtg-preserve-last-border'),
    ).toBeUndefined()

    wrapper.unmount()
  })

  it('does not add virtual divider state to a regular table body', () => {
    const wrapper = mountTable(baseColumns, { bordered: true })

    expect(wrapper.findAll('tbody')).toHaveLength(1)
    expect(wrapper.get('tbody').attributes('data-vtg-preserve-last-border')).toBeUndefined()

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

    expect(wrapper.find('[aria-label="Open filters"]').exists()).toBe(true)

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

  it('applies sticky positioning to fixed columns without edge shadows at rest', () => {
    const columns: ColumnsType<DemoRow> = [
      { title: 'Name', key: 'name', dataIndex: 'name', fixed: 'left', width: 120 },
      { title: 'Age', key: 'age', dataIndex: 'age', width: 400 },
      { title: 'Status', key: 'status', dataIndex: 'status', fixed: 'right', width: 100 },
    ]
    const wrapper = mountTable(columns, { scroll: { x: 900 } })

    const firstRowCells = getBodyRows(wrapper)[0].findAll('td')
    const nameCell = firstRowCells[0]
    const statusCell = firstRowCells[2]

    // 左固定列：sticky + left 偏移
    expect(nameCell.attributes('style')).toContain('position: sticky')
    expect(nameCell.attributes('style')).toContain('left: 0px')
    // 右固定列：sticky + right 偏移
    expect(statusCell.attributes('style')).toContain('position: sticky')
    expect(statusCell.attributes('style')).toContain('right: 0px')
    // 未滚动（同时处于起点与终点）时两侧阴影都不出现
    expect(nameCell.classes().join(' ')).not.toContain('shadow')
    expect(statusCell.classes().join(' ')).not.toContain('shadow')
    // 非固定列不带 sticky
    expect(firstRowCells[1].attributes('style') ?? '').not.toContain('sticky')

    wrapper.unmount()
  })

  describe('column placement sentinels', () => {
    it('places EXPAND_COLUMN at sentinel position when expandable is enabled', () => {
      const columns: ColumnsType<DemoRow> = [
        baseColumns[0],
        EXPAND_COLUMN,
        baseColumns[1],
        baseColumns[2],
      ]
      const wrapper = mountTable(columns, {
        expandable: {
          expandedRowRender: (record) => h('p', record.name),
        },
      })

      const headers = wrapper.findAll('thead th')
      // header titles: ['Name', '', 'Age', 'Status'] — second cell is the empty expand column
      expect(headers[0].text()).toBe('Name')
      expect(headers[1].text()).toBe('')
      expect(headers[2].text()).toBe('Age')
      expect(headers[3].text()).toBe('Status')

      // body row: first non-data cell is the expand trigger at index 1
      const firstRow = wrapper.findAll('tbody tr')[0]
      const cells = firstRow.findAll('td')
      // Expand-icon column is at second visible position
      expect(cells[1].find('button[aria-label="Expand row"]').exists()).toBe(true)

      wrapper.unmount()
    })

    it('places SELECTION_COLUMN at sentinel position when rowSelection is enabled', () => {
      const columns: ColumnsType<DemoRow> = [
        baseColumns[0],
        baseColumns[1],
        SELECTION_COLUMN,
        baseColumns[2],
      ]
      const wrapper = mountTable(columns, {
        rowSelection: { type: 'checkbox' },
      })

      const headers = wrapper.findAll('thead th')
      // header order: Name, Age, <selection>, Status
      expect(headers[0].text()).toBe('Name')
      expect(headers[1].text()).toBe('Age')
      expect(headers[3].text()).toBe('Status')
      // selection column header has the select-all checkbox
      expect(headers[2].find('[role="checkbox"]').exists()).toBe(true)

      const firstRow = wrapper.findAll('tbody tr')[0]
      const cells = firstRow.findAll('td')
      // body row checkbox is at index 2
      expect(cells[2].find('[role="checkbox"]').exists()).toBe(true)

      wrapper.unmount()
    })

    it('drops sentinel when its corresponding feature is disabled, and dedupes repeats', () => {
      const columns: ColumnsType<DemoRow> = [
        EXPAND_COLUMN, // no expandable → silently dropped
        baseColumns[0],
        SELECTION_COLUMN,
        baseColumns[1],
        SELECTION_COLUMN, // duplicate → only the first is honored
        baseColumns[2],
      ]
      const wrapper = mountTable(columns, {
        rowSelection: { type: 'checkbox' },
      })

      const headers = wrapper.findAll('thead th')
      // expected order: Name, <selection>, Age, Status — no expand col
      expect(headers).toHaveLength(4)
      expect(headers[0].text()).toBe('Name')
      expect(headers[1].find('[role="checkbox"]').exists()).toBe(true)
      expect(headers[2].text()).toBe('Age')
      expect(headers[3].text()).toBe('Status')

      wrapper.unmount()
    })

    it('exposes EXPAND_COLUMN / SELECTION_COLUMN as static properties on VTable', () => {
      // Mirrors the SELECTION_ALL / SELECTION_INVERT / SELECTION_NONE static-property pattern.
      const VTableWithStatics = VTableExport as unknown as {
        EXPAND_COLUMN: typeof EXPAND_COLUMN
        SELECTION_COLUMN: typeof SELECTION_COLUMN
      }
      expect(VTableWithStatics.EXPAND_COLUMN).toBe(EXPAND_COLUMN)
      expect(VTableWithStatics.SELECTION_COLUMN).toBe(SELECTION_COLUMN)
    })
  })
})
