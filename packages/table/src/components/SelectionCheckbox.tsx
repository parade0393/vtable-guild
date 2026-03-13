import { defineComponent } from 'vue'
import { Checkbox } from '@vtable-guild/core'

export default defineComponent({
  name: 'SelectionCheckbox',
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () => (
      <Checkbox
        checked={props.checked}
        indeterminate={props.indeterminate}
        disabled={props.disabled}
        onChange={(next: boolean) => emit('change', next)}
      />
    )
  },
})
