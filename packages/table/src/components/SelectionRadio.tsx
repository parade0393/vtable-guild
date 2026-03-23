import { defineComponent } from 'vue'
import { Radio } from '@vtable-guild/core'

export default defineComponent({
  name: 'SelectionRadio',
  props: {
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () => (
      <Radio
        checked={props.checked}
        disabled={props.disabled}
        onChange={(_next: boolean, e: MouseEvent) => emit('change', e)}
      />
    )
  },
})
