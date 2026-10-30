import { isVNode, type VNodeChild } from 'vue'
import type {
  CellAdditionalProps,
  ColumnType,
  RenderedCell,
  TableBodyCellSlotProps,
} from '../types'
import { ensureValidVNode } from './vnode'
import { resolveValueEnum } from './valueEnum'
import type { ColumnValueStatus } from '../types/presentation'
import type { TableFieldRenderers, TableFieldRenderResult } from '../types/renderers'
import { defaultTableRenderers } from '../renderers'

export interface ResolvedBodyCell {
  content: VNodeChild
  tooltipText?: string
  customCellProps?: CellAdditionalProps
  renderCellProps?: CellAdditionalProps
  colSpan: number
  rowSpan: number
  copyText?: string
  status?: ColumnValueStatus
  presentation?: TableFieldRenderResult['presentation']
  progress?: TableFieldRenderResult['progress']
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

function isFieldRenderResult(value: unknown): value is TableFieldRenderResult {
  return isRenderedCell(value)
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
  columnEmptyText?: VNodeChild | false
  renderers?: TableFieldRenderers<TRecord>
  locale?: string
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

  const enumValue = resolveValueEnum(column.valueEnum, transformedText)
  const defaultText = enumValue
    ? enumValue.text
    : typeof transformedText === 'boolean'
      ? String(transformedText)
      : transformedText
  let content = (defaultText ??
    (options.columnEmptyText === false ? '' : options.columnEmptyText) ??
    '') as VNodeChild
  let renderCellProps: CellAdditionalProps | undefined
  let customContent = false
  let tooltipText = resolveTooltipText(defaultText)
  let status = enumValue?.status
  let presentation: TableFieldRenderResult['presentation']
  let progress: TableFieldRenderResult['progress']

  if (column.customRender) {
    customContent = true
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
      customContent = true
      content = slotContent
    }
  }

  // Explicit render functions and nonempty body slots keep their existing priority.
  // Nullish values keep the shared empty-value contract without calling field renderers.
  if (!customContent && column.valueType && transformedText != null) {
    const defaults = defaultTableRenderers as TableFieldRenderers<TRecord>
    const registry = options.renderers ?? defaults
    const renderer = Object.prototype.hasOwnProperty.call(registry, column.valueType)
      ? registry[column.valueType]
      : defaults[column.valueType]
    if (renderer) {
      const context = {
        text: transformedText,
        value: transformedText,
        record,
        index: rowIndex,
        renderIndex: rowIndex,
        column,
      }
      const rendered = renderer({
        ...context,
        displayValue: defaultText as VNodeChild,
        status,
        fieldProps:
          typeof column.fieldProps === 'function'
            ? column.fieldProps(context)
            : (column.fieldProps ?? {}),
        locale: options.locale,
      })
      if (isFieldRenderResult(rendered)) {
        const result = rendered
        content = result.children
        tooltipText = result.tooltipText ?? resolveTooltipText(result.children)
        status = result.status
        presentation = result.presentation
        progress = result.progress
      } else {
        content = rendered
        tooltipText = resolveTooltipText(rendered)
      }
    }
  }

  const colSpan = getCellSpan(renderCellProps, 'colSpan') ?? getCellSpan(customCellProps, 'colSpan')
  const rowSpan = getCellSpan(renderCellProps, 'rowSpan') ?? getCellSpan(customCellProps, 'rowSpan')

  return {
    content,
    tooltipText,
    copyText: resolveTooltipText(transformedText),
    status: customContent ? undefined : status,
    presentation: customContent ? undefined : presentation,
    progress: customContent ? undefined : progress,
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
