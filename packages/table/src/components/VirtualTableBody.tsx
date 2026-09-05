import { computed, defineComponent, inject, onBeforeUnmount, ref, watch } from 'vue'
import type { CSSProperties, PropType } from 'vue'
import { cn, devWarn, VirtualList } from '@vtable-guild/core'
import type { ListRef, VirtualScrollInfo } from '@vtable-guild/core'
import TableRow from './TableRow'
import TableCell from './TableCell'
import TableEmpty from './TableEmpty'
import ColGroup from './ColGroup'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { ColumnMetrics } from '../composables/useColumnMetrics'
import { resolveFixedColumnRanges, useColumnWindow } from '../composables/useColumnWindow'
import type { ColumnType, Key } from '../types'
import { getExpandedRowCompatClass, getRowCompatClass } from '../utils/compat'

type VirtualTableScrollInfo = VirtualScrollInfo & {
  maxX: number
}

/** 一行里的一个 DOM 位置：真实单元格，或补齐总宽用的占位。 */
type CellSlot = { index: number; spacer?: undefined } | { spacer: number; index?: undefined }

export default defineComponent({
  name: 'VirtualTableBody',
  props: {
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    columns: { type: Array as PropType<ColumnType<Record<string, unknown>>[]>, required: true },
    tbodyClass: { type: String, required: true },
    rowClass: { type: String, required: true },
    tdClass: { type: String, required: true },
    emptyClass: { type: String, required: true },
    bodyCellEllipsisClass: { type: String, required: true },
    tableClass: { type: String, required: true },
    tableStyle: { type: Object as PropType<Record<string, string>>, default: undefined },
    rowKey: {
      type: [String, Function] as PropType<string | ((record: Record<string, unknown>) => Key)>,
      default: undefined,
    },
    height: { type: Number, required: true },
    itemHeight: { type: Number, required: true },
    /** 定高快路径开关，见 VTable 的 rowHeight prop */
    fixedHeight: { type: Boolean, default: false },
    /**
     * 横向虚拟化开关。由 VTable 判定完全部前提后才会为 true，
     * 这里只管渲染，不再重复校验。
     */
    virtualColumn: { type: Boolean, default: false },
    /** 从表头实测到的列宽。null 表示还没测到，此时渲染全部列。 */
    columnMetrics: { type: Object as PropType<ColumnMetrics | null>, default: null },
    /** Sync header scroll when virtual body scrolls horizontally */
    onVirtualScroll: {
      type: Function as PropType<(info: VirtualTableScrollInfo) => void>,
      default: undefined,
    },
    showScrollBar: {
      type: [Boolean, String] as PropType<boolean | 'optional' | 'hover'>,
      default: 'hover',
    },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const virtualListRef = ref<ListRef>()

    /** 当前横向滚动偏移。与 Filler 的 `marginLeft: -offsetX` 同源。 */
    const offsetX = ref(0)
    /** 可视区宽度。列窗口的另一个自变量。 */
    const viewportWidth = ref(0)

    function emitVirtualScroll(info: VirtualScrollInfo) {
      offsetX.value = info.x
      props.onVirtualScroll?.({
        ...info,
        maxX: virtualListRef.value?.getHorizontalRange() ?? 0,
      })
    }

    function getRowKey(record: Record<string, unknown>, index: number): Key {
      if (typeof props.rowKey === 'function') return props.rowKey(record)
      if (typeof props.rowKey === 'string' && props.rowKey in record) {
        return record[props.rowKey] as Key
      }
      return index
    }

    function itemKey(item: Record<string, unknown>): Key {
      // 避免在 VirtualList 的 O(n) range 计算里对每个 item 做 indexOf（否则整体 O(n²)）。
      // rowKey 提供时直接取记录上的 key；仅无 rowKey 的兜底分支才回退到 indexOf。
      if (typeof props.rowKey === 'function') return props.rowKey(item)
      if (typeof props.rowKey === 'string' && props.rowKey in item) {
        return item[props.rowKey] as Key
      }
      return props.dataSource.indexOf(item)
    }

    // 列总宽只随 columns 变化，提为 computed，避免每次渲染在 render 函数里 O(列数) 重算
    const declaredScrollWidth = computed(() => {
      let total = 0
      for (const col of props.columns) {
        const w = typeof col.width === 'number' ? col.width : parseInt(String(col.width || '0'), 10)
        total += w || 0
      }
      return total
    })

    /**
     * 传给 VirtualList 的内容宽度。
     *
     * 横向虚拟化开启时优先用实测总宽：声明宽度的求和会把 `auto` / 百分比列算成 0，
     * 横向滚动范围因此短一截，滚到底也露不出最后几列。实测值是浏览器算好的结果。
     */
    const scrollWidth = computed(() => {
      const measured = props.virtualColumn ? props.columnMetrics?.total : undefined
      if (measured && measured > 0) return measured
      return declaredScrollWidth.value
    })

    const fixedRanges = computed(() => resolveFixedColumnRanges(props.columns))

    /**
     * 参与窗口计算的列宽。返回 null 即「这一帧不虚拟化列，渲染全部」。
     *
     * 首帧尚无测量结果、或可视区宽度还没量到时都会落到这里——宁可第一帧多渲染，
     * 也不要按错误宽度定位，那会直接表现为表头表体错位。
     */
    const windowWidths = computed(() => {
      if (!props.virtualColumn) return null
      if (viewportWidth.value <= 0) return null
      const metrics = props.columnMetrics
      if (!metrics || metrics.widths.length !== props.columns.length) return null
      return metrics.widths
    })

    const {
      active: columnWindowActive,
      start: windowStart,
      end: windowEnd,
      leftSpacer,
      rightSpacer,
    } = useColumnWindow({
      widths: () => windowWidths.value,
      leftFixedCount: () => fixedRanges.value.leftFixedCount,
      rightFixedStart: () => fixedRanges.value.rightFixedStart,
      offsetX: () => offsetX.value,
      viewportWidth: () => viewportWidth.value,
    })

    /**
     * 一行的 DOM 结构计划：
     * `[...左固定] [占位] [...窗口列] [占位] [...右固定]`
     *
     * 所有可见行共用同一份计划，每帧只算一次。固定列恒渲染、不参与窗口——
     * 它们是 `position: sticky`，必须留在 DOM 里。
     */
    const cellPlan = computed<CellSlot[]>(() => {
      const count = props.columns.length
      if (!columnWindowActive.value) {
        return Array.from({ length: count }, (_, index) => ({ index }))
      }

      const { leftFixedCount, rightFixedStart } = fixedRanges.value
      const plan: CellSlot[] = []
      for (let i = 0; i < leftFixedCount; i += 1) plan.push({ index: i })
      if (leftSpacer.value > 0) plan.push({ spacer: leftSpacer.value })
      for (let i = windowStart.value; i <= windowEnd.value; i += 1) plan.push({ index: i })
      if (rightSpacer.value > 0) plan.push({ spacer: rightSpacer.value })
      for (let i = rightFixedStart; i < count; i += 1) plan.push({ index: i })
      return plan
    })

    /**
     * 定高快路径的安全网：实测首行高度，与声明值不符就告警。
     *
     * 快路径下我们**不再测量**行高，声明错了不会报错，只会表现为行错位或空隙——
     * 这种失败很难归因。所以在 dev 构建里主动测一次，把静默错误变成显式提示。
     * 生产构建整段跳过，不产生强制回流。
     */
    function verifyFixedRowHeight(el: HTMLElement | undefined) {
      if (import.meta.env?.PROD || !props.fixedHeight || !el) return
      requestAnimationFrame(() => {
        const row = el.querySelector('tbody tr') as HTMLElement | null
        if (!row) return
        const actual = row.offsetHeight
        if (actual > 0 && Math.abs(actual - props.itemHeight) > 1) {
          devWarn(
            'vtable-row-height-mismatch',
            `[VTable] rowHeight 声明为 ${props.itemHeight}px，但实测首行为 ${actual}px。` +
              `定高快路径依赖两者一致，不一致会导致行错位或滚动位置偏移。` +
              `请改正 rowHeight，或去掉该 prop 回到实测路径（支持不定行高）。`,
          )
        }
      })
    }

    // ---- 可视区宽度 ----
    // 不能靠 onVirtualScroll 带回来的 maxX 推算：它只在滚动位置真的变了才触发，
    // 挂载后如果用户没横向滚过，宽度就永远停在 0，窗口会一直收不拢。
    let viewportObserver: ResizeObserver | null = null
    let observedViewport: HTMLElement | null = null

    function observeViewport(el: HTMLElement | null | undefined) {
      const target = el ?? null
      if (target === observedViewport) return

      if (viewportObserver && observedViewport) viewportObserver.unobserve(observedViewport)
      observedViewport = target

      if (target) {
        viewportWidth.value = target.clientWidth
        if (!viewportObserver && typeof ResizeObserver !== 'undefined') {
          viewportObserver = new ResizeObserver(() => {
            if (observedViewport) viewportWidth.value = observedViewport.clientWidth
          })
        }
        viewportObserver?.observe(target)
      }
    }

    onBeforeUnmount(() => {
      viewportObserver?.disconnect()
      viewportObserver = null
      observedViewport = null
    })

    // Update scroll state (for fixed column shadows) when VirtualList scrolls
    watch(
      () => virtualListRef.value,
      (ref) => {
        if (ref) {
          // Trigger initial scroll state update
          const info = ref.getScrollInfo()
          emitVirtualScroll(info)
          verifyFixedRowHeight(ref.nativeElement)
          observeViewport(ref.nativeElement)
        } else {
          observeViewport(null)
        }
      },
    )

    return () => {
      if (props.dataSource.length === 0) {
        return (
          <table class={props.tableClass} style={props.tableStyle}>
            <ColGroup columns={props.columns} />
            <tbody class={props.tbodyClass}>
              <TableEmpty
                colSpan={props.columns.length || 1}
                emptyClass={props.emptyClass}
                tdClass={props.tdClass}
              />
            </tbody>
          </table>
        )
      }

      return (
        <VirtualList
          ref={virtualListRef}
          data={props.dataSource}
          height={props.height}
          itemHeight={props.itemHeight}
          itemKey={itemKey}
          scrollWidth={scrollWidth.value || undefined}
          disableHeightMeasure={props.fixedHeight}
          fullHeight={false}
          onVirtualScroll={emitVirtualScroll}
          showScrollBar={props.showScrollBar}
          style={{ overflow: 'hidden' } as CSSProperties}
        >
          {{
            default: ({
              item,
              index: absoluteIndex,
            }: {
              item: Record<string, unknown>
              index: number
              style: CSSProperties
              offsetX: number
            }) => {
              // VirtualList 的 index 即 props.dataSource 的绝对下标，直接使用，
              // 避免每可见行做一次 O(总行) 的 indexOf 扫描。
              const rIndex = absoluteIndex
              const key = getRowKey(item, rIndex)
              const exp = tableContext.expandable?.()
              const isExpanded = tableContext.isExpanded?.(key) ?? false
              const expandRowByClick = exp?.expandRowByClick ?? false
              const canExpand = tableContext.isRowExpandable?.(item) ?? false
              const rowClassName = tableContext.getRowClassName?.(item, rIndex)
              const rowProps = tableContext.getRowProps?.(item, rIndex)
              // 必须先判 isTreeData：getFlattenRow 会读 rowMetaMap → 强制求值 flattenData，
              // 而非树数据下 flattenData 是 data.map(...)，10 万行就是 10 万个对象 + 10 万项 Map。
              // 挂载与每次排序（processedData 换引用）各付一次，是虚拟模式挂载随行数增长的主因。
              const treeRow = tableContext.isTreeData?.value
                ? tableContext.getFlattenRow?.(item)
                : undefined
              const rowIndent = treeRow?.level ?? 0
              const expandedRowClassName =
                typeof exp?.expandedRowClassName === 'function'
                  ? exp.expandedRowClassName(item, rIndex, rowIndent)
                  : exp?.expandedRowClassName

              const handleRowClick = expandRowByClick
                ? () => {
                    if (!canExpand) return
                    tableContext.toggleExpand?.(item, rIndex)
                  }
                : undefined

              const plan = cellPlan.value
              const widths = columnWindowActive.value ? windowWidths.value : null

              return (
                <table
                  class={props.tableClass}
                  style={{
                    ...props.tableStyle,
                    tableLayout: 'fixed',
                  }}
                >
                  {/*
                    这里刻意**不渲染 `<ColGroup>`**。

                    每个可见行都是一张独立的 `<table>`，若各自再带一份 colgroup，
                    列宽信息会按「可见行数 × 列数」重复：200 列 × 12 行 = 2400 个
                    纯布局用的 `<col>`，实测占我们 DOM 节点总数的近四成。

                    去掉它是安全的：本表 `table-layout: fixed` 且只有一个数据行，
                    按 CSS 2.1 §17.5.2.1，没有 col 时列宽由**首行单元格**决定，
                    而 TableCell 已经把同一份宽度写在每个 `<td>` 上了
                    （见 TableCell 的 cellStyle）。两者宽度来源一致，故渲染等价。

                    横向虚拟化进一步依赖这一点：窗口化之后这一行只剩十几个 `<td>`，
                    列宽只能由它们自己声明，所以 widthOverride 必须逐个写回。

                    注意：这让「虚拟模式不支持单元格合并」这条既有约束变得更硬——
                    colSpan 导致某个 `<td>` 被省略时，首行不再覆盖全部列，列宽会整体
                    错位，而不像以前那样由 colgroup 兜住。该组合本就有 devWarn 拦截
                    （见 Table.tsx 的 vtable-virtual-body-span）。
                  */}
                  <tbody
                    class={props.tbodyClass}
                    data-vtg-preserve-last-border={
                      absoluteIndex < props.dataSource.length - 1 ? '' : undefined
                    }
                  >
                    <TableRow
                      key={key}
                      rowClass={
                        cn(
                          props.rowClass,
                          rowClassName,
                          getRowCompatClass(tableContext, item, rIndex, rowIndent),
                        ) ?? ''
                      }
                      rowProps={rowProps}
                      onClick={handleRowClick}
                    >
                      {plan.map((slot, slotIndex) => {
                        if (slot.spacer !== undefined) {
                          /*
                            占位单元格。它落在窗口之外、被固定列或视口边界挡住，
                            永远不可见，所以刻意不套 tdClass——套上会在 bordered 模式下
                            画出一条无中生有的竖线，也会让 `last:border-r-0` 落到它头上。
                          */
                          return (
                            <td
                              key={`__vtg_spacer_${slotIndex}`}
                              style={{ width: `${slot.spacer}px`, padding: '0' }}
                              aria-hidden="true"
                            />
                          )
                        }

                        const colIndex = slot.index
                        const column = props.columns[colIndex]
                        return (
                          <TableCell
                            key={column.key ?? String(column.dataIndex ?? colIndex)}
                            record={item}
                            rowIndex={rIndex}
                            column={column}
                            colIndex={colIndex}
                            widthOverride={widths?.[colIndex]}
                            tdClass={props.tdClass}
                            bodyCellEllipsisClass={props.bodyCellEllipsisClass}
                          />
                        )
                      })}
                    </TableRow>
                    {isExpanded && exp?.expandedRowRender && (
                      <tr
                        key={`${key}-expanded`}
                        class={cn(
                          props.rowClass,
                          rowClassName,
                          tableContext.subThemeSlots?.expandedRow(),
                          getExpandedRowCompatClass(tableContext, rowIndent),
                          expandedRowClassName,
                        )}
                      >
                        <td
                          // 跨的是**实际渲染出来的**单元格数，不是列总数：
                          // 窗口化之后这一行只有十几个 td，按列总数跨会撑出多余的列。
                          colspan={plan.length}
                          class={cn(props.tdClass, tableContext.subThemeSlots?.expandedRowCell())}
                        >
                          {tableContext.compatClass &&
                          (tableContext.fixedOffsets?.value?.size ?? 0) > 0 ? (
                            <div class={tableContext.compatClass('expanded-row-fixed')}>
                              {exp.expandedRowRender(item, rIndex, 0, true)}
                            </div>
                          ) : (
                            exp.expandedRowRender(item, rIndex, 0, true)
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )
            },
          }}
        </VirtualList>
      )
    }
  },
})
