import {
  computed,
  defineComponent,
  inject,
  mergeProps,
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
  TableQueryActionSlotProps,
  TableQueryField,
  TableQueryInstance,
  TableQueryProps,
  TableQuerySlots,
} from '../types/query-form'
import TableLightFilter from './TableLightFilter'
import { getQueryFilterLayout, useQueryFilterWidth } from '../utils/queryFilterLayout'
import { deriveTableQueryFields } from '../utils/queryFields'
import { snapshot } from '../utils/snapshot'
import { stateEqual } from '../utils/stateEqual'

export default defineComponent({
  name: 'TableQuery',
  inheritAttrs: false,
  props: {
    query: { type: Object as PropType<TableQueryProps['query']>, required: true },
    rootTag: { type: String as PropType<TableQueryProps['rootTag']>, default: 'form' },
    fields: Array as PropType<TableQueryProps['fields']>,
    columns: Array as PropType<TableQueryProps['columns']>,
    controls: { type: Object as PropType<TableQueryProps['controls']>, required: true },
    layoutType: {
      type: String as PropType<NonNullable<TableQueryProps['layoutType']>>,
      default: 'QueryFilter',
    },
    layout: String as PropType<TableQueryProps['layout']>,
    span: [Number, Object] as PropType<TableQueryProps['span']>,
    defaultColsNumber: Number,
    defaultFormItemsNumber: Number,
    defaultCollapsed: { type: Boolean, default: undefined },
    collapsed: { type: Boolean, default: undefined },
    onCollapse: Function as PropType<TableQueryProps['onCollapse']>,
    collapseRender: {
      type: [Boolean, Function] as PropType<TableQueryProps['collapseRender']>,
      default: undefined,
    },
    optionRender: {
      type: [Boolean, Function] as PropType<TableQueryProps['optionRender']>,
      default: undefined,
    },
    searchText: String,
    resetText: String,
    labelWidth: [Number, String] as PropType<TableQueryProps['labelWidth']>,
    searchGutter: [Number, Array] as PropType<TableQueryProps['searchGutter']>,
    split: Boolean,
    preserve: { type: Boolean, default: true },
    showHiddenNum: Boolean,
    submitter: {
      type: [Boolean, Object] as PropType<TableQueryProps['submitter']>,
      default: undefined,
    },
    submitterColSpanProps: Object as PropType<TableQueryProps['submitterColSpanProps']>,
    collapse: Boolean,
    collapseLabel: null as unknown as PropType<TableQueryProps['collapseLabel']>,
    footerRender: {
      type: [Boolean, Function] as PropType<TableQueryProps['footerRender']>,
      default: undefined,
    },
    getPopupContainer: Function as PropType<TableQueryProps['getPopupContainer']>,
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
    'update:collapsed': (_collapsed: boolean) => true,
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
    const root = ref<HTMLElement | null>(null)
    const width = useQueryFilterWidth(root)
    const validating = ref(false)
    const failure = ref<string>()
    let controller: AbortController | undefined
    let generation = 0
    let disposed = false
    let activeAction: 'submit' | 'reset' | undefined
    let pending: Promise<boolean> | undefined
    let settle: ((success: boolean) => void) | undefined
    let rollback: (() => void) | undefined
    const fields = computed(() =>
      props.fields
        ? [...props.fields].sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
        : deriveTableQueryFields(props.columns ?? []),
    )
    const draft = computed(() => props.query.draft.value)
    const fieldContext = (field: TableQueryField, values = draft.value) => ({ field, values })
    const hidden = (field: TableQueryField) =>
      typeof field.hidden === 'function' ? field.hidden(fieldContext(field)) : !!field.hidden
    const available = computed(() => fields.value.filter((field) => !hidden(field)))
    const submitter = computed(() => props.submitter || undefined)
    const showActions = computed(
      () => !!slots.actions || (props.optionRender !== false && props.submitter !== false),
    )
    const defaultCollapsed = ref(props.defaultCollapsed)
    const collapsed = computed(
      () =>
        props.collapsed ??
        (showActions.value && (defaultCollapsed.value ?? props.query.collapsed.value)),
    )
    const grid = computed(() =>
      getQueryFilterLayout(available.value, {
        width: width.value,
        layout: props.layout,
        span: props.span,
        defaultColsNumber: props.defaultColsNumber,
        defaultFormItemsNumber: props.defaultFormItemsNumber,
        collapsed: collapsed.value,
        submitterColSpanProps: props.submitterColSpanProps,
        showActions: showActions.value,
      }),
    )
    const gridStyle = computed(() => {
      const [horizontal, vertical] = Array.isArray(props.searchGutter)
        ? props.searchGutter
        : [props.searchGutter, undefined]
      return {
        '--vtg-query-label-width':
          typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth,
        '--vtg-query-column-gap': horizontal === undefined ? undefined : `${horizontal}px`,
        '--vtg-query-row-gap': vertical === undefined ? undefined : `${vertical}px`,
      }
    })
    const busy = computed(() => props.disabled || validating.value || props.query.submitting.value)

    function toggleCollapsed() {
      const next = !collapsed.value
      if (props.collapsed === undefined) {
        if (defaultCollapsed.value === undefined) props.query.toggleCollapsed()
        else defaultCollapsed.value = next
      }
      props.onCollapse?.(next)
      emit('update:collapsed', next)
    }
    watch(() => [props.layoutType, props.disabled, props.query], cancel, { flush: 'sync' })
    function cancel() {
      generation++
      controller?.abort()
      rollback?.()
      rollback = undefined
      settle?.(false)
      settle = undefined
      controller = undefined
      validating.value = false
      activeAction = undefined
      pending = undefined
    }
    function submitOptions() {
      if (props.preserve) return undefined
      const retained = new Set(
        props.layoutType === 'LightFilter'
          ? available.value
          : grid.value.fields.map(({ field }) => field),
      )
      return {
        omitFields: fields.value.filter((field) => !retained.has(field)).map(({ name }) => name),
      }
    }
    function run(action: 'submit' | 'reset', update?: Record<string, unknown>): Promise<boolean> {
      if (disposed || props.disabled) return Promise.resolve(false)
      if (pending && activeAction === action) return pending
      cancel()
      const current = generation
      const abort = new AbortController()
      controller = abort
      activeAction = action
      failure.value = undefined
      const draftRef = props.query.draft
      const previous = draftRef.value
      if (action === 'reset') props.query.resetFields()
      else if (update) draftRef.value = { ...draft.value, ...snapshot(update) }
      const values = snapshot(draft.value)
      if (update) {
        rollback = () => {
          if (stateEqual(values, draftRef.value)) draftRef.value = previous
        }
      }
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
          // Let a wrapping Form receive the replaced draft before validating it.
          if (action === 'reset' || update) await nextTick()
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
          if (!stateEqual(values, draft.value)) return false
          rollback = undefined
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
            rollback?.()
            rollback = undefined
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
    function canChange(field: TableQueryField) {
      const state = fieldContext(field)
      const disabled = typeof field.disabled === 'function' ? field.disabled(state) : field.disabled
      const readonly = typeof field.readonly === 'function' ? field.readonly(state) : field.readonly
      return (
        !props.disabled && !props.query.submitting.value && !hidden(field) && !disabled && !readonly
      )
    }
    function change(name: string, value: unknown) {
      const field = fields.value.find((field) => field.name === name)
      if (!field || !canChange(field) || stateEqual(draft.value[name], value)) return
      cancel()
      failure.value = undefined
      const draftRef = props.query.draft
      draftRef.value = { ...draft.value, [name]: snapshot(value) }
    }
    function submitValues(values: Record<string, unknown>) {
      if (busy.value) return Promise.resolve(false)
      const update = Object.fromEntries(
        fields.value
          .filter((field) => Object.hasOwn(values, field.name))
          .map(({ name }) => [name, values[name]]),
      )
      return Object.keys(update).length ? run('submit', update) : Promise.resolve(true)
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

    function resolveField(
      field: TableQueryField,
      values: Readonly<Record<string, unknown>>,
      onChange: (value: unknown) => void,
    ) {
      const state = fieldContext(field, values)
      const error = props.errors?.[field.name] ?? toValue(field.dictionary?.error)?.message
      const options = [...(toValue(field.options) ?? toValue(field.dictionary?.options) ?? [])]
      const value = values[field.name]
      for (const selected of Array.isArray(value) ? value : [value]) {
        if (
          !field.dictionary ||
          !['string', 'number', 'boolean'].includes(typeof selected) ||
          options.some((option) => Object.is(option.value, selected))
        )
          continue
        const key = selected as string | number | boolean
        const known = toValue(field.dictionary.valueEnum).get(key)
        const label = typeof known === 'string' ? known : known?.text
        if (typeof label === 'string')
          options.push({
            value: key,
            label,
            ...(typeof known === 'object' ? { status: known.status } : {}),
          })
      }
      const readonly =
        typeof field.readonly === 'function' ? field.readonly(state) : !!field.readonly
      const disabled =
        props.disabled ||
        props.query.submitting.value ||
        (typeof field.disabled === 'function' ? field.disabled(state) : !!field.disabled)
      const control: TableControlContext = {
        value,
        onChange,
        fieldProps:
          typeof field.fieldProps === 'function'
            ? field.fieldProps(state)
            : (field.fieldProps ?? {}),
        options,
        disabled,
        readonly,
        loading: toValue(field.dictionary?.loading) ?? false,
        error,
        id: `${id}-${field.name}`,
        name: field.name,
        mode: 'query',
        onSearch: field.dictionary
          ? (keyword) => {
              void field.dictionary!.search(keyword)
            }
          : undefined,
      }
      const valueType = field.valueType ?? 'text'
      const registered = Object.hasOwn(props.controls, valueType)
        ? props.controls[valueType]
        : undefined
      return {
        control,
        renderer: registered ?? props.controls.text,
        valueType: registered ? valueType : 'text',
      }
    }
    function renderActions() {
      const showCollapseButton = grid.value.canCollapse && props.collapseRender !== false
      const actions: TableQueryActionSlotProps = {
        ...instance,
        submitting: busy.value,
        collapsed: collapsed.value,
        toggleCollapsed,
        showCollapseButton,
      }
      if (slots.actions) return slots.actions(actions)

      const config = submitter.value
      const { resetButtonProps, submitButtonProps } = config ?? {}
      const buttons = [
        resetButtonProps !== false && (
          <Button
            key="reset"
            {...mergeProps(resetButtonProps ?? {}, {
              htmlType: 'button',
              disabled: busy.value || !!resetButtonProps?.disabled,
              onClick: (event: MouseEvent) => {
                if (!event.defaultPrevented) void run('reset')
              },
            })}
          >
            {config?.searchConfig?.resetText ?? props.resetText ?? locale.value.reset}
          </Button>
        ),
        submitButtonProps !== false && (
          <Button
            key="submit"
            {...mergeProps({ type: 'primary' }, submitButtonProps ?? {}, {
              htmlType: props.rootTag === 'form' ? 'submit' : 'button',
              disabled: busy.value || !!submitButtonProps?.disabled,
              onClick: (event: MouseEvent) => {
                if (event.defaultPrevented) return
                event.preventDefault()
                void run('submit')
              },
            })}
          >
            {config?.searchConfig?.submitText ?? props.searchText ?? locale.value.submit}
          </Button>
        ),
      ].filter(Boolean)
      const render = config?.render ?? props.optionRender
      return (
        <>
          {render === false
            ? null
            : typeof render === 'function'
              ? render(actions, buttons)
              : buttons}
          {showCollapseButton ? (
            <Button
              type="link"
              htmlType="button"
              disabled={props.disabled}
              class={styles.collapse()}
              onClick={toggleCollapsed}
              aria-expanded={!collapsed.value}
            >
              {typeof props.collapseRender === 'function'
                ? props.collapseRender(collapsed.value)
                : collapsed.value
                  ? `${locale.value.expand}${props.showHiddenNum ? ` (${grid.value.hiddenCount})` : ''}`
                  : locale.value.collapse}
            </Button>
          ) : null}
        </>
      )
    }
    function renderQueryFilter() {
      const positions = new Map(
        grid.value.fields.map((placement) => [placement.field.name, placement]),
      )
      const rendered = props.preserve ? fields.value : grid.value.fields.map(({ field }) => field)
      return (
        <div class={styles.fields()} data-query-grid="" style={gridStyle.value}>
          {rendered.map((field) => {
            const position = positions.get(field.name)
            const { control, renderer, valueType } = resolveField(field, draft.value, (value) => {
              change(field.name, value)
            })
            return (
              <div
                key={field.name}
                class={styles.field()}
                style={position?.style}
                hidden={!position}
                data-query-field={field.name}
                data-query-split={props.split && position?.endsRow ? '' : undefined}
              >
                <label class={styles.label()} for={control.id}>
                  {field.label ?? field.name}
                </label>
                <div class={styles.control()} data-query-value-type={valueType}>
                  <div data-query-control-content="">
                    {slots.field
                      ? slots.field({
                          field,
                          values: draft.value,
                          control,
                          layoutType: 'QueryFilter',
                        })
                      : renderer?.(control)}
                  </div>
                  {control.error ? (
                    <div class={styles.error()} role="alert" id={`${control.id}-error`}>
                      {control.error}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
          {showActions.value ? (
            <div
              class={[styles.actions(), props.submitterColSpanProps?.class]}
              style={[grid.value.actionStyle, props.submitterColSpanProps?.style]}
              data-query-actions=""
            >
              {renderActions()}
            </div>
          ) : null}
        </div>
      )
    }

    return () => {
      const Root = props.rootTag
      const light = props.layoutType === 'LightFilter'
      return (
        <Root
          {...attrs}
          ref={root}
          class={styles.root()}
          data-query-layout-type={props.layoutType}
          data-query-layout={light ? undefined : grid.value.layout}
          aria-label={locale.value.label}
          onSubmit={(event: Event) => {
            if (event.target !== root.value) return
            event.preventDefault()
            if (!light) void run('submit')
          }}
        >
          {light ? (
            <TableLightFilter
              fields={fields.value}
              values={draft.value}
              disabled={props.disabled}
              submitting={busy.value}
              collapse={props.collapse}
              collapseLabel={props.collapseLabel}
              footerRender={props.footerRender}
              getPopupContainer={props.getPopupContainer}
              locale={locale.value}
              resolveField={resolveField}
              submitValues={submitValues}
              v-slots={slots.field ? { field: slots.field } : undefined}
            />
          ) : (
            renderQueryFilter()
          )}
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
