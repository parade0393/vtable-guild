import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTimePicker,
} from 'element-plus'
import { DatePicker, Input, InputNumber, Select, TimePicker } from 'ant-design-vue'
import {
  createAntdvTableControls,
  createElementPlusTableControls,
  createVTableGuild,
  useTableQuery,
  VTableQuery,
} from '@vtable-guild/vtable-guild'

const wrappers: VueWrapper[] = []
const controls = createElementPlusTableControls({
  Input: ElInput,
  Select: ElSelect,
  Option: ElOption,
  InputNumber: ElInputNumber,
  DatePicker: ElDatePicker,
  TimePicker: ElTimePicker,
})

afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

function mountTimeFilter() {
  const onSubmit = vi.fn()
  const query = useTableQuery({ defaultValues: { time: '10:20:30' }, onSubmit })
  const wrapper = mount(VTableQuery<{ time: string }>, {
    attachTo: document.body,
    props: {
      query,
      controls,
      fields: [{ name: 'time', label: 'Time', valueType: 'time' }],
      layoutType: 'LightFilter',
      locale: { confirm: 'Apply filter' },
    },
    global: { plugins: [createVTableGuild({ themePreset: 'element-plus' })] },
  })
  wrappers.push(wrapper)
  return { wrapper, query, onSubmit }
}

function dialog() {
  return document.body.querySelector<HTMLElement>('.vtg-light-filter__popup[role="dialog"]')!
}

async function openTimeFilter(wrapper: VueWrapper) {
  await wrapper.get('[data-query-field="time"] .vtg-light-filter__trigger').trigger('click')
  await flushPromises()
  await vi.waitFor(() =>
    expect(dialog()?.querySelectorAll('.el-time-spinner__list')).toHaveLength(3),
  )
}

async function pickTimePart(part: number, value: string) {
  const list = dialog().querySelectorAll('.el-time-spinner__list')[part]!
  const item = [...list.querySelectorAll<HTMLElement>('li')].find(
    (element) => element.textContent?.trim() === value,
  )!
  expect(item).toBeDefined()
  item.click()
  await flushPromises()
}

describe('native Element Plus LightFilter time control', () => {
  it('keeps hour, minute and second edits local until the complete time is confirmed', async () => {
    const { wrapper, query, onSubmit } = mountTimeFilter()
    await openTimeFilter(wrapper)

    await pickTimePart(0, '11')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(wrapper.get('.vtg-light-filter__trigger').attributes('aria-expanded')).toBe('true')
    expect(query.draft.value.time).toBe('10:20:30')

    await pickTimePart(1, '21')
    await pickTimePart(2, '31')
    expect(dialog().querySelector<HTMLInputElement>('input')?.value).toBe('11:21:31')
    expect(onSubmit).not.toHaveBeenCalled()

    const apply = [
      ...dialog().querySelectorAll<HTMLButtonElement>('.vtg-light-filter__footer button'),
    ].find((button) => button.textContent?.trim() === 'Apply filter')!
    apply.click()
    await flushPromises()

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ time: '11:21:31' }, { time: '11:21:31' })
    expect(query.draft.value.time).toBe('11:21:31')
    expect(wrapper.get('.vtg-light-filter__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('discards an intermediate time when the enclosing filter is dismissed', async () => {
    const { wrapper, query, onSubmit } = mountTimeFilter()
    await openTimeFilter(wrapper)
    await pickTimePart(0, '11')
    expect(onSubmit).not.toHaveBeenCalled()

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.get('.vtg-light-filter__trigger').attributes('aria-expanded')).toBe('false')
    expect(query.draft.value.time).toBe('10:20:30')
    expect(onSubmit).not.toHaveBeenCalled()

    await openTimeFilter(wrapper)
    expect(dialog().querySelector<HTMLInputElement>('input')?.value).toBe('10:20:30')
  })
})

it('keeps native Ant Design Vue tags open for successive known option selections', async () => {
  const onSubmit = vi.fn()
  const query = useTableQuery({ defaultValues: { tags: ['first'] }, onSubmit })
  const wrapper = mount(VTableQuery<{ tags: string[] }>, {
    attachTo: document.body,
    props: {
      query,
      controls: createAntdvTableControls({
        Input,
        Select,
        InputNumber,
        DatePicker,
        RangePicker: DatePicker.RangePicker,
        TimePicker,
      }),
      fields: [
        {
          name: 'tags',
          label: 'Tags',
          valueType: 'select',
          fieldProps: { mode: 'tags' },
          options: [
            { value: 'first', label: 'First' },
            { value: 'second', label: 'Second' },
            { value: 'third', label: 'Third' },
          ],
        },
      ],
      layoutType: 'LightFilter',
    },
    global: { plugins: [createVTableGuild()] },
  })
  wrappers.push(wrapper)
  const trigger = wrapper.get('.vtg-light-filter__trigger')
  await trigger.trigger('click')
  await flushPromises()

  async function choose(label: string) {
    const option = await vi.waitFor(() => {
      const option = [...dialog().querySelectorAll<HTMLElement>('.ant-select-item-option')].find(
        (element) =>
          element.querySelector('.ant-select-item-option-content')?.textContent === label,
      )
      expect(option).toBeDefined()
      return option!
    })
    option.click()
    await flushPromises()
  }

  await choose('Second')
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
    { tags: ['first', 'second'] },
    { tags: ['first', 'second'] },
  )
  expect(trigger.attributes('aria-expanded')).toBe('true')

  await choose('Third')
  expect(onSubmit).toHaveBeenCalledTimes(2)
  expect(onSubmit).toHaveBeenLastCalledWith(
    { tags: ['first', 'second', 'third'] },
    { tags: ['first', 'second', 'third'] },
  )
  expect(trigger.attributes('aria-expanded')).toBe('true')
})
