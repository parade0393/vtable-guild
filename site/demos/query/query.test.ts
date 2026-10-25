import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import BasicDemo from './basic.vue'

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe.each(['antdv', 'element-plus'] as const)('query docs with %s', (themePreset) => {
  it('queries only on submit, resubmits identical values, and resets the current page', async () => {
    const wrapper = mount(BasicDemo, {
      global: { plugins: [createVTableGuild({ themePreset })] },
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('请求 1 次')
    await wrapper.get('input[type="search"]').setValue('苏')
    expect(wrapper.get('[role="status"]').text()).toContain('请求 1 次')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('tbody').text()).toContain('苏晚')
    expect(wrapper.get('tbody').text()).not.toContain('陈嘉')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('请求 3 次')
    const reset = wrapper.findAll('button').find((button) => button.text() === '重置并查询')!
    await reset.trigger('click')
    await flushPromises()
    await wrapper.get('button[title="2"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('tbody').text()).toContain('周野')
    await reset.trigger('click')
    await flushPromises()
    expect(wrapper.get('tbody').text()).toContain('陈嘉')
    expect(wrapper.get('[role="status"]').text()).toContain('请求 6 次')
  })
})
