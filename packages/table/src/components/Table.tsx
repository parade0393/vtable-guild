import { computed, defineComponent, inject, provide, type PropType, type SlotsType } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY, type VTableGuildContext } from '@vtable-guild/core'
import { resolveTableThemePreset, tableTheme, type TableSlots } from '@vtable-guild/theme'
import type { SlotProps, ThemePresetName } from '@vtable-guild/core'
import { useColumns, useSorter, useFilter } from '../composables'

import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import TableLoading from './TableLoading'
import type {
  ColumnsType,
  ColumnType,
  Key,
  TableFiltersInfo,
  TablePaginationInfo,
  TableChangeExtra,
} from '../types'

import type { SorterResult } from '../composables'

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
    showSorterTooltip: { type: Boolean, default: true },
  },
  emits: {
    change: (
      _pagination: TablePaginationInfo,
      _filters: TableFiltersInfo,
      _sorter: SorterResult,
      _extra: TableChangeExtra<Record<string, unknown>>,
    ) => true,
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
    customFilterDropdown: {
      column: ColumnType<Record<string, unknown>>
      selectedKeys: (string | number | boolean)[]
      setSelectedKeys: (keys: (string | number | boolean)[]) => void
      confirm: () => void
      clearFilters: () => void
    }
  }>,
  setup(props, { slots, emit }) {
    const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

    const effectiveThemePreset = computed(
      () => props.themePreset ?? globalContext?.themePreset ?? 'antdv',
    )

    const defaultTheme = resolveTableThemePreset(effectiveThemePreset.value) ?? tableTheme

    const { slots: themeSlots } = useTheme('table', defaultTheme, props)

    // ---- 拍平列 ----
    const { leafColumns } = useColumns(() => props.columns)

    // ---- 排序 ----
    const { getSortOrder, toggleSortOrder, sortData, sorterState } = useSorter({
      columns: () => leafColumns.value,
      onSorterChange(sorterResult) {
        const processedData = getProcessedData()
        emit(
          'change',
          { current: 1, pageSize: processedData.length, total: props.dataSource.length },
          getAllFilters(),
          sorterResult,
          { action: 'sort', currentDataSource: processedData },
        )
      },
    })

    // ---- 筛选 ----
    const { getFilteredValue, confirmFilter, resetFilter, getAllFilters, filterData } = useFilter({
      columns: () => leafColumns.value,
      onFilterChange(filters) {
        const processedData = getProcessedData()
        emit(
          'change',
          { current: 1, pageSize: processedData.length, total: props.dataSource.length },
          filters,
          {
            column: sorterState.value.column,
            columnKey: sorterState.value.columnKey,
            order: sorterState.value.order,
            field: sorterState.value.column?.dataIndex,
          },
          { action: 'filter', currentDataSource: processedData },
        )
      },
    })

    // ---- 处理后数据：筛选 → 排序 ----
    function getProcessedData() {
      let data = props.dataSource
      data = filterData(data)
      data = sortData(data)
      return data
    }

    const processedData = computed(() => getProcessedData())

    // ---- provide context ----
    provide<TableContext>(TABLE_CONTEXT_KEY, {
      bodyCell: slots.bodyCell,
      headerCell: slots.headerCell,
      empty: slots.empty,
      getSortOrder,
      toggleSortOrder,
      getFilteredValue,
      confirmFilter,
      resetFilter,
      customFilterDropdown: slots.customFilterDropdown,
      showSorterTooltip: props.showSorterTooltip,
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
              dataSource={processedData.value}
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
