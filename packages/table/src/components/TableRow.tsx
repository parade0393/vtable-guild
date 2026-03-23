import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'TableRow',
  props: {
    rowClass: { type: String, required: true },
    rowProps: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
  },
  emits: {
    click: (_e: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    function handleClick(e: MouseEvent) {
      const onClick = props.rowProps?.onClick
      if (typeof onClick === 'function') {
        onClick(e)
      }

      emit('click', e)
    }

    return () => (
      <tr
        {...props.rowProps}
        class={[props.rowClass, props.rowProps?.class, props.rowProps?.className]}
        style={props.rowProps?.style as Record<string, string> | undefined}
        onClick={handleClick}
      >
        {slots.default?.()}
      </tr>
    )
  },
})
