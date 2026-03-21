import { computed, defineComponent, inject } from 'vue'
import type { PropType } from 'vue'
import { cn } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'

import { ColumnType } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'
import { getByDataIndex } from '../composables'
import { getColumnKey } from '../composables/useSorter'
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
    tdClass: { type: String, required: true },
    bodyCellEllipsisClass: { type: String, required: true },
  },
  setup(props) {
    // ---- 通过 inject 获取 Table.tsx provide 的 bodyCell slot ----
    // ⚠️ 不使用 useSlots()！scoped slots 不跨层级传播。
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    const text = computed(() => getByDataIndex(props.record, props.column.dataIndex))

    // ---- 固定列 ----
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
      if (info.isLastLeft) {
        classes.push(atStart ? sub.fixedShadowLeftHidden : sub.fixedShadowLeft)
      }
      if (info.isFirstRight) {
        classes.push(atEnd ? sub.fixedShadowRightHidden : sub.fixedShadowRight)
      }
      return classes.join(' ')
    })

    /**
     * 计算最终渲染内容。
     *
     * 优先级：customRender > bodyCell slot > 纯文本
     *
     * TSX 中 VNode 可直接通过 {content} 渲染，无需 <component :is> 包裹。
     */
    const cellContent = computed(() => {
      // 优先级 1：column.customRender
      if (props.column.customRender) {
        return props.column.customRender({
          text: text.value,
          record: props.record,
          index: props.rowIndex,
          column: props.column,
        })
      }

      // 优先级 2：bodyCell slot（通过 inject 获取）
      if (tableContext.bodyCell) {
        return tableContext.bodyCell({
          text: text.value,
          record: props.record,
          index: props.rowIndex,
          column: props.column,
        })
      }
      // 优先级 3：纯文本
      return text.value ?? ''
    })

    const isRowSelected = computed(() => {
      const key = tableContext.getRowKey?.(props.record, props.rowIndex)
      if (key === undefined) return false
      return tableContext.isSelected?.(key) ?? false
    })

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
        selectedClasses,
        fixedClass.value,
      )
    })

    const cellStyle = computed(() => {
      const base: Record<string, string> = {}
      const resizedWidth =
        tableContext.columnWidths?.[String(getColumnKey(props.column) ?? props.colIndex)]
      const w = resizedWidth ?? props.column.width
      if (w) {
        base.width = typeof w === 'number' ? `${w}px` : w
      }
      const fixed = fixedStyle.value
      return fixed ? { ...base, ...fixed } : Object.keys(base).length ? base : undefined
    })

    // ---- 树形数据 indent 信息 ----
    const treeRow = computed(() => {
      if (!tableContext.isTreeData?.value) return null
      const flatData = tableContext.treeFlattenData?.value
      if (!flatData) return null
      const key = tableContext.getRowKey?.(props.record, props.rowIndex)
      return (
        flatData.find((r) => {
          const rKey = tableContext.getRowKey?.(r.record, -1)
          return rKey === key
        }) ?? null
      )
    })

    /** Is this the first data column (where tree indent is rendered)? */
    const isTreeIndentColumn = computed(() => {
      if (!tableContext.isTreeData?.value) return false
      // Skip selection and expand columns
      return props.column.key !== '__vtg_selection__' &&
        props.column.key !== '__vtg_expand__' &&
        props.colIndex <= 2
        ? (() => {
            // Find the first non-special column index
            const ctx = tableContext
            const sel = ctx.rowSelection?.()
            const exp = ctx.expandable?.()
            let firstDataIdx = 0
            if (sel) firstDataIdx++
            if (exp && exp.showExpandColumn !== false) firstDataIdx++
            return props.colIndex === firstDataIdx
          })()
        : false
    })

    return () => {
      // ---- 选择列单元格 ----
      if (props.column.key === '__vtg_selection__') {
        const sel = tableContext.rowSelection?.()
        const isRadio = sel?.type === 'radio'
        const key = tableContext.getRowKey?.(props.record, props.rowIndex)
        const checked = key !== undefined && (tableContext.isSelected?.(key) ?? false)
        const disabled = tableContext.isDisabledRow?.(props.record) ?? false

        const subThemeSlots = tableContext.subThemeSlots?.value
        const selectedClasses =
          checked && subThemeSlots
            ? cn(subThemeSlots.tdSelected, subThemeSlots.tdSelectedHover)
            : ''
        const cellSelClass = cn(
          props.tdClass,
          'text-center',
          props.column.className,
          selectedClasses,
          fixedClass.value,
        )
        const cellSelStyle = (() => {
          const base: Record<string, string> = {}
          if (props.column.width) {
            base.width =
              typeof props.column.width === 'number'
                ? `${props.column.width}px`
                : props.column.width
          }
          const fixed = fixedStyle.value
          return fixed ? { ...base, ...fixed } : Object.keys(base).length ? base : undefined
        })()

        return (
          <td class={cellSelClass} style={cellSelStyle}>
            {isRadio ? (
              <SelectionRadio
                checked={checked}
                disabled={disabled}
                onChange={() => tableContext.toggleRow?.(props.record, props.rowIndex)}
              />
            ) : (
              <SelectionCheckbox
                checked={checked}
                disabled={disabled}
                onChange={() => tableContext.toggleRow?.(props.record, props.rowIndex)}
              />
            )}
          </td>
        )
      }

      // ---- 展开列单元格 ----
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
        const expandCellStyle = (() => {
          const base: Record<string, string> = {}
          if (props.column.width) {
            base.width =
              typeof props.column.width === 'number'
                ? `${props.column.width}px`
                : props.column.width
          }
          const fixed = fixedStyle.value
          return fixed ? { ...base, ...fixed } : Object.keys(base).length ? base : undefined
        })()

        // Custom expand icon
        if (exp?.expandIcon) {
          return (
            <td class={expandCellClass} style={expandCellStyle}>
              {exp.expandIcon({
                expanded,
                record: props.record,
                onExpand: (_record, e) => {
                  e.stopPropagation()
                  tableContext.toggleExpand?.(props.record, props.rowIndex)
                },
              })}
            </td>
          )
        }

        return (
          <td class={expandCellClass} style={expandCellStyle}>
            <ExpandIcon
              expanded={expanded}
              expandable={canExpand}
              variant="row"
              onClick={() => tableContext.toggleExpand?.(props.record, props.rowIndex)}
            />
          </td>
        )
      }

      // ---- 普通数据列 ----
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
        <div class={props.bodyCellEllipsisClass}>{cellContent.value}</div>
      ) : (
        cellContent.value
      )

      return (
        <td class={cellClass.value} style={cellStyle.value}>
          {treeIndent}
          {treeExpandBtn}
          {mainContent}
        </td>
      )
    }
  },
})
