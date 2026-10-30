import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref, type PropType } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { useTableEdit } from './composables/useTableEdit'
import { useTableEditable } from './composables/useTableEditable'
import { useTableQuery } from './composables/useTableQuery'
import { getByDataIndex } from './composables/useColumns'
import TableQuery from './components/TableQuery'
import type { UseTableEditReturn } from './types/editing'

const wrappers: VueWrapper[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('review reproductions', () => {
  it('preserves both saved rows when a controlled parent receives concurrent save events', async () => {
    type Row = { id: number; name: string }
    const source = ref<Row[]>([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])
    let edit!: UseTableEditReturn<Row>
    const Child = defineComponent({
      props: { modelValue: { type: Array as PropType<Row[]>, required: true } },
      emits: ['update:modelValue'],
      setup(props, { emit }) {
        edit = useTableEdit<Row>({
          rowKey: 'id',
          mode: 'multiple',
          dataSource: () => props.modelValue,
          onChange: (value) => emit('update:modelValue', value),
        })
        return () => h('div')
      },
    })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Child, {
            modelValue: source.value,
            'onUpdate:modelValue': (value: Row[]) => {
              source.value = value
            },
          }),
      }),
    )
    wrappers.push(wrapper)
    source.value.forEach((record) => edit.start(record))
    edit.setDraft(1, { name: 'A updated' })
    edit.setDraft(2, { name: 'B updated' })
    const saved = await Promise.all([edit.save(1), edit.save(2)])
    await nextTick()
    expect(saved.map((row) => row?.name)).toEqual(['A updated', 'B updated'])
    expect(source.value.map((row) => row.name)).toEqual(['A updated', 'B updated'])
  })

  it('edits the same field that the readonly table displays for a dotted key', async () => {
    const row = { id: 1, 'profile.name': 'Visible', profile: { name: 'Hidden' } }
    const column = { dataIndex: 'profile.name', editor: {} }
    const edit = useTableEditable({ rowKey: 'id', columns: [column], controls: {} })
    edit.start(row)
    const field = edit.getCell({ record: row, column })!
    const displayed = getByDataIndex(row, column.dataIndex)
    expect(field.value).toBe(displayed)
  })

  it('makes query the implicit form action instead of reset', () => {
    const query = useTableQuery({ defaultValues: { keyword: 'typed text' } })
    const wrapper = mount(TableQuery, {
      props: {
        query,
        fields: [{ name: 'keyword' }],
        controls: { text: (context) => h('input', { value: context.value }) },
      },
    })
    wrappers.push(wrapper)
    // HTML implicit submission activates the first submit button in tree order.
    const defaultButton = wrapper
      .findAll('button')
      .find((button) => button.element.type === 'submit')
    expect(defaultButton?.text()).toBe('查询')
  })

  it('does not accept a canonical server key owned by another cached draft', async () => {
    type Row = { id: number; name: string }
    const source = ref<Row[]>([])
    const edit = useTableEdit<Row>({
      rowKey: 'id',
      mode: 'multiple',
      dataSource: source,
      onChange: (rows) => {
        source.value = rows
      },
      onSave: (row) => ({ ...row, id: 2 }),
    })
    edit.add({ id: 1, name: 'First' })
    edit.add({ id: 2, name: 'Second' })
    await edit.save(1)
    expect(() => edit.getValues()).not.toThrow()
    expect(edit.records.value).toHaveLength(2)
  })
})
