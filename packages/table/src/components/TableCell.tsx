import { computed, defineComponent, inject } from 'vue'
import type { PropType } from 'vue'

import { ColumnType } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'
import { getByDataIndex } from '../composables'

export default defineComponent({
  name: 'TableCell',
  props: {
    record: { type: Object as PropType<Record<string, unknown>>, required: true },
    rowIndex: { type: Number, required: true },
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    tdClass: { type: String, required: true },
    bodyCellEllipsisClass: { type: String, required: true },
  },
  setup(props) {
    // ---- 通过 inject 获取 Table.tsx provide 的 bodyCell slot ----
    // ⚠️ 不使用 useSlots()！scoped slots 不跨层级传播。
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    const text = computed(() => getByDataIndex(props.record, props.column.dataIndex))

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

    const cellClass = computed(() => {
      const alignClass =
        props.column.align === 'center'
          ? 'text-center'
          : props.column.align === 'right'
            ? 'text-right'
            : 'text-left'
      return [props.tdClass, alignClass, props.column.className].filter(Boolean).join(' ')
    })

    const widthStyle = computed(() => {
      if (!props.column.width) return undefined
      return {
        width:
          typeof props.column.width === 'number' ? `${props.column.width}px` : props.column.width,
      }
    })

    return () => (
      <td class={cellClass.value} style={widthStyle.value}>
        {props.column.ellipsis ? (
          <div class={props.bodyCellEllipsisClass}>{cellContent.value}</div>
        ) : (
          cellContent.value
        )}
      </td>
    )
  },
})
