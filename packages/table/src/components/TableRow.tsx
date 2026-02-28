import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TableRow',
  props: {
    rowClass: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => <tr class={props.rowClass}>{slots.default?.()}</tr>
  },
})
