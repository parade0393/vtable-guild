import { defineComponent, inject } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'

/** Zero-height intrinsic tracks also cover empty, headless and merged tables. */
export default defineComponent({
  name: 'ColumnWidthRow',
  setup() {
    const context = inject(TABLE_CONTEXT_KEY)
    return () =>
      context?.columnLayout?.enabled.value ? (
        <tbody aria-hidden="true" data-vtg-width-row="">
          <tr>
            {context.displayColumns?.value.map((_column, index) => (
              <td class={context.subThemeSlots?.widthConstraintCell()} data-vtg-track={index}>
                <div
                  class={context.subThemeSlots?.widthConstraintInner()}
                  style={{ minWidth: `${context.columnLayout?.minimums.value[index] ?? 0}px` }}
                />
              </td>
            ))}
          </tr>
        </tbody>
      ) : null
  },
})
