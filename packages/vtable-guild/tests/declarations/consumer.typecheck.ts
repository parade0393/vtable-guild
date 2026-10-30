// 通过发布入口消费 dist，不继承工作区 paths 或 skipLibCheck。
import {
  VTableSummary,
  VTableSummaryRow,
  VTableSummaryCell,
  createVTableGuild,
  VTableColumnSettings,
  type TableColumnSettingsProps,
  type TableColumnSettingsSlots,
  VTableToolbar,
  type TableToolbarProps,
  type TableToolbarSlots,
  VTable,
  createTableRenderers,
  createTableDictionary,
  useTableDictionary,
  useTableRequest,
  type TableRequestPolling,
  VTableQuery,
  VTableEditCell,
  useTableQuery,
  useTableEditable,
  deriveTableQueryFields,
  type TableQueryField,
  type TableInstance,
  type TableFieldRenderer,
} from '@vtable-guild/vtable-guild'

type SummaryProps = InstanceType<typeof VTableSummary>['$props']
type CellProps = InstanceType<typeof VTableSummary.Cell>['$props']

const _optionalFixed: SummaryProps = {}
const _fixedBottom: SummaryProps = { fixed: 'bottom' }
const _fixedBoolean: SummaryProps = { fixed: true }
// @ts-expect-error fixed only supports boolean, top and bottom
const _invalidFixed: SummaryProps = { fixed: 'left' }

const _cell: CellProps = { index: 0, colSpan: 2, align: 'right' }
// @ts-expect-error summary cells require an index
const _missingIndex: CellProps = {}
// @ts-expect-error align must remain strongly typed
const _invalidAlign: CellProps = { index: 0, align: 'invalid' }
const _rowAlias: typeof VTableSummaryRow = VTableSummary.Row
const _cellAlias: typeof VTableSummaryCell = VTableSummary.Cell

createVTableGuild({ theme: { table: { slots: { root: 'custom-root' } } } })
// @ts-expect-error theme augmentation must reject unknown slots
createVTableGuild({ theme: { table: { slots: { invalidSlot: 'custom-root' } } } })

interface Member {
  id: number
  name: string
}

const _schemaQuery = useTableQuery({ defaultValues: { name: '' } })
type QueryProps = Parameters<typeof VTableQuery<{ name: string }>>[0]
const _schemaProps: QueryProps = {
  query: _schemaQuery,
  fields: [{ name: 'name' }],
  controls: { text: () => null },
}
// @ts-expect-error A schema field must belong to the query values.
const _invalidQueryField: TableQueryField<{ name: string }> = { name: 'missing' }
const _editable = useTableEditable<Member>({
  rowKey: 'id',
  columns: [{ dataIndex: 'name', editor: {} }],
  controls: { text: () => null },
})
type EditCellProps = Parameters<typeof VTableEditCell<Member>>[0]
const _editorCell: EditCellProps = {
  edit: _editable,
  cell: { record: { id: 1, name: 'A' }, column: { dataIndex: 'name' }, text: 'A', index: 0 },
}
const _allDrafts: ReadonlyMap<string | number, Member> = _editable.getDrafts()
const _derivedFields: TableQueryField<{ name: string }>[] = deriveTableQueryFields([
  { dataIndex: 'name', query: { valueType: 'text' } },
])
createVTableGuild({ theme: { query: { slots: { fields: 'custom-grid' } } } })
// @ts-expect-error Query theme augmentation must survive the published bundle.
createVTableGuild({ theme: { query: { slots: { missing: 'invalid' } } } })

const _dictionary = createTableDictionary<{ team: number }>({
  key: 'members',
  request: async (params, { keyword, signal }) => ({
    options: signal.aborted ? [] : [{ value: params.team ?? 0, label: keyword }],
    complete: keyword === '',
  }),
})
const _dictionaryState = useTableDictionary({ dictionary: _dictionary, params: { team: 1 } })
// @ts-expect-error Dependency types must survive the published bundle.
useTableDictionary({ dictionary: _dictionary, params: { team: 'invalid' } })
const _polling: TableRequestPolling<Member> = (rows) => (rows.length ? false : 3000)
const _request = useTableRequest<Member>({
  polling: _polling,
  revalidateOnFocus: true,
  request: async () => ({ data: [], total: 0 }),
})
const _resume: Promise<void> = _request.resume(true)
const _refreshing: boolean = _request.refreshing.value
createVTableGuild({ theme: { table: { slots: { cellProgressTrack: 'custom-track' } } } })
type SettingsProps = Parameters<typeof VTableColumnSettings<Member>>[0]
const _settings: TableColumnSettingsProps<Member> = {
  columns: [{ key: 'name', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) }],
  size: 'middle',
  ui: { popup: 'custom-popup' },
}
const _settingsProps: SettingsProps = {
  ..._settings,
  'onUpdate:columns': (columns) => {
    const _typedColumns: TableColumnSettingsProps<Member>['columns'] = columns
  },
}
const _settingsSlot: TableColumnSettingsSlots<Member> = {
  columnLabel: ({ column }) => String(column.key),
}
// @ts-expect-error Unsupported density must remain rejected by the public component.
const _invalidSettingsSize: SettingsProps['size'] = 'compact'
createVTableGuild({
  theme: { columnSettings: { slots: { popup: 'custom-popup' } } },
  localeOverrides: { columnSettings: { title: 'Preferences' }, pagination: { page: 'Page' } },
})
// @ts-expect-error Unknown column settings slot must be rejected.
createVTableGuild({ theme: { columnSettings: { slots: { unknownSlot: 'custom-popup' } } } })

type ToolbarProps = Parameters<typeof VTableToolbar<Member>>[0]
const _toolbar: TableToolbarProps<Member> = {
  title: 'Members',
  columns: _settings.columns,
  options: { reload: true, density: true, setting: true, fullScreen: true },
  fullscreenTarget: () => document.body,
  columnSettings: { ui: { popup: 'custom-popup' }, locale: { reset: 'Restore' } },
  ui: { actions: 'gap-3' },
}
const _toolbarProps: ToolbarProps = {
  ..._toolbar,
  'onUpdate:columns': (columns) => {
    const _typedColumns: TableColumnSettingsProps<Member>['columns'] = columns
  },
  onFullscreenChange: (active) => {
    const _active: boolean = active
  },
}
const _toolbarSlots: TableToolbarSlots<Member> = {
  actions: ({ columns, reload, toggleFullscreen, loading }) => {
    const _nameSorter = columns.flatMap((column) =>
      typeof column !== 'symbol' && 'sorter' in column ? [column.sorter] : [],
    )
    const _reload: () => void = reload
    const _fullscreen: () => Promise<void> = toggleFullscreen
    return loading ? 'Exporting' : 'Export'
  },
}
// @ts-expect-error Toolbar option names must remain constrained.
const _invalidToolbarOptions: ToolbarProps['options'] = { export: true }
// @ts-expect-error Toolbar theme slots must remain constrained.
createVTableGuild({ theme: { toolbar: { slots: { unknownSlot: 'bad' } } } })
createVTableGuild({
  theme: { toolbar: { slots: { root: 'custom-toolbar', actions: 'gap-3' } } },
  localeOverrides: { toolbar: { reload: 'Refresh' } },
})

const _memberRenderer: TableFieldRenderer<Member> = ({ record, displayValue }) => ({
  children: displayValue,
  tooltipText: record.name,
  presentation: 'tag',
  status: 'success',
})
const _memberRenderers = createTableRenderers<Member>({ member: _memberRenderer })
type TablePublicProps = Parameters<typeof VTable<Member>>[0]
const _renderedTable: TablePublicProps = {
  dataSource: [{ id: 1, name: 'Member' }],
  columns: [
    { dataIndex: 'name', valueType: 'member', fieldProps: ({ record }) => ({ id: record.id }) },
  ],
  renderers: _memberRenderers,
}
// @ts-expect-error The published factory retains the declared record shape.
const _invalidRenderer: TableFieldRenderer<Member> = ({ record }) => record.unknown

type TableExposed = Parameters<NonNullable<Parameters<typeof VTable<Member>>[2]>>[0]
function _publishedInstance(table: TableExposed) {
  const _instance: TableInstance = table
  const _located: Promise<boolean> = table.scrollTo({ key: 1, align: 'top', left: 20 })
  const _retry: Promise<boolean> = table.retryTreeLoad(1)
  const _error: Error | undefined = table.getTreeLoadError(1)
  // @ts-expect-error Published instance align values remain constrained.
  table.scrollTo({ align: 'middle' })
}

createVTableGuild({ theme: { table: { slots: { cellTag: 'tag-override' } } } })
