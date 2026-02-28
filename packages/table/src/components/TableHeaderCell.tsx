import { defineComponent, computed, inject, type PropType } from 'vue'
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
      const alignClass =
        props.column.align === 'center'
          ? 'text-center'
          : props.column.align === 'right'
            ? 'text-right'
            : 'text-left'
      return [props.thClass, alignClass, props.column.className].filter(Boolean).join(' ')
    })

    const widthStyle = computed(() => {
      if (!props.column.width) return undefined
      return {
        width:
          typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
      }
    })

    return () => (
      <th class={cellClass.value} style={widthStyle.value}>
        <span class={props.headerCellInnerClass}>
          {/* TSX 中 VNode 直接渲染，无需 <component :is> 包裹 */}
          {headerContent.value}
        </span>
      </th>
    )
  },
})
