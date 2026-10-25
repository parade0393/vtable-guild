import { effectScope } from 'vue'
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
