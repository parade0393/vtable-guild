import { defineComponent, inject } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'TableLoading',
  props: {
    loadingClass: { type: String, required: true },
  },
  setup(props, { slots }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => (
      <div class={props.loadingClass}>
        {slots.default?.() ?? tableContext.locale?.value.loading.text ?? '加载中...'}
      </div>
    )
  },
})
