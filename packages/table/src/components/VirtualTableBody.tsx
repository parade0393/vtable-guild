import { computed, defineComponent, inject, ref, watch } from 'vue'
import type { CSSProperties, PropType } from 'vue'
import { cn, devWarn, VirtualList } from '@vtable-guild/core'
import type { ListRef, VirtualScrollInfo } from '@vtable-guild/core'
import TableRow from './TableRow'
import TableCell from './TableCell'
import TableEmpty from './TableEmpty'
import ColGroup from './ColGroup'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { ColumnType, Key } from '../types'

type VirtualTableScrollInfo = VirtualScrollInfo & {
  maxX: number
}

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

    function emitVirtualScroll(info: VirtualScrollInfo) {
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
    const scrollWidth = computed(() => {
      let total = 0
      for (const col of props.columns) {
        const w = typeof col.width === 'number' ? col.width : parseInt(String(col.width || '0'), 10)
        total += w || 0
      }
      return total
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

    // Update scroll state (for fixed column shadows) when VirtualList scrolls
    watch(
      () => virtualListRef.value,
      (ref) => {
        if (ref) {
          // Trigger initial scroll state update
          const info = ref.getScrollInfo()
          emitVirtualScroll(info)
          verifyFixedRowHeight(ref.nativeElement)
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

              return (
                <table
                  class={props.tableClass}
                  style={{
                    ...props.tableStyle,
                    tableLayout: 'fixed',
                  }}
                >
                  <ColGroup columns={props.columns} />
                  <tbody class={props.tbodyClass}>
                    <TableRow
                      key={key}
                      rowClass={cn(props.rowClass, rowClassName) ?? ''}
                      rowProps={rowProps}
                      onClick={handleRowClick}
                    >
                      {props.columns.map((column, colIndex) => (
                        <TableCell
                          key={column.key ?? String(column.dataIndex ?? colIndex)}
                          record={item}
                          rowIndex={rIndex}
                          column={column}
                          colIndex={colIndex}
                          tdClass={props.tdClass}
                          bodyCellEllipsisClass={props.bodyCellEllipsisClass}
                        />
                      ))}
                    </TableRow>
                    {isExpanded && exp?.expandedRowRender && (
                      <tr
                        key={`${key}-expanded`}
                        class={cn(
                          props.rowClass,
                          rowClassName,
                          tableContext.subThemeSlots?.expandedRow(),
                          expandedRowClassName,
                        )}
                      >
                        <td
                          colspan={props.columns.length}
                          class={cn(props.tdClass, tableContext.subThemeSlots?.expandedRowCell())}
                        >
                          {exp.expandedRowRender(item, rIndex, 0, true)}
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
