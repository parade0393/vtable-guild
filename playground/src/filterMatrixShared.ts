import { computed, h, reactive, ref, type ComputedRef, type Ref, type VNodeChild } from 'vue'
import type { TableColumnType } from 'ant-design-vue'
import type { ColumnType } from '@vtable-guild/table'

export type FilterValue = string | number | boolean

export interface FilterOption {
  text: string
  value: FilterValue
  children?: FilterOption[]
}

export interface DemoRow {
  key: number
  name: string
  age: number
  score: number
  city: string
  region: string
  team: string
  status: string
  role: string
  address: string
}

export interface DropdownLikeProps {
  selectedKeys: FilterValue[]
  setSelectedKeys: (keys: FilterValue[]) => void
  confirm: (options?: { closeDropdown?: boolean }) => void
  clearFilters?: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
  close: () => void
}

export interface FilterMatrixState {
  controlledTeamFilter: Ref<FilterValue[]>
  referenceDropdownOpen: Ref<boolean>
  vtableDropdownOpen: Ref<boolean>
  forcedHighlight: Ref<boolean>
  setControlledTeam: (values: FilterValue[]) => void
  openBothDropdowns: () => void
  closeBothDropdowns: () => void
  toggleForcedHighlight: () => void
  onReferenceChange: (label: string, ...args: unknown[]) => void
  onVTableChange: (...args: unknown[]) => void
  onAntControlledChange: (
    _pagination: unknown,
    filters: Record<string, FilterValue[] | null>,
  ) => void
  onVTableControlledChange: (
    _pagination: unknown,
    filters: Record<string, FilterValue[] | null>,
  ) => void
  onElementControlledFilterChange: (filters: Record<string, FilterValue[]>) => void
  antMultiColumns: TableColumnType<DemoRow>[]
  antSingleColumns: TableColumnType<DemoRow>[]
  antControlledColumns: ComputedRef<TableColumnType<DemoRow>[]>
  antDefaultResetColumns: TableColumnType<DemoRow>[]
  antSearchColumns: TableColumnType<DemoRow>[]
  antTreeColumns: TableColumnType<DemoRow>[]
  antTableIconApproxColumns: TableColumnType<DemoRow>[]
  antColumnIconColumns: TableColumnType<DemoRow>[]
  antTableDropdownApproxColumns: TableColumnType<DemoRow>[]
  antColumnDropdownColumns: TableColumnType<DemoRow>[]
  antControlledOpenColumns: ComputedRef<TableColumnType<DemoRow>[]>
  antFilteredOverrideColumns: ComputedRef<TableColumnType<DemoRow>[]>
  vtableMultiColumns: ColumnType<DemoRow>[]
  vtableSingleColumns: ColumnType<DemoRow>[]
  vtableControlledColumns: ComputedRef<ColumnType<DemoRow>[]>
  vtableDefaultResetColumns: ColumnType<DemoRow>[]
  vtableSearchColumns: ColumnType<DemoRow>[]
  vtableTreeColumns: ColumnType<DemoRow>[]
  vtableTableIconColumns: ColumnType<DemoRow>[]
  vtableColumnIconColumns: ColumnType<DemoRow>[]
  vtableTableDropdownColumns: ColumnType<DemoRow>[]
  vtableColumnDropdownColumns: ColumnType<DemoRow>[]
  vtableControlledOpenColumns: ComputedRef<ColumnType<DemoRow>[]>
  vtableFilteredOverrideColumns: ComputedRef<ColumnType<DemoRow>[]>
}

export const dataSource: DemoRow[] = [
  {
    key: 1,
    name: 'Aya Stone',
    age: 27,
    score: 92,
    city: 'New York',
    region: 'North America',
    team: 'Platform',
    status: 'Active',
    role: 'Frontend Engineer',
    address: 'New York / Guild Studio 1',
  },
  {
    key: 2,
    name: 'Milo Hart',
    age: 34,
    score: 88,
    city: 'Chicago',
    region: 'North America',
    team: 'Commerce',
    status: 'Paused',
    role: 'Product Analyst',
    address: 'Chicago / Stockroom 7',
  },
  {
    key: 3,
    name: 'Inez Vale',
    age: 41,
    score: 97,
    city: 'London',
    region: 'Europe',
    team: 'Design Systems',
    status: 'Active',
    role: 'Visual Designer',
    address: 'London / Token Office 4',
  },
  {
    key: 4,
    name: 'Ren Moss',
    age: 38,
    score: 76,
    city: 'Paris',
    region: 'Europe',
    team: 'Operations',
    status: 'Draft',
    role: 'Research Lead',
    address: 'Paris / River Dock 2',
  },
  {
    key: 5,
    name: 'Sora Blue',
    age: 31,
    score: 84,
    city: 'Sydney',
    region: 'APAC',
    team: 'Platform',
    status: 'Active',
    role: 'QA Architect',
    address: 'Sydney / Harbour Lab 6',
  },
  {
    key: 6,
    name: 'Theo Grant',
    age: 45,
    score: 90,
    city: 'Tokyo',
    region: 'APAC',
    team: 'Commerce',
    status: 'Active',
    role: 'Solutions Architect',
    address: 'Tokyo / Neon Tower 9',
  },
  {
    key: 7,
    name: 'Lina Cross',
    age: 29,
    score: 81,
    city: 'Berlin',
    region: 'Europe',
    team: 'Design Systems',
    status: 'Paused',
    role: 'UX Writer',
    address: 'Berlin / Pattern Block 5',
  },
  {
    key: 8,
    name: 'Omar Reed',
    age: 36,
    score: 79,
    city: 'Toronto',
    region: 'North America',
    team: 'Platform',
    status: 'Draft',
    role: 'Data Analyst',
    address: 'Toronto / North Hub 3',
  },
]

export const cityFilters: FilterOption[] = [
  { text: 'New York', value: 'New York' },
  { text: 'Chicago', value: 'Chicago' },
  { text: 'London', value: 'London' },
  { text: 'Paris', value: 'Paris' },
  { text: 'Sydney', value: 'Sydney' },
  { text: 'Tokyo', value: 'Tokyo' },
]

export const statusFilters: FilterOption[] = [
  { text: 'Active', value: 'Active' },
  { text: 'Paused', value: 'Paused' },
  { text: 'Draft', value: 'Draft' },
]

export const teamFilters: FilterOption[] = [
  { text: 'Platform', value: 'Platform' },
  { text: 'Commerce', value: 'Commerce' },
  { text: 'Design Systems', value: 'Design Systems' },
  { text: 'Operations', value: 'Operations' },
]

export const roleFilters: FilterOption[] = [
  { text: 'Frontend Engineer', value: 'Frontend Engineer' },
  { text: 'Product Analyst', value: 'Product Analyst' },
  { text: 'Visual Designer', value: 'Visual Designer' },
  { text: 'Research Lead', value: 'Research Lead' },
  { text: 'QA Architect', value: 'QA Architect' },
  { text: 'Solutions Architect', value: 'Solutions Architect' },
  { text: 'UX Writer', value: 'UX Writer' },
  { text: 'Data Analyst', value: 'Data Analyst' },
]

export const regionTreeFilters: FilterOption[] = [
  {
    text: 'North America',
    value: 'North America',
    children: [
      { text: 'New York', value: 'New York' },
      { text: 'Chicago', value: 'Chicago' },
      { text: 'Toronto', value: 'Toronto' },
    ],
  },
  {
    text: 'Europe',
    value: 'Europe',
    children: [
      { text: 'London', value: 'London' },
      { text: 'Paris', value: 'Paris' },
      { text: 'Berlin', value: 'Berlin' },
    ],
  },
  {
    text: 'APAC',
    value: 'APAC',
    children: [
      { text: 'Sydney', value: 'Sydney' },
      { text: 'Tokyo', value: 'Tokyo' },
    ],
  },
]

export function compareText(field: keyof DemoRow) {
  return (a: DemoRow, b: DemoRow) => String(a[field]).localeCompare(String(b[field]))
}

export function compareNumber(field: keyof DemoRow) {
  return (a: DemoRow, b: DemoRow) => Number(a[field]) - Number(b[field])
}

export function matchField(field: keyof DemoRow) {
  return (value: FilterValue, row: DemoRow) => String(row[field]) === String(value)
}

export function matchRegionOrCity(value: FilterValue, row: DemoRow) {
  return row.region === value || row.city === value
}

export function isSelected(keys: FilterValue[], value: FilterValue) {
  return keys.some((item) => String(item) === String(value))
}

export function toggleKeys(keys: FilterValue[], value: FilterValue, multiple: boolean = true) {
  if (!multiple) return isSelected(keys, value) ? [] : [value]
  if (isSelected(keys, value)) {
    return keys.filter((item) => String(item) !== String(value))
  }
  return [...keys, value]
}

export function renderIconChip(label: string, filtered: boolean): VNodeChild {
  return h(
    'span',
    {
      class: ['play-icon-chip', filtered && 'is-active'],
    },
    label,
  )
}

export function renderChoiceDropdown(
  props: DropdownLikeProps,
  title: string,
  filters: FilterOption[],
  multiple: boolean = true,
) {
  return h('div', { class: 'play-filter-menu' }, [
    h('p', { class: 'play-filter-menu__eyebrow' }, multiple ? 'Custom dropdown' : 'Single select'),
    h('h4', { class: 'play-filter-menu__title' }, title),
    h(
      'div',
      { class: 'play-filter-token-grid' },
      filters.map((item) =>
        h(
          'button',
          {
            type: 'button',
            class: ['play-filter-token', isSelected(props.selectedKeys, item.value) && 'is-active'],
            onClick: () => {
              props.setSelectedKeys(toggleKeys(props.selectedKeys, item.value, multiple))
            },
          },
          item.text,
        ),
      ),
    ),
    h('div', { class: 'play-filter-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'play-ghost-button',
          onClick: () => {
            props.clearFilters?.({ confirm: true })
          },
        },
        'Reset',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'play-solid-button',
          onClick: () => {
            props.confirm()
          },
        },
        'Apply',
      ),
    ]),
  ])
}

function createAntColumns(filterColumn: TableColumnType<DemoRow>): TableColumnType<DemoRow>[] {
  return [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 160, sorter: compareText('name') },
    filterColumn,
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 110,
      align: 'right',
      sorter: compareNumber('score'),
    },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
  ]
}

function createVTableColumns(filterColumn: ColumnType<DemoRow>): ColumnType<DemoRow>[] {
  return [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 160, sorter: compareText('name') },
    filterColumn,
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 110,
      align: 'right',
      sorter: compareNumber('score'),
    },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
  ]
}

function createAntFilterColumn(
  options: Partial<TableColumnType<DemoRow>> & {
    title: string
    dataIndex: keyof DemoRow
    key: string
  },
): TableColumnType<DemoRow> {
  const field = options.dataIndex
  return {
    title: options.title,
    dataIndex: field,
    key: options.key,
    width: 210,
    sorter: compareText(field),
    ...options,
  }
}

function createVTableFilterColumn(
  options: Partial<ColumnType<DemoRow>> & { title: string; dataIndex: keyof DemoRow; key: string },
): ColumnType<DemoRow> {
  const field = options.dataIndex
  return {
    title: options.title,
    dataIndex: field,
    key: options.key,
    width: 210,
    sorter: compareText(field),
    ...options,
  }
}

export function useFilterMatrixState(): FilterMatrixState {
  const controlledTeamFilter = ref<FilterValue[]>(['Platform'])
  const referenceDropdownOpen = ref(false)
  const vtableDropdownOpen = ref(false)
  const forcedHighlight = ref(true)

  function syncControlledTeam(values: FilterValue[] | null | undefined) {
    controlledTeamFilter.value = values ? [...values] : []
  }

  function setControlledTeam(values: FilterValue[]) {
    controlledTeamFilter.value = [...values]
  }

  function openBothDropdowns() {
    referenceDropdownOpen.value = true
    vtableDropdownOpen.value = true
  }

  function closeBothDropdowns() {
    referenceDropdownOpen.value = false
    vtableDropdownOpen.value = false
  }

  function toggleForcedHighlight() {
    forcedHighlight.value = !forcedHighlight.value
  }

  function onReferenceChange(label: string, ...args: unknown[]) {
    console.log(`[${label}]`, ...args)
  }

  function onVTableChange(...args: unknown[]) {
    console.log('[VTable change]', ...args)
  }

  function onAntControlledChange(
    _pagination: unknown,
    filters: Record<string, FilterValue[] | null>,
  ) {
    console.log(filters)
    syncControlledTeam(filters.team)
  }

  function onVTableControlledChange(
    _pagination: unknown,
    filters: Record<string, FilterValue[] | null>,
  ) {
    console.log(filters)
    syncControlledTeam(filters.team)
  }

  function onElementControlledFilterChange(filters: Record<string, FilterValue[]>) {
    syncControlledTeam(filters.team)
  }

  const antMultiColumns = createAntColumns(
    createAntFilterColumn({
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      filters: cityFilters,
      onFilter: matchField('city'),
    }),
  )

  const vtableMultiColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      filters: cityFilters,
      onFilter: matchField('city'),
    }),
  )

  const antSingleColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: statusFilters,
      filterMultiple: false,
      onFilter: matchField('status'),
    }),
  )

  const vtableSingleColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: statusFilters,
      filterMultiple: false,
      onFilter: matchField('status'),
    }),
  )

  const antControlledColumns = computed(() =>
    createAntColumns(
      createAntFilterColumn({
        title: 'Team',
        dataIndex: 'team',
        key: 'team',
        filters: teamFilters,
        filteredValue: controlledTeamFilter.value.length ? controlledTeamFilter.value : null,
        onFilter: matchField('team'),
      }),
    ),
  )

  const vtableControlledColumns = computed(() =>
    createVTableColumns(
      createVTableFilterColumn({
        title: 'Team',
        dataIndex: 'team',
        key: 'team',
        filters: teamFilters,
        filteredValue: controlledTeamFilter.value.length ? controlledTeamFilter.value : null,
        onFilter: matchField('team'),
      }),
    ),
  )

  const antDefaultResetColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'status-default',
      filters: statusFilters,
      defaultFilteredValue: ['Active'],
      filterResetToDefaultFilteredValue: true,
      onFilter: matchField('status'),
    }),
  )

  const vtableDefaultResetColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'status-default',
      filters: statusFilters,
      defaultFilteredValue: ['Active'],
      filterResetToDefaultFilteredValue: true,
      onFilter: matchField('status'),
    }),
  )

  const antSearchColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Role',
      dataIndex: 'role',
      key: 'role-search',
      filters: roleFilters,
      filterSearch: true,
      onFilter: matchField('role'),
    }),
  )

  const vtableSearchColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Role',
      dataIndex: 'role',
      key: 'role-search',
      filters: roleFilters,
      filterSearch: true,
      onFilter: matchField('role'),
    }),
  )

  const antTreeColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Region / City',
      dataIndex: 'city',
      key: 'region-tree',
      filters: regionTreeFilters,
      filterMode: 'tree',
      onFilter: matchRegionOrCity,
    }),
  )

  const vtableTreeColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Region / City',
      dataIndex: 'city',
      key: 'region-tree',
      filters: regionTreeFilters,
      filterMode: 'tree',
      onFilter: matchRegionOrCity,
    }),
  )

  const antTableIconApproxColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Team',
      dataIndex: 'team',
      key: 'table-icon-approx',
      filters: teamFilters,
      filterIcon: ({ filtered }) => renderIconChip('A.slot', filtered),
      onFilter: matchField('team'),
    }),
  )

  const vtableTableIconColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Team',
      dataIndex: 'team',
      key: 'table-icon-slot',
      filters: teamFilters,
      onFilter: matchField('team'),
    }),
  )

  const antColumnIconColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'column-icon',
      filters: statusFilters,
      filterIcon: ({ filtered }) => renderIconChip('A.col', filtered),
      onFilter: matchField('status'),
    }),
  )

  const vtableColumnIconColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'column-icon',
      filters: statusFilters,
      filterIcon: ({ filtered }) => renderIconChip('V.col', filtered),
      onFilter: matchField('status'),
    }),
  )

  const antTableDropdownApproxColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Team',
      dataIndex: 'team',
      key: 'table-dropdown-approx',
      filters: teamFilters,
      filterDropdown: (props) =>
        renderChoiceDropdown(props, 'Team / approximated by column api', teamFilters),
      onFilter: matchField('team'),
    }),
  )

  const vtableTableDropdownColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Team',
      dataIndex: 'team',
      key: 'table-dropdown-slot',
      filters: teamFilters,
      customFilterDropdown: true,
      onFilter: matchField('team'),
    }),
  )

  const antColumnDropdownColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'column-dropdown',
      filters: statusFilters,
      filterDropdown: (props) =>
        renderChoiceDropdown(props, 'Status / column api', statusFilters, false),
      onFilter: matchField('status'),
    }),
  )

  const vtableColumnDropdownColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Status',
      dataIndex: 'status',
      key: 'column-dropdown',
      filters: statusFilters,
      customFilterDropdown: true,
      onFilter: matchField('status'),
    }),
  )

  const antControlledOpenColumns = computed(() =>
    createAntColumns(
      createAntFilterColumn({
        title: 'Role',
        dataIndex: 'role',
        key: 'controlled-open',
        filters: roleFilters,
        filterDropdownOpen: referenceDropdownOpen.value,
        onFilterDropdownOpenChange: (visible: boolean) => {
          referenceDropdownOpen.value = visible
        },
        onFilter: matchField('role'),
      }),
    ),
  )

  const vtableControlledOpenColumns = computed(() =>
    createVTableColumns(
      createVTableFilterColumn({
        title: 'Role',
        dataIndex: 'role',
        key: 'controlled-open',
        filters: roleFilters,
        filterDropdownOpen: vtableDropdownOpen.value,
        onFilterDropdownOpenChange: (visible: boolean) => {
          vtableDropdownOpen.value = visible
        },
        onFilter: matchField('role'),
      }),
    ),
  )

  const antFilteredOverrideColumns = computed(() =>
    createAntColumns(
      createAntFilterColumn({
        title: 'Team',
        dataIndex: 'team',
        key: 'filtered-override',
        filters: teamFilters,
        filtered: forcedHighlight.value,
        onFilter: matchField('team'),
      }),
    ),
  )

  const vtableFilteredOverrideColumns = computed(() =>
    createVTableColumns(
      createVTableFilterColumn({
        title: 'Team',
        dataIndex: 'team',
        key: 'filtered-override',
        filters: teamFilters,
        filtered: forcedHighlight.value,
        onFilter: matchField('team'),
      }),
    ),
  )

  return reactive({
    controlledTeamFilter,
    referenceDropdownOpen,
    vtableDropdownOpen,
    forcedHighlight,
    setControlledTeam,
    openBothDropdowns,
    closeBothDropdowns,
    toggleForcedHighlight,
    onReferenceChange,
    onVTableChange,
    onAntControlledChange,
    onVTableControlledChange,
    onElementControlledFilterChange,
    antMultiColumns,
    antSingleColumns,
    antControlledColumns,
    antDefaultResetColumns,
    antSearchColumns,
    antTreeColumns,
    antTableIconApproxColumns,
    antColumnIconColumns,
    antTableDropdownApproxColumns,
    antColumnDropdownColumns,
    antControlledOpenColumns,
    antFilteredOverrideColumns,
    vtableMultiColumns,
    vtableSingleColumns,
    vtableControlledColumns,
    vtableDefaultResetColumns,
    vtableSearchColumns,
    vtableTreeColumns,
    vtableTableIconColumns,
    vtableColumnIconColumns,
    vtableTableDropdownColumns,
    vtableColumnDropdownColumns,
    vtableControlledOpenColumns,
    vtableFilteredOverrideColumns,
  }) as FilterMatrixState
}
