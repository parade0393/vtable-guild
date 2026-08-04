import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import CellEditingDemo from './cell.vue'
import RowEditingDemo from './row.vue'

function mountDemo(component: typeof CellEditingDemo | typeof RowEditingDemo) {
  return mount(component, {
    attachTo: document.body,
    global: {
      plugins: [createVTableGuild()],
    },
  })
}

function findByData(wrapper: VueWrapper, attribute: string, value: string) {
  return wrapper.find(`[${attribute}="${value}"]`)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('cell editing demo', () => {
  it('commits an isolated draft with Enter or blur', async () => {
    const wrapper = mountDemo(CellEditingDemo)

    await findByData(wrapper, 'data-cell', 'member-001:name').trigger('click')
    const nameEditor = findByData(wrapper, 'data-editor', 'member-001:name')
    await nameEditor.setValue('陈嘉宁')
    await nameEditor.trigger('keydown', { key: 'Enter' })

    expect(findByData(wrapper, 'data-editor', 'member-001:name').exists()).toBe(false)
    expect(findByData(wrapper, 'data-cell', 'member-001:name').text()).toBe('陈嘉宁')

    await findByData(wrapper, 'data-cell', 'member-001:role').trigger('click')
    const roleEditor = findByData(wrapper, 'data-editor', 'member-001:role')
    await roleEditor.setValue('技术负责人')
    await roleEditor.trigger('blur')

    expect(findByData(wrapper, 'data-cell', 'member-001:role').text()).toBe('技术负责人')
    wrapper.unmount()
  })

  it('cancels with Escape and restores the source value', async () => {
    const wrapper = mountDemo(CellEditingDemo)

    await findByData(wrapper, 'data-cell', 'member-002:name').trigger('click')
    const editor = findByData(wrapper, 'data-editor', 'member-002:name')
    await editor.setValue('未保存姓名')
    await editor.trigger('keydown', { key: 'Escape' })

    expect(findByData(wrapper, 'data-cell', 'member-002:name').text()).toBe('林悦')
    wrapper.unmount()
  })

  it('does not submit Enter while an IME composition is active', async () => {
    const wrapper = mountDemo(CellEditingDemo)

    await findByData(wrapper, 'data-cell', 'member-003:name').trigger('click')
    let editor = findByData(wrapper, 'data-editor', 'member-003:name')
    await editor.setValue('周原')
    await editor.trigger('compositionstart')
    await editor.trigger('keydown', { key: 'Enter', isComposing: true })

    expect(findByData(wrapper, 'data-editor', 'member-003:name').exists()).toBe(true)

    editor = findByData(wrapper, 'data-editor', 'member-003:name')
    await editor.trigger('compositionend')
    await editor.trigger('keydown', { key: 'Enter' })

    expect(findByData(wrapper, 'data-cell', 'member-003:name').text()).toBe('周原')
    wrapper.unmount()
  })

  it('keeps the draft attached to rowKey after records are replaced and reordered', async () => {
    const wrapper = mountDemo(CellEditingDemo)

    await findByData(wrapper, 'data-cell', 'member-002:role').trigger('click')
    await findByData(wrapper, 'data-editor', 'member-002:role').setValue('体验设计')
    await wrapper.find('[data-testid="replace-rows"]').trigger('click')

    const editor = findByData(wrapper, 'data-editor', 'member-002:role')
    expect(editor.exists()).toBe(true)
    expect((editor.element as HTMLInputElement).value).toBe('体验设计')
    expect(editor.element.closest('tr')?.textContent).toContain('林悦')

    await editor.trigger('keydown', { key: 'Enter' })
    expect(findByData(wrapper, 'data-cell', 'member-002:role').text()).toBe('体验设计')
    wrapper.unmount()
  })
})

describe('row editing demo', () => {
  it('commits multiple draft fields together on Save', async () => {
    const wrapper = mountDemo(RowEditingDemo)

    await findByData(wrapper, 'data-row-action', 'member-101:edit').trigger('click')
    await findByData(wrapper, 'data-row-field', 'member-101:name').setValue('苏晓晚')
    await findByData(wrapper, 'data-row-field', 'member-101:team').setValue('数据')
    await findByData(wrapper, 'data-row-field', 'member-101:role').setValue('设计负责人')
    await findByData(wrapper, 'data-row-action', 'member-101:save').trigger('click')

    const firstRowText = wrapper.findAll('tbody tr')[0].text()
    expect(firstRowText).toContain('苏晓晚')
    expect(firstRowText).toContain('数据')
    expect(firstRowText).toContain('设计负责人')
    wrapper.unmount()
  })

  it('discards the whole row draft on Cancel', async () => {
    const wrapper = mountDemo(RowEditingDemo)

    await findByData(wrapper, 'data-row-action', 'member-102:edit').trigger('click')
    await findByData(wrapper, 'data-row-field', 'member-102:name').setValue('未保存姓名')
    await findByData(wrapper, 'data-row-field', 'member-102:role').setValue('未保存职责')
    await findByData(wrapper, 'data-row-action', 'member-102:cancel').trigger('click')

    const secondRowText = wrapper.findAll('tbody tr')[1].text()
    expect(secondRowText).toContain('何川')
    expect(secondRowText).toContain('前端开发')
    expect(secondRowText).not.toContain('未保存')
    wrapper.unmount()
  })
})
