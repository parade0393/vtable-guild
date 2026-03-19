import { defineComponent, type PropType } from 'vue'
import type { ColumnType } from '../types'

export default defineComponent({
  name: 'ColGroup',
  props: {
    columns: { type: Array as PropType<ColumnType<Record<string, unknown>>[]>, required: true },
  },
  setup(props) {
    return () => (
      <colgroup>
        {props.columns.map((col, i) => {
          const w = col.width
          const style = w
            ? {
                width: typeof w === 'number' ? `${w}px` : w,
                minWidth: typeof w === 'number' ? `${w}px` : w,
              }
            : undefined
          return <col key={col.key ?? String(col.dataIndex ?? i)} style={style} />
        })}
      </colgroup>
    )
  },
})
