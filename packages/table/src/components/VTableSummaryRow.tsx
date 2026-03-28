import { defineComponent, inject } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'VTableSummaryRow',
  setup(_props, { slots }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => {
      const sub = tableContext.subThemeSlots?.value
      return <tr class={sub?.summaryRow ?? ''}>{slots.default?.()}</tr>
    }
  },
})
