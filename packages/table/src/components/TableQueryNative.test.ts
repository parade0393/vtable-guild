import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  provide,
  type InjectionKey,
  type PropType,
} from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import TableQuery from './TableQuery'
import VTableQuery from './VTableQuery.vue'
import { useTableQuery } from '../composables/useTableQuery'
import { TABLE_QUERY_FORM_ADAPTER, type TableControls } from '../types/controls'
import type { TableQueryProps } from '../types/query-form'

type Preset = 'antdv' | 'element-plus'
interface Values {
  keyword: string
  secret: string
}
interface Rule {
  required?: boolean
}
interface RegisteredItem {
  name?: string
  prop?: string
  required?: boolean
  rules?: Rule | Rule[]
}

const registrations: InjectionKey<Set<RegisteredItem>> = Symbol('native-form-items')
const wrappers: VueWrapper[] = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

/** Host stubs enforce rules against registered FormItems, using each library's exposed API. */
function nativeHost(preset: Preset) {
  const validate = vi.fn<(names: string[]) => Promise<unknown>>()
  const resetFields = vi.fn()
  const clearValidate = vi.fn()
  const Form = defineComponent({
    name: 'NativeFormStub',
    inheritAttrs: false,
    props: {
      model: { type: Object as PropType<Record<string, unknown>>, required: true },
      layout: String,
      inline: Boolean,
      labelPosition: String,
      disabled: Boolean,
    },
    setup(props, { attrs, slots, expose }) {
      const items = new Set<RegisteredItem>()
      provide(registrations, items)
      validate.mockImplementation(async (names) => {
        for (const item of items) {
          const name = preset === 'antdv' ? item.name : item.prop
          if (!name || !names.includes(name)) continue
          const rules = Array.isArray(item.rules) ? item.rules : [item.rules]
          const required = item.required || rules.some((rule) => rule?.required)
          if (required && (props.model[name] === '' || props.model[name] == null)) {
            throw new Error(`${name} is required`)
          }
        }
        return props.model
      })
      resetFields.mockImplementation(() => {
        // Native Forms restore their mount-time model; query defaults remain authoritative.
        // eslint-disable-next-line vue/no-mutating-props -- Simulate the host resetFields API.
        Object.assign(props.model, { keyword: 'host-mount-value', secret: 'host-mount-secret' })
      })
      expose({
        ...(preset === 'antdv' ? { validateFields: validate } : { validateField: validate }),
        resetFields,
        clearValidate,
      })
      return () => h('form', { ...attrs, 'data-native-form': preset }, slots.default?.())
    },
  })
  const FormItem = defineComponent({
    name: 'NativeFormItemStub',
    inheritAttrs: false,
    props: {
      name: String,
      prop: String,
      label: String,
      required: Boolean,
      rules: [Object, Array] as PropType<Rule | Rule[]>,
      htmlFor: String,
      for: String,
    },
    setup(props, { attrs, slots }) {
      const items = inject(registrations)!
      items.add(props)
      onBeforeUnmount(() => items.delete(props))
      return () =>
        h('div', { ...attrs, 'data-native-item': props.name ?? props.prop ?? 'actions' }, [
          props.label || slots.label
            ? h('label', { for: props.htmlFor ?? props.for }, slots.label?.() ?? props.label)
            : null,
          slots.default?.(),
        ])
    },
  })
  const Button = defineComponent({
    name: 'NativeButtonStub',
    inheritAttrs: false,
    props: { htmlType: String, nativeType: String, disabled: Boolean, type: String },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            type: (preset === 'antdv' ? props.htmlType : props.nativeType) ?? 'button',
            disabled: props.disabled,
            'data-native-button': props.type,
          },
          slots.default?.(),
        )
    },
  })
  const controls: TableControls = {
    [TABLE_QUERY_FORM_ADAPTER]: { kind: preset, Form, FormItem, Button },
    text: (context) =>
      h('input', {
        ...context.fieldProps,
        id: context.id,
        name: context.name,
        value: context.value,
        disabled: context.disabled,
        onInput: (event: Event) => context.onChange((event.target as HTMLInputElement).value),
      }),
  }
  return {
    controls: Object.freeze(controls),
    Form,
    FormItem,
    Button,
    validate,
    resetFields,
    clearValidate,
  }
}

describe.each(['antdv', 'element-plus'] as const)('%s native query form', (preset) => {
  function mountNative(
    overrides: Partial<TableQueryProps<Values>> = {},
    defaults: Values = { keyword: 'initial', secret: 'retained' },
  ) {
    const host = nativeHost(preset)
    const onSubmit = vi.fn()
    const query = useTableQuery<Values>({ defaultValues: defaults, onSubmit })
    const wrapper = mount(TableQuery, {
      attachTo: document.body,
      props: {
        query,
        controls: host.controls,
        fields: [{ name: 'keyword', label: 'Keyword' }],
        ...overrides,
      } as unknown as TableQueryProps,
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    return { wrapper, query, onSubmit, ...host }
  }

  it('uses the registered host Form, FormItem and buttons with inline packing by default', () => {
    const { wrapper, query, Form, FormItem, Button } = mountNative()
    expect(wrapper.findComponent(Form).exists()).toBe(true)
    expect(wrapper.findAllComponents(FormItem)).toHaveLength(2)
    expect(wrapper.findAllComponents(Button)).toHaveLength(2)
    expect(wrapper.findAll('form')).toHaveLength(1)
    expect(wrapper.find('[data-query-inline]').exists()).toBe(true)
    expect(wrapper.attributes('data-query-form-mode')).toBe('native')
    expect(wrapper.findComponent(Form).props('model')).toEqual(query.draft.value)
    expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('input').attributes('id'))
    if (preset === 'antdv') expect(wrapper.findComponent(Form).props('layout')).toBe('inline')
    else expect(wrapper.findComponent(Form).props('inline')).toBe(true)
    expect(wrapper.get<HTMLButtonElement>('[data-native-button="default"]').element.type).toBe(
      'button',
    )
    expect(wrapper.get<HTMLButtonElement>('[data-native-button="primary"]').element.type).toBe(
      'submit',
    )
  })

  it('supports opting into built-in rendering without calling native validation', async () => {
    const { wrapper, onSubmit, Form, validate } = mountNative({ formMode: 'builtin' })
    expect(wrapper.findComponent(Form).exists()).toBe(false)
    expect(wrapper.find('[data-query-grid]').exists()).toBe(true)
    expect(wrapper.find('[data-native-item]').exists()).toBe(false)
    await wrapper.get('input').setValue('built-in')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(validate).not.toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { keyword: 'built-in', secret: 'retained' },
      { keyword: 'built-in', secret: 'retained' },
    )
  })

  it('keeps native FormItems when switching to the configured grid layout', () => {
    const { wrapper, Form } = mountNative({ queryLayout: 'grid', layout: 'vertical', span: 12 })
    expect(wrapper.findComponent(Form).exists()).toBe(true)
    expect(wrapper.find('[data-query-inline]').exists()).toBe(false)
    expect(wrapper.find('[data-query-grid]').exists()).toBe(true)
    expect(wrapper.get('[data-query-field="keyword"]').attributes('style')).toContain('span 12')
    if (preset === 'antdv') expect(wrapper.findComponent(Form).props('layout')).toBe('vertical')
    else {
      expect(wrapper.findComponent(Form).props('inline')).toBe(false)
      expect(wrapper.findComponent(Form).props('labelPosition')).toBe('top')
    }
  })

  it('gives host form layout options precedence over the query label layout', () => {
    const { wrapper, Form } = mountNative({
      layout: 'horizontal',
      formProps: preset === 'antdv' ? { layout: 'vertical' } : { labelPosition: 'top' },
    })
    expect(wrapper.attributes('data-query-layout')).toBe('vertical')
    if (preset === 'antdv') expect(wrapper.findComponent(Form).props('layout')).toBe('vertical')
    else expect(wrapper.findComponent(Form).props('labelPosition')).toBe('top')
  })

  it('disables controls and submission through formProps.disabled and permits re-enabling', async () => {
    const { wrapper, query, Form, onSubmit, validate } = mountNative({
      formProps: { disabled: true },
    })
    expect(wrapper.findComponent(Form).props('disabled')).toBe(true)
    const input = wrapper.get('input')
    expect(input.element.disabled).toBe(true)
    expect(wrapper.findAll('button').every(({ element }) => element.disabled)).toBe(true)
    input.element.value = 'ignored'
    input.element.dispatchEvent(new Event('input', { bubbles: true }))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(query.draft.value.keyword).toBe('initial')
    expect(validate).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()

    await wrapper.setProps({ formProps: { disabled: false } })
    expect(input.element.disabled).toBe(false)
    await input.setValue('enabled')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(validate).toHaveBeenCalledExactlyOnceWith(['keyword'])
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { keyword: 'enabled', secret: 'retained' },
      { keyword: 'enabled', secret: 'retained' },
    )
  })

  it('forwards form and dynamic FormItem props while owning the draft and field name', async () => {
    const { wrapper, query, Form, FormItem } = mountNative({
      formProps: {
        class: 'host-form',
        'data-host-form': 'forwarded',
        model: { keyword: 'foreign' },
      },
      fields: [
        {
          name: 'keyword',
          formItemProps: ({ values }) => ({
            label: `Keyword: ${values.keyword}`,
            rules: [{ required: true }],
            name: 'foreign',
            prop: 'foreign',
            'data-host-item': 'forwarded',
          }),
          fieldProps: { placeholder: 'Host input' },
        },
      ],
    })
    expect(wrapper.get('form').classes()).toContain('host-form')
    expect(wrapper.get('form').attributes('data-host-form')).toBe('forwarded')
    expect(wrapper.findComponent(Form).props('model')).toEqual(query.draft.value)
    const item = wrapper.findAllComponents(FormItem)[0]
    expect(item.attributes('data-host-item')).toBe('forwarded')
    expect(item.props(preset === 'antdv' ? 'name' : 'prop')).toBe('keyword')
    expect(item.props('rules')).toEqual([{ required: true }])
    expect(wrapper.get('input').attributes('placeholder')).toBe('Host input')
    await wrapper.get('input').setValue('updated')
    expect(item.props('label')).toBe('Keyword: updated')
    expect(wrapper.findComponent(Form).props('model')).toEqual(query.draft.value)
  })

  it('blocks required-field submission and submits exactly once after native validation passes', async () => {
    const { wrapper, query, onSubmit, validate } = mountNative(
      { fields: [{ name: 'keyword', formItemProps: { rules: [{ required: true }] } }] },
      { keyword: '', secret: 'retained' },
    )
    await wrapper.get('[data-native-button="primary"]').trigger('click')
    await flushPromises()
    expect(validate).toHaveBeenCalledExactlyOnceWith(['keyword'])
    expect(onSubmit).not.toHaveBeenCalled()
    expect(query.params.value).toBeUndefined()

    await wrapper.get('input').setValue('valid')
    await wrapper.get('[data-native-button="primary"]').trigger('click')
    await flushPromises()
    expect(validate).toHaveBeenCalledTimes(2)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { keyword: 'valid', secret: 'retained' },
      { keyword: 'valid', secret: 'retained' },
    )
    expect(wrapper.emitted('submitted')).toEqual([[true]])
  })

  it('validates the native form submit used by implicit Enter exactly once', async () => {
    const { wrapper, onSubmit, validate } = mountNative()
    await wrapper.get('input').setValue('entered')
    // Browsers issue a form submit for implicit Enter; no action-button click is involved.
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(validate).toHaveBeenCalledExactlyOnceWith(['keyword'])
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { keyword: 'entered', secret: 'retained' },
      { keyword: 'entered', secret: 'retained' },
    )
  })

  it.each(['button', 'form'] as const)(
    'clears native validation and restores defaults once through the %s reset path',
    async (path) => {
      const { wrapper, query, onSubmit, validate, resetFields, clearValidate, Form } = mountNative({
        fields: [{ name: 'keyword', formItemProps: { rules: [{ required: true }] } }],
      })
      await wrapper.get('input').setValue('')
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(onSubmit).not.toHaveBeenCalled()
      await wrapper.get('input').setValue('edited')

      if (path === 'button') await wrapper.get('[data-native-button="default"]').trigger('click')
      else await wrapper.get('form').trigger('reset')
      await flushPromises()
      expect(resetFields).toHaveBeenCalledTimes(1)
      expect(clearValidate).toHaveBeenCalledTimes(1)
      expect(resetFields.mock.invocationCallOrder[0]).toBeLessThan(
        clearValidate.mock.invocationCallOrder[0],
      )
      expect(validate).toHaveBeenCalledTimes(1)
      expect(query.draft.value).toEqual({ keyword: 'initial', secret: 'retained' })
      expect(wrapper.findComponent(Form).props('model')).toEqual(query.draft.value)
      expect(wrapper.get('input').element.value).toBe('initial')
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
        { keyword: 'initial', secret: 'retained' },
        { keyword: 'initial', secret: 'retained' },
      )
      expect(wrapper.emitted('reset')).toEqual([[true]])
    },
  )

  it.each([true, false])(
    'preserves hidden draft values while preserve=%s controls their submission and registration',
    async (preserve) => {
      const { wrapper, query, onSubmit, validate, FormItem } = mountNative({
        preserve,
        fields: [
          { name: 'keyword' },
          { name: 'secret', hidden: true, formItemProps: { required: true } },
        ],
      })
      const secret = wrapper
        .findAllComponents(FormItem)
        .find((item) => item.props(preset === 'antdv' ? 'name' : 'prop') === 'secret')
      expect(!!secret).toBe(preserve)
      if (preserve)
        expect(wrapper.get('[data-query-field="secret"]').attributes()).toHaveProperty('hidden')
      await wrapper.get('input[name="keyword"]').setValue('visible')
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(validate).toHaveBeenCalledExactlyOnceWith(['keyword'])
      expect(query.draft.value.secret).toBe('retained')
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
        preserve ? { keyword: 'visible', secret: 'retained' } : { keyword: 'visible' },
        { keyword: 'visible', secret: 'retained' },
      )
    },
  )

  it('forwards native form options through the public VTableQuery wrapper', async () => {
    const { controls, Form, FormItem, validate } = nativeHost(preset)
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: '' }, onSubmit })
    const wrapper = mount(VTableQuery<{ keyword: string }>, {
      props: {
        query,
        controls,
        queryLayout: 'grid',
        formProps: { 'data-public-form': 'forwarded' },
        fields: [{ name: 'keyword', formItemProps: { rules: [{ required: true }] } }],
      },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.findComponent(Form).exists()).toBe(true)
    expect(wrapper.findAllComponents(FormItem)[0].props('rules')).toEqual([{ required: true }])
    expect(wrapper.get('form').attributes('data-public-form')).toBe('forwarded')
    await wrapper.get('input').setValue('public')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(validate).toHaveBeenCalledExactlyOnceWith(['keyword'])
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ keyword: 'public' }, { keyword: 'public' })
  })
})
