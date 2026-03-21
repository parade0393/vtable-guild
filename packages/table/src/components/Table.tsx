import {
  computed,
  defineComponent,
  inject,
  provide,
  ref,
  watch,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import {
  mergeDeep,
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
  resolveTableLocalePreset,
  resolveTableThemePreset,
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
  ColumnsType,
  ColumnType,
  Key,
  RowSelection,
  TableFiltersInfo,
  TableChangeExtra,
  Expandable,
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
    title: {
      type: Function as PropType<(data: Record<string, unknown>[]) => VNodeChild>,
      default: undefined,
    },
    footer: {
      type: Function as PropType<(data: Record<string, unknown>[]) => VNodeChild>,
      default: undefined,
    },
    scroll: {
      type: Object as PropType<ScrollConfig>,
      default: undefined,
    },
    expandable: {
      type: Object as PropType<Expandable>,
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
      type: Function as PropType<(expanded: boolean, record: Record<string, unknown>) => void>,
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
      _sorter: SorterResult,
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
    title: { data: Record<string, unknown>[] }
    footer: { data: Record<string, unknown>[] }
    summary: void
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
      toggleRow: selToggleRow,
      toggleAll: selToggleAll,
      allCheckedState: selAllCheckedState,
      invertSelection: selInvertSelection,
      clearSelection: selClearSelection,
      getChangeableRowKeys: selGetChangeableRowKeys,
    } = useSelection({
      rowSelection: () => props.rowSelection,
      getRowKey: getRowKeyFn,
      data: () => displayData.value,
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
          { action: 'select', currentDataSource: displayData.value },
        )
      },
    })

    // ---- 展开行 ----
    const { isExpanded: expIsExpanded, toggleExpand: expToggleExpand } = useExpand({
      expandable: () => props.expandable,
      getRowKey: getRowKeyFn,
      data: () => displayData.value,
    })

    const isRowExpandable = (record: Record<string, unknown>): boolean => {
      const exp = props.expandable
      if (!exp) return false
      if (exp.rowExpandable) return exp.rowExpandable(record)
      return !!exp.expandedRowRender
    }

    // ---- displayColumns：选择列 + 展开列 + 原始列 ----
    const SELECTION_COLUMN_KEY = '__vtg_selection__'
    const EXPAND_COLUMN_KEY = '__vtg_expand__'

    const displayColumns = computed(() => {
      const cols: ColumnType<Record<string, unknown>>[] = [...leafColumns.value]
      const exp = props.expandable
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
      const sel = props.rowSelection
      if (sel) {
        const selColumn: ColumnType<Record<string, unknown>> = {
          key: SELECTION_COLUMN_KEY,
          title: '',
          width: sel.columnWidth ?? 48,
          align: 'center',
        }
        cols.unshift(selColumn)
      }
      return cols
    })

    // ---- 滚动/固定列 ----
    const { headerWrapRef, bodyWrapRef, scrollState, handleBodyScroll, fixedOffsets } = useScroll({
      displayColumns: () => displayColumns.value,
    })

    const hasStickyHeader = computed(() => !!props.scroll?.y)

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
      fixedOffsets,
      scrollState,
      expandable: () => props.expandable,
      isExpanded: expIsExpanded,
      toggleExpand: expToggleExpand,
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
      const tableStyle: Record<string, string> = {}
      if (scroll?.x) {
        tableStyle.minWidth = typeof scroll.x === 'number' ? `${scroll.x}px` : scroll.x
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
        // Virtual scroll body
        const virtualBody = virtualEnabled.value ? (
          <VirtualTableBody
            dataSource={displayData.value}
            columns={displayColumns.value}
            tbodyClass={themeSlots.tbody()}
            rowClass={themeSlots.tr()}
            tdClass={themeSlots.td()}
            emptyClass={themeSlots.empty()}
            bodyCellEllipsisClass={themeSlots.bodyCellEllipsis()}
            tableClass={themeSlots.table()}
            tableStyle={tableStyle}
            rowKey={props.rowKey}
            height={virtualListHeight.value}
            itemHeight={virtualItemHeight.value}
            onVirtualScroll={(info) => {
              // Sync header horizontal scroll
              if (headerWrapRef.value) {
                headerWrapRef.value.scrollLeft = info.x
              }
            }}
          />
        ) : null

        // Normal scroll body
        const normalBody = !virtualEnabled.value ? (
          <Scrollbar
            ref={bodyScrollbarRef}
            maxHeight={typeof scroll!.y === 'number' ? scroll!.y : String(scroll!.y)}
            wrapClass={themeSlots.bodyWrapper()}
            onScroll={handleBodyScroll}
          >
            <table class={themeSlots.table()} style={tableStyle}>
              <ColGroup columns={displayColumns.value} />
              <TableBody
                dataSource={displayData.value}
                columns={displayColumns.value}
                tbodyClass={themeSlots.tbody()}
                rowClass={themeSlots.tr()}
                tdClass={themeSlots.td()}
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
              {/* Header table — fixed at top */}
              <div ref={headerWrapRef} class={themeSlots.headerWrapper()}>
                <div class="block min-w-full w-max">
                  <table class={themeSlots.table()} style={tableStyle}>
                    <ColGroup columns={displayColumns.value} />
                    <TableHeader
                      columns={displayColumns.value}
                      theadClass={themeSlots.thead()}
                      rowClass={themeSlots.tr()}
                      thClass={themeSlots.th()}
                      headerCellInnerClass={themeSlots.headerCellInner()}
                    />
                  </table>
                </div>
              </div>
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
          <table class={themeSlots.table()} style={tableStyle}>
            <ColGroup columns={displayColumns.value} />
            <TableHeader
              columns={displayColumns.value}
              theadClass={themeSlots.thead()}
              rowClass={themeSlots.tr()}
              thClass={themeSlots.th()}
              headerCellInnerClass={themeSlots.headerCellInner()}
            />
            <TableBody
              dataSource={displayData.value}
              columns={displayColumns.value}
              tbodyClass={themeSlots.tbody()}
              rowClass={themeSlots.tr()}
              tdClass={themeSlots.td()}
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
