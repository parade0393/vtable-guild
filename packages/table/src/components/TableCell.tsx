import { computed, defineComponent, inject, ref, type PropType, type VNodeChild } from 'vue'
import { cn, Tooltip } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { CellAdditionalProps, ColumnType } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getByDataIndex } from '../composables'
import { getColumnKey } from '../composables/useSorter'
import {
  isRenderedCell,
  omitCellProps,
  resolveBodyCell,
  type ResolvedBodyCell,
} from '../utils/cell'
import SelectionCheckbox from './SelectionCheckbox'
import SelectionRadio from './SelectionRadio'
import ExpandIcon from './ExpandIcon'

export default defineComponent({
  name: 'TableCell',
  props: {
    record: { type: Object as PropType<Record<string, unknown>>, required: true },
    rowIndex: { type: Number, required: true },
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    colIndex: { type: Number, required: true },
    resolvedCell: {
      type: Object as PropType<ResolvedBodyCell>,
      default: undefined,
    },
    tdClass: { type: String, required: true },
    bodyCellEllipsisClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const ellipsisContentRef = ref<HTMLElement | null>(null)
    const ellipsisTooltipOpen = ref(false)

    const resolvedCell = computed(
      () =>
        props.resolvedCell ??
        resolveBodyCell({
          text: getByDataIndex(props.record, props.column.dataIndex),
          record: props.record,
          rowIndex: props.rowIndex,
          column: props.column,
          bodyCell: tableContext.bodyCell,
          transformCellText: tableContext.transformCellText,
        }),
    )

    const fixedInfo = computed(() => {
      if (!props.column.fixed) return null
      const key = getColumnKey(props.column) ?? props.colIndex
      return tableContext.fixedOffsets?.value?.get(key) ?? null
    })

    const fixedStyle = computed(() => {
      const info = fixedInfo.value
      if (!info) return undefined
      const style: Record<string, string> = { position: 'sticky', zIndex: '2' }
      if (info.left !== undefined) style.left = `${info.left}px`
      if (info.right !== undefined) style.right = `${info.right}px`
      return style
    })

    const fixedClass = computed(() => {
      const info = fixedInfo.value
      if (!info) return ''
      const sub = tableContext.subThemeSlots?.value
      if (!sub) return ''
      const classes: string[] = []
      const atStart = tableContext.scrollState?.value?.atStart ?? true
      const atEnd = tableContext.scrollState?.value?.atEnd ?? true
      if (info.isLastLeft && !atStart) {
        classes.push(sub.fixedShadowLeft)
      }
      if (info.isFirstRight && !atEnd) {
        classes.push(sub.fixedShadowRight)
      }
      return classes.join(' ')
    })

    const selectionState = computed(
      () =>
        tableContext.getSelectionState?.(props.record, props.rowIndex) ?? {
          checked: false,
          indeterminate: false,
          disabled: false,
        },
    )

    const isRowSelected = computed(() => selectionState.value.checked)

    const bodyDomProps = computed(() => ({
      ...omitCellProps(resolvedCell.value.renderCellProps),
      ...omitCellProps(resolvedCell.value.customCellProps),
    }))

    const cellClass = computed(() => {
      const alignClass = props.column.align ? TABLE_ALIGN_CLASSES[props.column.align] : ''
      const subThemeSlots = tableContext.subThemeSlots?.value
      const selectedClasses =
        isRowSelected.value && subThemeSlots
          ? cn(subThemeSlots.tdSelected, subThemeSlots.tdSelectedHover)
          : ''

      return cn(
        props.tdClass,
        alignClass,
        props.column.className,
        resolvedCell.value.customCellProps?.class,
        resolvedCell.value.customCellProps?.className,
        resolvedCell.value.renderCellProps?.class,
        resolvedCell.value.renderCellProps?.className,
        selectedClasses,
        fixedClass.value,
      )
    })

    const cellStyle = computed(() => {
      const base: Record<string, string> = {}
      const resizedWidth =
        tableContext.columnWidths?.[String(getColumnKey(props.column) ?? props.colIndex)]
      const width = resizedWidth ?? props.column.width

      if (width) {
        base.width = typeof width === 'number' ? `${width}px` : width
      }

      return {
        ...base,
        ...(fixedStyle.value ?? {}),
        ...((resolvedCell.value.customCellProps?.style as Record<string, string> | undefined) ??
          {}),
        ...((resolvedCell.value.renderCellProps?.style as Record<string, string> | undefined) ??
          {}),
      }
    })

    const treeRow = computed(() => {
      if (!tableContext.isTreeData?.value) return null
      const flatData = tableContext.treeFlattenData?.value
      if (!flatData) return null
      return flatData.find((row) => row.record === props.record) ?? null
    })

    const isTreeIndentColumn = computed(() => {
      if (!tableContext.isTreeData?.value) return false

      return props.column.key !== '__vtg_selection__' &&
        props.column.key !== '__vtg_expand__' &&
        props.colIndex <= 2
        ? (() => {
            const sel = tableContext.rowSelection?.()
            const exp = tableContext.expandable?.()
            let firstDataIdx = 0
            if (sel) firstDataIdx += 1
            if (exp && exp.showExpandColumn !== false) firstDataIdx += 1
            return props.colIndex === firstDataIdx
          })()
        : false
    })

    function mergeSelectionCellStyle(extraStyle?: CellAdditionalProps['style']) {
      return {
        ...cellStyle.value,
        ...((extraStyle as Record<string, string> | undefined) ?? {}),
      }
    }

    function updateEllipsisTooltipState() {
      const contentEl = ellipsisContentRef.value
      const tooltipText = resolvedCell.value.tooltipText

      ellipsisTooltipOpen.value = Boolean(
        contentEl &&
        tooltipText &&
        (contentEl.scrollWidth > contentEl.clientWidth ||
          contentEl.scrollHeight > contentEl.clientHeight),
      )
    }

    function closeEllipsisTooltip() {
      ellipsisTooltipOpen.value = false
    }

    return () => {
      if (resolvedCell.value.colSpan === 0 || resolvedCell.value.rowSpan === 0) {
        return null
      }

      const colSpan = resolvedCell.value.colSpan !== 1 ? resolvedCell.value.colSpan : undefined
      const rowSpan = resolvedCell.value.rowSpan !== 1 ? resolvedCell.value.rowSpan : undefined

      if (props.column.key === '__vtg_selection__') {
        const sel = tableContext.rowSelection?.()
        const isRadio = sel?.type === 'radio'

        const originNode = isRadio ? (
          <SelectionRadio
            checked={selectionState.value.checked}
            disabled={selectionState.value.disabled}
            onChange={(e: MouseEvent) => tableContext.toggleRow?.(props.record, props.rowIndex, e)}
          />
        ) : (
          <SelectionCheckbox
            checked={selectionState.value.checked}
            indeterminate={selectionState.value.indeterminate}
            disabled={selectionState.value.disabled}
            onChange={(_checked: boolean, e: MouseEvent) =>
              tableContext.toggleRow?.(props.record, props.rowIndex, e)
            }
          />
        )

        let selectionCellContent: VNodeChild = originNode
        let selectionCellProps: CellAdditionalProps | undefined

        if (sel?.renderCell) {
          const rendered = sel.renderCell(
            selectionState.value.checked,
            props.record,
            props.rowIndex,
            originNode,
          )

          if (isRenderedCell(rendered)) {
            selectionCellContent = rendered.children
            selectionCellProps = rendered.props
          } else {
            selectionCellContent = rendered
          }
        }

        const cellSelClass = cn(
          props.tdClass,
          'text-center leading-[0]',
          props.column.className,
          selectionCellProps?.class,
          selectionCellProps?.className,
          isRowSelected.value &&
            tableContext.subThemeSlots?.value &&
            cn(
              tableContext.subThemeSlots.value.tdSelected,
              tableContext.subThemeSlots.value.tdSelectedHover,
            ),
          fixedClass.value,
        )

        return (
          <td
            {...omitCellProps(selectionCellProps)}
            class={cellSelClass}
            style={mergeSelectionCellStyle(selectionCellProps?.style)}
            colspan={colSpan}
            rowspan={rowSpan}
          >
            {selectionCellContent}
          </td>
        )
      }

      if (props.column.key === '__vtg_expand__') {
        const exp = tableContext.expandable?.()
        const key = tableContext.getRowKey?.(props.record, props.rowIndex)
        const expanded = key !== undefined && (tableContext.isExpanded?.(key) ?? false)
        const canExpand = tableContext.isRowExpandable?.(props.record) ?? false

        const expandCellClass = cn(
          props.tdClass,
          'text-center',
          props.column.className,
          fixedClass.value,
        )

        if (exp?.expandIcon) {
          return (
            <td class={expandCellClass} style={cellStyle.value} colspan={colSpan} rowspan={rowSpan}>
              {exp.expandIcon({
                expanded,
                record: props.record,
                expandable: canExpand,
                onExpand: (_record, e) => {
                  e.stopPropagation()
                  if (!canExpand) return
                  tableContext.toggleExpand?.(props.record, props.rowIndex)
                },
              })}
            </td>
          )
        }

        return (
          <td class={expandCellClass} style={cellStyle.value} colspan={colSpan} rowspan={rowSpan}>
            <ExpandIcon
              expanded={expanded}
              expandable={canExpand}
              variant="row"
              onClick={() => {
                if (!canExpand) return
                tableContext.toggleExpand?.(props.record, props.rowIndex)
              }}
            />
          </td>
        )
      }

      const row = treeRow.value
      const showTreeIndent = isTreeIndentColumn.value && row

      const treeIndent = showTreeIndent ? (
        <span
          style={{
            display: 'inline-block',
            width: `${row.level * (tableContext.treeIndentSize?.value ?? 15)}px`,
          }}
        />
      ) : null

      const treeExpandBtn =
        showTreeIndent && row.hasChildren ? (
          <ExpandIcon
            expanded={row.expanded}
            expandable={true}
            variant="tree"
            onClick={() => tableContext.toggleTreeExpand?.(props.record, props.rowIndex)}
          />
        ) : showTreeIndent ? (
          <ExpandIcon expanded={false} expandable={false} variant="tree" />
        ) : null

      const mainContent = props.column.ellipsis ? (
        <Tooltip
          block
          title={resolvedCell.value.tooltipText}
          placement="top"
          open={ellipsisTooltipOpen.value}
        >
          <div
            ref={ellipsisContentRef}
            class={props.bodyCellEllipsisClass}
            onMouseenter={updateEllipsisTooltipState}
            onMouseleave={closeEllipsisTooltip}
          >
            {resolvedCell.value.content}
          </div>
        </Tooltip>
      ) : (
        resolvedCell.value.content
      )

      return (
        <td
          {...bodyDomProps.value}
          class={cellClass.value}
          style={cellStyle.value}
          colspan={colSpan}
          rowspan={rowSpan}
        >
          {treeIndent}
          {treeExpandBtn}
          {mainContent}
        </td>
      )
    }
  },
})
