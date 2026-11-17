import { describe, expect, it, vi } from 'vitest'
import { defineComponent, type VNode } from 'vue'
import { createAntdvTableControls, createElementPlusTableControls } from './controls'
import type { TableControlContext } from './types/controls'

const Host = defineComponent({ render: () => null })
const host = {
  Input: Host,
  Select: Host,
  Option: Host,
  InputNumber: Host,
  DatePicker: Host,
  RangePicker: Host,
  TimePicker: Host,
}
function context(extra: Partial<TableControlContext> = {}): TableControlContext {
  return {
    value: undefined,
    onChange: vi.fn(),
    options: [],
    fieldProps: {},
    disabled: false,
    readonly: false,
    loading: false,
    mode: 'query',
    ...extra,
  }
}
describe.each([false, true])('host control adapter, element=%s', (element) => {
  const controls = element ? createElementPlusTableControls(host) : createAntdvTableControls(host)
  const model = element ? 'modelValue' : 'value'
  const event = element ? 'onUpdate:modelValue' : 'onUpdate:value'
  it('preserves string/number/boolean identity and clear values through Select', () => {
    const onChange = vi.fn()
    const ctx = context({
      value: [1, '1', false],
      onChange,
      options: [
        { value: 1, label: 'One' },
        { value: '1', label: 'String one' },
        { value: false, label: 'No' },
      ],
    })
    const vnode = controls.select(ctx) as VNode
    expect(vnode.props?.[model]).toEqual(['number:1', 'string:1', 'boolean:false'])
    vnode.props?.[event](['boolean:false', 'string:1'])
    expect(onChange).toHaveBeenLastCalledWith([false, '1'])
    vnode.props?.[event](undefined)
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })
  it('keeps remote search, readonly/error state and the model binding under protocol control', () => {
    const search = vi.fn()
    const ctx = context({
      value: 0,
      readonly: true,
      error: 'required',
      onSearch: search,
      name: 'state',
      fieldProps: { [model]: 'overridden' },
    })
    const vnode = controls.select(ctx) as VNode
    expect(vnode.props?.[model]).toBe('number:0')
    expect(vnode.props?.disabled).toBe(true)
    expect(vnode.props?.['aria-invalid']).toBe(true)
    expect(vnode.props?.[element ? 'remoteMethod' : 'onSearch']).toBe(search)
  })
  it('wires range and datetime values while allowing explicit host valueFormat', () => {
    const vnode = controls.dateTimeRange(
      context({ value: ['2026-01-01', '2026-01-02'], id: 'query-dates', name: 'dates' }),
    ) as VNode
    expect(vnode.props?.valueFormat).toBe('YYYY-MM-DD HH:mm:ss')
    expect(vnode.props?.[element ? 'type' : 'showTime']).toBe(element ? 'datetimerange' : true)
    expect(vnode.props?.id).toEqual(element ? ['query-dates', 'query-dates-end'] : 'query-dates')
    expect(vnode.props?.name).toEqual(element ? ['dates', 'dates-end'] : 'dates')
    expect(
      (controls.date(context({ fieldProps: { valueFormat: undefined } })) as VNode).props
        ?.valueFormat,
    ).toBeUndefined()
  })

  it('anchors native select and date popups inside LightFilter', () => {
    const panel = document.createElement('div')
    const getPopupContainer = () => panel
    const grouped = context({ lightFilter: { grouped: true, getPopupContainer } })
    const open = element ? 'automaticDropdown' : 'defaultOpen'
    const container = element ? 'appendTo' : 'getPopupContainer'
    const expectedContainer = element ? panel : getPopupContainer

    expect((controls.select(grouped) as VNode).props?.[container]).toBe(expectedContainer)
    expect((controls.dateRange(grouped) as VNode).props?.[container]).toBe(expectedContainer)
    expect((controls.select(grouped) as VNode).props?.[open]).toBe(false)
    const standalone = context({ lightFilter: { grouped: false, getPopupContainer } })
    expect((controls.dateRange(standalone) as VNode).props?.[open]).toBe(true)
  })

  it('keeps multivalue selections open while closing standalone single selections', () => {
    const policy = controls.select.lightFilter
    expect(policy?.submitOnChange).toBe(true)
    expect(controls.enum).toBe(controls.select)
    const closeOnChange = policy?.closeOnChange
    expect(typeof closeOnChange).toBe('function')
    if (typeof closeOnChange !== 'function') throw new Error('Missing select close policy')

    const multivalue = element ? [{ multiple: true }] : [{ mode: 'multiple' }, { mode: 'tags' }]
    for (const fieldProps of multivalue) {
      expect(closeOnChange(context({ fieldProps }))).toBe(false)
    }
    expect(closeOnChange(context())).toBe(true)
  })

  it.each(['time', 'dateTime', 'dateTimeRange'] as const)(
    'stages %s updates for explicit LightFilter confirmation',
    (valueType) => {
      const onChange = vi.fn()
      const value = valueType === 'dateTimeRange' ? ['start', 'end'] : 'selected'
      const renderer = controls[valueType]
      const vnode = renderer(context({ onChange })) as VNode

      expect(renderer.lightFilter?.submitOnChange).not.toBe(true)
      vnode.props?.[event](value)
      expect(onChange).toHaveBeenCalledExactlyOnceWith(value)
    },
  )

  it.each(['date', 'dateRange'] as const)(
    'retains immediate standalone LightFilter submission for %s',
    (valueType) => {
      expect(controls[valueType].lightFilter).toMatchObject({
        submitOnChange: true,
        closeOnChange: true,
      })
    },
  )
})
