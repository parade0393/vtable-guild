import { defineComponent, inject, type PropType } from 'vue'
import type { ColumnType } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getColumnKey } from '../composables/useSorter'

export default defineComponent({
  name: 'ColGroup',
  props: {
    columns: { type: Array as PropType<ColumnType<Record<string, unknown>>[]>, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => (
      <colgroup>
        {props.columns.map((col, i) => {
          /**
           * 宽度来源必须与 TableCell / TableHeaderCell 一致。
           *
           * `table-layout: fixed` 下 `<col>` 的宽度优先级**高于**单元格宽度
           * （CSS 2.1 §17.5.2.1：先看 col，再看首行单元格）。这里若只读
           * `column.width`，拖拽期间 `columnWidths` 里的实时宽度就会被 colgroup
           * 钉死——单元格的内联宽度已经变了，画面却纹丝不动，直到松手时应用层
           * 更新 `column.width` 才突然跳一下。
           */
          const resized = tableContext.columnWidths?.[String(getColumnKey(col) ?? i)]
          const w = resized ?? col.width
          const style = w
            ? {
                width: typeof w === 'number' ? `${w}px` : w,
                minWidth: typeof w === 'number' ? `${w}px` : w,
              }
            : undefined
          const compatClass = tableContext.compatClass
            ? col.key === '__vtg_selection__'
              ? tableContext.compatClass('selection-col')
              : col.key === '__vtg_expand__'
                ? tableContext.compatClass('expand-icon-col')
                : ''
            : ''
          return (
            <col key={col.key ?? String(col.dataIndex ?? i)} class={compatClass} style={style} />
          )
        })}
      </colgroup>
    )
  },
})
