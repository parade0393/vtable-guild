import {
  computed,
  defineComponent,
  inject,
  nextTick,
  shallowRef,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import { Button, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import {
  CloseCircleFilledIcon,
  DownOutlinedIcon,
  ElFilterIcon,
  FilterFilledIcon,
} from '@vtable-guild/icons'
import type { TableControlContext, TableControlRenderer } from '../types/controls'
import type {
  TableQueryField,
  TableQueryLocale,
  TableQueryProps,
  TableQuerySlots,
} from '../types/query-form'
import { snapshot } from '../utils/snapshot'
import { stateEqual } from '../utils/stateEqual'
import TablePopup from './TablePopup'

type Values = Readonly<Record<string, unknown>>
type ResolveField = (
  field: TableQueryField,
  values: Values,
  onChange: TableControlContext['onChange'],
) => { control: TableControlContext; renderer?: TableControlRenderer }

function hasValue(value: unknown) {
  return value != null && value !== '' && (!Array.isArray(value) || value.length > 0)
}

function summarize({ value, options }: TableControlContext, separator: string) {
  return (Array.isArray(value) ? value : [value])
    .map((item) => {
      const label = options.find((option) => Object.is(option.value, item))?.label
      if (label != null) return label
      if (item instanceof Date && !Number.isNaN(item.getTime())) return item.toLocaleString()
      if (item && typeof item === 'object' && 'label' in item) item = item.label
      return typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        ? String(item)
        : ''
    })
    .filter(Boolean)
    .join(separator)
}

export default defineComponent({
  name: 'TableLightFilter',
  props: {
    fields: { type: Array as PropType<readonly TableQueryField[]>, required: true },
    values: { type: Object as PropType<Values>, required: true },
    resolveField: { type: Function as PropType<ResolveField>, required: true },
    submitValues: {
      type: Function as PropType<(patch: Record<string, unknown>) => Promise<boolean>>,
      required: true,
    },
    locale: {
      type: Object as PropType<Pick<TableQueryLocale, 'more' | 'confirm' | 'clear'>>,
      required: true,
    },
    disabled: Boolean,
    submitting: Boolean,
    collapse: Boolean,
    collapseLabel: null as unknown as PropType<VNodeChild>,
    footerRender: {
      type: [Boolean, Function] as PropType<TableQueryProps['footerRender']>,
      default: undefined,
    },
    getPopupContainer: Function as PropType<TableQueryProps['getPopupContainer']>,
  },
  slots: Object as SlotsType<Pick<TableQuerySlots, 'field'>>,
  setup(props, { slots }) {
    const vtg = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const popupId = useId()
    const active = shallowRef<{ name?: string; anchor: HTMLButtonElement }>()
    const panel = shallowRef<HTMLElement | null>(null)
    const staged = shallowRef<Record<string, unknown>>({})
    const pending = shallowRef(false)
    const failed = shallowRef(false)
    const hidden = (field: TableQueryField, values: Values) =>
      typeof field.hidden === 'function' ? field.hidden({ field, values }) : !!field.hidden
    const visible = computed(() => props.fields.filter((field) => !hidden(field, props.values)))
    const grouped = computed(() =>
      visible.value.filter((field) => props.collapse || field.secondary),
    )
    const standalone = computed(() =>
      props.collapse ? [] : visible.value.filter((field) => !field.secondary),
    )
    const popupValues = computed(() => ({ ...props.values, ...staged.value }))
    function getPopupFields(values: Values) {
      if (!active.value) return []
      const name = active.value.name
      return props.fields.filter(
        (field) =>
          !hidden(field, values) &&
          (name === undefined
            ? props.collapse || field.secondary
            : !props.collapse && !field.secondary && field.name === name),
      )
    }
    const popupFields = computed(() => getPopupFields(popupValues.value))
    const committedPopupFields = computed(() => getPopupFields(props.values))
    const busy = computed(() => props.disabled || props.submitting || pending.value)

    function close(restoreFocus = false) {
      const anchor = active.value?.anchor
      active.value = undefined
      staged.value = {}
      failed.value = false
      if (restoreFocus) {
        void nextTick(() => {
          if (!active.value && anchor?.isConnected) anchor.focus({ preventScroll: true })
        })
      }
    }

    function toggle(event: MouseEvent, name?: string) {
      if (busy.value) return
      if (active.value?.anchor === event.currentTarget) {
        close()
        return
      }
      staged.value = {}
      failed.value = false
      active.value = { name, anchor: event.currentTarget as HTMLButtonElement }
    }

    watch(
      () => [committedPopupFields.value, pending.value] as const,
      ([fields, submitting]) => {
        // Host validation temporarily applies the patch; a rejected patch must remain retryable.
        if (active.value && !fields.length && !submitting) close()
      },
    )
    watch(
      () => [active.value, panel.value] as const,
      async ([current, element]) => {
        if (!current || !element) return
        await nextTick()
        if (current !== active.value || element !== panel.value) return
        const selector =
          'input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled)'
        const target = element.querySelector<HTMLElement>(selector) ?? element
        target.focus({ preventScroll: true })
      },
      { flush: 'post' },
    )

    function summary(
      field: TableQueryField,
      control: TableControlContext,
      renderer?: TableControlRenderer,
    ) {
      const format = renderer?.lightFilter?.formatValue
      if (format) return format(control)
      return summarize(control, field.valueType?.endsWith('Range') ? ' – ' : ', ')
    }

    async function submit(patch: Record<string, unknown>, closeAfter: boolean) {
      if (busy.value) return false
      const current = active.value
      pending.value = true
      try {
        const success = await props.submitValues(patch)
        if (current === active.value && current) {
          failed.value = !success
          if (success) {
            if (closeAfter) close(true)
            else staged.value = {}
          }
        }
        return success
      } finally {
        pending.value = false
      }
    }

    function confirm() {
      if (!active.value || busy.value) return Promise.resolve(false)
      if (!Object.keys(staged.value).length) {
        close(true)
        return Promise.resolve(true)
      }
      return submit(staged.value, true)
    }

    function change(field: TableQueryField, value: unknown) {
      if (busy.value || !active.value || !popupFields.value.includes(field)) return
      const { control, renderer } = props.resolveField(field, popupValues.value, () => {})
      if (control.disabled || control.readonly || stateEqual(control.value, value)) return
      staged.value = { ...staged.value, [field.name]: snapshot(value) }
      const light = renderer?.lightFilter
      if (active.value.name !== undefined && light?.submitOnChange) {
        const closeOnChange = light.closeOnChange
        void submit(
          staged.value,
          typeof closeOnChange === 'function'
            ? closeOnChange({ ...control, value })
            : closeOnChange !== false,
        )
      }
    }

    function clear() {
      const current = active.value
      if (!current || busy.value) return Promise.resolve(false)
      const editable = popupFields.value.filter((field) => {
        const { control } = props.resolveField(field, popupValues.value, () => {})
        return !control.disabled && !control.readonly
      })
      if (!editable.length) return Promise.resolve(false)
      if (current.name !== undefined) {
        staged.value = { [current.name]: undefined }
        return Promise.resolve(true)
      }
      staged.value = Object.fromEntries(editable.map((field) => [field.name, undefined]))
      return submit(staged.value, false)
    }

    function onPopupKeydown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return
      const target = event.target
      if (!(target instanceof HTMLInputElement) || target.closest('[role="combobox"]')) return
      event.preventDefault()
      void confirm()
    }

    function trigger(field: TableQueryField) {
      const { control, renderer } = props.resolveField(field, props.values, () => {})
      const label = field.label ?? field.name
      const current = hasValue(control.value)
      const value = current ? summary(field, control, renderer) : undefined
      const open = active.value?.name === field.name
      const disabled = busy.value || control.disabled || control.readonly
      return (
        <span
          key={field.name}
          class="vtg-light-filter__chip"
          data-query-field={field.name}
          data-active={current || undefined}
          data-invalid={!!control.error || undefined}
        >
          <button
            type="button"
            class="vtg-light-filter__trigger"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? popupId : undefined}
            onClick={(event) => toggle(event, field.name)}
          >
            <span>{label}</span>
            {value != null && value !== '' ? (
              <span
                class="vtg-light-filter__value"
                title={typeof value === 'string' ? value : undefined}
              >
                {': '}
                {value}
              </span>
            ) : null}
            <DownOutlinedIcon class="vtg-light-filter__icon" aria-hidden="true" />
          </button>
          {current &&
          control.fieldProps.allowClear !== false &&
          control.fieldProps.clearable !== false ? (
            <button
              type="button"
              class="vtg-light-filter__clear"
              aria-label={`${props.locale.clear} ${typeof label === 'string' ? label : field.name}`}
              disabled={disabled}
              onClick={() => void submit({ [field.name]: undefined }, true)}
            >
              <CloseCircleFilledIcon class="vtg-light-filter__icon" aria-hidden="true" />
            </button>
          ) : null}
        </span>
      )
    }

    function popupContent(element: HTMLElement, isGrouped: boolean) {
      const fields = popupFields.value
      const values = popupValues.value
      const resolved = fields.map((field) => ({
        field,
        ...props.resolveField(field, values, (value) => change(field, value)),
      }))
      let footer: VNodeChild = null
      if (
        props.footerRender !== false &&
        (isGrouped || failed.value || !resolved[0]?.renderer?.lightFilter?.submitOnChange)
      ) {
        footer = props.footerRender ? (
          props.footerRender({ values, fields, confirm, clear, submitting: busy.value })
        ) : (
          <div class="vtg-light-filter__footer">
            <Button size="sm" disabled={busy.value} onClick={() => void clear()}>
              {props.locale.clear}
            </Button>
            <Button type="primary" size="sm" disabled={busy.value} onClick={() => void confirm()}>
              {props.locale.confirm}
            </Button>
          </div>
        )
      }
      return [
        <div class="vtg-light-filter__fields">
          {resolved.map(({ field, control, renderer }) => {
            const context: TableControlContext = {
              ...control,
              lightFilter: { grouped: isGrouped, getPopupContainer: () => element },
            }
            return (
              <div
                class="vtg-light-filter__field"
                key={field.name}
                data-query-popup-field={field.name}
                data-query-value-type={field.valueType ?? 'text'}
              >
                {isGrouped ? <label for={control.id}>{field.label ?? field.name}</label> : null}
                <div data-query-control-content="">
                  {slots.field?.({ field, values, control: context, layoutType: 'LightFilter' }) ??
                    renderer?.(context)}
                </div>
                {control.error ? (
                  <div class="vtg-light-filter__error" role="alert">
                    {control.error}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>,
        footer,
      ]
    }

    return () => {
      const state = active.value
      const isGrouped = !!state && state.name === undefined
      const firstField = popupFields.value[0]
      const popupLabel = isGrouped ? props.locale.more : (firstField?.label ?? firstField?.name)
      const preset = vtg?.themePreset ?? 'antdv'
      return (
        <div class="vtg-light-filter">
          {standalone.value.map(trigger)}
          {grouped.value.length ? (
            <span
              class="vtg-light-filter__chip"
              data-active={
                grouped.value.some((field) => hasValue(props.values[field.name])) || undefined
              }
            >
              <button
                type="button"
                class="vtg-light-filter__trigger"
                data-query-more=""
                aria-label={
                  typeof props.collapseLabel === 'string' ? props.collapseLabel : props.locale.more
                }
                disabled={busy.value}
                aria-haspopup="dialog"
                aria-expanded={isGrouped}
                aria-controls={isGrouped ? popupId : undefined}
                onClick={(event) => toggle(event)}
              >
                {props.collapseLabel ??
                  (props.collapse ? (
                    preset === 'element-plus' ? (
                      <ElFilterIcon class="vtg-light-filter__collapse-icon" aria-hidden="true" />
                    ) : (
                      <FilterFilledIcon
                        class="vtg-light-filter__collapse-icon"
                        aria-hidden="true"
                      />
                    )
                  ) : (
                    props.locale.more
                  ))}
                {props.collapse ? null : (
                  <DownOutlinedIcon class="vtg-light-filter__icon" aria-hidden="true" />
                )}
              </button>
            </span>
          ) : null}
          <TablePopup
            open={!!state}
            anchor={state?.anchor}
            outsideBoundary={state?.anchor.parentElement}
            preset={preset}
            getPopupContainer={props.getPopupContainer}
            panelRef={(element) => {
              panel.value = element
            }}
            class="vtg-light-filter__popup"
            panelAttrs={{
              id: popupId,
              role: 'dialog',
              'aria-label': typeof popupLabel === 'string' ? popupLabel : firstField?.name,
              'aria-busy': busy.value,
              tabindex: -1,
              onKeydown: onPopupKeydown,
            }}
            onDismiss={() => close()}
          >
            {panel.value ? popupContent(panel.value, isGrouped) : null}
          </TablePopup>
        </div>
      )
    }
  },
})
