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

// 保留 DefineComponent 的命名类型，避免声明生成时展开其构造签名和 Vue 内部泛型。
const SummaryWithSubcomponents: typeof VTableSummary & {
  Row: typeof VTableSummaryRow
  Cell: typeof VTableSummaryCell
} = Object.assign(VTableSummary, {
  Row: VTableSummaryRow,
  Cell: VTableSummaryCell,
})

export default SummaryWithSubcomponents
