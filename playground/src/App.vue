<script setup lang="ts">
import { computed, h, ref, type VNodeChild } from 'vue'
import { Table as ATable, type TableColumnType } from 'ant-design-vue'
import { ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import { VTable, type ColumnType } from '@vtable-guild/table'

type ComparisonMode = 'antdv' | 'element-plus'
type FilterValue = string | number | boolean

interface FilterOption {
  text: string
  value: FilterValue
  children?: FilterOption[]
}

interface DemoRow {
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

interface DropdownLikeProps {
  selectedKeys: FilterValue[]
  setSelectedKeys: (keys: FilterValue[]) => void
  confirm: (options?: { closeDropdown?: boolean }) => void
  clearFilters?: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
  close: () => void
}

const dataSource: DemoRow[] = [
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

const cityFilters: FilterOption[] = [
  { text: 'New York', value: 'New York' },
  { text: 'Chicago', value: 'Chicago' },
  { text: 'London', value: 'London' },
  { text: 'Paris', value: 'Paris' },
  { text: 'Sydney', value: 'Sydney' },
  { text: 'Tokyo', value: 'Tokyo' },
]

const statusFilters: FilterOption[] = [
  { text: 'Active', value: 'Active' },
  { text: 'Paused', value: 'Paused' },
  { text: 'Draft', value: 'Draft' },
]

const teamFilters: FilterOption[] = [
  { text: 'Platform', value: 'Platform' },
  { text: 'Commerce', value: 'Commerce' },
  { text: 'Design Systems', value: 'Design Systems' },
  { text: 'Operations', value: 'Operations' },
]

const roleFilters: FilterOption[] = [
  { text: 'Frontend Engineer', value: 'Frontend Engineer' },
  { text: 'Product Analyst', value: 'Product Analyst' },
  { text: 'Visual Designer', value: 'Visual Designer' },
  { text: 'Research Lead', value: 'Research Lead' },
  { text: 'QA Architect', value: 'QA Architect' },
  { text: 'Solutions Architect', value: 'Solutions Architect' },
  { text: 'UX Writer', value: 'UX Writer' },
  { text: 'Data Analyst', value: 'Data Analyst' },
]

const regionTreeFilters: FilterOption[] = [
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

const comparisonMode = ref<ComparisonMode>('antdv')
const controlledTeamFilter = ref<FilterValue[]>(['Platform'])
const referenceDropdownOpen = ref(false)
const vtableDropdownOpen = ref(false)
const forcedHighlight = ref(true)

const currentThemePreset = computed(() =>
  comparisonMode.value === 'element-plus' ? 'element-plus' : undefined,
)

const paritySummary = computed(() =>
  comparisonMode.value === 'antdv' ? '12 / 12 real native parity' : '3 / 12 real native parity',
)

function compareText(field: keyof DemoRow) {
  return (a: DemoRow, b: DemoRow) => String(a[field]).localeCompare(String(b[field]))
}

function compareNumber(field: keyof DemoRow) {
  return (a: DemoRow, b: DemoRow) => Number(a[field]) - Number(b[field])
}

function matchField(field: keyof DemoRow) {
  return (value: FilterValue, row: DemoRow) => String(row[field]) === String(value)
}

function matchRegionOrCity(value: FilterValue, row: DemoRow) {
  return row.region === value || row.city === value
}

function isSelected(keys: FilterValue[], value: FilterValue) {
  return keys.some((item) => String(item) === String(value))
}

function toggleKeys(keys: FilterValue[], value: FilterValue, multiple: boolean = true) {
  if (!multiple) return isSelected(keys, value) ? [] : [value]
  if (isSelected(keys, value)) {
    return keys.filter((item) => String(item) !== String(value))
  }
  return [...keys, value]
}

function renderIconChip(label: string, filtered: boolean): VNodeChild {
  return h(
    'span',
    {
      class: ['play-icon-chip', filtered && 'is-active'],
    },
    label,
  )
}

function renderChoiceDropdown(
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
  syncControlledTeam(filters.team)
}

function onVTableControlledChange(
  _pagination: unknown,
  filters: Record<string, FilterValue[] | null>,
) {
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
</script>

<template>
  <main class="play-shell">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Filter Matrix Playground</p>
        <h1>筛选 API 全量对照</h1>
        <p class="play-summary">
          全部测试案例改为筛选功能点。每个案例都保留可排序列，专门观察筛选图标、下拉层与排序控件在同一表头中的共存
          UI。
        </p>
      </div>

      <div class="play-switch">
        <button
          type="button"
          class="play-switch__button"
          :class="{ 'is-active': comparisonMode === 'antdv' }"
          @click="comparisonMode = 'antdv'"
        >
          antdv 基准
        </button>
        <button
          type="button"
          class="play-switch__button"
          :class="{ 'is-active el': comparisonMode === 'element-plus' }"
          @click="comparisonMode = 'element-plus'"
        >
          element-plus 基准
        </button>
      </div>
    </section>

    <section class="play-metrics">
      <article class="play-metric-card">
        <span class="play-metric-card__label">Case count</span>
        <strong>12</strong>
        <p>筛选 API 每个功能点一个案例。</p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Parity</span>
        <strong>{{ paritySummary }}</strong>
        <p>
          {{
            comparisonMode === 'antdv'
              ? 'ant-design-vue 可做完整高级筛选对照。'
              : 'element-plus 只保留基础能力真实对照，其余用说明卡。'
          }}
        </p>
      </article>
      <article class="play-metric-card">
        <span class="play-metric-card__label">Focus</span>
        <strong>Sort + Filter header UI</strong>
        <p>优先核对表头图标位置、激活态、下拉偏移与排序箭头并存布局。</p>
      </article>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">01</p>
          <h2>基础多选筛选</h2>
        </div>
        <p class="play-case__desc">验证点：多选选中态、筛选图标位置、同列表头排序箭头共存。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>真实原生对照</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antMultiColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable multi', ...args)"
          />
          <ElTable v-else :data="dataSource" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="160" sortable />
            <ElTableColumn
              prop="city"
              label="City"
              width="210"
              sortable
              column-key="city"
              :filters="cityFilters"
              :filter-method="(value: FilterValue, row: DemoRow) => matchField('city')(value, row)"
            />
            <ElTableColumn prop="score" label="Score" width="110" align="right" sortable />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>真实验证目标</p>
          </div>
          <VTable
            :columns="vtableMultiColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">05</p>
          <h2>筛选搜索</h2>
        </div>
        <p class="play-case__desc">
          验证点：长筛选项搜索、面板输入区域样式、与排序箭头的间距关系。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antSearchColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable filter search', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>最新官方 table 文档没有 `ElTableColumn` 原生筛选搜索面板的能力说明。</p>
            <p>若要实现类似交互，通常需要自己在 header slot 里拼 UI，不属于原生对位。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`filterSearch`</p>
          </div>
          <VTable
            :columns="vtableSearchColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">06</p>
          <h2>树形筛选</h2>
        </div>
        <p class="play-case__desc">
          验证点：树形节点缩进、父子选项呈现、排序控件与树形过滤图标共存。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antTreeColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable tree filter', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 筛选示例只覆盖平铺菜单，没有 `tree` 模式的原生筛选面板。</p>
            <p>这里保留说明，不用自定义 slot 去掩盖差异。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`filterMode: 'tree'`</p>
          </div>
          <VTable
            :columns="vtableTreeColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">07</p>
          <h2>表级自定义筛选图标</h2>
        </div>
        <p class="play-case__desc">验证点：图标替换、激活色、同一列排序箭头与自定义图标的排列。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>
              {{ comparisonMode === 'antdv' ? '近似对照：列级 filterIcon' : '文档能力边界说明' }}
            </p>
          </div>
          <p v-if="comparisonMode === 'antdv'" class="play-inline-note">
            antdv 没有表级 `customFilterIcon` slot，这里用列级 `filterIcon` 做最接近的 UI 参考。
          </p>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antTableIconApproxColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable table icon approx', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档未提供筛选图标自定义 API，也没有表级 icon slot 的原生能力。</p>
            <p>如需类似效果，需要自建 header 渲染。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>table slot `#customFilterIcon`</p>
          </div>
          <VTable
            :columns="vtableTableIconColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          >
            <template #customFilterIcon="{ filtered }">
              <span class="play-icon-chip" :class="{ 'is-active': filtered }">slot</span>
            </template>
          </VTable>
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">08</p>
          <h2>列级自定义筛选图标</h2>
        </div>
        <p class="play-case__desc">
          验证点：列级 icon 渲染优先级、激活态、排序与筛选图标宽度分配。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antColumnIconColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable column icon', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 筛选 API 没有列级 `filterIcon` 入口，因此这里不做伪造对照。</p>
            <p>右侧只验证 `VTable` 的列级图标渲染优先级。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`column.filterIcon`</p>
          </div>
          <VTable
            :columns="vtableColumnIconColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">02</p>
          <h2>单选筛选</h2>
        </div>
        <p class="play-case__desc">验证点：单选行为、面板选中反馈、筛选与排序共存时的表头密度。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>真实原生对照</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antSingleColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable single', ...args)"
          />
          <ElTable v-else :data="dataSource" style="width: 100%">
            <ElTableColumn prop="name" label="Name" width="160" sortable />
            <ElTableColumn
              prop="status"
              label="Status"
              width="210"
              sortable
              column-key="status"
              :filters="statusFilters"
              :filter-method="
                (value: FilterValue, row: DemoRow) => matchField('status')(value, row)
              "
              :filter-multiple="false"
            />
            <ElTableColumn prop="score" label="Score" width="110" align="right" sortable />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`filterMultiple: false`</p>
          </div>
          <VTable
            :columns="vtableSingleColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">03</p>
          <h2>受控筛选值</h2>
        </div>
        <p class="play-case__desc">验证点：外部状态切换、筛选高亮同步、手动交互后受控状态回写。</p>
      </header>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="setControlledTeam([])">
          Clear
        </button>
        <button type="button" class="play-ghost-button" @click="setControlledTeam(['Platform'])">
          Platform
        </button>
        <button type="button" class="play-ghost-button" @click="setControlledTeam(['Commerce'])">
          Commerce
        </button>
        <button
          type="button"
          class="play-ghost-button"
          @click="setControlledTeam(['Platform', 'Design Systems'])"
        >
          Platform + Design Systems
        </button>
      </div>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>真实受控筛选</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antControlledColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="onAntControlledChange"
          />
          <ElTable
            v-else
            :data="dataSource"
            style="width: 100%"
            @filter-change="onElementControlledFilterChange"
          >
            <ElTableColumn prop="name" label="Name" width="160" sortable />
            <ElTableColumn
              prop="team"
              label="Team"
              width="210"
              sortable
              column-key="team"
              :filters="teamFilters"
              :filter-method="(value: FilterValue, row: DemoRow) => matchField('team')(value, row)"
              :filtered-value="controlledTeamFilter"
            />
            <ElTableColumn prop="score" label="Score" width="110" align="right" sortable />
            <ElTableColumn prop="address" label="Address" show-overflow-tooltip />
          </ElTable>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`filteredValue`</p>
          </div>
          <VTable
            :columns="vtableControlledColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableControlledChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">04</p>
          <h2>默认筛选与重置回默认</h2>
        </div>
        <p class="play-case__desc">验证点：初始筛选命中、Reset 后是否回到默认值而不是完全清空。</p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antDefaultResetColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable default reset', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>
              官方表格文档覆盖 `filters`、`filter-method`、`filter-multiple`、`filtered-value`，
              但没有 `filterResetToDefaultFilteredValue` 的原生对位。
            </p>
            <p>左侧不做伪实现，避免把额外业务逻辑误判为组件能力。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`defaultFilteredValue + filterResetToDefaultFilteredValue`</p>
          </div>
          <VTable
            :columns="vtableDefaultResetColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">09</p>
          <h2>表级自定义筛选下拉</h2>
        </div>
        <p class="play-case__desc">
          验证点：自定义面板结构、按钮排布、操作区与默认表头 UI 的衔接。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>
              {{
                comparisonMode === 'antdv' ? '近似对照：列级 filterDropdown' : '文档能力边界说明'
              }}
            </p>
          </div>
          <p v-if="comparisonMode === 'antdv'" class="play-inline-note">
            antdv 使用列级 `filterDropdown`；右侧是 `VTable` 的表级 slot。
          </p>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antTableDropdownApproxColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="
              (...args: unknown[]) => onReferenceChange('ATable table dropdown approx', ...args)
            "
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档没有原生自定义筛选面板入口。</p>
            <p>如果强行模拟，需要自己在表头里做 popover 与状态同步，这不属于原生组件能力。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>table slot `#customFilterDropdown`</p>
          </div>
          <VTable
            :columns="vtableTableDropdownColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          >
            <template
              #customFilterDropdown="{
                selectedKeys,
                setSelectedKeys,
                confirm,
                clearFilters,
                column,
              }"
            >
              <div class="play-filter-menu">
                <p class="play-filter-menu__eyebrow">Table-level slot</p>
                <h4 class="play-filter-menu__title">{{ column.title }} / shared slot</h4>
                <div class="play-filter-token-grid">
                  <button
                    v-for="item in teamFilters"
                    :key="String(item.value)"
                    type="button"
                    class="play-filter-token"
                    :class="{ 'is-active': isSelected(selectedKeys, item.value) }"
                    @click="setSelectedKeys(toggleKeys(selectedKeys, item.value))"
                  >
                    {{ item.text }}
                  </button>
                </div>
                <div class="play-filter-actions">
                  <button
                    type="button"
                    class="play-ghost-button"
                    @click="clearFilters({ confirm: true })"
                  >
                    Reset
                  </button>
                  <button type="button" class="play-solid-button" @click="confirm()">Apply</button>
                </div>
              </div>
            </template>
          </VTable>
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">10</p>
          <h2>列级自定义筛选下拉</h2>
        </div>
        <p class="play-case__desc">
          验证点：列级 dropdown 渲染优先级、单选面板排版、排序与面板入口的间距。
        </p>
      </header>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antColumnDropdownColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable column dropdown', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>`ElTableColumn` 文档没有列级 `filterDropdown` 回调式 API。</p>
            <p>右侧用真实列级 dropdown，左侧保持说明卡，避免混入手写替身。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`column.filterDropdown`</p>
          </div>
          <VTable
            :columns="vtableColumnDropdownColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">11</p>
          <h2>受控下拉显隐</h2>
        </div>
        <p class="play-case__desc">
          验证点：外部打开/关闭、图标点击回调、受控显隐状态与表头 UI 一致性。
        </p>
      </header>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="openBothDropdowns()">
          Open panel
        </button>
        <button type="button" class="play-ghost-button" @click="closeBothDropdowns()">
          Close panel
        </button>
      </div>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antControlledOpenColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable controlled open', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档没有筛选面板开关的受控属性说明。</p>
            <p>这种能力通常只能通过自建表头 popover 状态完成。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`filterDropdownOpen + onFilterDropdownOpenChange`</p>
          </div>
          <VTable
            :columns="vtableControlledOpenColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>

    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">12</p>
          <h2>高亮态覆盖</h2>
        </div>
        <p class="play-case__desc">
          验证点：无真实筛选值时强制点亮图标，检查视觉反馈与数据状态是否解耦。
        </p>
      </header>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="forcedHighlight = !forcedHighlight">
          Highlight: {{ forcedHighlight ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="play-compare-grid">
        <article class="play-panel">
          <div class="play-panel__head">
            <div>
              <span class="play-badge">reference</span>
              <h3>{{ comparisonMode === 'antdv' ? 'ant-design-vue' : 'element-plus' }}</h3>
            </div>
            <p>{{ comparisonMode === 'antdv' ? '真实原生对照' : '文档能力边界说明' }}</p>
          </div>
          <ATable
            v-if="comparisonMode === 'antdv'"
            :columns="antFilteredOverrideColumns"
            :data-source="dataSource"
            :pagination="false"
            @change="(...args: unknown[]) => onReferenceChange('ATable filtered override', ...args)"
          />
          <div v-else class="play-note-card">
            <p class="play-note-card__eyebrow">No native parity</p>
            <h3>element-plus</h3>
            <p>官方 table 文档没有暴露独立于实际筛选值的 `filtered` 高亮覆盖属性。</p>
            <p>右侧单独验证 `VTable` 是否能把视觉高亮与数据过滤状态解耦。</p>
          </div>
        </article>

        <article class="play-panel play-panel--accent">
          <div class="play-panel__head">
            <div>
              <span class="play-badge play-badge--accent">vtable-guild</span>
              <h3>{{ comparisonMode === 'antdv' ? 'antdv preset' : 'element-plus preset' }}</h3>
            </div>
            <p>`filtered` override</p>
          </div>
          <VTable
            :columns="vtableFilteredOverrideColumns"
            :data-source="dataSource"
            :theme-preset="currentThemePreset"
            @change="onVTableChange"
          />
        </article>
      </div>
    </section>
  </main>
</template>

<style>
.play-shell {
  --play-bg: #f6efe3;
  --play-panel: rgb(255 252 246 / 94%);
  --play-panel-strong: #fffdf7;
  --play-ink: #1d241e;
  --play-muted: #6b6f63;
  --play-line: rgb(35 43 36 / 12%);
  --play-accent: #ba5b32;
  --play-accent-soft: rgb(186 91 50 / 14%);
  --play-green: #2e5e4e;

  min-height: 100vh;
  padding: 32px;
  color: var(--play-ink);
  background:
    radial-gradient(circle at top left, rgb(255 255 255 / 65%), transparent 28%),
    linear-gradient(135deg, #efe6d6 0%, #f6efe3 42%, #ece6da 100%);
  font-family: 'Segoe UI', sans-serif;
}

.play-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 28px;
  border: 1px solid var(--play-line);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgb(255 252 246 / 96%), rgb(247 241 230 / 90%)), var(--play-panel);
  box-shadow: 0 18px 55px rgb(42 36 28 / 8%);
}

.play-hero h1 {
  margin: 6px 0 10px;
  font-family: 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: clamp(2rem, 3vw, 3.2rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.play-kicker {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-summary {
  max-width: 760px;
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.65;
  color: var(--play-muted);
}

.play-switch {
  display: grid;
  gap: 10px;
  min-width: 220px;
}

.play-switch__button {
  border: 1px solid rgb(39 45 39 / 16%);
  border-radius: 999px;
  padding: 11px 16px;
  background: rgb(255 255 255 / 54%);
  color: var(--play-ink);
  font-size: 0.92rem;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.play-switch__button:hover {
  transform: translateY(-1px);
}

.play-switch__button.is-active {
  background: #1677ff;
  border-color: #1677ff;
  color: #ffffff;
}

.play-switch__button.is-active.el {
  background: #409eff;
  border-color: #409eff;
}

.play-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.play-metric-card {
  padding: 18px 20px;
  border: 1px solid var(--play-line);
  border-radius: 22px;
  background: var(--play-panel);
  box-shadow: 0 12px 30px rgb(42 36 28 / 6%);
}

.play-metric-card__label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-muted);
}

.play-metric-card strong {
  display: block;
  font-size: 1.18rem;
  font-weight: 700;
  line-height: 1.2;
}

.play-metric-card p {
  margin: 8px 0 0;
  line-height: 1.55;
  color: var(--play-muted);
}

.play-case {
  margin-top: 22px;
  padding: 22px;
  border: 1px solid var(--play-line);
  border-radius: 26px;
  background: rgb(255 252 246 / 78%);
  box-shadow: 0 14px 40px rgb(42 36 28 / 5%);
}

.play-case__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;
}

.play-case__index {
  margin: 0 0 8px;
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-case__header h2 {
  margin: 0;
  font-family: 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: 1.45rem;
  line-height: 1.1;
}

.play-case__desc {
  max-width: 460px;
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--play-muted);
}

.play-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.play-compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.play-panel {
  padding: 18px;
  border: 1px solid var(--play-line);
  border-radius: 22px;
  background: var(--play-panel-strong);
  overflow: hidden;
}

.play-panel--accent {
  border-color: rgb(186 91 50 / 22%);
  background: linear-gradient(180deg, rgb(255 249 245 / 100%), rgb(255 252 246 / 100%));
}

.play-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.play-panel__head h3 {
  margin: 6px 0 0;
  font-size: 1rem;
}

.play-panel__head p {
  margin: 4px 0 0;
  font-size: 0.83rem;
  line-height: 1.45;
  color: var(--play-muted);
  text-align: right;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgb(29 36 30 / 7%);
  color: var(--play-green);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.play-badge--accent {
  background: var(--play-accent-soft);
  color: var(--play-accent);
}

.play-inline-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-left: 3px solid rgb(186 91 50 / 48%);
  background: rgb(186 91 50 / 8%);
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--play-muted);
}

.play-note-card {
  display: grid;
  gap: 10px;
  min-height: 230px;
  align-content: start;
  padding: 18px;
  border: 1px dashed rgb(39 45 39 / 22%);
  border-radius: 18px;
  background: linear-gradient(180deg, rgb(244 239 229 / 78%), rgb(255 252 246 / 92%));
}

.play-note-card__eyebrow {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-note-card h3 {
  margin: 0;
  font-size: 1rem;
}

.play-note-card p {
  margin: 0;
  line-height: 1.65;
  color: var(--play-muted);
}

.play-ghost-button,
.play-solid-button,
.play-filter-token {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.84rem;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.play-ghost-button {
  border: 1px solid rgb(39 45 39 / 16%);
  background: rgb(255 255 255 / 70%);
  color: var(--play-ink);
}

.play-solid-button {
  border: 1px solid var(--play-accent);
  background: var(--play-accent);
  color: #ffffff;
}

.play-icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(29 36 30 / 8%);
  color: var(--play-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.play-icon-chip.is-active {
  background: rgb(186 91 50 / 16%);
  color: var(--play-accent);
}

.play-filter-menu {
  width: 240px;
  padding: 16px;
  border: 1px solid rgb(39 45 39 / 14%);
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf8, #f5efe5);
  box-shadow: 0 16px 36px rgb(40 31 24 / 14%);
}

.play-filter-menu__eyebrow {
  margin: 0 0 6px;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--play-accent);
}

.play-filter-menu__title {
  margin: 0 0 12px;
  font-size: 0.92rem;
  line-height: 1.35;
}

.play-filter-token-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.play-filter-token {
  border: 1px solid rgb(39 45 39 / 14%);
  background: rgb(255 255 255 / 76%);
  color: var(--play-ink);
}

.play-filter-token.is-active {
  border-color: rgb(186 91 50 / 42%);
  background: rgb(186 91 50 / 12%);
  color: var(--play-accent);
}

.play-ghost-button:hover,
.play-solid-button:hover,
.play-filter-token:hover {
  transform: translateY(-1px);
}

.play-filter-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
}

@media (width <= 1080px) {
  .play-compare-grid,
  .play-metrics,
  .play-case__header,
  .play-hero {
    grid-template-columns: 1fr;
  }

  .play-panel__head {
    flex-direction: column;
  }

  .play-panel__head p {
    text-align: left;
  }
}

@media (width <= 720px) {
  .play-shell {
    padding: 16px;
  }

  .play-hero,
  .play-case,
  .play-panel,
  .play-metric-card {
    padding: 16px;
  }

  .play-filter-menu {
    width: min(240px, calc(100vw - 60px));
  }
}
</style>
