import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVTableGuild, type VTableGuildOptions } from '@vtable-guild/core'
import { resolveToolbarThemePreset } from '@vtable-guild/theme'
import VTableToolbar from './VTableToolbar.vue'
import type { TableToolbarSlotProps } from '../types/toolbar'
import type { ColumnsType } from '../types'

const wrappers: VueWrapper[] = []
const originalFullscreen = Object.getOwnPropertyDescriptor(document, 'fullscreenElement')
const originalExit = Object.getOwnPropertyDescriptor(document, 'exitFullscreen')
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  for (const [key, descriptor] of [
    ['fullscreenElement', originalFullscreen],
    ['exitFullscreen', originalExit],
  ] as const) {
    if (descriptor) Object.defineProperty(document, key, descriptor)
    else Reflect.deleteProperty(document, key)
  }
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const columns: ColumnsType = [
  { key: 'name', title: 'Name' },
  { key: 'city', title: 'City', visible: false },
]
function button(wrapper: VueWrapper | DOMWrapper<HTMLElement>, label: string) {
  return wrapper
    .findAll('button')
    .find((item) => item.attributes('aria-label') === label || item.text() === label)!
}
function overlay(role: 'menu' | 'dialog') {
  return new DOMWrapper(document.querySelector<HTMLElement>(`[role="${role}"]`)!)
}
function create(preset: 'antdv' | 'element-plus', options: VTableGuildOptions = {}) {
  const exported = vi.fn()
  const wrapper = mount(VTableToolbar<Record<string, unknown>>, {
    attachTo: document.body,
    props: { title: 'Members', columns, size: 'middle' },
    slots: {
      actions: (scope: TableToolbarSlotProps) =>
        h('button', { onClick: () => exported(scope.columns), disabled: scope.disabled }, 'Export'),
    },
    global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US', ...options })] },
  })
  wrappers.push(wrapper)
  return { wrapper, exported }
}

describe.each(['antdv', 'element-plus'] as const)('%s toolbar', (preset) => {
  it('keeps business actions alongside the default controls without requiring extra configuration', async () => {
    const { wrapper, exported } = create(preset)
    expect(wrapper.text()).toContain('Members')
    expect(button(wrapper, 'Reload')).toBeDefined()
    expect(button(wrapper, 'Density')).toBeDefined()
    expect(button(wrapper, 'Column settings')).toBeDefined()
    expect(button(wrapper, 'Full screen')).toBeUndefined()
    await button(wrapper, 'Export').trigger('click')
    expect(exported).toHaveBeenCalledWith(columns)
    expect(wrapper.emitted('reload')).toBeUndefined()
  })

  it('lets options hide individual tools or all built-ins while preserving export', async () => {
    const { wrapper } = create(preset)
    await wrapper.setProps({ options: { reload: false, density: false } })
    expect(button(wrapper, 'Reload')).toBeUndefined()
    expect(button(wrapper, 'Density')).toBeUndefined()
    await button(wrapper, 'Column settings').trigger('click')
    expect(overlay('dialog').text()).toContain('Column display')
    await wrapper.setProps({ options: false })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(button(wrapper, 'Export')).toBeDefined()
  })

  it('only emits reload requests and respects loading and disabled state', async () => {
    const { wrapper } = create(preset)
    await button(wrapper, 'Reload').trigger('click')
    expect(wrapper.emitted('reload')).toEqual([[]])
    await wrapper.setProps({ loading: true })
    expect(button(wrapper, 'Reload').attributes('aria-busy')).toBe('true')
    expect(button(wrapper, 'Reload').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Column settings').attributes('disabled')).toBeUndefined()
    await button(wrapper, 'Reload').trigger('click')
    expect(wrapper.emitted('reload')).toHaveLength(1)
    await wrapper.setProps({ disabled: true, loading: false })
    expect(
      wrapper.findAll('button').every((item) => item.attributes('disabled') !== undefined),
    ).toBe(true)
  })

  it('forwards column pinning and drag options to the settings panel', async () => {
    const { wrapper } = create(preset)
    await wrapper.setProps({ options: { fixed: false, draggable: false } })
    await button(wrapper, 'Column settings').trigger('click')
    expect(overlay('dialog').find('[data-column-pin]').exists()).toBe(false)
    expect(overlay('dialog').find('[draggable]').exists()).toBe(false)
  })

  it('forwards controlled column, density and reset events through the public generic bridge', async () => {
    const { wrapper } = create(preset)
    await button(wrapper, 'Density').trigger('click')
    await button(overlay('menu'), 'Compact').trigger('click')
    expect(wrapper.emitted('update:size')).toEqual([['small']])
    expect(wrapper.props('size')).toBe('middle')
    await button(wrapper, 'Column settings').trigger('click')
    const checkbox = overlay('dialog')
      .findAll('label')
      .find((item) => item.text() === 'City')!
      .get('input')
    await checkbox.setValue(true)
    const updated = wrapper.emitted('update:columns')![0]![0] as ColumnsType
    expect(updated[1]).toMatchObject({ key: 'city', visible: true })
    expect((columns[1] as { visible: boolean }).visible).toBe(false)
    await button(overlay('dialog'), 'Reset').trigger('click')
    expect(wrapper.emitted('reset')).toEqual([[]])
    expect(wrapper.emitted('update:size')).toHaveLength(1)
  })

  it.each([
    ['Density', 'menu'],
    ['Column settings', 'dialog'],
  ] as const)('keeps the %s tooltip hidden after closing its panel', async (label, role) => {
    vi.useFakeTimers()
    const { wrapper } = create(preset)
    const control = button(wrapper, label)
    const tooltipTrigger = new DOMWrapper(control.element.parentElement!)

    await tooltipTrigger.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(100)
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(label)

    await control.trigger('click')
    expect(document.querySelector(`[role="${role}"]`)).not.toBeNull()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    await tooltipTrigger.trigger('mouseleave')

    if (role === 'menu') await button(overlay(role), 'Compact').trigger('click')
    else await overlay(role).trigger('keydown', { key: 'Escape' })
    await vi.advanceTimersByTimeAsync(100)
    expect(document.querySelector(`[role="${role}"]`)).toBeNull()
    expect(document.querySelector('[role="tooltip"]')).toBeNull()

    await tooltipTrigger.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(100)
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(label)
    await tooltipTrigger.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(100)
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
  })

  it('hides column settings when columns are omitted and follows the table default density', async () => {
    const { wrapper } = create(preset, { theme: { table: { defaultVariants: { size: 'small' } } } })
    await wrapper.setProps({ columns: undefined, size: undefined })
    expect(button(wrapper, 'Column settings')).toBeUndefined()
    await button(wrapper, 'Density').trigger('click')
    expect(button(overlay('menu'), 'Compact').attributes('aria-checked')).toBe('true')
  })

  it('combines global and local themes and locale overrides', async () => {
    const { wrapper } = create(preset, {
      classPrefix: 'app',
      theme: { toolbar: { slots: { root: 'global-toolbar' } } },
      localeOverrides: { toolbar: { reload: 'Refresh' } },
    })
    await wrapper.setProps({ ui: { root: 'local-toolbar' }, locale: { label: 'Data tools' } })
    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Data tools')
    expect(wrapper.find('[role="group"]').classes()).toEqual(
      expect.arrayContaining(['global-toolbar', 'local-toolbar']),
    )
    expect(button(wrapper, 'Refresh')).toBeDefined()
    expect(wrapper.find('[role="group"]').attributes('data-vtg-preset')).toBe(preset)
  })

  it('keeps search text controlled and separates input, submit, clear and reload', async () => {
    const { wrapper } = create(preset)
    await wrapper.setProps({ search: true, searchValue: 'Ada' })
    const input = wrapper.get('input')
    expect(input.attributes('placeholder')).toBe('Enter keywords')
    const searchGroup = wrapper.get('[data-vtg-search-group]')
    const searchButton = button(wrapper, 'Search')
    expect(searchButton.text()).toBe('')
    expect(searchButton.find('svg').exists()).toBe(true)
    expect(searchButton.element.parentElement).toBe(searchGroup.element)
    expect(input.element.parentElement?.parentElement).toBe(searchGroup.element)
    expect(button(wrapper, 'Clear search').element.parentElement).toBe(input.element.parentElement)
    await input.setValue('Grace')
    expect(wrapper.emitted('update:searchValue')).toEqual([['Grace']])
    expect(wrapper.props('searchValue')).toBe('Ada')
    expect(wrapper.emitted('search')).toBeUndefined()
    await wrapper.setProps({ searchValue: 'Grace' })
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('search')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')).toEqual([['Grace']])
    await button(wrapper, 'Search').trigger('click')
    expect(wrapper.emitted('search')).toEqual([['Grace'], ['Grace']])
    await button(wrapper, 'Clear search').trigger('click')
    expect(wrapper.emitted('update:searchValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('clearSearch')).toEqual([[]])
    expect(wrapper.emitted('search')).toHaveLength(2)
    expect(wrapper.emitted('reload')).toBeUndefined()
    expect(wrapper.get('button').attributes('type')).toBe('button')
    await wrapper.setProps({ loading: true })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')).toHaveLength(2)
    await wrapper.setProps({ disabled: true })
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('renders replaceable search, inline or second-row filters, and view tabs without built-ins', async () => {
    const wrapper = mount(VTableToolbar<Record<string, unknown>>, {
      props: {
        options: false,
        searchValue: 'pending',
        multipleLine: true,
        ui: { search: 'test-search', filter: 'test-filter', extra: 'test-extra' },
      },
      slots: {
        search: (scope: TableToolbarSlotProps) =>
          h('button', { onClick: () => scope.submitSearch('custom') }, 'Custom search'),
        filter: () => h('select', { 'aria-label': 'Status' }, [h('option', 'Pending')]),
        extra: () => h('nav', [h('button', 'All'), h('button', 'Pending')]),
      },
      global: { plugins: [createVTableGuild({ themePreset: preset })] },
    })
    wrappers.push(wrapper)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.get('.test-search').text()).toBe('Custom search')
    expect(wrapper.get('select').element.parentElement?.classList.contains('test-extra')).toBe(true)
    expect(wrapper.get('nav').element.parentElement?.classList.contains('test-extra')).toBe(true)
    await button(wrapper, 'Custom search').trigger('click')
    expect(wrapper.emitted('search')).toEqual([['custom']])
    await wrapper.setProps({ multipleLine: false })
    expect(wrapper.get('select').element.parentElement?.classList.contains('test-filter')).toBe(
      true,
    )
  })
})

it('supports complete settings replacement, custom titles and typed business slot state', async () => {
  const wrapper = mount(VTableToolbar<Record<string, unknown>>, {
    props: { columns, options: false, loading: true, title: 'Fallback' },
    slots: {
      title: () => h('strong', 'Custom title'),
      actions: (scope: TableToolbarSlotProps) =>
        h('button', { disabled: scope.loading }, `Export ${scope.columns.length}`),
      settings: (scope: TableToolbarSlotProps) =>
        h('button', { onClick: scope.reload }, 'Custom reload'),
    },
  })
  wrappers.push(wrapper)
  expect(wrapper.text()).toContain('Custom title')
  expect(wrapper.text()).not.toContain('Fallback')
  expect(button(wrapper, 'Export 2').attributes('disabled')).toBeDefined()
  await button(wrapper, 'Custom reload').trigger('click')
  expect(wrapper.emitted('reload')).toBeUndefined()
  await wrapper.setProps({ loading: false })
  await button(wrapper, 'Custom reload').trigger('click')
  expect(wrapper.emitted('reload')).toEqual([[]])
  expect(wrapper.findAll('button')).toHaveLength(2)
})

function fullscreenApi() {
  let current: Element | null = null
  const target = document.createElement('section')
  document.body.append(target)
  function change(element: Element | null) {
    current = element
    document.dispatchEvent(new Event('fullscreenchange'))
  }
  const request = vi.fn(async () => change(target))
  const exit = vi.fn(async () => change(null))
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current })
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit })
  Object.defineProperty(target, 'requestFullscreen', { configurable: true, value: request })
  return { target, change, request, exit }
}

it('enters the explicit target and tracks native exits, without exiting another fullscreen element', async () => {
  const api = fullscreenApi()
  const { wrapper } = create('antdv')
  await wrapper.setProps({ options: { fullScreen: true }, fullscreenTarget: () => api.target })
  api.change(document.createElement('div'))
  await nextTick()
  await button(wrapper, 'Full screen').trigger('click')
  await flushPromises()
  expect(api.request).toHaveBeenCalledOnce()
  expect(api.exit).not.toHaveBeenCalled()
  expect(button(wrapper, 'Exit full screen').attributes('aria-pressed')).toBe('true')
  expect(wrapper.emitted('fullscreenChange')).toEqual([[true]])
  await button(wrapper, 'Column settings').trigger('click')
  expect(api.target.contains(overlay('dialog').element)).toBe(true)
  api.change(null)
  await nextTick()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(button(wrapper, 'Full screen').attributes('aria-pressed')).toBe('false')
  expect(wrapper.emitted('fullscreenChange')).toEqual([[true], [false]])
  await button(wrapper, 'Full screen').trigger('click')
  await flushPromises()
  await button(wrapper, 'Exit full screen').trigger('click')
  await flushPromises()
  expect(api.exit).toHaveBeenCalledOnce()
})

it('disables unavailable fullscreen and reports rejected requests without optimistic state', async () => {
  const { wrapper } = create('antdv')
  await wrapper.setProps({ options: { fullScreen: true } })
  expect(button(wrapper, 'Full screen').attributes('disabled')).toBeDefined()
  const api = fullscreenApi()
  const error = new Error('Fullscreen request denied')
  api.request.mockRejectedValueOnce(error)
  await wrapper.setProps({ fullscreenTarget: () => api.target })
  await button(wrapper, 'Full screen').trigger('click')
  await flushPromises()
  expect(wrapper.emitted('fullscreenError')).toEqual([[error]])
  expect(wrapper.emitted('fullscreenChange')).toBeUndefined()
  expect(button(wrapper, 'Full screen').attributes('aria-pressed')).toBe('false')
  expect(button(wrapper, 'Full screen').attributes('disabled')).toBeUndefined()
})

it('keeps identical theme slot keys across presets', () => {
  expect(Object.keys(resolveToolbarThemePreset('antdv').slots)).toEqual(
    Object.keys(resolveToolbarThemePreset('element-plus').slots),
  )
})
