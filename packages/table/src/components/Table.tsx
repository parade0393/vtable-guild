import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import {
  cn,
  mergeDeep,
  mergeThemeConfigs,
  type ThemeConfig,
  Scrollbar,
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
  resolveButtonThemePreset,
  resolveCheckboxThemePreset,
  resolveInputThemePreset,
  resolveRadioThemePreset,
  resolveScrollbarThemePreset,
  resolveTableLocalePreset,
  resolveTableThemePreset,
  resolveTooltipThemePreset,
  tableTheme,
  type TableSlots,
} from '@vtable-guild/theme'
import { useColumns, useSorter, useFilter, useSelection } from '../composables'
import { useScroll, type ScrollConfig } from '../composables/useScroll'
import { useExpand } from '../composables/useExpand'
import { useResize } from '../composables/useResize'
import { useVirtual } from '../composables/useVirtual'
import { useTreeData } from '../composables/useTreeData'

import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { resolveTablePresetConfig } from '../preset-config'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import VirtualTableBody from './VirtualTableBody'
import TableLoading from './TableLoading'
import ColGroup from './ColGroup'
import type {
  Breakpoint,
  ColumnsType,
  ColumnType,
  ColumnGroupType,
  Key,
  RowSelection,
  TableFiltersInfo,
  TableChangeExtra,
  Expandable,
} from '../types'

import type { SorterResult } from '../composables'

type TableRecord = Record<string, unknown>

const RESPONSIVE_BREAKPOINTS: Array<[Breakpoint, number]> = [
  ['xxxl', 2000],
  ['xxl', 1600],
  ['xl', 1200],
  ['lg', 992],
  ['md', 768],
  ['sm', 576],
  ['xs', 0],
]

function resolveMatchedBreakpoints(): Set<Breakpoint> {
  if (typeof window === 'undefined') {
    return new Set(['md', 'sm', 'xs'])
  }

  const width = window.innerWidth
  const screens = new Set<Breakpoint>()

  RESPONSIVE_BREAKPOINTS.forEach(([breakpoint, minWidth]) => {
    if (breakpoint === 'xs') {
      if (width < 576) {
        screens.add('xs')
      }
      return
    }

    if (width >= minWidth) {
      screens.add(breakpoint)
    }
  })

  return screens
}

function filterResponsiveColumns<TRecord extends Record<string, unknown>>(
  columns: ColumnsType<TRecord>,
  screens: Set<Breakpoint>,
): ColumnsType<TRecord> {
  return columns.reduce<ColumnsType<TRecord>>((result, column) => {
    if (
      column.responsive?.length &&
      !column.responsive.some((breakpoint) => screens.has(breakpoint))
    ) {
      return result
    }

    if ('children' in column && Array.isArray(column.children)) {
      const children = filterResponsiveColumns(column.children, screens)
      if (children.length === 0) {
        return result
      }

      result.push({
        ...column,
        children,
      } as ColumnGroupType<TRecord>)
      return result
    }

    result.push(column)
    return result
  }, [])
}

export default defineComponent({
  name: 'VTable',
  props: {
    dataSource: { type: Array as PropType<TableRecord[]>, default: () => [] },
    columns: { type: Array as PropType<ColumnsType<TableRecord>>, default: () => [] },
    rowKey: {
      type: [String, Function] as PropType<string | ((record: TableRecord) => Key)>,
      default: undefined,
    },
    loading: { type: Boolean, default: false },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: undefined },
    bordered: { type: Boolean, default: false },
    striped: { type: Boolean, default: false },
    hoverable: { type: Boolean, default: true },
    tableLayout: {
      type: String as PropType<'auto' | 'fixed'>,
      default: undefined,
    },
    showHeader: { type: Boolean, default: true },
    rowClassName: {
      type: [String, Function] as PropType<
        string | ((record: TableRecord, index: number, indent: number) => string)
      >,
      default: undefined,
    },
    customRow: {
      type: Function as PropType<
        (
          record: TableRecord,
          index?: number,
          column?: ColumnType<TableRecord>,
        ) => Record<string, unknown>
      >,
      default: undefined,
    },
    customHeaderRow: {
      type: Function as PropType<
        (
          columns: Array<ColumnType<TableRecord> | ColumnGroupType<TableRecord>>,
          index?: number,
        ) => Record<string, unknown>
      >,
      default: undefined,
    },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<TableSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
    showSorterTooltip: { type: Boolean, default: undefined },
    sortDirections: {
      type: Array as PropType<Array<'ascend' | 'descend' | null>>,
      default: undefined,
    },
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
    sticky: {
      type: [Boolean, Object] as PropType<
        boolean | { offsetHeader?: number; offsetSummary?: number; offsetScroll?: number }
      >,
      default: undefined,
    },
    getPopupContainer: {
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    transformCellText: {
      type: Function as PropType<
        (options: {
          text: unknown
          column: ColumnType<TableRecord>
          record: TableRecord
          index: number
        }) => unknown
      >,
      default: undefined,
    },
    rowSelection: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
    title: {
      type: Function as PropType<(data: TableRecord[]) => VNodeChild>,
      default: undefined,
    },
    footer: {
      type: Function as PropType<(data: TableRecord[]) => VNodeChild>,
      default: undefined,
    },
    scroll: {
      type: Object as PropType<ScrollConfig>,
      default: undefined,
    },
    expandable: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
    virtual: { type: Boolean, default: false },
    childrenColumnName: { type: String, default: undefined },
    indentSize: { type: Number, default: undefined },
    expandedRowKeys: {
      type: Array as PropType<Key[]>,
      default: undefined,
    },
    defaultExpandedRowKeys: {
      type: Array as PropType<Key[]>,
      default: undefined,
    },
    defaultExpandAllRows: { type: Boolean, default: false },
    onExpand: {
      type: Function as PropType<(expanded: boolean, record: TableRecord) => void>,
      default: undefined,
    },
    onExpandedRowsChange: {
      type: Function as PropType<(expandedKeys: Key[]) => void>,
      default: undefined,
    },
  },
  emits: {
    change: (
      _filters: TableFiltersInfo,
      _sorter: SorterResult<Record<string, unknown>>,
      _extra: TableChangeExtra<Record<string, unknown>>,
    ) => true,
    resizeColumn: (_column: ColumnType<Record<string, unknown>>, _width: number) => true,
  },
  slots: Object as SlotsType<{
    bodyCell: {
      text: unknown
      record: Record<string, unknown>
      index: number
      column: ColumnType<Record<string, unknown>>
    }
    headerCell: {
      title: VNodeChild | undefined
      column: ColumnsType<Record<string, unknown>>[number]
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
    title: { data: Record<string, unknown>[] }
    footer: { data: Record<string, unknown>[] }
    summary: void
  }>,
  setup(props, { slots, emit }) {
    const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

    const effectiveThemePreset = computed(() => globalContext?.themePreset ?? 'antdv')

    const descendantTheme = computed(() => {
      const inheritedTheme = globalContext?.theme ?? {}
      const presetName = effectiveThemePreset.value

      return {
        ...inheritedTheme,
        button: mergeThemeConfigs(
          resolveButtonThemePreset(presetName),
          inheritedTheme.button as Partial<ThemeConfig> | undefined,
        ),
        checkbox: mergeThemeConfigs(
          resolveCheckboxThemePreset(presetName),
          inheritedTheme.checkbox as Partial<ThemeConfig> | undefined,
        ),
        input: mergeThemeConfigs(
          resolveInputThemePreset(presetName),
          inheritedTheme.input as Partial<ThemeConfig> | undefined,
        ),
        radio: mergeThemeConfigs(
          resolveRadioThemePreset(presetName),
          inheritedTheme.radio as Partial<ThemeConfig> | undefined,
        ),
        scrollbar: mergeThemeConfigs(
          resolveScrollbarThemePreset(presetName),
          inheritedTheme.scrollbar as Partial<ThemeConfig> | undefined,
        ),
        tooltip: mergeThemeConfigs(
          resolveTooltipThemePreset(presetName),
          inheritedTheme.tooltip as Partial<ThemeConfig> | undefined,
        ),
      }
    })

    provide(VTABLE_GUILD_INJECTION_KEY, {
      get themePreset() {
        return effectiveThemePreset.value
      },
      get theme() {
        return descendantTheme.value
      },
      get locale() {
        return globalContext?.locale ?? 'zh-CN'
      },
      get locales() {
        return globalContext?.locales ?? {}
      },
      get localeOverrides() {
        return globalContext?.localeOverrides ?? {}
      },
    } as VTableGuildContext)

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

    const matchedResponsiveBreakpoints = ref<Set<Breakpoint>>(resolveMatchedBreakpoints())

    function updateResponsiveBreakpoints() {
      matchedResponsiveBreakpoints.value = resolveMatchedBreakpoints()
    }

    onMounted(() => {
      updateResponsiveBreakpoints()
      window.addEventListener('resize', updateResponsiveBreakpoints)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateResponsiveBreakpoints)
    })

    const responsiveColumns = computed(() =>
      filterResponsiveColumns(props.columns, matchedResponsiveBreakpoints.value),
    )

    const resolvedSticky = computed(() =>
      props.sticky === true ? {} : typeof props.sticky === 'object' ? props.sticky : undefined,
    )

    // ---- 原始数据列 ----
    const { leafColumns: dataLeafColumns } = useColumns(() => responsiveColumns.value)

    // ---- 排序 ----
    const { getSortOrder, toggleSortOrder, sortData, sorterState, sorterResult, sortColumns } =
      useSorter({
        columns: () => dataLeafColumns.value,
        tableSortDirections: () => props.sortDirections,
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
      columns: () => dataLeafColumns.value,
      onFilterChange(filters) {
        const processedData = getProcessedData()
        emit('change', filters, sorterResult.value, {
          action: 'filter',
          currentDataSource: processedData,
        })
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

    // ---- 行 key 解析 ----
    function getRowKeyFn(record: Record<string, unknown>, index: number): Key {
      if (typeof props.rowKey === 'function') return props.rowKey(record)
      if (typeof props.rowKey === 'string' && props.rowKey in record) {
        return record[props.rowKey] as Key
      }
      return index
    }

    // ---- 树形数据 ----
    const {
      flattenData: treeFlattenData,
      isTreeData,
      toggleTreeExpand,
      isTreeExpanded,
      indentSize: treeIndentSize,
    } = useTreeData({
      data: () => processedData.value,
      childrenColumnName: () => props.childrenColumnName,
      indentSize: () => props.indentSize,
      getRowKey: getRowKeyFn,
      defaultExpandedRowKeys: () => props.defaultExpandedRowKeys,
      expandedRowKeys: () => props.expandedRowKeys,
      defaultExpandAllRows: () => props.defaultExpandAllRows,
      onExpand: props.onExpand,
      onExpandedRowsChange: props.onExpandedRowsChange,
    })

    /** Final display data — flat records after tree expansion */
    const displayData = computed(() => {
      if (!isTreeData.value) return processedData.value
      return treeFlattenData.value.map((row) => row.record)
    })

    const {
      selectedKeySet: _selectedKeySet,
      isSelected: selIsSelected,
      isDisabled: selIsDisabled,
      getSelectionState: selGetSelectionState,
      toggleRow: selToggleRow,
      toggleAll: selToggleAll,
      allCheckedState: selAllCheckedState,
      invertSelection: selInvertSelection,
      clearSelection: selClearSelection,
      getChangeableRowKeys: selGetChangeableRowKeys,
    } = useSelection({
      rowSelection: () => props.rowSelection as RowSelection<Record<string, unknown>> | undefined,
      getRowKey: getRowKeyFn,
      data: () => processedData.value,
      visibleData: () => displayData.value,
      childrenColumnName: () => props.childrenColumnName,
      onSelectionChange() {
        emit('change', getAllFilters(), sorterResult.value, {
          action: 'select',
          currentDataSource: displayData.value,
        })
      },
    })

    // ---- 展开行 ----
    const { isExpanded: expIsExpanded, toggleExpand: expToggleExpand } = useExpand({
      expandable: () => props.expandable as Expandable<Record<string, unknown>> | undefined,
      getRowKey: getRowKeyFn,
      data: () => displayData.value,
    })

    const isRowExpandable = (record: Record<string, unknown>): boolean => {
      const exp = props.expandable as Expandable<Record<string, unknown>> | undefined
      if (!exp) return false
      if (exp.rowExpandable) return exp.rowExpandable(record)
      return !!exp.expandedRowRender
    }

    const toggleExpandedRow = (record: Record<string, unknown>, index: number) => {
      if (!isRowExpandable(record)) return
      expToggleExpand(record, index)
    }

    // ---- displayColumns：选择列 + 展开列 + 原始列 ----
    const SELECTION_COLUMN_KEY = '__vtg_selection__'
    const EXPAND_COLUMN_KEY = '__vtg_expand__'

    const displayColumnTree = computed<ColumnsType<Record<string, unknown>>>(() => {
      const cols: ColumnsType<Record<string, unknown>> = [...responsiveColumns.value]
      const exp = props.expandable as Expandable<Record<string, unknown>> | undefined
      if (exp && exp.showExpandColumn !== false) {
        const expandCol: ColumnType<Record<string, unknown>> = {
          key: EXPAND_COLUMN_KEY,
          title: '',
          width: exp.columnWidth ?? 48,
          align: 'center',
          fixed: exp.fixed,
        }
        cols.unshift(expandCol)
      }
      const sel = props.rowSelection as RowSelection<Record<string, unknown>> | undefined
      if (sel) {
        const selColumn: ColumnType<Record<string, unknown>> = {
          key: SELECTION_COLUMN_KEY,
          title: '',
          width: sel.columnWidth ?? 48,
          align: 'center',
          fixed: sel.fixed === true ? 'left' : sel.fixed || undefined,
        }
        cols.unshift(selColumn)
      }
      return cols
    })

    const { leafColumns: displayColumns, headerRows } = useColumns(() => displayColumnTree.value)
    const hasGroupedHeader = computed(() => headerRows.value.length > 1)

    // ---- 滚动/固定列 ----
    const {
      headerWrapRef,
      bodyWrapRef,
      scrollState,
      handleBodyScroll,
      fixedOffsets,
      syncHorizontalScroll,
    } = useScroll({
      displayColumns: () => displayColumns.value,
    })

    const hasStickyHeader = computed(
      () => props.showHeader !== false && (!!props.scroll?.y || !!props.sticky),
    )

    const hasFixedColumns = computed(() =>
      displayColumns.value.some((column) => column.fixed === 'left' || column.fixed === 'right'),
    )

    const hasEllipsisColumns = computed(() =>
      dataLeafColumns.value.some((column) => column.ellipsis),
    )

    const shouldExpandTableWidth = computed(
      () => props.scroll?.x !== undefined || hasFixedColumns.value,
    )

    const resolvedTableLayout = computed(() => {
      if (props.tableLayout) return props.tableLayout
      if (props.scroll?.y || props.scroll?.x || hasFixedColumns.value || hasEllipsisColumns.value) {
        return 'fixed'
      }
      return 'auto'
    })

    const stickyHeaderStyle = computed<Record<string, string> | undefined>(() => {
      if (!resolvedSticky.value) return undefined

      return {
        position: 'sticky',
        top: `${resolvedSticky.value.offsetHeader ?? 0}px`,
        zIndex: '4',
      }
    })

    // ---- 虚拟滚动 ----
    const {
      enabled: virtualEnabled,
      itemHeight: virtualItemHeight,
      listHeight: virtualListHeight,
    } = useVirtual({
      virtual: () => props.virtual,
      scrollY: () => props.scroll?.y,
      size: () => props.size,
    })

    const hasPotentialBodySpan = computed(() =>
      dataLeafColumns.value.some((column) => !!column.customCell || !!column.customRender),
    )
    const groupedHeaderThemeClasses = computed(() => {
      if (!hasGroupedHeader.value || props.bordered) {
        return {
          table: '',
          th: '',
          td: '',
        }
      }

      return {
        table: themeSlots.groupedHeaderTable(),
        th: themeSlots.groupedHeaderTh(),
        td: themeSlots.groupedHeaderTd(),
      }
    })
    const tableClass = computed(
      () => cn(themeSlots.table(), groupedHeaderThemeClasses.value.table) ?? '',
    )
    const thClass = computed(() => cn(themeSlots.th(), groupedHeaderThemeClasses.value.th) ?? '')
    const tdClass = computed(() => cn(themeSlots.td(), groupedHeaderThemeClasses.value.td) ?? '')
    const warnedVirtualSpan = ref(false)

    watch(
      [virtualEnabled, hasPotentialBodySpan],
      ([enabled, hasSpan]) => {
        if (!enabled || !hasSpan || warnedVirtualSpan.value || import.meta.env.PROD) {
          return
        }

        warnedVirtualSpan.value = true
        console.warn(
          '[VTable] Body cell merging via customCell/customRender is not supported when virtual=true.',
        )
      },
      { immediate: true },
    )

    // Bridge VScrollbar's internal wrapRef → useScroll's bodyWrapRef
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyScrollbarRef = ref<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapperScrollbarRef = ref<any>(null)

    watch(
      () => bodyScrollbarRef.value?.wrapRef,
      (el: HTMLElement | null) => {
        if (el) bodyWrapRef.value = el
      },
    )
    watch(
      () => wrapperScrollbarRef.value?.wrapRef,
      (el: HTMLElement | null) => {
        if (el) bodyWrapRef.value = el
      },
    )

    // ---- 列宽调整 ----
    const {
      columnWidths: resizeColumnWidths,
      startResize: resizeStartResize,
      isResizing: resizeIsResizing,
    } = useResize({
      onResizeColumn(column, width) {
        emit('resizeColumn', column, width)
      },
    })

    function getRowIndent(record: Record<string, unknown>): number {
      return isTreeData.value
        ? (treeFlattenData.value.find((row) => row.record === record)?.level ?? 0)
        : 0
    }

    function getResolvedRowClassName(record: Record<string, unknown>, index: number): string {
      if (!props.rowClassName) return ''
      if (typeof props.rowClassName === 'function') {
        return props.rowClassName(record, index, getRowIndent(record))
      }
      return props.rowClassName
    }

    function getResolvedRowProps(record: Record<string, unknown>, index: number) {
      return props.customRow?.(record, index)
    }

    function getResolvedHeaderRowProps(
      columns: Array<
        ColumnType<Record<string, unknown>> | ColumnGroupType<Record<string, unknown>>
      >,
      index: number,
    ) {
      return props.customHeaderRow?.(columns, index)
    }

    function getResolvedColumnTitle(
      column: ColumnType<Record<string, unknown>> | ColumnGroupType<Record<string, unknown>>,
    ) {
      if (typeof column.title !== 'function') {
        return column.title ?? ''
      }

      const sortableColumn = column as ColumnType<Record<string, unknown>>
      const resolvedSortColumns = sortColumns.value.filter(
        (item): item is { column: ColumnType<Record<string, unknown>>; order: typeof item.order } =>
          !!item.column,
      )

      return column.title({
        sortOrder: sortableColumn.sorter ? (getSortOrder(sortableColumn) ?? undefined) : undefined,
        sortColumn: sorterState.value.column,
        sortColumns: resolvedSortColumns.length > 0 ? resolvedSortColumns : undefined,
        filters: getAllFilters(),
      })
    }

    const scrollbarViewStyle = {
      width: '100%',
      minWidth: '100%',
    } as const

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
      summaryRow: themeSlots.summaryRow(),
      summaryCell: themeSlots.summaryCell(),
      headerWrapper: themeSlots.headerWrapper(),
      bodyWrapper: themeSlots.bodyWrapper(),
      fixedCell: themeSlots.fixedCell(),
      fixedDividerLeft: themeSlots.fixedDividerLeft(),
      fixedDividerRight: themeSlots.fixedDividerRight(),
      fixedShadowLeft: themeSlots.fixedShadowLeft(),
      fixedShadowRight: themeSlots.fixedShadowRight(),
      fixedShadowLeftHidden: themeSlots.fixedShadowLeftHidden(),
      fixedShadowRightHidden: themeSlots.fixedShadowRightHidden(),
      expandIcon: themeSlots.expandIcon(),
      expandIconExpanded: themeSlots.expandIconExpanded(),
      expandIconCollapsed: themeSlots.expandIconCollapsed(),
      expandIconSpaced: themeSlots.expandIconSpaced(),
      expandIconDisabled: themeSlots.expandIconDisabled(),
      expandIconSymbol: themeSlots.expandIconSymbol(),
      expandIconSymbolExpanded: themeSlots.expandIconSymbolExpanded(),
      expandIconSymbolCollapsed: themeSlots.expandIconSymbolCollapsed(),
      treeExpandIcon: themeSlots.treeExpandIcon(),
      treeExpandIconExpanded: themeSlots.treeExpandIconExpanded(),
      treeExpandIconCollapsed: themeSlots.treeExpandIconCollapsed(),
      treeExpandIconSpaced: themeSlots.treeExpandIconSpaced(),
      treeExpandIconDisabled: themeSlots.treeExpandIconDisabled(),
      treeExpandIconSymbol: themeSlots.treeExpandIconSymbol(),
      treeExpandIconSymbolExpanded: themeSlots.treeExpandIconSymbolExpanded(),
      treeExpandIconSymbolCollapsed: themeSlots.treeExpandIconSymbolCollapsed(),
      expandedRow: themeSlots.expandedRow(),
      expandedRowCell: themeSlots.expandedRowCell(),
      resizeHandle: themeSlots.resizeHandle(),
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
      themePreset: effectiveThemePreset,
      localeName: effectiveLocaleName,
      locale: tableLocale,
      rowSelection: () => props.rowSelection as RowSelection<Record<string, unknown>> | undefined,
      isSelected: selIsSelected,
      isDisabledRow: selIsDisabled,
      getSelectionState: selGetSelectionState,
      toggleRow: selToggleRow,
      toggleAll: selToggleAll,
      allCheckedState: () => selAllCheckedState.value,
      getRowKey: getRowKeyFn,
      invertSelection: selInvertSelection,
      clearSelection: selClearSelection,
      getChangeableRowKeys: selGetChangeableRowKeys,
      fixedOffsets,
      scrollState,
      leafColumnCount: computed(() => displayColumns.value.length),
      bordered: computed(() => props.bordered),
      tableLayout: resolvedTableLayout,
      sticky: computed(() => props.sticky),
      getRowProps: getResolvedRowProps,
      getRowClassName: getResolvedRowClassName,
      getHeaderRowProps: getResolvedHeaderRowProps,
      getColumnTitle: getResolvedColumnTitle,
      getPopupContainer: props.getPopupContainer,
      transformCellText: props.transformCellText,
      expandable: () => props.expandable as Expandable<Record<string, unknown>> | undefined,
      isExpanded: expIsExpanded,
      toggleExpand: toggleExpandedRow,
      isRowExpandable,
      columnWidths: resizeColumnWidths,
      startResize: resizeStartResize,
      isResizing: () => resizeIsResizing.value,
      isTreeData,
      treeFlattenData,
      toggleTreeExpand,
      isTreeExpanded,
      treeIndentSize,
    })

    return () => {
      // ---- title: prop > slot ----
      const titleContent = props.title
        ? props.title(displayData.value)
        : slots.title
          ? slots.title({ data: displayData.value })
          : null

      // ---- footer: prop > slot ----
      const footerContent = props.footer
        ? props.footer(displayData.value)
        : slots.footer
          ? slots.footer({ data: displayData.value })
          : null

      // ---- summary: slot only ----
      const summaryContent = slots.summary ? slots.summary() : null

      // ---- scroll style ----
      const scroll = props.scroll
      const tableStyle: Record<string, string> = {
        tableLayout: resolvedTableLayout.value,
      }

      if (scroll?.x) {
        tableStyle.width = typeof scroll.x === 'number' ? `${scroll.x}px` : scroll.x
        tableStyle.minWidth = '100%'
      } else {
        tableStyle.width = shouldExpandTableWidth.value ? 'max-content' : '100%'
      }

      const loadingOverlay =
        props.loading &&
        (slots.loading ? (
          <TableLoading loadingClass={themeSlots.loading()}>{slots.loading()}</TableLoading>
        ) : (
          <TableLoading loadingClass={themeSlots.loading()} />
        ))

      // ---- Dual-table mode (scroll.y set) ----
      if (hasStickyHeader.value) {
        const headerTable =
          props.showHeader !== false ? (
            <div
              ref={headerWrapRef}
              class={themeSlots.headerWrapper()}
              style={stickyHeaderStyle.value}
            >
              <div class="block w-full min-w-full">
                <table class={tableClass.value} style={tableStyle}>
                  <ColGroup columns={displayColumns.value} />
                  <TableHeader
                    rows={headerRows.value}
                    theadClass={themeSlots.thead()}
                    rowClass={themeSlots.tr()}
                    thClass={thClass.value}
                    headerCellInnerClass={themeSlots.headerCellInner()}
                  />
                </table>
              </div>
            </div>
          ) : null

        // Virtual scroll body
        const virtualBody = virtualEnabled.value ? (
          <VirtualTableBody
            dataSource={displayData.value}
            columns={displayColumns.value}
            tbodyClass={themeSlots.tbody()}
            rowClass={themeSlots.tr()}
            tdClass={tdClass.value}
            emptyClass={themeSlots.empty()}
            bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
            tableClass={tableClass.value}
            tableStyle={tableStyle}
            rowKey={props.rowKey}
            height={virtualListHeight.value}
            itemHeight={virtualItemHeight.value}
            showScrollBar="hover"
            onVirtualScroll={(info) => {
              syncHorizontalScroll(info.x, info.maxX)
            }}
          />
        ) : null

        // Normal scroll body
        const normalBody = !virtualEnabled.value ? (
          <Scrollbar
            ref={bodyScrollbarRef}
            maxHeight={
              scroll?.y !== undefined
                ? typeof scroll.y === 'number'
                  ? scroll.y
                  : String(scroll.y)
                : undefined
            }
            wrapClass={themeSlots.bodyWrapper()}
            viewStyle={scrollbarViewStyle}
            onScroll={handleBodyScroll}
          >
            <table class={tableClass.value} style={tableStyle}>
              <ColGroup columns={displayColumns.value} />
              <TableBody
                dataSource={displayData.value}
                columns={displayColumns.value}
                tbodyClass={themeSlots.tbody()}
                rowClass={themeSlots.tr()}
                tdClass={tdClass.value}
                emptyClass={themeSlots.empty()}
                bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
                rowKey={props.rowKey}
              />
              {summaryContent && <tfoot class={themeSlots.summary()}>{summaryContent}</tfoot>}
            </table>
          </Scrollbar>
        ) : null

        return (
          <div class={themeSlots.root()}>
            {titleContent && <div class={themeSlots.title()}>{titleContent}</div>}
            <div class={themeSlots.wrapper()}>
              {headerTable}
              {virtualBody}
              {normalBody}
              {loadingOverlay}
            </div>
            {footerContent && <div class={themeSlots.footer()}>{footerContent}</div>}
          </div>
        )
      }

      // ---- Single-table mode ----
      const tableContent = (
        <>
          <table class={tableClass.value} style={tableStyle}>
            <ColGroup columns={displayColumns.value} />
            {props.showHeader !== false && (
              <TableHeader
                rows={headerRows.value}
                theadClass={themeSlots.thead()}
                rowClass={themeSlots.tr()}
                thClass={thClass.value}
                headerCellInnerClass={themeSlots.headerCellInner()}
              />
            )}
            <TableBody
              dataSource={displayData.value}
              columns={displayColumns.value}
              tbodyClass={themeSlots.tbody()}
              rowClass={themeSlots.tr()}
              tdClass={tdClass.value}
              emptyClass={themeSlots.empty()}
              bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
              rowKey={props.rowKey}
            />
            {summaryContent && <tfoot class={themeSlots.summary()}>{summaryContent}</tfoot>}
          </table>
          {loadingOverlay}
        </>
      )

      return (
        <div class={themeSlots.root()}>
          {titleContent && <div class={themeSlots.title()}>{titleContent}</div>}
          <Scrollbar
            ref={wrapperScrollbarRef}
            wrapClass={themeSlots.wrapper()}
            viewStyle={scrollbarViewStyle}
            onScroll={handleBodyScroll}
          >
            {tableContent}
          </Scrollbar>
          {footerContent && <div class={themeSlots.footer()}>{footerContent}</div>}
        </div>
      )
    }
  },
})
