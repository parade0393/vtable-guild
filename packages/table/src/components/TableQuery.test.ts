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
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
})

describe.each(['antdv', 'element-plus'] as const)('%s query schema', (preset) => {
  it('makes search the default form action and keeps div actions out of the parent form', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const query = useTableQuery({ defaultValues: { first: '', second: '' }, onSubmit, onReset })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [{ name: 'first' }, { name: 'second' }],
        collapsedCount: 1,
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
            query: { dictionary },
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

  it('submits once per click, keeps form changes explicit and collapses independently of hidden policy', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const query = useTableQuery({
      defaultValues: { first: '', second: '', hidden: 'retain' },
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
        collapsedCount: 1,
        hiddenPolicy: 'omit',
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
      { first: 'hello', second: '' },
      { first: 'hello', second: '', hidden: 'retain' },
    )
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(onSubmit).toHaveBeenCalledOnce()
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()
    expect(onReset).toHaveBeenCalledExactlyOnceWith(
      { first: '', second: '' },
      { first: '', second: '', hidden: 'retain' },
    )
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe('query validation and light submission', () => {
  it.each([{ layout: 'form' }, { autoSubmit: false }, { disabled: true }] as const)(
    'cancels queued automatic submission when its strategy changes: %o',
    async (patch) => {
      vi.useFakeTimers()
      const onSubmit = vi.fn()
      const query = useTableQuery({ defaultValues: { keyword: '' }, onSubmit })
      const wrapper = mount(TableQuery, {
        props: {
          query,
          controls,
          fields: [{ name: 'keyword' }],
          layout: 'light',
          autoSubmit: true,
          debounceTime: 100,
        },
      })
      wrappers.push(wrapper)
      await wrapper.get('input').setValue('queued')
      await vi.advanceTimersByTimeAsync(50)
      await wrapper.setProps(patch)
      await wrapper.setProps({ layout: 'light', autoSubmit: true, disabled: false })
      await vi.advanceTimersByTimeAsync(200)
      expect(onSubmit).not.toHaveBeenCalled()
      expect(query.draft.value.keyword).toBe('queued')
      await wrapper.get('input').setValue('fresh')
      await vi.advanceTimersByTimeAsync(100)
      expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ keyword: 'fresh' }, { keyword: 'fresh' })
    },
  )

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
  it('retains default collapse behavior through the public generic bridge', async () => {
    const query = useTableQuery({ defaultValues: { first: '', second: '' } })
    const wrapper = mount(VTableQuery<{ first: string; second: string }>, {
      props: {
        query,
        controls,
        fields: [{ name: 'first' }, { name: 'second' }],
        collapsedCount: 1,
      },
      global: { plugins: [createVTableGuild()] },
    })
    wrappers.push(wrapper)
    expect(wrapper.findAll('input')).toHaveLength(1)
    const toggle = wrapper.findAll('button').find((button) => button.text() === '展开')!
    await toggle.trigger('click')
    expect(wrapper.findAll('input')).toHaveLength(2)
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

  it('coalesces light updates and reset cancels an outstanding auto submit', async () => {
    vi.useFakeTimers()
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const query = useTableQuery({ defaultValues: { keyword: '' }, onSubmit, onReset })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        controls,
        fields: [{ name: 'keyword' }],
        layout: 'light',
        autoSubmit: true,
        debounceTime: 100,
      },
    })
    wrappers.push(wrapper)
    await wrapper.get('input').setValue('a')
    await wrapper.get('input').setValue('ab')
    await vi.advanceTimersByTimeAsync(99)
    expect(onSubmit).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(onSubmit).toHaveBeenCalledOnce()
    await wrapper.get('input').setValue('next')
    await wrapper.findAll('button')[0].trigger('click')
    await vi.advanceTimersByTimeAsync(200)
    expect(onReset).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledOnce()
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
  it('ignores direct draft changes during validation and stops auto-submit after unmount', async () => {
    vi.useFakeTimers()
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
        layout: 'light',
        autoSubmit: true,
        debounceTime: 100,
      },
    })
    wrappers.push(wrapper)
    const first = (wrapper.vm as unknown as TableQueryInstance).submit()
    query.draft.value.keyword = 'direct'
    resolve(true)
    expect(await first).toBe(false)
    await wrapper.get('input').setValue('queued')
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(200)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
