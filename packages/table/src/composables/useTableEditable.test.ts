import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useTableEditable } from './useTableEditable'
import type { ColumnType, CustomRenderContext } from '../types/column'

interface Row {
  id: number
  profile: { name: string }
  amount: number
  day: string | Date
}
const source: Row = { id: 1, profile: { name: 'Before' }, amount: 3, day: '2026-01-01' }
const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
function setup(extra = {}) {
  const scope = effectScope()
  scopes.push(scope)
  const convert = vi.fn((value) => new Date(`${value}T00:00:00Z`))
  const transform = vi.fn((value: unknown) => (value as Date).toISOString().slice(0, 10))
  const validate = vi.fn((value) => (value ? undefined : 'Name is required'))
  const columns: ColumnType<Row>[] = [
    { dataIndex: ['profile', 'name'], editor: { validate } },
    { dataIndex: 'day', valueType: 'date', editor: { convertValue: convert, transform } },
    {
      dataIndex: 'amount',
      editor: { valueType: 'digit', disabled: ({ draft }) => draft.amount === 0 },
    },
  ]
  const save = vi.fn()
  const edit = scope.run(() =>
    useTableEditable<Row>({
      rowKey: 'id',
      mode: 'multiple',
      columns,
      controls: { text: () => null, date: () => null, digit: () => null },
      onSave: save,
      ...extra,
    }),
  )!
  const cell = (index: number): CustomRenderContext<Row> => ({
    record: source,
    column: columns[index],
    index: 0,
    renderIndex: 0,
    text: undefined,
    value: undefined,
  })
  return { edit, columns, cell, convert, transform, validate, save }
}
describe('column editing protocol', () => {
  it('reads, updates and converts dotted string keys without changing the nested field', async () => {
    const record = { id: 1, 'profile.name': 'Visible', profile: { name: 'Nested' } }
    const column = {
      dataIndex: 'profile.name',
      editor: {
        convertValue: (value: unknown) => `Edit:${value}`,
        transform: (value: unknown) => String(value).replace('Edit:', ''),
      },
    }
    const edit = useTableEditable({ rowKey: 'id', columns: [column], controls: {} })
    edit.start(record)
    const field = edit.getCell({ record, column })!
    expect(field.value).toBe('Edit:Visible')
    field.onChange('Edit:Updated')
    expect(edit.getValues()).toEqual([{ ...record, 'profile.name': 'Updated' }])
    expect(await edit.save(1)).toEqual({ ...record, 'profile.name': 'Updated' })
    expect(record.profile.name).toBe('Nested')
    expect(record['profile.name']).toBe('Visible')
  })

  it('keeps explicit options ahead of dictionary candidates, including an explicitly empty list', () => {
    const { edit, cell, columns } = setup()
    columns[2].editor = {
      options: [{ value: 3, label: 'Manual option' }],
      dictionary: {
        options: ref([
          { value: 3, label: 'Remote option' },
          { value: 4, label: 'Remote other' },
        ]),
        valueEnum: ref(new Map()),
        loading: ref(false),
        error: ref(null),
        search: vi.fn().mockResolvedValue(true),
      },
    }
    edit.start(source)
    expect(edit.getCell(cell(2))?.options).toEqual([{ value: 3, label: 'Manual option' }])
    columns[2].editor.options = []
    expect(edit.getCell(cell(2))?.options).toEqual([])
    expect(edit.getCell(cell(2))?.onSearch).toBeTypeOf('function')
  })

  it('converts once at start, edits isolated nested fields and transforms only submission snapshots', async () => {
    const { edit, cell, convert, transform, save } = setup()
    expect(edit.start(source)).toBe(true)
    expect(edit.getDraft(1)?.day).toBeInstanceOf(Date)
    edit.getCell(cell(0))!.onChange('After')
    expect(edit.getDraft(1)?.profile.name).toBe('After')
    expect(source.profile.name).toBe('Before')
    edit.getCell(cell(1))
    edit.getCell(cell(1))
    expect(convert).toHaveBeenCalledOnce()
    expect(transform).not.toHaveBeenCalled()
    const saved = await edit.save(1)
    expect(saved?.day).toBe('2026-01-01')
    expect(save).toHaveBeenCalledOnce()
    expect(transform).toHaveBeenCalledOnce()
  })
  it('keeps invalid drafts/errors and respects row rules even for a previously captured update callback', async () => {
    const { edit, cell, columns, validate, save } = setup()
    edit.start(source)
    edit.getCell(cell(0))!.onChange('')
    expect(await edit.save(1)).toBeUndefined()
    expect(validate).toHaveBeenCalledOnce()
    expect(save).not.toHaveBeenCalled()
    expect(edit.getCell(cell(0))!.error).toBe('Name is required')
    const old = edit.getCell(cell(2))!
    edit.setDraft(1, { amount: 0 })
    old.onChange(99)
    expect(edit.getDraft(1)?.amount).toBe(0)
    columns[0].editor = { readonly: true }
    expect(edit.getCell(cell(0))).toBeUndefined()
    old.onChange(100)
    expect(edit.getDraft(1)?.amount).toBe(0)
  })
  it('applies linked fields in the same draft update and supports registered custom editors', () => {
    const { edit, cell, columns } = setup()
    columns[0].editor = { valueType: 'person', onValueChange: () => ({ amount: 7 }) }
    edit.start(source)
    const context = edit.getCell(cell(0))!
    expect(context.valueType).toBe('person')
    context.onChange('Linked')
    expect(edit.getDraft(1)).toMatchObject({ profile: { name: 'Linked' }, amount: 7 })
  })
  it('retains dictionary selected labels while partial options change', () => {
    const options = ref([{ value: 2, label: 'Another' }])
    const { edit, cell, columns } = setup()
    columns[2].editor = {
      dictionary: {
        options,
        valueEnum: ref(new Map([[3, { text: 'Selected' }]])),
        loading: ref(false),
        error: ref(null),
        search: vi.fn().mockResolvedValue(true),
      },
    }
    edit.start(source)
    expect(edit.getCell(cell(2))?.options).toContainEqual({ value: 3, label: 'Selected' })
  })
  it('derives host options from the same valueEnum while retaining primitive keys', () => {
    const { edit, cell, columns } = setup()
    columns[2].valueEnum = new Map<string | number, string | { text: string; status: 'success' }>([
      [3, { text: 'Three', status: 'success' }],
      ['3', 'String three'],
    ])
    edit.start(source)
    expect(edit.getCell(cell(2))?.options).toEqual([
      { value: 3, label: 'Three', status: 'success' },
      { value: '3', label: 'String three' },
    ])
  })
  it('accepts a dictionary after Vue deeply unwraps a reactive column configuration', () => {
    const columns = ref([
      {
        dataIndex: 'amount',
        editor: {
          dictionary: {
            options: ref([{ value: 3, label: 'Three' }]),
            valueEnum: ref(new Map([[3, { text: 'Three' }]])),
            loading: ref(false),
            error: ref(null),
            search: vi.fn().mockResolvedValue(true),
          },
        },
      },
    ])
    const { edit } = setup({ columns })
    edit.start(source)
    const column: ColumnType<Row> = columns.value[0]
    const field = edit.getCell({ column, record: source })
    expect(field?.options).toEqual([{ value: 3, label: 'Three' }])
    expect(field?.loading).toBe(false)
  })
})
