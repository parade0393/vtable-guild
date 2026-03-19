import { defineComponent, inject, type PropType } from 'vue'
import type { ColumnType } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'ResizeHandle',
  props: {
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    colIndex: { type: Number, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    function handlePointerDown(e: PointerEvent) {
      tableContext.startResize?.(props.column, props.colIndex, e)
    }

    return () => (
      <span
        class={[
          'absolute right-0 top-0 bottom-0 w-[5px] z-[3]',
          'cursor-col-resize select-none',
          'after:absolute after:right-[2px] after:top-[25%] after:bottom-[25%] after:w-px',
          'after:bg-transparent hover:after:bg-[var(--color-primary,#1677ff)]',
          'after:transition-colors',
          tableContext.subThemeSlots?.value.resizeHandle,
        ].join(' ')}
        onPointerdown={handlePointerDown}
      />
    )
  },
})
