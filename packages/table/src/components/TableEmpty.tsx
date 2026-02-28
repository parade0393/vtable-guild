import { defineComponent, inject } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'

export default defineComponent({
  name: 'TableEmpty',
  props: {
    colSpan: { type: Number, required: true },
    emptyClass: { type: String, required: true },
    tdClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    return () => (
      <tr>
        <td class={[props.tdClass, props.emptyClass]} colspan={props.colSpan}>
          {/* 优先使用用户自定义 empty slot */}
          {tableContext.empty ? tableContext.empty() : 'No Data'}
        </td>
      </tr>
    )
  },
})
