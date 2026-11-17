import { effectScope, h, nextTick, ref, watch } from 'vue'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import TableQuery from './TableQuery'
import VTableQuery from './VTableQuery.vue'
import { useTableQuery } from '../composables/useTableQuery'
import type { TableControls } from '../types/controls'
import type { TableQueryInstance } from '../types/query-form'
import { createTableDictionary, useTableDictionary } from '../composables/useTableDictionary'
import { deriveTableQueryFields } from '../utils/queryFields'

const wrappers: VueWrapper[] = []
const controls: TableControls = {
  text: (context) =>
    h('input', {
      id: context.id,
      value: context.value,
      disabled: context.disabled,
      readonly: context.readonly,
      onInput: (event: Event) => context.onChange((event.target as HTMLInputElement).value),
    }),
}
function editPopupField(name: string, value: string) {
  const input = document.body.querySelector<HTMLInputElement>(
    `[role="dialog"] [data-query-popup-field="${name}"] input`,
  )!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
function confirmPopup() {
  Array.from(document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
    .find((button) => button.textContent === 'Confirm')!
    .click()
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe.each(['antdv', 'element-plus'] as const)('%s query schema', (preset) => {
  function mountDependentFilter(mode: string, preserve = true) {
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { mode, detail: 'original' }, onSubmit })
    const wrapper = mount(TableQuery, {
      attachTo: document.body,
      props: {
        query,
        controls,
        layoutType: 'LightFilter',
        preserve,
        fields: [
          { name: 'mode', secondary: true },
          { name: 'detail', secondary: true, hidden: ({ values }) => values.mode !== 'show' },
        ],
      },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    return { wrapper, query, onSubmit }
  }

  it('reveals, edits and submits a dependent LightFilter field in one confirmation', async () => {
    const { wrapper, query, onSubmit } = mountDependentFilter('hide')
    await wrapper.get('[data-query-more]').trigger('click')
    await flushPromises()
    expect(document.body.querySelector('[data-query-popup-field="detail"]')).toBeNull()

    editPopupField('mode', 'show')
    await flushPromises()
    expect(document.body.querySelector('[data-query-popup-field="detail"]')).not.toBeNull()
    editPopupField('detail', 'edited')
    await flushPromises()
    expect(query.draft.value).toEqual({ mode: 'hide', detail: 'original' })
    expect(onSubmit).not.toHaveBeenCalled()

    confirmPopup()
    await flushPromises()
    expect(query.draft.value).toEqual({ mode: 'show', detail: 'edited' })
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { mode: 'show', detail: 'edited' },
      { mode: 'show', detail: 'edited' },
    )
  })

  it('restores dependent LightFilter visibility and draft when staged edits are dismissed', async () => {
    const { wrapper, query, onSubmit } = mountDependentFilter('show')
    const more = wrapper.get('[data-query-more]')
    await more.trigger('click')
    await flushPromises()
    editPopupField('detail', 'discarded')
    editPopupField('mode', 'hide')
    await flushPromises()
    expect(document.body.querySelector('[data-query-popup-field="detail"]')).toBeNull()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flushPromises()

    await more.trigger('click')
    await flushPromises()
    expect(
      document.body.querySelector<HTMLInputElement>('[data-query-popup-field="detail"] input')
        ?.value,
    ).toBe('original')
    expect(query.draft.value).toEqual({ mode: 'show', detail: 'original' })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each([true, false])(
    'retains staged edits of newly hidden fields while preserve=%s controls request omission',
    async (preserve) => {
      const { wrapper, query, onSubmit } = mountDependentFilter('show', preserve)
      await wrapper.get('[data-query-more]').trigger('click')
      await flushPromises()
      editPopupField('detail', 'edited')
      editPopupField('mode', 'hide')
      await flushPromises()
      expect(document.body.querySelector('[data-query-popup-field="detail"]')).toBeNull()

      confirmPopup()
      await flushPromises()
      expect(query.draft.value).toEqual({ mode: 'hide', detail: 'edited' })
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
        preserve ? { mode: 'hide', detail: 'edited' } : { mode: 'hide' },
        { mode: 'hide', detail: 'edited' },
      )
    },
  )

  it('retains a self-hiding popup edit when validation fails and permits confirmation retry', async () => {
    const onSubmit = vi.fn()
    const validate = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    const query = useTableQuery({ defaultValues: { mode: 'show' }, onSubmit })
    const wrapper = mount(TableQuery, {
      attachTo: document.body,
      props: {
        query,
        controls,
        layoutType: 'LightFilter',
        validate,
        fields: [{ name: 'mode', secondary: true, hidden: ({ values }) => values.mode === 'hide' }],
      },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    await wrapper.get('[data-query-more]').trigger('click')
    await flushPromises()
    editPopupField('mode', 'hide')
    await flushPromises()

    confirmPopup()
    await flushPromises()
    expect(query.draft.value.mode).toBe('show')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.get('[data-query-more]').attributes('aria-expanded')).toBe('true')
    expect(document.body.querySelector('[data-query-popup-field="mode"]')).toBeNull()

    confirmPopup()
    await flushPromises()
    expect(validate).toHaveBeenCalledTimes(2)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ mode: 'hide' }, { mode: 'hide' })
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  it('falls back to text for unregistered keys, including inherited object names', () => {
    const query = useTableQuery({ defaultValues: { keyword: '', legacy: '' } })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [
          { name: 'keyword', valueType: 'dateRange' },
          { name: 'legacy', valueType: '__proto__' },
        ],
      },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.findAll('[data-query-value-type="text"] input')).toHaveLength(2)
  })

  it('defaults to QueryFilter and derives form fields from the column schema', async () => {
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: '' }, onSubmit })
    const wrapper = mount(VTableQuery<{ keyword: string }>, {
      props: {
        query,
        controls,
        columns: [{ dataIndex: 'keyword', title: 'Keyword', search: { order: 1 } }],
      },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.attributes('data-query-layout-type')).toBe('QueryFilter')
    expect(wrapper.get('label').text()).toBe('Keyword')
    await wrapper.get('input').setValue('changed')
    expect(onSubmit).not.toHaveBeenCalled()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ keyword: 'changed' }, { keyword: 'changed' })
  })

  it('makes search the default form action and keeps div actions out of the parent form', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const query = useTableQuery({ defaultValues: { first: '', second: '' }, onSubmit, onReset })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [{ name: 'first' }, { name: 'second' }],
        span: 12,
      },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('Search this')
    const buttons = wrapper.findAll('button')
    expect(buttons.map(({ element }) => element.type)).toEqual(['button', 'submit', 'button'])
    // Browsers activate the first native submit button for implicit Enter submission.
    buttons.find(({ element }) => element.type === 'submit')!.element.click()
    await flushPromises()
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { first: 'Search this', second: '' },
      { first: 'Search this', second: '' },
    )
    expect(onReset).not.toHaveBeenCalled()
    expect(query.draft.value.first).toBe('Search this')

    await wrapper.setProps({ rootTag: 'div' })
    expect(wrapper.findAll('button').every(({ element }) => element.type === 'button')).toBe(true)
    await wrapper.findAll('button')[1].trigger('click')
    await flushPromises()
    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(onReset).not.toHaveBeenCalled()
  })

  it('uses remote search candidates when deriving fields from columns with cached labels', async () => {
    const scope = effectScope()
    const dictionary = scope.run(() =>
      useTableDictionary({
        dictionary: createTableDictionary({
          key: 'derived-status',
          request: async (_params, { keyword }) => ({
            options: keyword
              ? [{ value: 2, label: 'Two' }]
              : [
                  { value: 1, label: 'One' },
                  { value: 2, label: 'Two' },
                  { value: 3, label: 'Three' },
                ],
            complete: keyword === '',
          }),
        }),
      }),
    )!
    try {
      await flushPromises()
      const fields = () =>
        deriveTableQueryFields<Record<string, unknown>>([
          {
            dataIndex: 'status',
            valueEnum: dictionary.valueEnum.value,
            search: { dictionary },
          },
        ])
      const query = useTableQuery({ defaultValues: { status: 1 } })
      const render = vi.fn((context) =>
        h('span', context.options.map((option: { label: string }) => option.label).join(',')),
      )
      const wrapper = mount(TableQuery, {
        props: { query, fields: fields(), controls: { select: render } },
        global: { plugins: [createVTableGuild({ themePreset: preset })] },
      })
      wrappers.push(wrapper)
      await dictionary.search('two')
      await wrapper.setProps({ fields: fields() })
      expect(render.mock.lastCall?.[0].options).toEqual([
        { value: 2, label: 'Two' },
        { value: 1, label: 'One', status: undefined },
      ])
    } finally {
      scope.stop()
    }
  })

  it('omits hidden and folded values when preserve is false', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const query = useTableQuery({
      defaultValues: { first: '', second: 'folded', hidden: 'retain' },
      onSubmit,
      onReset,
    })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [
          { name: 'first', label: 'First' },
          { name: 'second' },
          { name: 'hidden', hidden: true },
        ],
        span: 12,
        preserve: false,
      },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.findAll('input')).toHaveLength(1)
    await wrapper.get('input').setValue('hello')
    expect(onSubmit).not.toHaveBeenCalled()
    await wrapper.findAll('button')[1].trigger('click')
    await flushPromises()
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { first: 'hello' },
      { first: 'hello', second: 'folded', hidden: 'retain' },
    )
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(onSubmit).toHaveBeenCalledOnce()
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()
    expect(onReset).toHaveBeenCalledExactlyOnceWith(
      { first: '', second: 'folded' },
      { first: '', second: 'folded', hidden: 'retain' },
    )
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('commits a staged LightFilter patch through the shared validation and transform pipeline', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const validate = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    const query = useTableQuery<{ keyword: string }, { term: string }>({
      defaultValues: { keyword: '' },
      fieldTransforms: { keyword: (value) => ({ term: value.trim() }) },
      onSubmit,
      onReset,
    })
    const wrapper = mount(VTableQuery<{ keyword: string }, { term: string }>, {
      attachTo: document.body,
      props: {
        query,
        controls,
        fields: [{ name: 'keyword' }],
        layoutType: 'LightFilter',
        collapse: true,
        validate,
      },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.find('[data-query-more] svg').exists()).toBe(true)
    await wrapper.get('[data-query-more]').trigger('click')
    await flushPromises()
    const popup = document.body.querySelector('[role="dialog"]')!
    const input = popup.querySelector('input')!
    input.value = ' changed '
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(query.draft.value.keyword).toBe('')
    expect(onSubmit).not.toHaveBeenCalled()
    const confirm = Array.from(popup.querySelectorAll('button')).find(
      (button) => button.textContent === 'Confirm',
    )!
    confirm.click()
    await flushPromises()
    expect(query.draft.value.keyword).toBe('')
    expect(input.value).toBe(' changed ')
    expect(onSubmit).not.toHaveBeenCalled()
    confirm.click()
    await flushPromises()
    expect(validate).toHaveBeenCalledTimes(2)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ term: 'changed' }, { keyword: ' changed ' })
    expect(onReset).not.toHaveBeenCalled()
    expect(wrapper.emitted('submitted')).toEqual([[true]])
  })
})

describe('query validation and collapse state', () => {
  it('flushes a reset model to the wrapping host form before validating it', async () => {
    const onReset = vi.fn()
    const query = useTableQuery({ defaultValues: { first: '' }, onReset })
    const seen = ref('')
    const stop = watch(query.draft, (value) => {
      seen.value = value.first
    })
    const validate = vi.fn(() => seen.value !== 'invalid')
    const wrapper = mount(TableQuery, {
      props: { query, controls, fields: [{ name: 'first' }], validate },
      global: { plugins: [createVTableGuild()] },
    })
    wrappers.push(wrapper)
    query.draft.value = { first: 'invalid' }
    await nextTick()
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()
    expect(validate).toHaveReturnedWith(true)
    expect(onReset).toHaveBeenCalledExactlyOnceWith({ first: '' }, { first: '' })
    stop()
  })
  it('preserves collapsed fields and emits controlled changes through the public component', async () => {
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { first: '', second: 'saved' }, onSubmit })
    const wrapper = mount(VTableQuery<{ first: string; second: string }>, {
      props: {
        query,
        controls,
        fields: [{ name: 'first' }, { name: 'second' }],
        span: 12,
        showHiddenNum: true,
      },
      global: { plugins: [createVTableGuild()] },
    })
    wrappers.push(wrapper)
    expect(wrapper.findAll('[data-query-field]:not([hidden])')).toHaveLength(1)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(onSubmit.mock.calls[0][0]).toEqual({ first: '', second: 'saved' })
    await wrapper.setProps({ collapsed: true })
    const toggle = wrapper.findAll('button').find((button) => button.text() === '展开 (1)')!
    await toggle.trigger('click')
    expect(wrapper.emitted('update:collapsed')).toEqual([[false]])
    expect(wrapper.findAll('[data-query-field]:not([hidden])')).toHaveLength(1)
    await wrapper.setProps({ collapsed: false })
    expect(wrapper.findAll('[data-query-field]:not([hidden])')).toHaveLength(2)
  })
  it('uses field overrides and preserves selected dictionary labels across partial searches', async () => {
    const scope = effectScope()
    const dictionary = scope.run(() =>
      useTableDictionary({
        dictionary: createTableDictionary({
          key: 'status',
          request: async (_params, { keyword }) => ({
            options: keyword ? [{ value: 2, label: 'Two' }] : [{ value: 1, label: 'One' }],
            complete: keyword === '',
          }),
        }),
      }),
    )!
    await flushPromises()
    const query = useTableQuery({ defaultValues: { status: 1 } })
    const readOnly = ref(false)
    const rendered = vi.fn((context) =>
      h('span', context.options.map((option: { label: string }) => option.label).join(',')),
    )
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls: { select: rendered },
        fields: [
          { name: 'status', valueType: 'select', dictionary, readonly: () => readOnly.value },
        ],
      },
    })
    wrappers.push(wrapper)
    await dictionary.search('two')
    await nextTick()
    expect(wrapper.text()).toContain('Two,One')
    expect(rendered.mock.lastCall?.[0].onSearch).toBeTypeOf('function')
    readOnly.value = true
    await nextTick()
    rendered.mock.lastCall?.[0].onChange(2)
    expect(query.draft.value.status).toBe(1)
    scope.stop()
  })

  it('lets custom field/actions slots own the controls and uses English feedback', async () => {
    const query = useTableQuery({ defaultValues: { keyword: '' } })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [{ name: 'keyword' }],
        validate: () => false,
        ui: { root: 'custom-query' },
      },
      slots: {
        field: ({ control }) =>
          h('textarea', {
            value: control.value,
            onInput: (event: Event) =>
              control.onChange((event.target as HTMLTextAreaElement).value),
          }),
        actions: ({ submit }) => h('button', { type: 'button', onClick: submit }, 'Go'),
      },
      global: { plugins: [createVTableGuild({ locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.classes().join(' ')).toContain('custom-query')
    expect(wrapper.find('input').exists()).toBe(false)
    await wrapper.get('textarea').setValue('custom')
    expect(query.draft.value.keyword).toBe('custom')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Check query conditions')
  })

  it('validates once before submission, shares repeated actions and rejects obsolete validation', async () => {
    let resolve!: (valid: boolean) => void
    const validate = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((done) => {
            resolve = done
          }),
      )
      .mockResolvedValue(true)
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: '' }, onSubmit })
    const wrapper = mount(TableQuery, {
      props: { query, controls, fields: [{ name: 'keyword' }], validate },
    })
    wrappers.push(wrapper)
    const instance = wrapper.vm as unknown as TableQueryInstance
    const first = instance.submit()
    const same = instance.submit()
    expect(first).toBe(same)
    expect(validate).toHaveBeenCalledOnce()
    await wrapper.get('input').setValue('new')
    expect(validate.mock.calls[0][1].signal.aborted).toBe(true)
    resolve(true)
    expect(await first).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(await instance.submit()).toBe(true)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ keyword: 'new' }, { keyword: 'new' })
  })
  it('blocks failed or thrown validation, retains draft and permits retry', async () => {
    const validate = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Host error'))
      .mockResolvedValue(true)
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: 'keep' }, onSubmit })
    const wrapper = mount(TableQuery, {
      props: { query, controls, fields: [{ name: 'keyword' }], validate },
    })
    wrappers.push(wrapper)
    const instance = wrapper.vm as unknown as TableQueryInstance
    expect(await instance.submit()).toBe(false)
    await nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('请检查')
    expect(await instance.submit()).toBe(false)
    await nextTick()
    expect(wrapper.get('[role="alert"]').text()).toBe('Host error')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(query.draft.value.keyword).toBe('keep')
    expect(await instance.submit()).toBe(true)
    expect(onSubmit).toHaveBeenCalledOnce()
  })
  it('ignores direct draft changes and invalidates pending validation on unmount', async () => {
    let resolve!: (valid: boolean) => void
    const onSubmit = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: '' }, onSubmit })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [{ name: 'keyword' }],
        validate: () =>
          new Promise<boolean>((done) => {
            resolve = done
          }),
      },
    })
    wrappers.push(wrapper)
    const first = (wrapper.vm as unknown as TableQueryInstance).submit()
    query.draft.value.keyword = 'direct'
    resolve(true)
    expect(await first).toBe(false)
    const second = (wrapper.vm as unknown as TableQueryInstance).submit()
    wrapper.unmount()
    resolve(true)
    expect(await second).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
