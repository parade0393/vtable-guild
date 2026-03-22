import { isVNode, type VNodeChild } from 'vue'
import type {
  CellAdditionalProps,
  ColumnType,
  RenderedCell,
  TableBodyCellSlotProps,
} from '../types'

export interface ResolvedBodyCell {
  content: VNodeChild
  customCellProps?: CellAdditionalProps
  renderCellProps?: CellAdditionalProps
  colSpan: number
  rowSpan: number
}

export function isRenderedCell(value: unknown): value is RenderedCell {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !isVNode(value)
}

export function getCellSpan(
  props: CellAdditionalProps | undefined,
  axis: 'colSpan' | 'rowSpan',
): number | undefined {
  const raw = props?.[axis] ?? props?.[axis.toLowerCase() as 'colspan' | 'rowspan']

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }

  return undefined
}

export function omitCellProps(props: CellAdditionalProps | undefined): Record<string, unknown> {
  if (!props) return {}

  const {
    class: _class,
    className: _className,
    style: _style,
    colSpan: _colSpan,
    rowSpan: _rowSpan,
    colspan: _colspan,
    rowspan: _rowspan,
    ...rest
  } = props

  return rest
}

export function resolveBodyCell<TRecord extends Record<string, unknown>>(options: {
  text: unknown
  record: TRecord
  rowIndex: number
  column: ColumnType<TRecord>
  bodyCell?: ((props: TableBodyCellSlotProps<TRecord>) => VNodeChild) | undefined
}): ResolvedBodyCell {
  const { text, record, rowIndex, column, bodyCell } = options

  const customCellProps = column.customCell?.(record, rowIndex, column)

  let content = (text ?? '') as VNodeChild
  let renderCellProps: CellAdditionalProps | undefined

  if (column.customRender) {
    const rendered = column.customRender({
      text,
      value: text,
      record,
      index: rowIndex,
      renderIndex: rowIndex,
      column,
    })

    if (isRenderedCell(rendered)) {
      content = rendered.children
      renderCellProps = rendered.props
    } else {
      content = rendered
    }
  } else if (bodyCell) {
    content = bodyCell({
      text,
      record,
      index: rowIndex,
      column,
    })
  }

  const colSpan = getCellSpan(renderCellProps, 'colSpan') ?? getCellSpan(customCellProps, 'colSpan')
  const rowSpan = getCellSpan(renderCellProps, 'rowSpan') ?? getCellSpan(customCellProps, 'rowSpan')

  return {
    content,
    customCellProps,
    renderCellProps,
    colSpan: colSpan ?? 1,
    rowSpan: rowSpan ?? 1,
  }
}
