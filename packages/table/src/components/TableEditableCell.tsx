import { computed, defineComponent, inject, type PropType } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import { resolveTableThemePreset } from '@vtable-guild/theme'
import type { TableControls, TableControlContext } from '../types/controls'

export default defineComponent({
  name: 'TableEditableCell',
  props: {
    context: {
      type: Object as PropType<TableControlContext & { valueType: string }>,
      required: true,
    },
    controls: { type: Object as PropType<TableControls>, required: true },
    ui: Object as PropType<Record<string, string>>,
  },
  setup(props) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const { slots } = useTheme(
      'table',
      computed(() => resolveTableThemePreset(context?.themePreset ?? 'antdv')),
      props,
    )
    return () => {
      const field = props.context
      const renderer = props.controls[field.valueType]
      if (!renderer) throw new Error(`No table control registered for ${field.valueType}`)
      return (
        <div class={slots.editCell()}>
          <div class={slots.editControl()} data-invalid={field.error ? true : undefined}>
            {renderer(field)}
          </div>
          {field.error ? (
            <span class={slots.editError()} role="alert">
              {field.error}
            </span>
          ) : null}
        </div>
      )
    }
  },
})
