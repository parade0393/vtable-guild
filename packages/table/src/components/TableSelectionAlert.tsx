import {
  computed,
  defineComponent,
  inject,
  Transition,
  watch,
  type PropType,
  type SlotsType,
} from 'vue'
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
  inheritAttrs: false,
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
  setup(props, { emit, slots, attrs }) {
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
    const visible = computed(() => props.alwaysShow || props.selectedRowKeys.length > 0)
    let motionElement: HTMLElement | undefined
    let leaving = false
    let interruptedEnter: { height: number; opacity: string } | undefined
    let interruptedLeave: { height: number; opacity: string } | undefined

    // v-if re-entry replaces the leaving node. Keep its current size so rapid
    // selection changes continue from the visible height instead of restarting at zero.
    watch(
      visible,
      (shown) => {
        if (shown) interruptedEnter = undefined
        else interruptedLeave = undefined
        if (shown && leaving && motionElement) {
          interruptedLeave = {
            height: motionElement.getBoundingClientRect().height,
            opacity: getComputedStyle(motionElement).opacity,
          }
        } else if (!shown && !leaving && motionElement) {
          interruptedEnter = {
            height: motionElement.getBoundingClientRect().height,
            opacity: getComputedStyle(motionElement).opacity,
          }
        }
      },
      { flush: 'sync' },
    )

    function beforeEnter(el: Element) {
      const element = el as HTMLElement
      motionElement = element
      leaving = false
      element.inert = false
      element.style.height = `${interruptedLeave?.height ?? 0}px`
      element.style.opacity = interruptedLeave?.opacity ?? '0'
      interruptedLeave = undefined
    }

    function enter(el: Element) {
      const element = el as HTMLElement
      // Flush the starting height before transitioning to the measured content size.
      void element.offsetHeight
      element.style.height = `${element.scrollHeight}px`
      element.style.opacity = '1'
    }

    function beforeLeave(el: Element) {
      const element = el as HTMLElement
      motionElement = element
      leaving = true
      element.style.height = `${interruptedEnter?.height ?? element.getBoundingClientRect().height}px`
      element.style.opacity = interruptedEnter?.opacity ?? getComputedStyle(element).opacity
      interruptedEnter = undefined
      element.inert = true
    }

    function leave(el: Element) {
      const element = el as HTMLElement
      void element.offsetHeight
      element.style.height = '0px'
      element.style.opacity = '0'
    }

    function finishMotion(el: Element) {
      const element = el as HTMLElement
      element.style.removeProperty('height')
      element.style.removeProperty('opacity')
      element.inert = false
      if (motionElement === element) {
        motionElement = undefined
        leaving = false
      }
    }

    function cancelEnter(el: Element) {
      const element = el as HTMLElement
      // Pin an interrupted enter at its painted size before the leave hook runs.
      const height = interruptedEnter?.height ?? element.getBoundingClientRect().height
      const opacity = interruptedEnter?.opacity ?? getComputedStyle(element).opacity
      element.style.height = `${height}px`
      element.style.opacity = opacity
    }

    function clear() {
      if (disabled.value || props.selectedRowKeys.length === 0) return
      const keys = [...props.selectedRowKeys]
      const rows = [...(props.selectedRows ?? [])]
      emit('update:selectedRowKeys', [])
      emit('clear', keys, rows)
    }
    return () => {
      const count = props.selectedRowKeys.length
      const scope: TableSelectionAlertSlotProps = {
        selectedRowKeys: [...props.selectedRowKeys],
        selectedRows: [...(props.selectedRows ?? [])],
        count,
        disabled: disabled.value,
        loading: props.loading,
        clear,
      }
      return (
        <Transition
          name="vtg-selection-alert"
          onBeforeEnter={beforeEnter}
          onEnter={enter}
          onAfterEnter={finishMotion}
          onEnterCancelled={cancelEnter}
          onBeforeLeave={beforeLeave}
          onLeave={leave}
          onAfterLeave={finishMotion}
          onLeaveCancelled={finishMotion}
        >
          {visible.value && (
            <div
              {...attrs}
              role="group"
              aria-label={locale.value.label}
              aria-busy={props.loading}
              data-vtg-preset={preset.value}
              data-selection-alert-motion=""
              class={styles.wrapper()}
            >
              <div data-selection-alert-content="" class={styles.content()}>
                <div class={styles.root()}>
                  {/* One live region announces count changes from the default text and the #info slot. */}
                  <div role="status" aria-live="polite" class={styles.info()}>
                    {slots.info ? (
                      slots.info(scope)
                    ) : (
                      <span class={styles.text()}>
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
              </div>
            </div>
          )}
        </Transition>
      )
    }
  },
})
