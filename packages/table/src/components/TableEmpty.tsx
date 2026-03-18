import { defineComponent, inject, resolveDynamicComponent, h, type Component } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'TableEmpty',
  props: {
    colSpan: { type: Number, required: true },
    emptyClass: { type: String, required: true },
    tdClass: { type: String, required: true },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => {
      const subThemeSlots = tableContext.subThemeSlots?.value
      const presetConfig = tableContext.presetConfig?.value

      return (
        <tr>
          <td class={[props.tdClass, props.emptyClass]} colspan={props.colSpan}>
            {/* 优先使用用户自定义 empty slot */}
            {tableContext.empty ? (
              tableContext.empty()
            ) : (
              <div class={subThemeSlots?.emptyWrapper}>
                {presetConfig?.emptyIcon && (
                  <div class={subThemeSlots?.emptyIcon}>
                    {h(resolveDynamicComponent(presetConfig.emptyIcon) as Component)}
                  </div>
                )}
                <p class={subThemeSlots?.emptyText}>
                  {tableContext.locale?.value.empty.text ?? '暂无数据'}
                </p>
              </div>
            )}
          </td>
        </tr>
      )
    }
  },
})
