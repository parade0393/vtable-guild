import { defineComponent, inject, watch, type PropType } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import VTableSummaryRow from './VTableSummaryRow'
import VTableSummaryCell from './VTableSummaryCell'

export type SummaryFixed = boolean | 'top' | 'bottom'

const VTableSummary = defineComponent({
  name: 'VTableSummary',
  props: {
    fixed: {
      type: [Boolean, String] as PropType<SummaryFixed>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    watch(
      () => props.fixed,
      (val) => {
        tableContext.registerSummaryFixed?.(val ?? false)
      },
      { immediate: true },
    )

    return () => slots.default?.()
  },
})

export default Object.assign(VTableSummary, {
  Row: VTableSummaryRow,
  Cell: VTableSummaryCell,
})
