import type * as Public from '@vtable-guild/vtable-guild'
import type { ApiEntry, EventEntry, VueSlotEntry } from './types'

// 名称类型取自公开入口：字段改名或删除时，site type-check 会直接报错。
// `as const` 保留字面量名称，供 contracts.typecheck.ts 校验各功能的字段集合是否齐全。
type StripOn<K> = K extends `on${infer N}` ? Uncapitalize<N> : never

type TablePropName = keyof Public.TableProps & string
type ColumnFieldName = keyof Public.ColumnType & string
type RowSelectionFieldName = keyof Public.RowSelection & string
type EventName = StripOn<keyof Public.VTableEventProps>
type VueSlotName = keyof Public.TableSlotsDecl & string

const typeRef = (anchor: string) => `/guide/type-reference#${anchor}`

export const tableProps = [
  {
    name: 'rowKey',
    type: 'string | ((record: TRecord) => Key)',
    default: "`'key'`",
    description: '行唯一标识。选择状态按行 key 记录，必须稳定且唯一。',
    descriptionEn:
      'Unique row identity. Selection state is recorded by row key, so it must be stable and unique.',
    features: ['selection'],
  },
  {
    name: 'rowSelection',
    type: 'RowSelection<TRecord>',
    typeHref: typeRef('rowselection'),
    description: '开启行选择列，字段见[行选择 · RowSelection](/guide/selection#rowselection)。',
    descriptionEn:
      'Enables the row selection column; for its fields, see [Row selection · RowSelection](/en/guide/selection#rowselection).',
    features: ['selection'],
  },
  {
    name: 'showSorterTooltip',
    type: 'boolean | TableTooltipConfig',
    typeHref: '/guide/cell-display#tabletooltipconfig',
    default: '`antdv` 为 `true`，`element-plus` 为 `false`',
    defaultEn: '`true` for `antdv`, `false` for `element-plus`',
    description: '表级排序提示配置，可被列级 `showSorterTooltip` 覆盖。',
    descriptionEn:
      'Table-level sorter tooltip config; a column-level `showSorterTooltip` overrides it.',
    features: ['sorting'],
  },
  {
    name: 'sortDirections',
    type: 'SortOrder[]',
    typeHref: typeRef('sortorder'),
    default: "`['ascend', 'descend']`",
    description: '表级排序方向列表，作为列级 `sortDirections` 的默认值。',
    descriptionEn:
      'Table-level list of sort directions, used as the default for column-level `sortDirections`.',
    features: ['sorting'],
  },
  {
    name: 'manual',
    type: 'boolean | TableManualConfig',
    default: '`false`',
    description:
      '`true` 跳过本地排序、筛选和分页切片；对象形式分别设置 `sort`、`filter`、`pagination`。表头状态和 `change` 事件继续工作，见[远程数据](/guide/remote-data)。',
    descriptionEn:
      '`true` skips local sorting, filtering and pagination slicing; the object form sets `sort`, `filter` and `pagination` separately. Header state and the `change` event keep working; see [Remote data and requests](/en/guide/remote-data).',
    features: ['sorting', 'filtering'],
  },
  {
    name: 'getPopupContainer',
    type: '(triggerNode: HTMLElement) => HTMLElement',
    description: '筛选、选择和页大小菜单的挂载容器。',
    descriptionEn: 'Mount container for the filter, selection and page-size menus.',
    features: ['filtering', 'selection'],
  },
] as const satisfies readonly ApiEntry<TablePropName>[]

export const columnFields = [
  {
    name: 'sorter',
    type: 'ColumnSorter<TRecord>',
    typeHref: typeRef('columnsorter'),
    description: '开启排序；支持默认比较、自定义比较函数和多列排序对象。',
    descriptionEn:
      'Enables sorting; supports the default comparison, a custom compare function and a multi-column sort object.',
    features: ['sorting'],
  },
  {
    name: 'sortOrder',
    type: 'SortOrder',
    typeHref: typeRef('sortorder'),
    description: '受控排序方向。',
    descriptionEn: 'Controlled sort direction.',
    features: ['sorting'],
  },
  {
    name: 'defaultSortOrder',
    type: 'SortOrder',
    typeHref: typeRef('sortorder'),
    description: '非受控列初始化时的排序方向。',
    descriptionEn: 'Sort direction an uncontrolled column is initialized with.',
    features: ['sorting'],
  },
  {
    name: 'sortDirections',
    type: 'SortOrder[]',
    default: '继承表级配置',
    defaultEn: 'Inherits the table-level setting',
    description: "当前列可用排序方向。传入空数组时使用 `['ascend', 'descend']`。",
    descriptionEn:
      "Sort directions available for this column. An empty array falls back to `['ascend', 'descend']`.",
    features: ['sorting'],
  },
  {
    name: 'showSorterTooltip',
    type: 'boolean | TableTooltipConfig',
    typeHref: '/guide/cell-display#tabletooltipconfig',
    default: '继承表级配置',
    defaultEn: 'Inherits the table-level setting',
    description: '列级排序提示开关与配置。',
    descriptionEn: 'Column-level sorter tooltip switch and config.',
    features: ['sorting'],
  },
  {
    name: 'filters',
    type: 'ColumnFilterItem[] | boolean',
    description: '`true` 从 `valueEnum` 生成选项，`false` 不提供选项，也可以传入自定义数组。',
    descriptionEn:
      '`true` generates the options from `valueEnum`, `false` provides no options; you can also pass a custom array.',
    features: ['filtering'],
  },
  {
    name: 'onFilter',
    type: 'boolean | ((value: string | number | boolean, record: TRecord) => boolean)',
    description: '`true` 使用默认匹配规则，函数自定义匹配规则，`false` 跳过本地筛选。',
    descriptionEn:
      '`true` uses the default matching rule, a function defines a custom one, and `false` skips local filtering.',
    features: ['filtering'],
  },
  {
    name: 'filterMultiple',
    type: 'boolean',
    default: '`true`',
    description: '是否支持多选筛选。',
    descriptionEn: 'Whether multiple filter values can be selected.',
    features: ['filtering'],
  },
  {
    name: 'filteredValue',
    type: 'Array<string | number | boolean> | null',
    description: '受控筛选值；`null` 和 `[]` 都表示受控且无筛选值。',
    descriptionEn:
      'Controlled filter values; `null` and `[]` both mean controlled with no filter value.',
    features: ['filtering'],
  },
  {
    name: 'defaultFilteredValue',
    type: 'Array<string | number | boolean>',
    description: '非受控默认筛选值。',
    descriptionEn: 'Uncontrolled default filter values.',
    features: ['filtering'],
  },
  {
    name: 'customFilterDropdown',
    type: 'boolean',
    default: '`false`',
    description: '使用表级 `customFilterDropdown` slot。',
    descriptionEn: 'Uses the table-level `customFilterDropdown` slot.',
    features: ['filtering'],
  },
  {
    name: 'filterSearch',
    type: 'boolean | ((input: string, filter: ColumnFilterItem) => boolean)',
    default: '`false`',
    description: '筛选项搜索。',
    descriptionEn: 'Search within the filter items.',
    features: ['filtering'],
  },
  {
    name: 'filterMode',
    type: "'menu' | 'tree'",
    default: "`'menu'`",
    description: '筛选项展示模式。',
    descriptionEn: 'Display mode of the filter items.',
    features: ['filtering'],
  },
  {
    name: 'filterResetToDefaultFilteredValue',
    type: 'boolean',
    default: '`false`',
    description: '重置时恢复到默认筛选值。',
    descriptionEn: 'Restores the default filter values on reset.',
    features: ['filtering'],
  },
  {
    name: 'filterDropdownOpen',
    type: 'boolean',
    description: '受控筛选下拉可见性。',
    descriptionEn: 'Controlled visibility of the filter dropdown.',
    features: ['filtering'],
  },
  {
    name: 'onFilterDropdownOpenChange',
    type: '(visible: boolean) => void',
    description: '筛选下拉可见性变化回调。',
    descriptionEn: 'Callback when the visibility of the filter dropdown changes.',
    features: ['filtering'],
  },
  {
    name: 'filtered',
    type: 'boolean',
    description: '外部控制筛选图标高亮状态，不改变筛选逻辑。',
    descriptionEn:
      'Controls the highlight state of the filter icon externally; does not change the filtering logic.',
    features: ['filtering'],
  },
  {
    name: 'filterIcon',
    type: '(opt: { filtered: boolean }) => VNodeChild',
    description: '自定义筛选图标。',
    descriptionEn: 'Custom filter icon.',
    features: ['filtering'],
  },
  {
    name: 'filterDropdown',
    type: 'VNodeChild | ((props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild)',
    description: '列级别自定义筛选面板，优先级高于表级 slot。',
    descriptionEn: 'Column-level custom filter panel; takes precedence over the table-level slot.',
    features: ['filtering'],
  },
] as const satisfies readonly ApiEntry<ColumnFieldName>[]

export const rowSelectionFields = [
  {
    name: 'type',
    type: "'checkbox' | 'radio'",
    default: "`'checkbox'`",
    description: '选择类型。',
    descriptionEn: 'Selection type.',
    features: ['selection'],
  },
  {
    name: 'selectedRowKeys',
    type: 'Key[]',
    description: '受控选中 key。',
    descriptionEn: 'Controlled selected keys.',
    features: ['selection'],
  },
  {
    name: 'defaultSelectedRowKeys',
    type: 'Key[]',
    description: '默认选中 key。',
    descriptionEn: 'Default selected keys.',
    features: ['selection'],
  },
  {
    name: 'onChange',
    type: '(selectedRowKeys: Key[], selectedRows: TRecord[]) => void',
    description: '选中项变化回调。',
    descriptionEn: 'Callback when the selection changes.',
    features: ['selection'],
  },
  {
    name: 'onSelect',
    type: '(record: TRecord, selected: boolean, selectedRows: TRecord[]) => void',
    description: '单行选择变化回调。',
    descriptionEn: 'Callback when the selection of a single row changes.',
    features: ['selection'],
  },
  {
    name: 'onSelectMultiple',
    type: '(selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void',
    description: 'Shift 多选变化回调。',
    descriptionEn: 'Callback when a Shift multi-selection changes.',
    features: ['selection'],
  },
  {
    name: 'onSelectAll',
    type: '(selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void',
    description: '全选变化回调。',
    descriptionEn: 'Callback when select-all changes.',
    features: ['selection'],
  },
  {
    name: 'onSelectInvert',
    type: '(selectedRowKeys: Key[]) => void',
    description: '反选回调。',
    descriptionEn: 'Callback when the selection is inverted.',
    features: ['selection'],
  },
  {
    name: 'onSelectNone',
    type: '() => void',
    description: '清空选择回调。',
    descriptionEn: 'Callback when the selection is cleared.',
    features: ['selection'],
  },
  {
    name: 'getCheckboxProps',
    type: '(record: TRecord) => { disabled?: boolean; name?: string }',
    description: '为选择控件注入属性。',
    descriptionEn: 'Injects attributes into the selection control.',
    features: ['selection'],
  },
  {
    name: 'columnWidth',
    type: 'number | string',
    default: '`48`',
    description: '选择列宽度。',
    descriptionEn: 'Width of the selection column.',
    features: ['selection'],
  },
  {
    name: 'fixed',
    type: "boolean | 'left' | 'right'",
    description: '选择列固定位置。',
    descriptionEn: 'Fixed position of the selection column.',
    features: ['selection'],
  },
  {
    name: 'columnTitle',
    type: 'string | VNodeChild',
    description: '选择列表头内容。',
    descriptionEn: 'Header content of the selection column.',
    features: ['selection'],
  },
  {
    name: 'renderCell',
    type: '(value: boolean, record: TRecord, index: number, originNode: VNodeChild) => VNodeChild | RenderedCell',
    description: '自定义选择单元格。',
    descriptionEn: 'Custom selection cell.',
    features: ['selection'],
  },
  {
    name: 'checkStrictly',
    type: 'boolean',
    default: '`true`',
    description: '树形数据是否父子独立选择。',
    descriptionEn: 'Whether parent and child rows are selected independently in tree data.',
    features: ['selection'],
  },
  {
    name: 'selections',
    type: 'boolean | (SelectionItem | SelectionSentinel)[]',
    default: '`false`',
    description:
      '默认或自定义批量选择菜单；默认菜单常量见 [SelectionSentinel](/guide/type-reference#selectionsentinel)。',
    descriptionEn:
      'Default or custom batch selection menu; for the default menu constants, see [SelectionSentinel](/en/guide/type-reference#selectionsentinel).',
    features: ['selection'],
  },
  {
    name: 'hideSelectAll',
    type: 'boolean',
    default: '`false`',
    description: '隐藏全选 checkbox 和选择下拉。',
    descriptionEn: 'Hides the select-all checkbox and the selection dropdown.',
    features: ['selection'],
  },
  {
    name: 'preserveSelectedRowKeys',
    type: 'boolean',
    default: '`false`',
    description: '数据源变化时保留已选 key。',
    descriptionEn: 'Keeps the selected keys when the data source changes.',
    features: ['selection'],
  },
] as const satisfies readonly ApiEntry<RowSelectionFieldName>[]

export const tableEvents = [
  {
    name: 'change',
    params:
      '(filters: TableFiltersInfo, sorter: VTableSorterResult<TRecord>, extra: TableChangeExtra<TRecord>) => void',
    description:
      "排序、筛选、选择、分页后的统一事件出口；`extra.action` 为 `'sort'`、`'filter'`、`'select'` 或 `'paginate'`。",
    descriptionEn:
      "Single event outlet after sorting, filtering, selection and pagination; `extra.action` is `'sort'`, `'filter'`, `'select'` or `'paginate'`.",
    features: ['sorting', 'filtering', 'selection'],
  },
] as const satisfies readonly EventEntry<EventName>[]

export const vueSlots = [
  {
    name: 'customFilterDropdown',
    params: 'CustomFilterDropdownSlotProps<TRecord>',
    paramsHref: typeRef('customfilterdropdownslotprops'),
    description: '表级自定义筛选面板，列需设置 `customFilterDropdown: true`。',
    descriptionEn:
      'Table-level custom filter panel; the column must set `customFilterDropdown: true`.',
    features: ['filtering'],
  },
  {
    name: 'customFilterIcon',
    params: '{ column: ColumnType<TRecord>; filtered: boolean }',
    description: '表级自定义筛选图标。',
    descriptionEn: 'Table-level custom filter icon.',
    features: ['filtering'],
  },
] as const satisfies readonly VueSlotEntry<VueSlotName>[]
