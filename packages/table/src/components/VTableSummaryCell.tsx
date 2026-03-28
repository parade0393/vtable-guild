import { computed, defineComponent, inject, type PropType } from 'vue'
import { cn } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { AlignType } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getColumnKey } from '../composables/useSorter'

export default defineComponent({
  name: 'VTableSummaryCell',
  props: {
    index: { type: Number, required: true },
    colSpan: { type: Number, default: 1 },
    rowSpan: { type: Number, default: undefined },
    align: { type: String as PropType<AlignType>, default: undefined },
  },
  setup(props, { slots }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    const fixedInfo = computed(() => {
      const columns = tableContext.displayColumns?.value
      if (!columns) return null
      const col = columns[props.index]
      if (!col?.fixed) return null
      const key = getColumnKey(col) ?? props.index
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
      if (info.isLastLeft && !atStart) classes.push(sub.fixedShadowLeft)
      if (info.isFirstRight && !atEnd) classes.push(sub.fixedShadowRight)
      return classes.join(' ')
    })

    const cellClass = computed(() => {
      const sub = tableContext.subThemeSlots?.value
      const alignClass = props.align ? TABLE_ALIGN_CLASSES[props.align] : ''
      return cn(sub?.summaryCell ?? '', alignClass, fixedClass.value)
    })

    const cellStyle = computed(() => {
      const columns = tableContext.displayColumns?.value
      if (!columns) return fixedStyle.value
      const col = columns[props.index]
      const base: Record<string, string> = {}
      if (col?.width) {
        base.width = typeof col.width === 'number' ? `${col.width}px` : String(col.width)
      }
      return { ...base, ...(fixedStyle.value ?? {}) }
    })

    return () => {
      const colSpan = props.colSpan !== 1 ? props.colSpan : undefined
      const rowSpan = props.rowSpan !== 1 ? props.rowSpan : undefined

      return (
        <td class={cellClass.value} style={cellStyle.value} colspan={colSpan} rowspan={rowSpan}>
          {slots.default?.()}
        </td>
      )
    }
  },
})
