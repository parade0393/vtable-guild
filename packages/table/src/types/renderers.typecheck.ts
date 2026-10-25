import { h } from 'vue'
import { createTableRenderers } from '../renderers'
import type { TableFieldRenderer } from './renderers'
import type { ColumnType } from './column'

interface Row {
  id: number
  amount: number
}

export const renderer: TableFieldRenderer<Row> = ({ record, fieldProps }) => ({
  children: h('span', `${record.id}:${fieldProps.suffix}`),
  tooltipText: String(record.amount),
  status: 'success',
})
export const renderers = createTableRenderers<Row>({ business: renderer })
export const column: ColumnType<Row> = {
  dataIndex: 'amount',
  valueType: 'business',
  fieldProps: ({ record }) => ({ suffix: record.id }),
}

// @ts-expect-error A field renderer receives the declared row shape.
export const invalidRenderer: TableFieldRenderer<Row> = ({ record }) => record.missing

// @ts-expect-error Status values match the existing enum presentation contract.
export const invalidStatus: ColumnType<Row> = { fieldProps: { status: 'unknown' } }
