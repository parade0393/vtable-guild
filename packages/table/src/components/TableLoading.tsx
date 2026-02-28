import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TableLoading',
  props: {
    loadingClass: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => <div class={props.loadingClass}>{slots.default?.() ?? 'Loading...'}</div>
  },
})
