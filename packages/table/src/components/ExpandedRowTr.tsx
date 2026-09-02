// packages/table/src/components/ExpandedRowTr.tsx
import { defineComponent, inject, type PropType, type VNodeChild } from 'vue'
import { cn } from '@vtable-guild/core'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getExpandedRowCompatClass } from '../utils/compat'

/**
 * 展开行 `<tr>` 的共享渲染：普通表体与虚拟表体只有 colspan 语义不同
 * （普通模式跨列总数，列窗口化模式跨实际渲染的单元格数），其余结构必须
 * 保持一致，避免两条渲染路径行为漂移。
 */
export default defineComponent({
  name: 'ExpandedRowTr',
  props: {
    record: { type: Object as PropType<Record<string, unknown>>, required: true },
    rowIndex: { type: Number, required: true },
    /** 普通模式传列总数；列窗口化模式下传实际渲染的单元格数 */
    colspan: { type: Number, required: true },
    rowIndent: { type: Number, default: 0 },
    rowClass: { type: String, default: undefined },
    rowClassName: {
      type: [String, Object] as PropType<Record<string, boolean> | string>,
      default: undefined,
    },
    expandedRowClassName: {
      type: [String, Object] as PropType<Record<string, boolean> | string>,
      default: undefined,
    },
    tdClass: { type: String, required: true },
    expandedRowRender: {
      type: Function as PropType<
        (
          record: Record<string, unknown>,
          index: number,
          indent: number,
          expanded: boolean,
        ) => VNodeChild
      >,
      required: true,
    },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => (
      <tr
        class={cn(
          props.rowClass,
          props.rowClassName,
          tableContext.subThemeSlots?.expandedRow(),
          getExpandedRowCompatClass(tableContext, props.rowIndent),
          props.expandedRowClassName,
        )}
      >
        <td
          colspan={props.colspan}
          class={cn(props.tdClass, tableContext.subThemeSlots?.expandedRowCell())}
        >
          {tableContext.compatClass && (tableContext.fixedOffsets?.value?.size ?? 0) > 0 ? (
            <div class={tableContext.compatClass('expanded-row-fixed')}>
              {props.expandedRowRender(props.record, props.rowIndex, 0, true)}
            </div>
          ) : (
            props.expandedRowRender(props.record, props.rowIndex, 0, true)
          )}
        </td>
      </tr>
    )
  },
})
