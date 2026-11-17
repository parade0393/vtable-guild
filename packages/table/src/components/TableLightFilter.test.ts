import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { h } from 'vue'
import type { TableControlRenderer } from '../types/controls'
import type { TableQueryField } from '../types/query-form'
import TableLightFilter from './TableLightFilter'

const wrappers: VueWrapper[] = []
const text: TableControlRenderer = (context) =>
  h('input', {
    value: context.value,
    disabled: context.disabled || context.readonly,
    onInput: (event: Event) => context.onChange((event.target as HTMLInputElement).value),
  })
const select: TableControlRenderer = Object.assign(text.bind(null), {
  lightFilter: { submitOnChange: true, closeOnChange: false },
})

function mountFilters(
  fields: TableQueryField[],
  values: Record<string, unknown>,
  submitValues = vi.fn(async (_patch: Record<string, unknown>) => true),
) {
  const wrapper = mount(TableLightFilter, {
    attachTo: document.body,
    props: {
      fields,
      values,
      submitValues,
      locale: { more: 'More filters', confirm: 'Confirm', clear: 'Clear' },
      resolveField: (field, values, onChange) => ({
        control: {
          value: values[field.name],
          onChange,
          fieldProps: {},
          disabled: false,
          readonly: field.readonly === true,
          loading: false,
          options: [{ label: 'Inactive', value: false }],
          mode: 'query',
        },
        renderer: field.valueType === 'select' ? select : text,
      }),
    },
  })
  wrappers.push(wrapper)
  return { wrapper, submitValues }
}

function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')!
}

function edit(value: string, field: string) {
  const input = dialog().querySelector<HTMLInputElement>(
    `[data-query-popup-field="${field}"] input`,
  )!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function press(text: string) {
  const button = [...dialog().querySelectorAll('button')].find(
    (button) => button.textContent === text,
  )
  button!.click()
}

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

it('discards dismissed text edits and retries a rejected confirmation with the same value', async () => {
  const submit = vi.fn<(patch: Record<string, unknown>) => Promise<boolean>>()
  submit.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  const { wrapper } = mountFilters([{ name: 'keyword' }], { keyword: 'original' }, submit)
  const trigger = wrapper.get('[data-query-field="keyword"] button')

  await trigger.trigger('click')
  await flushPromises()
  edit('discarded', 'keyword')
  expect(submit).not.toHaveBeenCalled()
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  await flushPromises()

  await trigger.trigger('click')
  await flushPromises()
  expect(dialog().querySelector('input')?.value).toBe('original')
  edit('selected', 'keyword')
  await flushPromises()
  press('Confirm')
  await flushPromises()
  expect(trigger.attributes('aria-expanded')).toBe('true')
  press('Confirm')
  await flushPromises()
  expect(submit.mock.calls).toEqual([[{ keyword: 'selected' }], [{ keyword: 'selected' }]])
  expect(trigger.attributes('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(trigger.element)
})

it('batches secondary edits and clears only editable secondary fields while staying open', async () => {
  const { wrapper, submitValues } = mountFilters(
    [
      { name: 'normal' },
      { name: 'status', valueType: 'select', secondary: true },
      { name: 'term', secondary: true },
      { name: 'readonly', secondary: true, readonly: true },
    ],
    { normal: 'keep', readonly: 'keep' },
  )
  const more = wrapper.get('[data-query-more]')
  await more.trigger('click')
  await flushPromises()
  edit('open', 'status')
  edit('pending', 'term')
  expect(submitValues).not.toHaveBeenCalled()
  press('Confirm')
  await flushPromises()
  expect(submitValues).toHaveBeenCalledExactlyOnceWith({ status: 'open', term: 'pending' })

  await more.trigger('click')
  await flushPromises()
  press('Clear')
  await flushPromises()
  expect(submitValues).toHaveBeenLastCalledWith({ status: undefined, term: undefined })
  expect(more.attributes('aria-expanded')).toBe('true')
})

it('shows option summaries for false values and submits a standalone selection immediately', async () => {
  const { wrapper, submitValues } = mountFilters([{ name: 'status', valueType: 'select' }], {
    status: false,
  })
  const trigger = wrapper.get('[data-query-field="status"] button')
  expect(trigger.text()).toContain('Inactive')
  await trigger.trigger('click')
  await flushPromises()
  edit('open', 'status')
  await flushPromises()
  expect(submitValues).toHaveBeenCalledExactlyOnceWith({ status: 'open' })
  expect(trigger.attributes('aria-expanded')).toBe('true')
})

it('keeps trigger visibility on committed values while popup edits are staged', async () => {
  const { wrapper, submitValues } = mountFilters(
    [
      { name: 'mode', secondary: true },
      { name: 'detail', hidden: ({ values }) => values.mode !== 'show' },
      { name: 'hidden', hidden: true },
    ],
    { mode: 'hide', detail: 'original' },
  )
  expect(wrapper.find('[data-query-field="detail"]').exists()).toBe(false)
  expect(wrapper.find('[data-query-field="hidden"]').exists()).toBe(false)
  await wrapper.get('[data-query-more]').trigger('click')
  await flushPromises()
  edit('show', 'mode')
  await flushPromises()
  expect(wrapper.find('[data-query-field="detail"]').exists()).toBe(false)
  expect(submitValues).not.toHaveBeenCalled()

  press('Confirm')
  await flushPromises()
  expect(submitValues).toHaveBeenCalledExactlyOnceWith({ mode: 'show' })
  await wrapper.setProps({ values: { mode: 'show', detail: 'original' } })
  expect(wrapper.get('[data-query-field="detail"]').text()).toContain('original')
  expect(wrapper.find('[data-query-field="hidden"]').exists()).toBe(false)
})

it('keeps confirmation available when a staged edit hides the last popup field', async () => {
  const { wrapper, submitValues } = mountFilters(
    [{ name: 'mode', secondary: true, hidden: ({ values }) => values.mode === 'hide' }],
    { mode: 'show' },
  )
  await wrapper.get('[data-query-more]').trigger('click')
  await flushPromises()
  edit('hide', 'mode')
  await flushPromises()
  expect(dialog().querySelector('[data-query-popup-field="mode"]')).toBeNull()
  expect(wrapper.get('[data-query-more]').attributes('aria-expanded')).toBe('true')
  press('Confirm')
  await flushPromises()
  expect(submitValues).toHaveBeenCalledExactlyOnceWith({ mode: 'hide' })
})
