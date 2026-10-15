import { computed, h, proxyRefs, ref, type VNode } from 'vue'
import type { TableColumnType } from 'ant-design-vue'
import type { ColumnType } from '@vtable-guild/vtable-guild'

export type FilterValue = string | number | boolean

/**
 * 筛选项。value 用 FilterValue，和 vtable 的 ColumnFilterItem 对齐。
 */
export interface FilterOption {
  text: string
  value: FilterValue
  children?: FilterOption[]
}

/**
 * element-plus 的 `filters` prop 只接受 `{ text: string; value: string }[]`，
 * 比 vtable 的 ColumnFilterItem 窄。演示数据里的筛选值本来就全是字符串，
 * 所以喂给 element-plus 的列表用这个收窄类型声明（仍可赋给 ColumnFilterItem）。
 */
export interface TextFilterOption {
  text: string
  value: string
  children?: TextFilterOption[]
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
  /**
   * setSelectedKeys / confirm 用方法语法而不是属性语法声明：
   * ant-design-vue 的形参是 `Key[]` / `{ closeDropdown: boolean }`，
   * vtable 的形参是 `FilterValue[]` / `{ closeDropdown?: boolean }`，
   * 两组类型互不为子类型。方法语法走双变参数检查，两边都能赋值，运行时不受影响。
   */
  setSelectedKeys(keys: FilterValue[]): void
  confirm(options?: { closeDropdown?: boolean }): void
  clearFilters?: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
  close: () => void
}

/**
 * `proxyRefs()` 只解包顶层 ref / computed，读取时拿到的就是值本身，
 * 所以这里直接描述「解包后」的类型：模板里 `state.antControlledColumns` 是数组。
 */
export interface FilterMatrixState {
  controlledTeamFilter: FilterValue[]
  referenceDropdownOpen: boolean
  vtableDropdownOpen: boolean
  forcedHighlight: boolean
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
  onVTableControlledChange: (filters: Record<string, FilterValue[] | null>) => void
  onElementControlledFilterChange: (filters: Record<string, FilterValue[]>) => void
  antMultiColumns: TableColumnType<DemoRow>[]
  antSingleColumns: TableColumnType<DemoRow>[]
  antControlledColumns: TableColumnType<DemoRow>[]
  antDefaultResetColumns: TableColumnType<DemoRow>[]
  antSearchColumns: TableColumnType<DemoRow>[]
  antTreeColumns: TableColumnType<DemoRow>[]
  antTreeSearchColumns: TableColumnType<DemoRow>[]
  antTableIconApproxColumns: TableColumnType<DemoRow>[]
  antColumnIconColumns: TableColumnType<DemoRow>[]
  antTableDropdownApproxColumns: TableColumnType<DemoRow>[]
  antColumnDropdownColumns: TableColumnType<DemoRow>[]
  antControlledOpenColumns: TableColumnType<DemoRow>[]
  antFilteredOverrideColumns: TableColumnType<DemoRow>[]
  vtableMultiColumns: ColumnType<DemoRow>[]
  vtableSingleColumns: ColumnType<DemoRow>[]
  vtableControlledColumns: ColumnType<DemoRow>[]
  vtableDefaultResetColumns: ColumnType<DemoRow>[]
  vtableSearchColumns: ColumnType<DemoRow>[]
  vtableTreeColumns: ColumnType<DemoRow>[]
  vtableTreeSearchColumns: ColumnType<DemoRow>[]
  vtableTableIconColumns: ColumnType<DemoRow>[]
  vtableColumnIconColumns: ColumnType<DemoRow>[]
  vtableTableDropdownColumns: ColumnType<DemoRow>[]
  vtableColumnDropdownColumns: ColumnType<DemoRow>[]
  vtableControlledOpenColumns: ColumnType<DemoRow>[]
  vtableFilteredOverrideColumns: ColumnType<DemoRow>[]
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

export const ellipsisDemoRows: DemoRow[] = dataSource.slice(0, 4).map((row, index) => ({
  ...row,
  role:
    index % 2 === 0 ? `${row.role} / Interaction Steward` : `${row.role} / Operations Coordination`,
  address: `${row.address} / Documentation Archive Corridor / Unit ${index + 11} / Long Text Validation Segment`,
}))

export const ellipsisDemoColumns: ColumnType<DemoRow>[] = [
  { title: 'Name', dataIndex: 'name', key: 'ellipsis-name', width: 140 },
  { title: 'Team', dataIndex: 'team', key: 'ellipsis-team', width: 140 },
  {
    title: 'Long Column Long Column Long Column Long Column Long Column Long Column',
    dataIndex: 'role',
    key: 'ellipsis-role',
    width: 180,
    ellipsis: true,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'ellipsis-address',
    width: 260,
    ellipsis: true,
  },
]

export const cityFilters: TextFilterOption[] = [
  { text: 'New York', value: 'New York' },
  { text: 'Chicago', value: 'Chicago' },
  { text: 'London', value: 'London' },
  { text: 'Paris', value: 'Paris' },
  { text: 'Sydney', value: 'Sydney' },
  { text: 'Tokyo', value: 'Tokyo' },
]

export const statusFilters: TextFilterOption[] = [
  { text: 'Active', value: 'Active' },
  { text: 'Paused', value: 'Paused' },
  { text: 'Draft', value: 'Draft' },
]

export const teamFilters: TextFilterOption[] = [
  { text: 'Platform', value: 'Platform' },
  { text: 'Commerce', value: 'Commerce' },
  { text: 'Design Systems', value: 'Design Systems' },
  { text: 'Operations', value: 'Operations' },
]

export const roleFilters: TextFilterOption[] = [
  { text: 'Frontend Engineer', value: 'Frontend Engineer' },
  { text: 'Product Analyst', value: 'Product Analyst' },
  { text: 'Visual Designer', value: 'Visual Designer' },
  { text: 'Research Lead', value: 'Research Lead' },
  { text: 'QA Architect', value: 'QA Architect' },
  { text: 'Solutions Architect', value: 'Solutions Architect' },
  { text: 'UX Writer', value: 'UX Writer' },
  { text: 'Data Analyst', value: 'Data Analyst' },
]

export const regionTreeFilters: TextFilterOption[] = [
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

export function renderIconChip(label: string, filtered: boolean): VNode {
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
  // 先解构出必填字段，剩下的用 rest 展开：`...options` 覆盖的是同一批键，
  // 直接写成 `{ title: ..., ...options }` 会触发 TS2783「键被重复指定」。
  // 结果对象与展开顺序完全一致，运行时行为不变。
  const { title, dataIndex: field, key, ...rest } = options
  return {
    title,
    dataIndex: field,
    key,
    width: 210,
    sorter: compareText(field),
    ...rest,
  }
}

function createVTableFilterColumn(
  options: Partial<ColumnType<DemoRow>> & { title: string; dataIndex: keyof DemoRow; key: string },
): ColumnType<DemoRow> {
  // 同 createAntFilterColumn：解构必填字段后用 rest 展开，避开 TS2783。
  const { title, dataIndex: field, key, ...rest } = options
  return {
    title,
    dataIndex: field,
    key,
    width: 210,
    sorter: compareText(field),
    ...rest,
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

  function onVTableControlledChange(filters: Record<string, FilterValue[] | null>) {
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

  const antTreeSearchColumns = createAntColumns(
    createAntFilterColumn({
      title: 'Region / City',
      dataIndex: 'city',
      key: 'region-tree-search',
      filters: regionTreeFilters,
      filterMode: 'tree',
      filterSearch: true,
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

  const vtableTreeSearchColumns = createVTableColumns(
    createVTableFilterColumn({
      title: 'Region / City',
      dataIndex: 'city',
      key: 'region-tree-search',
      filters: regionTreeFilters,
      filterMode: 'tree',
      filterSearch: true,
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
      filterDropdown: (props) =>
        renderChoiceDropdown(props, 'Status / column api', statusFilters, false),
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

  // proxyRefs 而不是 reactive：reactive() 的返回值类型 UnwrapNestedRefs 会一路
  // 展开列配置里自引用的 VNodeChild 联合，撞上 TS 实例化深度上限报 TS2589；
  // proxyRefs 只做一层浅解包，类型正好就是 FilterMatrixState。
  // 本对象的 ref / computed 全在顶层、没有嵌套 ref，两者运行时行为一致。
  return proxyRefs({
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
    antTreeSearchColumns,
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
    vtableTreeSearchColumns,
    vtableTableIconColumns,
    vtableColumnIconColumns,
    vtableTableDropdownColumns,
    vtableColumnDropdownColumns,
    vtableControlledOpenColumns,
    vtableFilteredOverrideColumns,
  }) as FilterMatrixState
}
