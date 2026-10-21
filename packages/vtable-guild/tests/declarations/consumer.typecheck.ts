// 通过发布入口消费 dist，不继承工作区 paths 或 skipLibCheck。
import {
  VTableSummary,
  VTableSummaryRow,
  VTableSummaryCell,
  createVTableGuild,
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
