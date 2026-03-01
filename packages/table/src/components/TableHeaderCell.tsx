import { defineComponent, computed, inject, type PropType } from 'vue'
import { cn } from '@vtable-guild/core'
import { TABLE_ALIGN_CLASSES } from '@vtable-guild/theme'
import type { ColumnType } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'
export default defineComponent({
  name: 'TableHeaderCell',
  props: {
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    index: { type: Number, required: true },
    thClass: { type: String, required: true },
    headerCellInnerClass: { type: String, required: true },
  },
  setup(props) {
    // ---- 通过 inject 获取 headerCell slot ----
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    const headerContent = computed(() => {
      // 优先级 1：headerCell slot
      if (tableContext.headerCell) {
        return tableContext.headerCell({
          title: props.column.title,
          column: props.column,
          index: props.index,
        })
      }

      // 优先级 2：column.title 纯文本
      return props.column.title ?? ''
    })

    const cellClass = computed(() => {
      const alignClass = props.column.align ? TABLE_ALIGN_CLASSES[props.column.align] : ''
      return cn(props.thClass, alignClass, props.column.className)
    })

    const cellStyle = computed(() => {
      if (!props.column.width) return undefined
      return {
        width:
          typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
      }
    })

    return () => (
      <th class={cellClass.value} style={cellStyle.value}>
        <span class={props.headerCellInnerClass}>
          {/* TSX 中 VNode 直接渲染，无需 <component :is> 包裹 */}
          {headerContent.value}
        </span>
      </th>
    )
  },
})
