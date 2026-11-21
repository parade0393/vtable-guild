import { h } from 'vue'
import type { Component } from 'vue'
import type { ColumnValue } from './types/presentation'
import type {
  TableBuiltinControlValueType,
  TableControlComponents,
  TableControlContext,
  TableControlRenderer,
  TableControls,
  TableQueryFormAdapter,
} from './types/controls'
import { TABLE_QUERY_FORM_ADAPTER } from './types/controls'

function optionKey(value: ColumnValue) {
  return `${typeof value}:${String(value)}`
}

function createControls(host: TableControlComponents, element: boolean): TableControls {
  function popupProps(context: TableControlContext) {
    const light = context.lightFilter
    if (!light) return {}
    // Keep events from the native option/calendar popup inside the enclosing query popup.
    return element
      ? { appendTo: light.getPopupContainer() }
      : { getPopupContainer: light.getPopupContainer }
  }

  function popupDefaults(context: TableControlContext) {
    const light = context.lightFilter
    if (!light) return {}
    return element ? { automaticDropdown: !light.grouped } : { defaultOpen: !light.grouped }
  }

  function popupControl(
    renderer: TableControlRenderer,
    closeOnChange: NonNullable<TableControlRenderer['lightFilter']>['closeOnChange'] = true,
  ): TableControlRenderer {
    return Object.assign(renderer, { lightFilter: { submitOnChange: true, closeOnChange } })
  }

  function control(
    component: Component,
    context: TableControlContext,
    defaults = {},
    range = false,
    popup = false,
  ) {
    const update = element ? 'onUpdate:modelValue' : 'onUpdate:value'
    const model = element ? 'modelValue' : 'value'
    return h(component, {
      ...defaults,
      ...(popup ? popupDefaults(context) : {}),
      ...context.fieldProps,
      ...(popup ? popupProps(context) : {}),
      [model]: context.value,
      [update]: context.onChange,
      id: element && range && context.id ? [context.id, `${context.id}-end`] : context.id,
      name: element && range && context.name ? [context.name, `${context.name}-end`] : context.name,
      'aria-label': context.name,
      disabled: context.disabled || context.readonly,
      'aria-invalid': context.error ? true : undefined,
      ...(element
        ? { readonly: context.readonly }
        : { status: context.error ? 'error' : undefined }),
    })
  }
  const select = popupControl(
    (context) => {
      const choices = new Map(context.options.map((option) => [optionKey(option.value), option]))
      const encode = (value: unknown) => {
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')
          return undefined
        const key = optionKey(value)
        if (!choices.has(key)) choices.set(key, { value, label: String(value) })
        return key
      }
      const value = Array.isArray(context.value) ? context.value.map(encode) : encode(context.value)
      const decode = (value: unknown): unknown =>
        Array.isArray(value)
          ? value.map(decode)
          : typeof value === 'string'
            ? choices.get(value)?.value
            : undefined
      const mapped = {
        ...context,
        value,
        onChange: (next: unknown) => context.onChange(decode(next)),
      }
      const options = [...choices].map(([value, option]) => ({ ...option, value }))
      if (element) {
        if (!host.Option) throw new Error('Element Plus table controls require ElOption as Option')
        return h(
          host.Select,
          {
            ...popupDefaults(context),
            ...context.fieldProps,
            ...popupProps(context),
            modelValue: value,
            'onUpdate:modelValue': mapped.onChange,
            id: context.id,
            disabled: context.disabled || context.readonly,
            'aria-label': context.name,
            loading: context.loading,
            'aria-invalid': context.error ? true : undefined,
            ...(context.onSearch
              ? { filterable: true, remote: true, remoteMethod: context.onSearch }
              : {}),
          },
          {
            default: () =>
              options.map((option) => h(host.Option!, { ...option, key: option.value })),
          },
        )
      }
      return control(
        host.Select,
        {
          ...mapped,
          fieldProps: {
            ...context.fieldProps,
            options,
            loading: context.loading,
            ...(context.onSearch
              ? { showSearch: true, filterOption: false, onSearch: context.onSearch }
              : {}),
          },
        },
        {},
        false,
        true,
      )
    },
    ({ fieldProps }) =>
      element ? !fieldProps.multiple : fieldProps.mode !== 'multiple' && fieldProps.mode !== 'tags',
  )
  const date = (type: string, format: string, range = false) => {
    const renderer: TableControlRenderer = (context) => {
      const component = range && !element ? host.RangePicker : host.DatePicker
      if (!component) throw new Error('Ant Design Vue range fields require RangePicker')
      return control(
        component,
        context,
        element
          ? { type, valueFormat: format }
          : { valueFormat: format, ...(type.includes('time') ? { showTime: true } : {}) },
        range,
        true,
      )
    }
    // Time-bearing pickers emit intermediate values while their native panel stays open.
    return type.includes('time') ? renderer : popupControl(renderer)
  }
  const formAdapter =
    host.Form && host.FormItem
      ? Object.freeze({
          kind: element ? 'element-plus' : 'antdv',
          Form: host.Form,
          FormItem: host.FormItem,
          Button: host.Button,
        } satisfies TableQueryFormAdapter)
      : undefined

  return Object.freeze({
    ...(formAdapter ? { [TABLE_QUERY_FORM_ADAPTER]: formAdapter } : {}),
    text: (context) => control(host.Input, context),
    select,
    enum: select,
    digit: (context) => control(host.InputNumber, context),
    money: (context) => control(host.InputNumber, context),
    date: date('date', 'YYYY-MM-DD'),
    dateRange: date('daterange', 'YYYY-MM-DD', true),
    dateTime: date('datetime', 'YYYY-MM-DD HH:mm:ss'),
    dateTimeRange: date('datetimerange', 'YYYY-MM-DD HH:mm:ss', true),
    time: (context) => {
      if (!host.TimePicker) throw new Error('Time fields require TimePicker')
      return control(host.TimePicker, context, { valueFormat: 'HH:mm:ss' }, false, true)
    },
  } satisfies Record<TableBuiltinControlValueType, TableControlRenderer> & TableControls)
}

export function createAntdvTableControls(components: TableControlComponents): TableControls {
  return createControls(components, false)
}
export function createElementPlusTableControls(components: TableControlComponents): TableControls {
  return createControls(components, true)
}
