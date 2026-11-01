import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, shallowRef, type Slot } from 'vue'
import { createVTableGuild, type ThemePresetName } from '@vtable-guild/core'
import VTable from './VTable.vue'
import TableImpl from './Table'
import type { ColumnsType, TableProps } from '../types'

interface Row extends Record<string, unknown> {
  key: number
  name: string
}
type SlotName = 'empty' | 'bodyCell' | 'headerCell' | 'customFilterIcon' | 'customFilterDropdown'
const wrappers: VueWrapper[] = []

function mountDynamicSlot(preset: ThemePresetName, virtual: boolean, slotName: SlotName) {
  const activeSlot = shallowRef<Slot>()
  // 列和数据保持同一引用；切换插槽不能依靠变更数据或重新挂载来触发更新。
  const columns: ColumnsType<Row> = [
    {
      key: 'name',
      dataIndex: 'name',
      title: 'Name',
      filters: [{ text: 'Active', value: 'Alice' }],
      customFilterDropdown: true,
    },
  ]
  const dataSource: Row[] = slotName === 'empty' ? [] : [{ key: 1, name: 'Alice' }]
  const props = {
    columns,
    dataSource,
    rowKey: 'key',
    pagination: false as const,
    virtual,
    scroll: { y: 240 },
    localeOverrides: { empty: { text: 'Fallback empty' } },
  }
  const Host = defineComponent({
    setup: () => () =>
      h(VTable<Row>, props, activeSlot.value ? { [slotName]: activeSlot.value } : {}),
  })
  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
  })
  wrappers.push(wrapper)
  // A/B 不读取外部 ref，防止旧插槽自身的依赖更新掩盖函数快照缺陷。
  const slotA = () => [h('span', { 'data-test-slot': slotName }, 'Slot A')]
  const slotB = () => [h('span', { 'data-test-slot': slotName }, 'Slot B')]
  return { wrapper, activeSlot, slotA, slotB }
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
})

describe.each(['antdv', 'element-plus'] as const)('%s dynamic table slots', (preset) => {
  describe.each([false, true])('virtual=%s', (virtual) => {
    function mountCallbacks() {
      const wrapper = mount(VTable<Row>, {
        attachTo: document.body,
        props: {
          columns: [
            {
              key: 'name',
              dataIndex: 'name',
              title: 'Name',
              filters: [{ text: 'Active', value: 'Alice' }],
            },
          ],
          dataSource: [{ key: 1, name: 'Alice' }],
          pagination: false,
          virtual,
          scroll: { y: 240 },
        },
        global: { plugins: [createVTableGuild({ themePreset: preset, locale: 'en-US' })] },
      })
      wrappers.push(wrapper)
      return wrapper
    }

    it('updates the cell transformer without replacing rows', async () => {
      const wrapper = mountCallbacks()
      expect(wrapper.find('tbody').text()).toBe('Alice')
      const transformA: TableProps<Row>['transformCellText'] = ({ text }) => `${String(text)} A`
      const transformB: TableProps<Row>['transformCellText'] = ({ text }) => `${String(text)} B`
      await wrapper.setProps({ transformCellText: transformA })
      expect(wrapper.find('tbody').text()).toBe('Alice A')
      await wrapper.setProps({ transformCellText: transformB })
      expect(wrapper.find('tbody').text()).toBe('Alice B')
      await wrapper.setProps({ transformCellText: undefined })
      expect(wrapper.find('tbody').text()).toBe('Alice')
    })

    it('moves an open popup when its container callback changes', async () => {
      const wrapper = mountCallbacks()
      const first = document.createElement('div')
      const second = document.createElement('div')
      document.body.append(first, second)
      await wrapper.setProps({ getPopupContainer: () => first })
      await wrapper.get('[aria-label="Filter"]').trigger('click')
      expect(first.textContent).toContain('Active')
      await wrapper.setProps({ getPopupContainer: () => second })
      expect(second.textContent).toContain('Active')
      expect(first.textContent).toBe('')
      await wrapper.setProps({ getPopupContainer: undefined })
      expect(second.textContent).toBe('')
      expect(document.body.textContent).toContain('Active')
    })

    it.each(['empty', 'bodyCell', 'headerCell', 'customFilterIcon'] as const)(
      'adds, replaces and removes %s without remounting or changing data',
      async (slotName) => {
        const { wrapper, activeSlot, slotA, slotB } = mountDynamicSlot(preset, virtual, slotName)
        const instance = wrapper.findComponent(TableImpl).vm.$
        const target = () => wrapper.find(`[data-test-slot="${slotName}"]`)
        const fallback =
          slotName === 'empty' ? 'Fallback empty' : slotName === 'bodyCell' ? 'Alice' : 'Name'
        expect(target().exists()).toBe(false)
        expect(wrapper.text()).toContain(fallback)

        activeSlot.value = slotA
        await nextTick()
        expect(target().text()).toBe('Slot A')
        activeSlot.value = slotB
        await nextTick()
        expect(target().text()).toBe('Slot B')
        activeSlot.value = undefined
        await nextTick()
        expect(target().exists()).toBe(false)
        expect(wrapper.text()).toContain(fallback)
        activeSlot.value = slotA
        await nextTick()
        expect(target().text()).toBe('Slot A')
        expect(wrapper.findComponent(TableImpl).vm.$).toBe(instance)
      },
    )

    it('updates an open custom dropdown and retains outside-click dismissal', async () => {
      const { wrapper, activeSlot, slotA, slotB } = mountDynamicSlot(
        preset,
        virtual,
        'customFilterDropdown',
      )
      const trigger = wrapper.get('[aria-label="Filter"]')
      await trigger.trigger('click')
      expect(document.body.textContent).toContain('Active')

      activeSlot.value = slotA
      await nextTick()
      expect(document.body.querySelector('[data-test-slot]')?.textContent).toBe('Slot A')
      activeSlot.value = slotB
      await nextTick()
      expect(document.body.querySelector('[data-test-slot]')?.textContent).toBe('Slot B')
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      await nextTick()
      expect(document.body.querySelector('[data-test-slot]')).toBeNull()

      await trigger.trigger('click')
      expect(document.body.querySelector('[data-test-slot]')?.textContent).toBe('Slot B')
      activeSlot.value = undefined
      await nextTick()
      expect(document.body.querySelector('[data-test-slot]')).toBeNull()
      expect(document.body.textContent).toContain('Active')
    })
  })
})
