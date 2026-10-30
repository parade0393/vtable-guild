import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createVTableGuild } from '@vtable-guild/core'
import { useTableEditable } from '../composables/useTableEditable'
import type { TableColumnsType, TableBodyCellSlotProps } from '../types'
import VTable from './VTable.vue'
import VTableEditCell from './VTableEditCell.vue'

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
interface Row {
  id: number
  name: string
  code: string
}
describe.each(['antdv', 'element-plus'] as const)('%s editable cell bridge', (preset) => {
  it.each([false, true])(
    'keeps host input mounted through updates and retains readonly fallback, virtual=%s',
    async (virtual) => {
      const source = ref<Row[]>([{ id: 1, name: 'Before', code: 'Readonly' }])
      const columns: TableColumnsType<Row> = [
        {
          dataIndex: 'name',
          title: 'Name',
          width: 180,
          editor: { validate: (value) => (value ? undefined : 'Required') },
        },
        { dataIndex: 'code', title: 'Code', editor: { readonly: true } },
      ]
      let edit!: ReturnType<typeof useTableEditable<Row>>
      const App = defineComponent({
        setup() {
          edit = useTableEditable<Row>({
            rowKey: 'id',
            columns,
            dataSource: source,
            controls: {
              text: (field) =>
                h('input', {
                  value: field.value,
                  'aria-label': field.name,
                  onInput: (event: Event) =>
                    field.onChange((event.target as HTMLInputElement).value),
                }),
            },
          })
          edit.start(source.value[0])
          return () =>
            h(
              VTable<Row>,
              {
                rowKey: 'id',
                columns,
                dataSource: edit.records.value,
                virtual,
                scroll: { y: 200 },
              },
              {
                bodyCell: (cell: TableBodyCellSlotProps<Row>) =>
                  edit.getCell(cell) ? h(VTableEditCell<Row>, { edit, cell }) : undefined,
              },
            )
        },
      })
      const wrapper = mount(App, {
        global: { plugins: [createVTableGuild({ themePreset: preset, cssMode: 'tailwind4' })] },
      })
      wrappers.push(wrapper)
      const original = wrapper.get('input').element
      await wrapper.get('input').setValue('Changed')
      expect(wrapper.get('input').element).toBe(original)
      expect(edit.getDraft(1)?.name).toBe('Changed')
      expect(wrapper.text()).toContain('Readonly')
      expect(source.value[0].name).toBe('Before')
      await wrapper.get('input').setValue('')
      await edit.save(1)
      expect(wrapper.get('[role="alert"]').text()).toBe('Required')
      expect(wrapper.get('input').element).toBe(original)
      await edit.cancel(1)
      expect(wrapper.find('input').exists()).toBe(false)
      expect(wrapper.text()).toContain('Before')
    },
  )
})
