import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useTableEdit } from './useTableEdit'

interface Row {
  key: number
  name: string
  profile: { tags: string[] }
  birthday?: Date
}

const row = (): Row => ({ key: 1, name: 'Alice', profile: { tags: ['member'] } })

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

describe('useTableEdit', () => {
  it('composes parallel saves and synchronous source additions before a parent v-model echo', async () => {
    const source = ref([row(), { ...row(), key: 2, name: 'Second' }])
    let edit!: ReturnType<typeof useTableEdit<Row>>
    const Child = defineComponent({
      props: { records: { type: Array<Row>, required: true } },
      emits: ['change'],
      setup(props, { emit }) {
        edit = useTableEdit<Row>({
          rowKey: 'key',
          mode: 'multiple',
          dataSource: () => props.records,
          onChange: (records) => emit('change', records),
        })
        return () => h('div')
      },
    })
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Child, {
            records: source.value,
            onChange: (records: Row[]) => {
              source.value = records
            },
          }),
      }),
    )
    try {
      source.value.forEach((record) => edit.start(record))
      edit.setDraft(1, { name: 'First saved' })
      edit.setDraft(2, { name: 'Second saved' })
      await Promise.all([edit.save(1), edit.save(2)])
      await nextTick()
      expect(source.value.map(({ name }) => name)).toEqual(['First saved', 'Second saved'])
      expect(edit.add({ ...row(), key: -1 }, { mode: 'source' })).toBe(true)
      expect(edit.add({ ...row(), key: -2 }, { mode: 'source' })).toBe(true)
      await nextTick()
      expect(source.value.map(({ key }) => key)).toEqual([1, 2, -1, -2])
      expect(edit.getValues().map(({ key }) => key)).toEqual([1, 2, -1, -2])
    } finally {
      wrapper.unmount()
    }
  })

  it('uses the parent source after ignored, normalized or failed publications', async () => {
    const source = ref([row()])
    const onChange = vi.fn()
    const edit = useTableEdit<Row>({ rowKey: 'key', dataSource: source, onChange })
    edit.start(source.value[0]!)
    edit.setDraft(1, { name: 'Ignored' })
    expect(await edit.save(1)).toMatchObject({ name: 'Ignored' })
    await nextTick()
    expect(edit.records.value).toEqual([row()])

    onChange.mockImplementationOnce((records: Row[]) => {
      source.value = records.map((record) => ({ ...record, name: record.name.trim() }))
    })
    edit.start(source.value[0]!)
    edit.setDraft(1, { name: ' Normalized ' })
    await edit.save(1)
    expect(edit.records.value[0]?.name).toBe('Normalized')

    onChange.mockImplementationOnce(() => {
      throw new Error('Rejected')
    })
    expect(edit.add({ ...row(), key: -1 }, { mode: 'source' })).toBe(false)
    expect(edit.getValues()).toEqual(source.value)
    await nextTick()
    expect(edit.records.value).toEqual(source.value)
  })

  it('invalidates full validation after in-place custom-class source changes', async () => {
    class Profile {
      constructor(public label: string) {}
    }
    interface CustomRow {
      key: number
      profile: Profile
    }
    const source = ref<CustomRow[]>([{ key: 1, profile: new Profile('Before') }])
    const pending = deferred<void>()
    const clone = (record: CustomRow): CustomRow => ({
      ...record,
      profile: new Profile(record.profile.label),
    })
    const validate = vi.fn(() => pending.promise)
    const edit = useTableEdit<CustomRow>({ rowKey: 'key', dataSource: source, clone, validate })
    const checking = edit.validateAll()
    source.value[0]!.profile.label = 'After'
    pending.resolve()
    expect(await checking).toMatchObject({ valid: false, obsolete: true })
    expect(edit.validating.value).toBe(false)
    expect(edit.errors.value.size).toBe(0)
    expect(edit.records.value[0]?.profile.label).toBe('After')
    expect(validate).toHaveBeenCalledOnce()
  })

  it('reads cached additions without cloning every controlled source record', () => {
    const source = ref(Array.from({ length: 100 }, (_, key) => ({ ...row(), key })))
    const clone = vi.fn(
      (record: Row): Row => ({ ...record, profile: { tags: [...record.profile.tags] } }),
    )
    const edit = useTableEdit<Row>({ rowKey: 'key', mode: 'multiple', dataSource: source, clone })
    edit.add({ ...row(), key: -1 }, { position: 'top' })
    edit.add({ ...row(), key: -2 }, { position: 'top' })
    edit.add({ ...row(), key: -3 })
    clone.mockClear()
    expect(edit.newRecords.value.map(({ key }) => key)).toEqual([-2, -1, -3])
    expect(clone).toHaveBeenCalledTimes(3)
    edit.setDraft(-1, { name: 'Changed' })
    clone.mockClear()
    expect(edit.newRecords.value[1]?.name).toBe('Changed')
    expect(clone).toHaveBeenCalledTimes(3)
  })
  it('exposes isolated original snapshots for started and immediately inserted source rows', async () => {
    const source = ref([row()])
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      mode: 'multiple',
      onChange: (records) => {
        source.value = records
      },
      toDraft: (record) => ({ ...record, name: `Editor:${record.name}` }),
    })
    edit.start(source.value[0]!)
    edit.getOriginal(1)!.profile.tags.push('Outside')
    source.value[0]!.name = 'Parent update'
    expect(edit.getOriginal(1)).toMatchObject({ name: 'Alice', profile: { tags: ['member'] } })
    edit.add({ ...row(), key: -1 }, { mode: 'source' })
    expect(edit.getOriginal(-1)?.name).toBe('Alice')
    expect(edit.getDraft(-1)?.name).toBe('Editor:Alice')
    edit.getOriginal(-1)!.profile.tags.push('Outside')
    expect(edit.getOriginal(-1)?.profile.tags).toEqual(['member'])
    edit.add({ ...row(), key: -2 })
    expect(edit.getOriginal(-2)).toBeUndefined()
    await edit.cancel(-1)
    expect(edit.getOriginal(-1)).toBeUndefined()
    expect(source.value.some(({ key }) => key === -1)).toBe(true)
    expect(edit.getOriginal(404)).toBeUndefined()
  })
  it('overlays controlled records without letting parent echoes overwrite open drafts', async () => {
    const source = ref([row(), { ...row(), key: 2, name: 'Second' }])
    const onChange = vi.fn((records: Row[]) => {
      source.value = records
    })
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      onChange,
      mode: 'multiple',
    })
    edit.start(source.value[0]!)
    edit.setDraft(1, { name: 'Typing' })
    source.value = [
      { ...row(), name: 'Parent echo' },
      { ...row(), key: 2, name: 'Remote second' },
    ]
    expect(edit.records.value.map(({ name }) => name)).toEqual(['Typing', 'Remote second'])
    expect(source.value[0]?.name).toBe('Parent echo')
    expect(onChange).not.toHaveBeenCalled()
    expect(await edit.save(1)).toMatchObject({ name: 'Typing' })
    expect(onChange).toHaveBeenCalledOnce()
    expect(source.value.map(({ name }) => name)).toEqual(['Typing', 'Remote second'])
    edit.start(source.value[0]!)
    edit.setDraft(1, { name: 'Discard me' })
    edit.reset()
    expect(edit.records.value[0]?.name).toBe('Typing')
    expect(edit.editableKeys.value).toEqual([])
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('keeps source, editor and submission values separate and converts each edit entry once', async () => {
    const source = ref([row()])
    const toDraft = vi.fn((record: Row) => ({ ...record, name: `Editor:${record.name}` }))
    const toValue = vi.fn((record: Row) => ({
      ...record,
      name: record.name.replace('Editor:', '').trim(),
    }))
    const validate = vi.fn((record: Row) => {
      expect(record.name).toBe('Editor: Updated ')
    })
    const onSave = vi.fn((record: Row) => {
      expect(record.name).toBe('Updated')
      return record
    })
    const onChange = vi.fn((records: Row[]) => {
      source.value = records
    })
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      toDraft,
      toValue,
      validate,
      onSave,
      onChange,
    })
    edit.start(source.value[0]!)
    expect(toDraft).toHaveBeenCalledOnce()
    edit.setDraft(1, { name: 'Editor: Updated ' })
    expect(source.value[0]?.name).toBe('Alice')
    const isolated = edit.getDrafts()
    isolated.get(1)!.profile.tags.push('External')
    expect(edit.getDraft(1)?.profile.tags).toEqual(['member'])
    const saving = edit.save(1)
    expect(edit.save(1)).toBe(saving)
    expect(await saving).toMatchObject({ name: 'Updated' })
    expect(validate).toHaveBeenCalledOnce()
    expect(toValue).toHaveBeenCalledOnce()
    expect(toDraft).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledOnce()
    expect(source.value[0]?.name).toBe('Updated')
  })

  it('validates every client-held row without saving, including unopened and cached rows', async () => {
    const source = ref([row(), { ...row(), key: 2, name: 'Offscreen' }])
    const onSave = vi.fn()
    const onChange = vi.fn()
    const validate = vi.fn((draft: Row) =>
      draft.name ? undefined : { fields: { name: 'Required' } },
    )
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      mode: 'multiple',
      validate,
      onSave,
      onChange,
    })
    edit.start(source.value[1]!)
    edit.setDraft(2, { name: '' })
    edit.add({ ...row(), key: -1, name: '' }, { position: 'top' })
    const failure = await edit.validateAll()
    expect(failure.valid).toBe(false)
    expect(failure.values).toBeUndefined()
    expect([...failure.errors.keys()]).toEqual([-1, 2])
    expect(edit.errors.value.get(2)?.fields).toEqual({ name: 'Required' })
    expect(validate).toHaveBeenCalledTimes(3)
    expect(onSave).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    edit.setDraft(-1, { name: 'Added' })
    edit.setDraft(2, { name: 'Corrected' })
    const success = await edit.validateAll()
    expect(success.valid).toBe(true)
    expect(success.values?.map(({ key }) => key)).toEqual([-1, 1, 2])
    success.values![0]!.name = 'Changed outside'
    expect(edit.getDraft(-1)?.name).toBe('Added')
    expect(edit.errors.value.size).toBe(0)
    expect(edit.isEditing(2)).toBe(true)
    expect(edit.validating.value).toBe(false)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('returns source values untouched while converting captured draft values for a pure form submit', async () => {
    const source = ref([row(), { ...row(), key: 2, name: 'Second' }])
    const toDraft = vi.fn((record: Row) => ({ ...record, name: `Editor:${record.name}` }))
    const toValue = vi.fn((record: Row) => ({
      ...record,
      name: record.name.replace('Editor:', ''),
    }))
    const validate = vi.fn((record: Row) => {
      expect(record.name.startsWith('Editor:')).toBe(true)
    })
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      toDraft,
      toValue,
      validate,
    })
    edit.start(source.value[0]!)
    edit.setDraft(1, { name: 'Editor:Draft' })
    const values = edit.getValues()
    expect(values.map(({ name }) => name)).toEqual(['Draft', 'Second'])
    values[0]!.profile.tags.push('Outside')
    expect(edit.getDraft(1)?.profile.tags).toEqual(['member'])
    toValue.mockClear()
    const result = await edit.validateAll()
    expect(result.values?.map(({ name }) => name)).toEqual(['Draft', 'Second'])
    expect(toValue).toHaveBeenCalledOnce()
    expect(toDraft).toHaveBeenCalledTimes(2)
    expect(validate).toHaveBeenCalledTimes(2)
    expect(source.value.map(({ name }) => name)).toEqual(['Alice', 'Second'])
  })

  it('deduplicates full validation and invalidates its snapshot immediately after draft or source changes', async () => {
    const source = ref([row()])
    const pending = deferred<void>()
    let signal: AbortSignal | undefined
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      validate: (_draft, context) => {
        signal = context.signal
        return pending.promise
      },
    })
    edit.start(source.value[0]!)
    const first = edit.validateAll()
    expect(edit.validateAll()).toBe(first)
    expect(edit.validating.value).toBe(true)
    edit.setDraft(1, { name: 'Newer' })
    expect(await first).toMatchObject({ valid: false, obsolete: true })
    expect(signal?.aborted).toBe(true)
    pending.resolve()
    await Promise.resolve()
    expect(edit.errors.value.size).toBe(0)
    expect(edit.getDraft(1)?.name).toBe('Newer')
    const second = edit.validateAll()
    source.value[0]!.name = 'External update'
    expect(await second).toMatchObject({ valid: false, obsolete: true })
    expect(edit.getDraft(1)?.name).toBe('Newer')
  })

  it('resets and disposes pending validation/save work without triggering cancel callbacks', async () => {
    const pending = deferred<void>()
    const onCancel = vi.fn()
    const scope = effectScope()
    const edit = scope.run(() =>
      useTableEdit<Row>({ rowKey: 'key', validate: () => pending.promise, onCancel }),
    )!
    edit.start(row())
    const validating = edit.validateAll()
    edit.reset()
    expect(await validating).toMatchObject({ obsolete: true })
    expect(edit.validating.value).toBe(false)
    expect(edit.getDrafts().size).toBe(0)
    expect(onCancel).not.toHaveBeenCalled()
    edit.start(row())
    const saving = edit.save(1)
    const later = edit.validateAll()
    scope.stop()
    expect(await saving).toBeUndefined()
    expect(await later).toMatchObject({ obsolete: true })
    pending.resolve()
    await Promise.resolve()
    expect(edit.errors.value.size).toBe(0)
    expect(edit.start(row())).toBe(false)
  })

  it('supports positioned cached or source additions, factories and a client row limit', async () => {
    const source = ref([row()])
    let sequence = 0
    const createRecord = vi.fn(() => ({ ...row(), key: --sequence }))
    const onChange = vi.fn((records: Row[]) => {
      source.value = records
    })
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      onChange,
      mode: 'multiple',
      createRecord,
      maxRows: 3,
    })
    expect(edit.add(undefined, { position: 'top' })).toBe(true)
    expect(edit.add(undefined, { position: 'top' })).toBe(true)
    expect(edit.records.value.map(({ key }) => key)).toEqual([-2, -1, 1])
    expect(edit.newRecords.value.map(({ key }) => key)).toEqual([-2, -1])
    expect(edit.add()).toBe(false)
    expect(createRecord).toHaveBeenCalledTimes(2)
    expect(onChange).not.toHaveBeenCalled()
    await edit.cancel(-2)
    expect(edit.add(undefined, { position: 'bottom', mode: 'source' })).toBe(true)
    expect(source.value.map(({ key }) => key)).toEqual([1, -3])
    expect(onChange).toHaveBeenCalledOnce()
    await edit.cancel(-3)
    expect(edit.records.value.map(({ key }) => key)).toEqual([-1, 1, -3])
    expect(edit.newRecords.value.map(({ key }) => key)).toEqual([-1])
    expect(edit.add(row())).toBe(false)
    const noAdapter = useTableEdit<Row>({ rowKey: 'key' })
    expect(noAdapter.add(row(), { mode: 'source' })).toBe(false)
  })

  it('preserves failed conversion drafts and rejects duplicate accepted source keys', async () => {
    const source = ref([row()])
    const onChange = vi.fn()
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      onChange,
      mode: 'multiple',
      toValue: (draft) => {
        if (!draft.name) throw new Error('Conversion failed')
        return draft
      },
      onSave: (draft) => ({ ...draft, key: 1 }),
    })
    edit.add({ ...row(), key: -1, name: '' })
    expect(await edit.save(-1)).toBeUndefined()
    expect(edit.getDraft(-1)?.name).toBe('')
    expect(edit.errors.value.get(-1)?.message).toBe('Conversion failed')
    edit.setDraft(-1, { name: 'New' })
    expect(await edit.save(-1)).toBeUndefined()
    expect(edit.errors.value.get(-1)?.message).toContain('duplicate a source row key')
    expect(edit.isEditing(-1)).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    const duplicates = useTableEdit<Row>({ rowKey: 'key', dataSource: [row(), row()] })
    expect(() => duplicates.records.value).toThrow('unique source row keys')
  })

  it('does not overwrite a source row arriving during a cached save with a new server key', async () => {
    const source = ref<Row[]>([])
    const pending = deferred<Row>()
    const onSave = vi.fn(() => pending.promise)
    const onChange = vi.fn((records: Row[]) => {
      source.value = records
    })
    const edit = useTableEdit<Row>({ rowKey: 'key', dataSource: source, onSave, onChange })
    edit.add({ ...row(), key: -1, name: 'Draft' })
    const saving = edit.save(-1)
    await Promise.resolve()
    expect(onSave).toHaveBeenCalledOnce()
    const external = { ...row(), key: -1, name: 'External' }
    source.value = [external]
    pending.resolve({ ...row(), key: 10, name: 'Saved draft' })

    expect(await saving).toBeUndefined()
    expect(source.value).toEqual([external])
    expect(onChange).not.toHaveBeenCalled()
    expect(edit.getDraft(-1)?.name).toBe('Draft')
    expect(edit.errors.value.get(-1)).toMatchObject({ type: 'save' })
    expect(edit.errors.value.get(-1)?.message).toContain('duplicate a source row key')
    expect(edit.savingKeys.value.size).toBe(0)
  })

  it.each([false, true])(
    'rejects a server key owned by another draft and permits retry, controlled=%s',
    async (controlled) => {
      const source = ref<Row[]>([])
      const onChange = vi.fn((records: Row[]) => {
        source.value = records
      })
      const onSave = vi
        .fn()
        .mockImplementationOnce((draft: Row) => ({ ...draft, key: 2 }))
        .mockImplementationOnce((draft: Row) => ({ ...draft, key: 3 }))
      const edit = useTableEdit<Row>({
        rowKey: 'key',
        mode: 'multiple',
        onSave,
        ...(controlled ? { dataSource: source, onChange } : {}),
      })
      const first = { ...row(), key: 1, name: 'First' }
      const second = { ...row(), key: 2, name: 'Second' }
      edit.add(first)
      edit.add(second)

      expect(await edit.save(1)).toBeUndefined()
      expect(onChange).not.toHaveBeenCalled()
      expect(source.value).toEqual([])
      expect(edit.records.value).toEqual([first, second])
      expect(edit.getValues()).toEqual([first, second])
      expect(edit.errors.value.get(1)?.message).toContain('duplicate another draft row key')
      expect(edit.savingKeys.value.size).toBe(0)

      expect(await edit.save(1)).toEqual({ ...first, key: 3 })
      expect(edit.getDraft(2)).toEqual(second)
      expect(edit.isEditing(1)).toBe(false)
      expect(edit.errors.value.size).toBe(0)
      if (controlled) {
        expect(source.value).toEqual([{ ...first, key: 3 }])
        expect(edit.getValues()).toEqual([{ ...first, key: 3 }, second])
        expect(onChange).toHaveBeenCalledOnce()
      }
    },
  )

  it('keeps stable draft keys through submitted conversion and rejects stale duplicate additions', async () => {
    const source = ref<Row[]>([])
    const onChange = vi.fn()
    const changing = useTableEdit<Row>({
      rowKey: 'key',
      dataSource: source,
      toValue: (draft) => ({ ...draft, key: 10 }),
      onChange,
    })
    changing.add({ ...row(), key: -1 })
    expect(() => changing.getValues()).toThrow('cannot change its row key')
    expect((await changing.validateAll()).errors.get(-1)?.message).toContain(
      'cannot change its row key',
    )
    expect(await changing.save(-1)).toBeUndefined()
    expect(changing.isEditing(-1)).toBe(true)
    const delayed = useTableEdit<Row>({ rowKey: 'key', dataSource: source, onChange })
    delayed.add({ ...row(), key: -2 })
    source.value = [{ ...row(), key: -2, name: 'External record' }]
    expect(() => delayed.getValues()).toThrow('duplicates a source row key')
    expect((await delayed.validateAll()).errors.get(-2)?.message).toContain(
      'duplicates a source row key',
    )
    expect(await delayed.save(-2)).toBeUndefined()
    expect(delayed.errors.value.get(-2)?.message).toContain('duplicate a source row key')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('isolates nested drafts, getter results, and source records', () => {
    const source = row()
    source.birthday = new Date('2020-01-01')
    const edit = useTableEdit<Row>({ rowKey: 'key' })
    expect(edit.start(source)).toBe(true)
    source.profile.tags.push('source')
    edit.setDraft(1, (draft) => {
      draft.profile.tags.push('draft')
      draft.birthday!.setUTCFullYear(2025)
      return draft
    })
    const copy = edit.getDraft(1)!
    copy.profile.tags.push('external')
    expect(edit.getDraft(1)?.profile.tags).toEqual(['member', 'draft'])
    expect(source.profile.tags).toEqual(['member', 'source'])
    expect(source.birthday.getUTCFullYear()).toBe(2020)
    expect(edit.getDraft(1)?.birthday?.getUTCFullYear()).toBe(2025)
  })

  it('keeps drafts stable across replaced records and refuses duplicate sessions', () => {
    const edit = useTableEdit<Row>({ rowKey: (record) => record.key })
    edit.start(row())
    edit.setDraft(1, { name: 'Draft' })
    expect(edit.start({ ...row(), name: 'Replacement' })).toBe(false)
    expect(edit.editableKeys.value).toEqual([1])
    expect(edit.getDraft(1)?.name).toBe('Draft')
    edit.cancel(1)
    expect(edit.getDraft(1)).toBeUndefined()
    expect(edit.setDraft(1, { name: 'Missing' })).toBe(false)
  })

  it('supports independent multiple sessions and rejects second rows in single mode', () => {
    const edit = useTableEdit<Row>({ rowKey: 'key', mode: 'multiple' })
    edit.start(row())
    edit.start({ ...row(), key: 2 })
    expect(edit.editableKeys.value).toEqual([1, 2])
    edit.cancelAll()
    expect(edit.editableKeys.value).toEqual([])
    const single = useTableEdit<Row>({ rowKey: 'key', mode: 'single' })
    single.start(row())
    expect(single.start({ ...row(), key: 2 })).toBe(false)
    expect(single.editableKeys.value).toEqual([1])
  })

  it('rejects unstable keys before invalidating an existing draft', () => {
    const edit = useTableEdit<Row>({ rowKey: 'key' })
    edit.start(row())
    expect(() => edit.setDraft(1, { key: 3 })).toThrow('row key')
    expect(edit.getDraft(1)?.key).toBe(1)
    const invalid = useTableEdit<{ key?: number }>({ rowKey: 'key' })
    expect(() => invalid.start({})).toThrow('row key')
  })

  it('accepts a local draft without mutating dataSource', async () => {
    const source = row()
    const edit = useTableEdit<Row>({ rowKey: 'key' })
    edit.start(source)
    edit.setDraft(1, { name: 'Saved' })
    expect(await edit.save(1)).toMatchObject({ key: 1, name: 'Saved' })
    expect(source.name).toBe('Alice')
    expect(edit.isEditing(1)).toBe(false)
    expect(edit.savingKeys.value.size).toBe(0)
    expect(await edit.save(404)).toBeUndefined()
  })

  it('keeps field validation errors open and clears them when corrected', async () => {
    const onSave = vi.fn()
    const onError = vi.fn()
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      validate: async (draft) => (draft.name ? undefined : { fields: { name: 'Required' } }),
      onSave,
      onError,
    })
    edit.start(row())
    edit.setDraft(1, { name: '' })
    expect(await edit.save(1)).toBeUndefined()
    expect(edit.errors.value.get(1)).toMatchObject({
      type: 'validation',
      fields: { name: 'Required' },
    })
    expect(onSave).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
    expect(edit.isEditing(1)).toBe(true)
    edit.setDraft(1, { name: 'Corrected' })
    expect(edit.errors.value.size).toBe(0)
    await edit.save(1)
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('deduplicates saves and returns the server canonical record', async () => {
    const response = deferred<Row>()
    const onSave = vi.fn((_draft: Row) => response.promise)
    const edit = useTableEdit<Row>({ rowKey: 'key', onSave })
    edit.start(row())
    edit.setDraft(1, { name: ' draft ' })
    const first = edit.save(1)
    expect(edit.save(1)).toBe(first)
    expect(edit.savingKeys.value.has(1)).toBe(true)
    await Promise.resolve()
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ name: ' draft ' })
    response.resolve({ ...row(), name: 'Canonical' })
    expect(await first).toMatchObject({ name: 'Canonical' })
    expect(edit.editableKeys.value).toEqual([])
  })

  it('retains a failed save and allows explicit retry', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(undefined)
    const edit = useTableEdit<Row>({ rowKey: 'key', onSave })
    edit.start(row())
    expect(await edit.save(1)).toBeUndefined()
    expect(edit.errors.value.get(1)).toMatchObject({ type: 'save', message: 'Offline' })
    expect(edit.isEditing(1)).toBe(true)
    expect(await edit.save(1)).toMatchObject({ key: 1 })
    expect(edit.errors.value.size).toBe(0)
  })

  it('treats validation exceptions as row errors and prevents saving', async () => {
    const onSave = vi.fn()
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      validate: () => {
        throw new Error('Validation service unavailable')
      },
      onSave,
    })
    edit.start(row())
    await edit.save(1)
    expect(edit.errors.value.get(1)?.type).toBe('validation')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('cancels pending validation without invoking onSave', async () => {
    const validation = deferred<void>()
    const onSave = vi.fn()
    const edit = useTableEdit<Row>({ rowKey: 'key', validate: () => validation.promise, onSave })
    edit.start(row())
    const saving = edit.save(1)
    edit.cancel(1)
    expect(await saving).toBeUndefined()
    validation.resolve()
    await Promise.resolve()
    expect(onSave).not.toHaveBeenCalled()
    expect(edit.errors.value.size).toBe(0)
  })

  it('invalidates a save when a newer draft replaces it', async () => {
    const response = deferred<Row>()
    let signal: AbortSignal | undefined
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      onSave: (_draft, context) => {
        signal = context.signal
        return response.promise
      },
    })
    edit.start(row())
    const saving = edit.save(1)
    await Promise.resolve()
    edit.setDraft(1, { name: 'Newer' })
    expect(signal?.aborted).toBe(true)
    expect(await saving).toBeUndefined()
    response.resolve({ ...row(), name: 'Stale' })
    await Promise.resolve()
    expect(edit.getDraft(1)?.name).toBe('Newer')
    expect(edit.savingKeys.value.size).toBe(0)
  })

  it('ignores a stale failure after cancel and restart with the same key', async () => {
    const response = deferred<Row>()
    const onError = vi.fn()
    const edit = useTableEdit<Row>({ rowKey: 'key', onSave: () => response.promise, onError })
    edit.start(row())
    const saving = edit.save(1)
    await Promise.resolve()
    edit.cancel(1)
    edit.start({ ...row(), name: 'Restart' })
    response.reject(new Error('Old failure'))
    expect(await saving).toBeUndefined()
    await Promise.resolve()
    expect(edit.getDraft(1)?.name).toBe('Restart')
    expect(onError).not.toHaveBeenCalled()
  })

  it('composes new records and accepts server-assigned keys', async () => {
    const contexts: unknown[] = []
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      onSave: (draft, context) => {
        contexts.push(context)
        return { ...draft, key: 100 }
      },
    })
    edit.add({ ...row(), key: -1 })
    expect(edit.newRecords.value).toHaveLength(1)
    edit.newRecords.value[0]!.name = 'External'
    expect(edit.getDraft(-1)?.name).toBe('Alice')
    expect(await edit.save(-1)).toMatchObject({ key: 100 })
    expect(contexts[0]).toMatchObject({ key: -1, isNew: true, original: undefined })
    expect(edit.newRecords.value).toEqual([])
  })

  it('rejects changed canonical keys for an existing row', async () => {
    const edit = useTableEdit<Row>({ rowKey: 'key', onSave: (draft) => ({ ...draft, key: 2 }) })
    edit.start(row())
    expect(await edit.save(1)).toBeUndefined()
    expect(edit.errors.value.get(1)?.message).toContain('cannot change its key')
    expect(edit.isEditing(1)).toBe(true)
  })

  it('disposes pending saves and prevents future editing', async () => {
    const response = deferred<Row>()
    const scope = effectScope()
    const edit = scope.run(() =>
      useTableEdit<Row>({ rowKey: 'key', onSave: () => response.promise }),
    )!
    edit.start(row())
    const saving = edit.save(1)
    await Promise.resolve()
    scope.stop()
    expect(await saving).toBeUndefined()
    expect(edit.start(row())).toBe(false)
    response.resolve(row())
    await Promise.resolve()
    expect(edit.editableKeys.value).toEqual([])
    expect(edit.errors.value.size).toBe(0)
  })

  it('uses a custom clone only with complete records', () => {
    const clone = vi.fn((record: Row) => ({
      ...record,
      profile: { tags: [...record.profile.tags] },
    }))
    const edit = useTableEdit<Row>({ rowKey: 'key', clone })
    edit.start(row())
    expect(edit.setDraft(1, { name: 'Partial' })).toBe(true)
    expect(edit.getDraft(1)?.name).toBe('Partial')
    expect(clone).toHaveBeenCalled()
  })

  it('waits for onCancel, deduplicates cancellation, and keeps rejected drafts', async () => {
    const response = deferred<void>()
    const onCancel = vi.fn(() => response.promise)
    const edit = useTableEdit<Row>({ rowKey: 'key', onCancel })
    edit.start(row())
    const cancelled = edit.cancel(1)
    expect(edit.cancel(1)).toBe(cancelled)
    expect(edit.cancellingKeys.value.has(1)).toBe(true)
    expect(await edit.save(1)).toBeUndefined()
    response.reject(new Error('Cancel rejected'))
    expect(await cancelled).toBe(false)
    expect(edit.errors.value.get(1)).toMatchObject({ type: 'cancel', message: 'Cancel rejected' })
    expect(edit.isEditing(1)).toBe(true)
    expect(onCancel).toHaveBeenCalledOnce()
    expect(edit.cancellingKeys.value.size).toBe(0)
  })

  it('allows async cancellation and ignores an obsolete cancellation response', async () => {
    const response = deferred<void>()
    const edit = useTableEdit<Row>({ rowKey: 'key', onCancel: () => response.promise })
    edit.add(row())
    const cancelled = edit.cancel(1)
    edit.setDraft(1, { name: 'Keep editing' })
    expect(await cancelled).toBe(false)
    response.resolve()
    await Promise.resolve()
    expect(edit.getDraft(1)?.name).toBe('Keep editing')
    expect(await edit.cancel(1)).toBe(true)
    expect(edit.newRecords.value).toEqual([])
  })

  it('supports explicit save and cancel vetoes without discarding drafts', async () => {
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      onSave: async () => false,
      onCancel: async () => false,
    })
    edit.start(row())
    expect(await edit.save(1)).toBeUndefined()
    expect(await edit.cancel(1)).toBe(false)
    expect(edit.isEditing(1)).toBe(true)
    expect(edit.errors.value.size).toBe(0)
    expect(edit.savingKeys.value.size).toBe(0)
    expect(edit.cancellingKeys.value.size).toBe(0)
  })

  it('settles failed operations even if the error observer throws', async () => {
    const edit = useTableEdit<Row>({
      rowKey: 'key',
      onSave: () => Promise.reject(new Error('Save failed')),
      onError: () => {
        throw new Error('Observer failed')
      },
    })
    edit.start(row())
    expect(await edit.save(1)).toBeUndefined()
    expect(edit.errors.value.get(1)?.message).toBe('Save failed')
    expect(edit.savingKeys.value.size).toBe(0)
  })
})
