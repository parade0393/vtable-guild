import { computed, defineComponent, inject, type PropType, type SlotsType } from 'vue'
import { useTheme, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import {
  resolveBuiltInLocale,
  resolveSelectionAlertThemePreset,
  selectionAlertZhCN,
} from '@vtable-guild/theme'
import type { Key } from '../types/column'
import type {
  TableSelectionAlertProps,
  TableSelectionAlertSlotProps,
  TableSelectionAlertSlots,
} from '../types/selection-alert'

type Row = Record<string, unknown>

export default defineComponent({
  name: 'TableSelectionAlert',
  props: {
    selectedRowKeys: { type: Array as PropType<readonly Key[]>, required: true },
    selectedRows: Array as PropType<readonly Row[]>,
    alwaysShow: Boolean,
    disabled: Boolean,
    loading: Boolean,
    showClear: { type: Boolean, default: true },
    locale: Object as PropType<TableSelectionAlertProps['locale']>,
    ui: Object as PropType<TableSelectionAlertProps['ui']>,
    class: String,
  },
  emits: {
    'update:selectedRowKeys': (_keys: Key[]) => true,
    clear: (_selectedRowKeys: readonly Key[], _selectedRows: readonly Row[]) => true,
  },
  slots: Object as SlotsType<TableSelectionAlertSlots>,
  setup(props, { emit, slots }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const preset = computed(() => context?.themePreset ?? 'antdv')
    const { slots: styles } = useTheme(
      'selectionAlert',
      computed(() => resolveSelectionAlertThemePreset(preset.value)),
      props,
    )
    const locale = computed(() => ({
      ...selectionAlertZhCN,
      ...resolveBuiltInLocale(preset.value, context?.locale)?.selectionAlert,
      ...context?.locales[context.locale]?.selectionAlert,
      ...context?.localeOverrides.selectionAlert,
      ...props.locale,
    }))
    const disabled = computed(() => props.disabled || props.loading)
    function clear() {
      if (disabled.value || props.selectedRowKeys.length === 0) return
      const keys = [...props.selectedRowKeys]
      const rows = [...(props.selectedRows ?? [])]
      emit('update:selectedRowKeys', [])
      emit('clear', keys, rows)
    }
    return () => {
      const count = props.selectedRowKeys.length
      if (!count && !props.alwaysShow) return null
      const scope: TableSelectionAlertSlotProps = {
        selectedRowKeys: [...props.selectedRowKeys],
        selectedRows: [...(props.selectedRows ?? [])],
        count,
        disabled: disabled.value,
        loading: props.loading,
        clear,
      }
      return (
        <div
          role="group"
          aria-label={locale.value.label}
          aria-busy={props.loading}
          data-vtg-preset={preset.value}
          class={styles.root()}
        >
          <div class={styles.info()}>
            {slots.info ? (
              slots.info(scope)
            ) : (
              <span role="status" aria-live="polite" class={styles.text()}>
                {locale.value.selected.replace('{count}', String(count))}
              </span>
            )}
          </div>
          {(props.showClear || slots.actions) && (
            <div class={styles.option()}>
              {props.showClear && (
                <button
                  type="button"
                  class={styles.clear()}
                  disabled={disabled.value || !count}
                  onClick={clear}
                >
                  {locale.value.clear}
                </button>
              )}
              {slots.actions && <div class={styles.actions()}>{slots.actions(scope)}</div>}
            </div>
          )}
        </div>
      )
    }
  },
})
