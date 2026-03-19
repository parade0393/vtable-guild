import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TableRow',
  props: {
    rowClass: { type: String, required: true },
  },
  emits: {
    click: (_e: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    return () => (
      <tr class={props.rowClass} onClick={(e: MouseEvent) => emit('click', e)}>
        {slots.default?.()}
      </tr>
    )
  },
})
