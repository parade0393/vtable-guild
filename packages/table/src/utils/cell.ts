import { isVNode, type VNodeChild } from 'vue'
import type {
  CellAdditionalProps,
  ColumnType,
  RenderedCell,
  TableBodyCellSlotProps,
} from '../types'
import { ensureValidVNode } from './vnode'

export interface ResolvedBodyCell {
  content: VNodeChild
  tooltipText?: string
  customCellProps?: CellAdditionalProps
  renderCellProps?: CellAdditionalProps
  colSpan: number
  rowSpan: number
}

function resolveTooltipText(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return undefined
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
  transformCellText?:
    | ((options: {
        text: unknown
        column: ColumnType<TRecord>
        record: TRecord
        index: number
      }) => unknown)
    | undefined
}): ResolvedBodyCell {
  const { text, record, rowIndex, column, bodyCell, transformCellText } = options

  const customCellProps = column.customCell?.(record, rowIndex, column)
  const transformedText = transformCellText
    ? transformCellText({
        text,
        column,
        record,
        index: rowIndex,
      })
    : text

  let content = (transformedText ?? '') as VNodeChild
  let renderCellProps: CellAdditionalProps | undefined

  if (column.customRender) {
    const rendered = column.customRender({
      text: transformedText,
      value: transformedText,
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
    const slotContent = bodyCell({
      text: transformedText,
      record,
      index: rowIndex,
      column,
    })
    if (ensureValidVNode(slotContent) !== null) {
      content = slotContent
    }
  }

  const colSpan = getCellSpan(renderCellProps, 'colSpan') ?? getCellSpan(customCellProps, 'colSpan')
  const rowSpan = getCellSpan(renderCellProps, 'rowSpan') ?? getCellSpan(customCellProps, 'rowSpan')

  return {
    content,
    tooltipText: resolveTooltipText(transformedText),
    customCellProps,
    renderCellProps,
    colSpan: colSpan ?? 1,
    rowSpan: rowSpan ?? 1,
  }
}

/**
 * 解析 column.ellipsis 配置（与 ant-design-vue 对齐）。
 *
 * - `true` → 启用省略 + 省略 tooltip
 * - `{ showTitle: false }` → 启用省略，不显示 tooltip（即不渲染 hover 内容卡片）
 * - 其它 falsy → 不启用省略
 */
export function getEllipsisConfig(column: ColumnType): {
  enabled: boolean
  showTitle: boolean
} {
  const e = column.ellipsis
  if (e === true) return { enabled: true, showTitle: true }
  if (e && typeof e === 'object') return { enabled: true, showTitle: e.showTitle !== false }
  return { enabled: false, showTitle: false }
}
