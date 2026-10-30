import {
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  toValue,
  useId,
  watch,
  type PropType,
  type SlotsType,
} from 'vue'
import { Button, VTABLE_GUILD_INJECTION_KEY, useTheme } from '@vtable-guild/core'
import { queryEnUS, queryZhCN, resolveQueryThemePreset } from '@vtable-guild/theme'
import type { TableControlContext } from '../types/controls'
import type {
  TableQueryField,
  TableQueryInstance,
  TableQueryProps,
  TableQuerySlots,
} from '../types/query-form'
import { snapshot } from '../utils/snapshot'
import { stateEqual } from '../utils/stateEqual'

export default defineComponent({
  name: 'TableQuery',
  inheritAttrs: false,
  props: {
    query: { type: Object as PropType<TableQueryProps['query']>, required: true },
    rootTag: { type: String as PropType<TableQueryProps['rootTag']>, default: 'form' },
    fields: { type: Array as PropType<TableQueryProps['fields']>, required: true },
    controls: { type: Object as PropType<TableQueryProps['controls']>, required: true },
    layout: { type: String as PropType<TableQueryProps['layout']>, default: 'form' },
    autoSubmit: Boolean,
    debounceTime: { type: Number, default: 0 },
    hiddenPolicy: {
      type: String as PropType<TableQueryProps['hiddenPolicy']>,
      default: 'preserve',
    },
    collapsedCount: { type: Number, default: 3 },
    collapsible: { type: Boolean, default: true },
    disabled: Boolean,
    validate: Function as PropType<TableQueryProps['validate']>,
    errors: Object as PropType<TableQueryProps['errors']>,
    locale: Object as PropType<TableQueryProps['locale']>,
    ui: Object as PropType<TableQueryProps['ui']>,
    class: String,
  },
  emits: {
    submitted: (_success: boolean) => true,
    reset: (_success: boolean) => true,
  },
  slots: Object as SlotsType<TableQuerySlots>,
  setup(props, { attrs, slots, emit, expose }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const { slots: styles } = useTheme(
      'query',
      computed(() => resolveQueryThemePreset(context?.themePreset)),
      props,
    )
    const locale = computed(() => ({
      ...(context?.locale === 'en-US' ? queryEnUS : queryZhCN),
      ...props.locale,
    }))
    const id = useId()
    const validating = ref(false)
    const failure = ref<string>()
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    let generation = 0
    let disposed = false
    let activeAction: 'submit' | 'reset' | undefined
    let pending: Promise<boolean> | undefined
    let settle: ((success: boolean) => void) | undefined
    const fields = computed(() => [...props.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
    const fieldContext = (field: TableQueryField) => ({ field, values: props.query.draft.value })
    const hidden = (field: TableQueryField) =>
      typeof field.hidden === 'function' ? field.hidden(fieldContext(field)) : !!field.hidden
    const available = computed(() => fields.value.filter((field) => !hidden(field)))
    const collapsedCount = computed(() => Math.max(1, Math.floor(props.collapsedCount || 1)))
    const canCollapse = computed(
      () => props.collapsible && available.value.length > collapsedCount.value,
    )
    const visible = computed(() =>
      canCollapse.value && props.query.collapsed.value
        ? available.value.slice(0, collapsedCount.value)
        : available.value,
    )
    const busy = computed(() => props.disabled || validating.value || props.query.submitting.value)

    function clearTimer() {
      clearTimeout(timer)
      timer = undefined
    }
    watch(() => [props.layout, props.autoSubmit, props.disabled], clearTimer, { flush: 'sync' })
    function cancel() {
      clearTimer()
      generation++
      controller?.abort()
      settle?.(false)
      settle = undefined
      controller = undefined
      validating.value = false
      activeAction = undefined
      pending = undefined
    }
    function submitOptions() {
      return props.hiddenPolicy === 'omit'
        ? { omitFields: fields.value.filter(hidden).map((field) => field.name) }
        : undefined
    }
    function run(action: 'submit' | 'reset'): Promise<boolean> {
      if (disposed || props.disabled) return Promise.resolve(false)
      clearTimer()
      if (pending && activeAction === action) return pending
      cancel()
      const current = generation
      const abort = new AbortController()
      controller = abort
      activeAction = action
      failure.value = undefined
      if (action === 'reset') props.query.resetFields()
      const values = snapshot(props.query.draft.value)
      const options = submitOptions()
      validating.value = true
      let finish!: (success: boolean) => void
      pending = new Promise<boolean>((resolve) => {
        finish = resolve
      })
      settle = finish
      void (async () => {
        let success = false
        try {
          // Reset replaces the draft ref. Let a wrapping host Form receive its new model first.
          if (action === 'reset') await nextTick()
          if (disposed || current !== generation || abort.signal.aborted) return false
          const valid = await props.validate?.(values, {
            fields: available.value,
            action,
            signal: abort.signal,
          })
          if (disposed || current !== generation || abort.signal.aborted) return false
          if (valid === false) {
            failure.value = locale.value.validationFailed
            return false
          }
          // A host validation must not submit a newer draft it did not validate.
          if (!stateEqual(values, props.query.draft.value)) return false
          validating.value = false
          success = await (action === 'reset'
            ? props.query.reset(options)
            : props.query.submit(options))
          if (disposed || current !== generation) return false
          if (action === 'reset') emit('reset', success)
          else emit('submitted', success)
          return success
        } catch (reason) {
          if (!disposed && current === generation)
            failure.value = reason instanceof Error ? reason.message : String(reason)
          return false
        } finally {
          if (current === generation) {
            validating.value = false
            activeAction = undefined
            controller = undefined
            pending = undefined
            settle = undefined
          }
        }
      })().then(finish)
      return pending
    }
    function change(field: TableQueryField, value: unknown) {
      field = fields.value.find((current) => current.name === field.name) ?? field
      const state = fieldContext(field)
      const disabled = typeof field.disabled === 'function' ? field.disabled(state) : field.disabled
      const readonly = typeof field.readonly === 'function' ? field.readonly(state) : field.readonly
      if (props.disabled || props.query.submitting.value || disabled || readonly) return
      if (stateEqual(props.query.draft.value[field.name], value)) return
      cancel()
      failure.value = undefined
      // The supplied query is the explicitly shared state protocol, rather than an emitted model.
      const draft = props.query.draft
      draft.value = { ...draft.value, [field.name]: snapshot(value) }
      if (props.layout === 'light' && props.autoSubmit) {
        timer = setTimeout(
          () => {
            timer = undefined
            if (!disposed && props.layout === 'light' && props.autoSubmit && !props.disabled)
              void run('submit')
          },
          Math.max(0, props.debounceTime),
        )
      }
    }
    onBeforeUnmount(() => {
      disposed = true
      cancel()
    })
    const instance: TableQueryInstance = {
      submit: () => run('submit'),
      reset: () => run('reset'),
      cancel,
    }
    expose(instance)

    return () => {
      const Root = props.rootTag
      return (
        <Root
          {...attrs}
          class={styles.root()}
          aria-label={locale.value.label}
          onSubmit={(event) => {
            event.preventDefault()
            void run('submit')
          }}
        >
          <div class={styles.fields()}>
            {visible.value.map((field) => {
              const state = fieldContext(field)
              const controlId = `${id}-${field.name}`
              const error = props.errors?.[field.name] ?? toValue(field.dictionary?.error)?.message
              const readonly =
                typeof field.readonly === 'function' ? field.readonly(state) : !!field.readonly
              const disabled =
                props.disabled ||
                props.query.submitting.value ||
                (typeof field.disabled === 'function' ? field.disabled(state) : !!field.disabled)
              const options = [
                ...(toValue(field.options) ?? toValue(field.dictionary?.options) ?? []),
              ]
              const value = props.query.draft.value[field.name]
              for (const selected of Array.isArray(value) ? value : [value]) {
                if (
                  !field.dictionary ||
                  !['string', 'number', 'boolean'].includes(typeof selected) ||
                  options.some((option) => Object.is(option.value, selected))
                )
                  continue
                const known = toValue(field.dictionary.valueEnum).get(
                  selected as string | number | boolean,
                )
                const label = typeof known === 'string' ? known : known?.text
                if (typeof label === 'string')
                  options.push({
                    value: selected as string | number | boolean,
                    label,
                    ...(typeof known === 'object' ? { status: known.status } : {}),
                  })
              }
              const control: TableControlContext = {
                value,
                onChange: (value) => change(field, value),
                fieldProps:
                  typeof field.fieldProps === 'function'
                    ? field.fieldProps(state)
                    : (field.fieldProps ?? {}),
                options,
                disabled,
                readonly,
                loading: toValue(field.dictionary?.loading) ?? false,
                error,
                id: controlId,
                name: field.name,
                mode: 'query',
                onSearch: field.dictionary
                  ? (keyword) => {
                      void field.dictionary!.search(keyword)
                    }
                  : undefined,
              }
              const renderer = props.controls[field.valueType ?? 'text'] ?? props.controls.text
              return (
                <div key={field.name} class={styles.field()} data-query-field={field.name}>
                  <label class={styles.label()} for={controlId}>
                    {field.label ?? field.name}
                  </label>
                  <div class={styles.control()}>
                    {slots.field?.({ field, values: props.query.draft.value, control }) ??
                      renderer?.(control)}
                    {error ? (
                      <div class={styles.error()} role="alert" id={`${controlId}-error`}>
                        {error}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
          <div class={styles.actions()}>
            {slots.actions?.({
              ...instance,
              submitting: busy.value,
              collapsed: props.query.collapsed.value,
              toggleCollapsed: props.query.toggleCollapsed,
            }) ?? (
              <>
                <Button
                  htmlType="button"
                  disabled={busy.value}
                  onClick={(event: MouseEvent) => {
                    event.preventDefault()
                    void run('reset')
                  }}
                >
                  {locale.value.reset}
                </Button>
                <Button
                  type="primary"
                  htmlType={props.rootTag === 'form' ? 'submit' : 'button'}
                  disabled={busy.value}
                  onClick={(event: MouseEvent) => {
                    event.preventDefault()
                    void run('submit')
                  }}
                >
                  {locale.value.submit}
                </Button>
                {canCollapse.value ? (
                  <Button
                    type="link"
                    htmlType="button"
                    disabled={props.disabled}
                    class={styles.collapse()}
                    onClick={(event: MouseEvent) => {
                      event.preventDefault()
                      props.query.toggleCollapsed()
                    }}
                    aria-expanded={!props.query.collapsed.value}
                  >
                    {props.query.collapsed.value ? locale.value.expand : locale.value.collapse}
                  </Button>
                ) : null}
              </>
            )}
          </div>
          {failure.value || props.query.error.value ? (
            <div class={styles.feedback()} role="alert">
              {failure.value ?? props.query.error.value?.message}
            </div>
          ) : null}
        </Root>
      )
    }
  },
})
