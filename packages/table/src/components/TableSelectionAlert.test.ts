import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import { resolveSelectionAlertThemePreset } from '@vtable-guild/theme'
import VTableSelectionAlert from './VTableSelectionAlert.vue'
import type { TableSelectionAlertSlotProps } from '../types/selection-alert'

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe.each(['antdv', 'element-plus'] as const)('%s selection alert', (preset) => {
  it('counts controlled keys even when remote records are unavailable and only requests clearing', async () => {
    const keys = [1, 2, 3]
    const rows = [{ key: 1, name: 'Ada' }]
    const wrapper = mount(VTableSelectionAlert, {
      props: { selectedRowKeys: keys, selectedRows: rows },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('3 selected')
    // ProTable alignment: the count stays plain and clear sits in the trailing option area.
    expect(wrapper.find('strong').exists()).toBe(false)
    const option = wrapper.get('button').element.parentElement
    expect(option?.parentElement?.lastElementChild).toBe(option)
    expect(wrapper.attributes('data-vtg-preset')).toBe(preset)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:selectedRowKeys')).toEqual([[[]]])
    expect(wrapper.emitted('clear')).toEqual([[keys, rows]])
    expect(wrapper.text()).toContain('3 selected')
    expect(keys).toEqual([1, 2, 3])
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('reload')).toBeUndefined()
    await wrapper.setProps({ selectedRowKeys: [] })
    expect(wrapper.find('[role="group"]').exists()).toBe(false)
  })

  it('supports empty visibility, hidden clearing and loading / disabled behavior', async () => {
    const wrapper = mount(VTableSelectionAlert, {
      props: { selectedRowKeys: [], alwaysShow: true },
      global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('0 selected')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ selectedRowKeys: [1], loading: true })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('clear')).toBeUndefined()
    await wrapper.setProps({ loading: false, disabled: true })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('clear')).toBeUndefined()
    await wrapper.setProps({ disabled: false, showClear: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('offers key-based batch actions and protects prop arrays from slot changes', async () => {
    const keys = [1, 2]
    const onBatch = vi.fn()
    const wrapper = mount(VTableSelectionAlert, {
      props: { selectedRowKeys: keys, selectedRows: [], showClear: false },
      slots: {
        info: (scope: TableSelectionAlertSlotProps<object>) => h('strong', `Batch ${scope.count}`),
        actions: (scope: TableSelectionAlertSlotProps<object>) =>
          h(
            'button',
            {
              disabled: scope.disabled,
              onClick: () => onBatch(scope.selectedRowKeys, scope.selectedRows),
            },
            'Approve',
          ),
      },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('Batch 2')
    await wrapper.get('button').trigger('click')
    expect(onBatch).toHaveBeenCalledWith([1, 2], [])
    const passedKeys = onBatch.mock.calls[0]![0] as number[]
    passedKeys.push(3)
    expect(keys).toEqual([1, 2])
    await wrapper.setProps({ loading: true })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })

  it('combines locale and theme overrides and keeps older language bundles valid', async () => {
    const wrapper = mount(VTableSelectionAlert, {
      props: { selectedRowKeys: [1], ui: { root: 'local-alert' }, locale: { clear: 'Reset keys' } },
      global: {
        plugins: [
          createVTableGuild({
            themePreset: preset,
            classPrefix: 'app',
            locale: 'en-US',
            theme: { selectionAlert: { slots: { root: 'global-alert' } } },
            localeOverrides: { selectionAlert: { selected: 'Picked {count}' } },
          }),
        ],
      },
    })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('Picked 1')
    expect(wrapper.get('button').text()).toBe('Reset keys')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['local-alert', 'global-alert']))
  })
})

it('keeps identical selection alert theme slots across presets', () => {
  expect(Object.keys(resolveSelectionAlertThemePreset('antdv').slots)).toEqual(
    Object.keys(resolveSelectionAlertThemePreset('element-plus').slots),
  )
})
