import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { createVTableGuild } from '@vtable-guild/core'
import VTable from './VTable.vue'

interface Row extends Record<string, unknown> {
  key: number
  name: string
}

const wrappers: VueWrapper[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe.each(['antdv', 'element-plus'] as const)('%s expand icon', (themePreset) => {
  it.each([
    { locale: 'zh-CN', expand: '展开行', collapse: '收起行' },
    { locale: 'en-US', expand: 'Expand row', collapse: 'Collapse row' },
  ])('labels detail-row expand buttons in $locale', async ({ locale, expand, collapse }) => {
    const wrapper = mount(VTable<Row>, {
      props: {
        columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
        dataSource: [{ key: 1, name: 'Ada' }],
        rowKey: 'key',
        expandable: { expandedRowRender: (record) => h('p', `Details of ${record.name}`) },
      },
      global: { plugins: [createVTableGuild({ themePreset, locale })] },
    })
    wrappers.push(wrapper)
    const button = wrapper.get('tbody button[aria-expanded]')
    expect(button.attributes('aria-label')).toBe(expand)
    await button.trigger('click')
    expect(wrapper.text()).toContain('Details of Ada')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-label')).toBe(collapse)
  })
})
