import { DOMWrapper, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild, type VTableGuildOptions } from '@vtable-guild/core'
import { resolveColumnSettingsThemePreset } from '@vtable-guild/theme'
import VTableColumnSettings from './VTableColumnSettings.vue'
import { EXPAND_COLUMN, SELECTION_COLUMN } from '../constants'
import type { ColumnsType, ColumnGroupType, ColumnType } from '../types'

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

function columns(): ColumnsType {
  return [
    SELECTION_COLUMN,
    { key: 'name', title: 'Name', dataIndex: 'name', sorter: true, width: 120 },
    {
      key: 'contact',
      title: 'Contact',
      children: [
        { key: 'city', title: 'City', dataIndex: 'city' },
        { key: 'email', title: 'Email', dataIndex: 'email', visible: false },
      ],
    },
    EXPAND_COLUMN,
  ]
}
function popup() {
  return new DOMWrapper(document.querySelector<HTMLElement>('[role="dialog"], [role="menu"]')!)
}
function settingsTrigger(wrapper: VueWrapper) {
  return wrapper.get('button[aria-haspopup="dialog"]')
}
function densityTrigger(wrapper: VueWrapper) {
  return wrapper.get('button[aria-haspopup="menu"]')
}
function checkbox(label: string) {
  return popup()
    .findAll('label')
    .find((item) => item.text() === label)!
    .get('input')
}
function button(label: string) {
  return popup()
    .findAll('button')
    .find((item) => item.text() === label)!
}
function create(themePreset: 'antdv' | 'element-plus', options: VTableGuildOptions = {}) {
  const wrapper = mount(VTableColumnSettings, {
    attachTo: document.body,
    props: { columns: columns(), size: 'middle' },
    global: { plugins: [createVTableGuild({ themePreset, locale: 'en-US', ...options })] },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe.each(['antdv', 'element-plus'] as const)('%s column settings', (preset) => {
  it('emits immutable controlled changes without replacing unrelated columns or sentinels', async () => {
    const wrapper = create(preset)
    const original = wrapper.props('columns')
    await settingsTrigger(wrapper).trigger('click')
    await checkbox('Name').setValue(false)
    const next = wrapper.emitted('update:columns')![0]![0] as ColumnsType
    expect((original[1] as ColumnType).visible).toBeUndefined()
    expect((checkbox('Name').element as HTMLInputElement).checked).toBe(true)
    expect(next[0]).toBe(SELECTION_COLUMN)
    expect(next[3]).toBe(EXPAND_COLUMN)
    expect(next[2]).toBe(original[2])
    expect(next[1]).toMatchObject({ visible: false, sorter: true, width: 120 })
    expect(wrapper.emitted('update:columns')).toHaveLength(1)
    await wrapper.setProps({ columns: next })
    expect((checkbox('Name').element as HTMLInputElement).checked).toBe(false)
  })

  it('preserves nested visibility while hiding a group and resets columns independently of density', async () => {
    const wrapper = create(preset)
    await settingsTrigger(wrapper).trigger('click')
    await checkbox('Contact').setValue(false)
    const hidden = wrapper.emitted('update:columns')![0]![0] as ColumnsType
    await wrapper.setProps({ columns: hidden })
    expect(checkbox('City').attributes('disabled')).toBeDefined()
    expect((hidden[2] as ColumnGroupType).children[1]!.visible).toBe(false)
    const modified = hidden.map((column) =>
      typeof column !== 'symbol' && column.key === 'name'
        ? { ...column, width: 240, sortOrder: 'descend' as const }
        : column,
    )
    await wrapper.setProps({ columns: modified, size: 'small' })
    await button('Reset').trigger('click')
    const restored = wrapper.emitted('update:columns')!.at(-1)![0] as ColumnsType
    expect(restored[1]).toMatchObject({ width: 240, sortOrder: 'descend' })
    expect((restored[2] as ColumnGroupType).visible).toBeUndefined()
    expect((restored[2] as ColumnGroupType).children[1]!.visible).toBe(false)
    expect(wrapper.emitted('update:size')).toBeUndefined()
    expect(wrapper.emitted('reset')).toEqual([[]])
  })

  it('retains defaults through reordering and captures newly introduced column defaults', async () => {
    const wrapper = create(preset)
    const first = wrapper.props('columns')
    await wrapper.setProps({ columns: [{ key: 'new', title: 'New', visible: false }, ...first] })
    await wrapper.setProps({
      columns: [
        first[2]!,
        { ...(first[1] as ColumnType), visible: false },
        { key: 'new', title: 'New', visible: true },
      ],
    })
    await settingsTrigger(wrapper).trigger('click')
    await button('Reset').trigger('click')
    const result = wrapper.emitted('update:columns')![0]![0] as ColumnType[]
    expect(result.map((column) => column.key)).toEqual(['contact', 'name', 'new'])
    expect(result[1]!.visible).toBeUndefined()
    expect(result[2]!.visible).toBe(false)
  })

  it('keeps size controlled and suppresses clicks on the selected density', async () => {
    const wrapper = create(preset)
    await densityTrigger(wrapper).trigger('click')
    await button('Middle').trigger('click')
    expect(wrapper.emitted('update:size')).toBeUndefined()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    await densityTrigger(wrapper).trigger('click')
    await button('Compact').trigger('click')
    expect(wrapper.emitted('update:size')).toEqual([['small']])
    await densityTrigger(wrapper).trigger('click')
    expect(button('Middle').attributes('aria-checked')).toBe('true')
    await wrapper.setProps({ size: 'small' })
    expect(button('Compact').attributes('aria-checked')).toBe('true')
  })

  it('moves focus into the popup, closes on Escape, outside focus and disabling', async () => {
    const wrapper = create(preset)
    const trigger = settingsTrigger(wrapper)
    await trigger.trigger('click')
    expect(document.activeElement).toBe(checkbox('Column display').element)
    await popup().trigger('keydown', { key: 'Escape' })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
    await trigger.trigger('click')
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    await nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    await wrapper.setProps({ disabled: true })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(trigger.attributes('disabled')).toBeDefined()
  })

  it('supports custom popup containers, theme overrides, legacy locales and label slots', async () => {
    const target = document.createElement('div')
    document.body.append(target)
    const wrapper = create(preset, {
      classPrefix: 'app',
      locale: 'custom',
      localeOverrides: { columnSettings: { title: 'Preferences' } },
      theme: { columnSettings: { slots: { popup: 'global-popup' } } },
    })
    await wrapper.setProps({
      getPopupContainer: () => target,
      ui: { popup: 'local-popup' },
      locale: { reset: 'Restore' },
    })
    await settingsTrigger(wrapper).trigger('click')
    expect(target.querySelector('[role="dialog"]')).not.toBeNull()
    expect(popup().classes()).toEqual(expect.arrayContaining(['global-popup', 'local-popup']))
    expect(
      wrapper
        .get('button[aria-haspopup="dialog"]')
        .classes()
        .some((name) => name.startsWith('app-')),
    ).toBe(true)
    expect(popup().attributes('data-vtg-preset')).toBe(preset)
    expect(popup().attributes('aria-label')).toBe('Preferences')
    expect(popup().text()).toContain('Restore')
    expect(densityTrigger(wrapper).attributes('aria-label')).toBe('表格密度')
  })

  it('handles empty columns and updates instance labels while open', async () => {
    const options: VTableGuildOptions = { themePreset: preset, locale: 'en-US' }
    const wrapper = mount(VTableColumnSettings, {
      attachTo: document.body,
      props: { columns: [] },
      global: { plugins: [createVTableGuild(options)] },
    })
    wrappers.push(wrapper)
    await settingsTrigger(wrapper).trigger('click')
    expect(popup().text()).toContain('No configurable columns')
    await wrapper.setProps({ locale: { empty: 'Nothing here' } })
    expect(popup().text()).toContain('Nothing here')
  })

  it('uses the table preset density when size is omitted', async () => {
    const wrapper = create(preset)
    await wrapper.setProps({ size: undefined })
    await densityTrigger(wrapper).trigger('click')
    expect(button(preset === 'antdv' ? 'Larger' : 'Middle').attributes('aria-checked')).toBe('true')
  })

  it('honors the global table density and lets Tab leave the last control', async () => {
    const wrapper = create(preset, { theme: { table: { defaultVariants: { size: 'small' } } } })
    await wrapper.setProps({ size: undefined })
    await densityTrigger(wrapper).trigger('click')
    expect(button('Compact').attributes('aria-checked')).toBe('true')
    await settingsTrigger(wrapper).trigger('click')
    await checkbox('Email').trigger('keydown', { key: 'Tab' })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(settingsTrigger(wrapper).element)
  })

  it('selects and clears all columns with a controlled indeterminate header', async () => {
    const wrapper = create(preset)
    await settingsTrigger(wrapper).trigger('click')
    const all = checkbox('Column display')
    expect((all.element as HTMLInputElement).indeterminate).toBe(true)
    await all.setValue(true)
    expect((all.element as HTMLInputElement).checked).toBe(false)
    const selected = wrapper.emitted('update:columns')![0]![0] as ColumnsType
    expect(selected[0]).toBe(SELECTION_COLUMN)
    expect((selected[2] as ColumnGroupType).children[1]!.visible).toBe(true)
    await wrapper.setProps({ columns: selected })
    expect((all.element as HTMLInputElement).indeterminate).toBe(false)
    expect((all.element as HTMLInputElement).checked).toBe(true)
    await all.setValue(false)
    const cleared = wrapper.emitted('update:columns')!.at(-1)![0] as ColumnsType
    await wrapper.setProps({ columns: cleared })
    expect((all.element as HTMLInputElement).checked).toBe(false)
    expect((all.element as HTMLInputElement).indeterminate).toBe(false)
    expect((cleared[2] as ColumnGroupType).children.every((column) => !column.visible)).toBe(true)
    expect(wrapper.props('size')).toBe('middle')
  })

  it('switches overlays and navigates the density menu with the keyboard', async () => {
    const wrapper = create(preset)
    await settingsTrigger(wrapper).trigger('click')
    await densityTrigger(wrapper).trigger('click')
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(button('Middle').element)
    await button('Middle').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(button('Compact').element)
    await button('Compact').trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(button('Larger').element)
    await button('Larger').trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(button('Compact').element)
    await button('Compact').trigger('keydown', { key: 'Escape' })
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(densityTrigger(wrapper).element)
  })

  it('keeps hidden settings and locked descendants out of bulk visibility changes', async () => {
    const wrapper = create(preset)
    await wrapper.setProps({
      columns: [
        { key: 'hidden', title: 'Internal', hideInSetting: true },
        { key: 'name', title: 'Name', disable: { checkbox: true } },
        {
          key: 'group',
          title: 'Group',
          children: [
            { key: 'required', title: 'Required', disable: true },
            { key: 'optional', title: 'Optional' },
          ],
        },
      ],
    })
    await settingsTrigger(wrapper).trigger('click')
    expect(popup().text()).not.toContain('Internal')
    expect(checkbox('Name').attributes('disabled')).toBeDefined()
    expect(checkbox('Group').attributes('disabled')).toBeDefined()
    await checkbox('Column display').setValue(false)
    const next = wrapper.emitted('update:columns')!.at(-1)![0] as ColumnType[]
    expect(next[0]!.visible).toBeUndefined()
    expect(next[1]!.visible).toBeUndefined()
    const group = next[2] as ColumnGroupType
    expect(group.visible).toBeUndefined()
    expect(group.children[0]!.visible).toBeUndefined()
    expect(group.children[1]!.visible).toBe(false)
  })

  it('pins a top-level group through controlled updates and keeps visibility reset independent', async () => {
    const wrapper = create(preset)
    await settingsTrigger(wrapper).trigger('click')
    const pin = popup().get('button[aria-label="Contact: Pin left"]')
    await pin.trigger('click')
    const next = wrapper.emitted('update:columns')!.at(-1)![0] as ColumnsType
    expect((wrapper.props('columns')[1] as ColumnType).key).toBe('name')
    expect((next[1] as ColumnGroupType).key).toBe('contact')
    expect((next[1] as ColumnGroupType).children.every((column) => column.fixed === 'left')).toBe(
      true,
    )
    await wrapper.setProps({ columns: next })
    expect(popup().get('button[aria-label="Contact: Pin left"]').attributes('aria-pressed')).toBe(
      'true',
    )
    await button('Reset').trigger('click')
    const reset = wrapper.emitted('update:columns')!.at(-1)![0] as ColumnsType
    expect((reset[1] as ColumnGroupType).children.every((column) => column.fixed === 'left')).toBe(
      true,
    )
    expect((reset[1] as ColumnGroupType).children[1]!.visible).toBe(false)
  })

  it('drags whole top-level groups without accepting cross-group or locked moves', async () => {
    const wrapper = create(preset)
    await settingsTrigger(wrapper).trigger('click')
    const items = popup().findAll('[data-column-setting]')
    const source = items.find((item) => item.get('label').text() === 'Contact')!
    const target = items.find((item) => item.get('label').text() === 'Name')!
    const transfer = { setData: vi.fn(), effectAllowed: '' }
    await source.get('[draggable="true"]').trigger('dragstart', { dataTransfer: transfer })
    await target.trigger('drop')
    const next = wrapper.emitted('update:columns')!.at(-1)![0] as ColumnsType
    expect(next[0]).toBe(SELECTION_COLUMN)
    expect((next[1] as ColumnType).key).toBe('contact')
    expect((next[2] as ColumnType).key).toBe('name')
    expect(next[3]).toBe(EXPAND_COLUMN)
    expect((next[1] as ColumnGroupType).children.map((column) => column.key)).toEqual([
      'city',
      'email',
    ])
    expect(transfer.setData).toHaveBeenCalled()
    await wrapper.setProps({ options: { fixed: false, draggable: false } })
    expect(popup().find('[data-column-pin]').exists()).toBe(false)
    expect(popup().find('[draggable]').exists()).toBe(false)
  })
})

it('renders function titles through an explicit label slot without invoking table renderers', async () => {
  const title = vi.fn(() => 'Table title')
  const wrapper = mount(VTableColumnSettings, {
    attachTo: document.body,
    props: { columns: [{ key: 'name', title }] },
    slots: { columnLabel: ({ column }: { column: ColumnType }) => `Label: ${column.key}` },
  })
  wrappers.push(wrapper)
  await settingsTrigger(wrapper).trigger('click')
  expect(checkbox('Label: name').element.tagName).toBe('INPUT')
  expect(title).not.toHaveBeenCalled()
})

it('keeps the slot names identical across presets', () => {
  expect(Object.keys(resolveColumnSettingsThemePreset('antdv').slots)).toEqual(
    Object.keys(resolveColumnSettingsThemePreset('element-plus').slots),
  )
})
