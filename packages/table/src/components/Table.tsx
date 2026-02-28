import { computed, defineComponent, inject, provide, type PropType, type SlotsType } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import { resolveTableThemePreset, tableTheme, type TableSlots } from '@vtable-guild/theme'
import type { SlotProps, ThemePresetName } from '@vtable-guild/core'
import { useColumns } from '../composables'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import TableLoading from './TableLoading'
import type { ColumnsType, ColumnType, Key } from '../types'

export default defineComponent({
  name: 'VTable',
  props: {
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    columns: { type: Array as PropType<ColumnsType<Record<string, unknown>>>, default: () => [] },
    rowKey: {
      type: [String, Function] as PropType<string | ((record: Record<string, unknown>) => Key)>,
      default: undefined,
    },
    loading: { type: Boolean, default: false },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'lg' },
    bordered: { type: Boolean, default: false },
    striped: { type: Boolean, default: false },
    hoverable: { type: Boolean, default: true },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<TableSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
    themePreset: { type: String as PropType<ThemePresetName>, default: undefined },
  },
  slots: Object as SlotsType<{
    bodyCell: {
      text: unknown
      record: Record<string, unknown>
      index: number
      column: ColumnType<Record<string, unknown>>
    }
    headerCell: {
      title: string | undefined
      column: ColumnType<Record<string, unknown>>
      index: number
    }
    empty: void
    loading: void
  }>,
  setup(props, { slots }) {
    const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

    const effectiveThemePreset = computed(
      () => props.themePreset ?? globalContext?.themePreset ?? 'antdv',
    )

    // ---- Step 2: 根据 preset 获取默认主题 ----
    // ⚠️ 重要限制：useTheme() 的 defaultTheme 参数为非响应式。
    // resolveTableThemePreset() 在 setup 阶段调用一次，后续不会因 effectiveThemePreset 变化而更新。
    const defaultTheme = resolveTableThemePreset(effectiveThemePreset.value) ?? tableTheme

    // ---- Step 3: 三层主题合并 ----
    // 直接传 defineComponent 的 reactive props，useTheme 内部通过闭包懒读取保证响应性
    const { slots: themeSlots } = useTheme('table', defaultTheme, props)

    // ---- Step 4: 拍平列 ----
    const { leafColumns } = useColumns(() => props.columns)

    // ---- Step 6: 通过 provide 传递 slots 给孙组件 ----
    // ⚠️ 核心修正：scoped slots 不跨层级传播，必须用 provide/inject。
    provide<TableContext>(TABLE_CONTEXT_KEY, {
      bodyCell: slots.bodyCell,
      headerCell: slots.headerCell,
      empty: slots.empty,
    })

    return () => (
      <div class={themeSlots.root()}>
        <div class={themeSlots.wrapper()}>
          <table class={themeSlots.table()}>
            <TableHeader
              columns={leafColumns.value}
              theadClass={themeSlots.thead()}
              rowClass={themeSlots.tr()}
              thClass={themeSlots.th()}
              headerCellInnerClass={themeSlots.headerCellInner()}
            />
            <TableBody
              dataSource={props.dataSource}
              columns={leafColumns.value}
              tbodyClass={themeSlots.tbody()}
              rowClass={themeSlots.tr()}
              tdClass={themeSlots.td()}
              emptyClass={themeSlots.empty()}
              bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
              rowKey={props.rowKey}
            />
          </table>

          {props.loading && (
            <TableLoading loadingClass={themeSlots.loading()}>
              {slots.loading?.() ?? 'Loading...'}
            </TableLoading>
          )}
        </div>
      </div>
    )
  },
})
