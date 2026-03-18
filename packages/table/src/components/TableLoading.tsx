import { defineComponent, inject, resolveDynamicComponent, h, type Component } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'TableLoading',
  props: {
    loadingClass: { type: String, required: true },
  },
  setup(props, { slots }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => {
      const subThemeSlots = tableContext.subThemeSlots?.value
      const presetConfig = tableContext.presetConfig?.value

      const defaultContent = slots.default?.()
      if (defaultContent) {
        return <div class={props.loadingClass}>{defaultContent}</div>
      }

      return (
        <div class={props.loadingClass}>
          {presetConfig?.loadingIcon &&
            h(resolveDynamicComponent(presetConfig.loadingIcon) as Component, {
              class: subThemeSlots?.loadingSpinner,
              style: { fontSize: '32px' },
            })}
        </div>
      )
    }
  },
})
