import { defineComponent, inject } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'TableEmpty',
  props: {
    colSpan: { type: Number, required: true },
    emptyClass: { type: String, required: true },
    tdClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => (
      <tr>
        <td class={[props.tdClass, props.emptyClass]} colspan={props.colSpan}>
          {/* 优先使用用户自定义 empty slot */}
          {tableContext.empty
            ? tableContext.empty()
            : (tableContext.locale?.value.empty.text ?? '暂无数据')}
        </td>
      </tr>
    )
  },
})
