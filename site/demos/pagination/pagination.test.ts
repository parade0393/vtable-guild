import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import { nextTick } from 'vue'
import CallbackDemo from './callback.vue'
import ControlledDemo from './controlled.vue'

const wrappers: VueWrapper[] = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

describe.each(['antdv', 'element-plus'] as const)('pagination docs with %s', (themePreset) => {
  it.each([
    ['pagination.onChange', CallbackDemo],
    ['VTable.change', ControlledDemo],
  ] as const)('keeps controlled data in sync using %s', async (_name, component) => {
    const wrapper = mount(component, {
      attachTo: document.body,
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    wrappers.push(wrapper)

    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.find('tbody').text()).toContain('Record 1')
    await wrapper.get('button[title="2"]').trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.find('tbody').text()).toContain('Record 6')
    expect(wrapper.find('tbody tr').text()).toBe('Record 6')

    await wrapper.get('[aria-haspopup="listbox"]').trigger('click')
    const options = document.body.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(3)
    options[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    expect(wrapper.find('tbody tr').text()).toBe('Record 11')
  })
})
