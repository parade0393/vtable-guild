import { computed, defineComponent, inject, provide, type PropType, type SlotsType } from 'vue'
import {
  mergeDeep,
  useTheme,
  VTABLE_GUILD_INJECTION_KEY,
  type DeepPartial,
  type LocaleName,
  type LocaleRegistry,
  type SlotProps,
  type VTableGuildContext,
  type VTableGuildTableLocale,
} from '@vtable-guild/core'
import {
  resolveBuiltInTableLocale,
  resolveTableLocalePreset,
  resolveTableThemePreset,
  tableTheme,
  type TableSlots,
} from '@vtable-guild/theme'
import { useColumns, useSorter, useFilter, useSelection } from '../composables'

import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { resolveTablePresetConfig } from '../preset-config'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import TableLoading from './TableLoading'
import type {
  ColumnsType,
  ColumnType,
  Key,
  RowSelection,
  TableFiltersInfo,
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
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: undefined },
    bordered: { type: Boolean, default: false },
    striped: { type: Boolean, default: false },
    hoverable: { type: Boolean, default: true },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<TableSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
    showSorterTooltip: { type: Boolean, default: undefined },
    locale: {
      type: String as PropType<LocaleName>,
      default: undefined,
    },
    locales: {
      type: Object as PropType<LocaleRegistry>,
      default: undefined,
    },
    localeOverrides: {
      type: Object as PropType<DeepPartial<VTableGuildTableLocale>>,
      default: undefined,
    },
    rowSelection: {
      type: Object as PropType<RowSelection>,
      default: undefined,
    },
  },
  emits: {
    change: (
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
      confirm: (options?: { closeDropdown?: boolean }) => void
      clearFilters: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
      filters: import('../types').ColumnFilterItem[]
      visible: boolean
      close: () => void
    }
    customFilterIcon: {
      column: ColumnType<Record<string, unknown>>
      filtered: boolean
    }
  }>,
  setup(props, { slots, emit }) {
    const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

    const effectiveThemePreset = computed(() => globalContext?.themePreset ?? 'antdv')

    const defaultTheme = computed(
      () => resolveTableThemePreset(effectiveThemePreset.value) ?? tableTheme,
    )

    const { slots: themeSlots } = useTheme('table', defaultTheme, props)

    const effectiveLocaleName = computed(() => props.locale ?? globalContext?.locale ?? 'zh-CN')

    const effectiveLocales = computed(() => ({
      ...(globalContext?.locales ?? {}),
      ...(props.locales ?? {}),
    }))

    const tableLocale = computed<VTableGuildTableLocale>(() => {
      const defaultLocale = resolveTableLocalePreset(effectiveThemePreset.value)
      const builtInLocale = resolveBuiltInTableLocale(
        effectiveThemePreset.value,
        effectiveLocaleName.value,
      )
      const registeredLocale = effectiveLocales.value[effectiveLocaleName.value]?.table

      // default → builtIn → registered: builtIn always participates
      const mergedBase = mergeDeep(mergeDeep(defaultLocale, builtInLocale), registeredLocale)

      return mergeDeep(
        mergedBase,
        mergeDeep(globalContext?.localeOverrides?.table ?? {}, props.localeOverrides),
      )
    })

    // ---- 拍平列 ----
    const { leafColumns } = useColumns(() => props.columns)

    // ---- 排序 ----
    const { getSortOrder, toggleSortOrder, sortData, sorterState } = useSorter({
      columns: () => leafColumns.value,
      onSorterChange(sorterResult) {
        const processedData = getProcessedData()
        emit('change', getAllFilters(), sorterResult, {
          action: 'sort',
          currentDataSource: processedData,
        })
      },
    })

    // ---- 筛选 ----
    const { getFilteredValue, confirmFilter, resetFilter, getAllFilters, filterData } = useFilter({
      columns: () => leafColumns.value,
      onFilterChange(filters) {
        const processedData = getProcessedData()
        emit(
          'change',
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

    // ---- 行选择 ----
    function getRowKeyFn(record: Record<string, unknown>, index: number): Key {
      if (typeof props.rowKey === 'function') return props.rowKey(record)
      if (typeof props.rowKey === 'string' && props.rowKey in record) {
        return record[props.rowKey] as Key
      }
      return index
    }

    const {
      selectedKeySet: _selectedKeySet,
      isSelected: selIsSelected,
      isDisabled: selIsDisabled,
      toggleRow: selToggleRow,
      toggleAll: selToggleAll,
      allCheckedState: selAllCheckedState,
      invertSelection: selInvertSelection,
      clearSelection: selClearSelection,
      getChangeableRowKeys: selGetChangeableRowKeys,
    } = useSelection({
      rowSelection: () => props.rowSelection,
      getRowKey: getRowKeyFn,
      data: () => processedData.value,
      onSelectionChange() {
        emit(
          'change',
          getAllFilters(),
          {
            column: sorterState.value.column,
            columnKey: sorterState.value.columnKey,
            order: sorterState.value.order,
            field: sorterState.value.column?.dataIndex,
          },
          { action: 'select', currentDataSource: processedData.value },
        )
      },
    })

    // ---- displayColumns：选择列 + 原始列 ----
    const SELECTION_COLUMN_KEY = '__vtg_selection__'

    const displayColumns = computed(() => {
      const sel = props.rowSelection
      if (!sel) return leafColumns.value
      const selColumn: ColumnType<Record<string, unknown>> = {
        key: SELECTION_COLUMN_KEY,
        title: '',
        width: sel.columnWidth ?? 48,
        align: 'center',
      }
      return [selColumn, ...leafColumns.value]
    })

    // ---- provide context ----
    const subThemeSlots = computed(() => ({
      thSortable: themeSlots.thSortable(),
      sortButton: themeSlots.sortButton(),
      sortIconDown: themeSlots.sortIconDown(),
      sortAreaOuter: themeSlots.sortAreaOuter(),
      sortAreaWrapper: themeSlots.sortAreaWrapper(),
      sortAreaTitle: themeSlots.sortAreaTitle(),
      filterIconWrapper: themeSlots.filterIconWrapper(),
      filterIcon: themeSlots.filterIcon(),
      filterDropdown: themeSlots.filterDropdown(),
      filterDropdownList: themeSlots.filterDropdownList(),
      filterDropdownItem: themeSlots.filterDropdownItem(),
      filterDropdownItemSelected: themeSlots.filterDropdownItemSelected(),
      filterDropdownItemHover: themeSlots.filterDropdownItemHover(),
      filterDropdownActions: themeSlots.filterDropdownActions(),
      filterDropdownSearch: themeSlots.filterDropdownSearch(),
      filterDropdownSearchField: themeSlots.filterDropdownSearchField(),
      filterDropdownSearchIcon: themeSlots.filterDropdownSearchIcon(),
      filterDropdownSearchInput: themeSlots.filterDropdownSearchInput(),
      filterDropdownListEmpty: themeSlots.filterDropdownListEmpty(),
      filterDropdownSwitcher: themeSlots.filterDropdownSwitcher(),
      filterDropdownSwitcherExpanded: themeSlots.filterDropdownSwitcherExpanded(),
      filterDropdownSwitcherCollapsed: themeSlots.filterDropdownSwitcherCollapsed(),
      filterDropdownSwitcherNoop: themeSlots.filterDropdownSwitcherNoop(),
      filterDropdownContentWrapper: themeSlots.filterDropdownContentWrapper(),
      filterDropdownTreeWrapper: themeSlots.filterDropdownTreeWrapper(),
      filterDropdownTreeList: themeSlots.filterDropdownTreeList(),
      filterDropdownTreeItem: themeSlots.filterDropdownTreeItem(),
      filterDropdownTreeContentWrapper: themeSlots.filterDropdownTreeContentWrapper(),
      filterDropdownTreeItemSelected: themeSlots.filterDropdownTreeItemSelected(),
      filterDropdownTreeCheckAll: themeSlots.filterDropdownTreeCheckAll(),
      emptyWrapper: themeSlots.emptyWrapper(),
      emptyIcon: themeSlots.emptyIcon(),
      emptyText: themeSlots.emptyText(),
      loadingSpinner: themeSlots.loadingSpinner(),
      tdSelected: themeSlots.tdSelected(),
      tdSelectedHover: themeSlots.tdSelectedHover(),
      selectionDropdown: themeSlots.selectionDropdown(),
      selectionDropdownItem: themeSlots.selectionDropdownItem(),
      selectionExtra: themeSlots.selectionExtra(),
    }))

    const presetConfig = computed(() => resolveTablePresetConfig(effectiveThemePreset.value))

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
      customFilterIcon: slots.customFilterIcon,
      showSorterTooltip: computed(
        () => props.showSorterTooltip ?? presetConfig.value.showSorterTooltip,
      ),
      subThemeSlots,
      presetConfig,
      localeName: effectiveLocaleName,
      locale: tableLocale,
      rowSelection: () => props.rowSelection,
      isSelected: selIsSelected,
      isDisabledRow: selIsDisabled,
      toggleRow: selToggleRow,
      toggleAll: selToggleAll,
      allCheckedState: () => selAllCheckedState.value,
      getRowKey: getRowKeyFn,
      invertSelection: selInvertSelection,
      clearSelection: selClearSelection,
      getChangeableRowKeys: selGetChangeableRowKeys,
    })

    return () => (
      <div class={themeSlots.root()}>
        <div class={themeSlots.wrapper()}>
          <table class={themeSlots.table()}>
            <TableHeader
              columns={displayColumns.value}
              theadClass={themeSlots.thead()}
              rowClass={themeSlots.tr()}
              thClass={themeSlots.th()}
              headerCellInnerClass={themeSlots.headerCellInner()}
            />
            <TableBody
              dataSource={processedData.value}
              columns={displayColumns.value}
              tbodyClass={themeSlots.tbody()}
              rowClass={themeSlots.tr()}
              tdClass={themeSlots.td()}
              emptyClass={themeSlots.empty()}
              bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
              rowKey={props.rowKey}
            />
          </table>

          {props.loading &&
            (slots.loading ? (
              <TableLoading loadingClass={themeSlots.loading()}>{slots.loading()}</TableLoading>
            ) : (
              <TableLoading loadingClass={themeSlots.loading()} />
            ))}
        </div>
      </div>
    )
  },
})
