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
