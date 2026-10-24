import { effectScope, nextTick, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ColumnsType, ColumnType } from '../types'
import { SELECTION_COLUMN } from '../constants'
import { moveSettingColumn, setColumnFixed, settingsEntries } from '../utils/columnSettings'
import { useColumnState } from './useColumnState'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe('useColumnState', () => {
  it('restores state without serializing or losing column functions, and resets initial preferences', async () => {
    const storage = memoryStorage()
    const render = vi.fn(() => 'rendered')
    const definitions = shallowRef<ColumnsType>([
      SELECTION_COLUMN,
      { key: 'name', customRender: render },
      { key: 'city', visible: false },
      { key: 'email' },
    ])
    const scope = effectScope()
    const first = scope.run(() => useColumnState(definitions, { storageKey: 'members', storage }))!
    const names = (columns: ColumnsType) =>
      columns.filter((column) => typeof column !== 'symbol').map((column) => column.key)
    const entries = settingsEntries(first.columns.value)
    first.columns.value = moveSettingColumn(first.columns.value, entries[2]!.id, entries[0]!.id)
    first.columns.value = first.columns.value.map((column) =>
      typeof column !== 'symbol' && column.key === 'city' ? { ...column, visible: true } : column,
    )
    await nextTick()
    expect(storage.getItem('members')).not.toContain('customRender')
    const second = scope.run(() => useColumnState(definitions, { storageKey: 'members', storage }))!
    expect(names(second.columns.value)).toEqual(['email', 'name', 'city'])
    expect(
      (
        second.columns.value.find(
          (column) => typeof column !== 'symbol' && column.key === 'name',
        ) as ColumnType
      ).customRender,
    ).toBe(render)
    expect(
      (
        second.columns.value.find(
          (column) => typeof column !== 'symbol' && column.key === 'city',
        ) as ColumnType
      ).visible,
    ).toBe(true)
    second.reset()
    expect(names(second.columns.value)).toEqual(['name', 'city', 'email'])
    expect((second.columns.value[2] as ColumnType).visible).toBe(false)
    scope.stop()
  })

  it('handles changed versions, invalid storage, and failures without preventing rendering', () => {
    const storage = memoryStorage()
    const source: ColumnsType = [{ key: 'name' }]
    const id = settingsEntries(source)[0]!.id
    storage.setItem('table', JSON.stringify({ version: 1, state: { [id]: { visible: false } } }))
    const scope = effectScope()
    const state = scope.run(() =>
      useColumnState(source, { storageKey: 'table', storage, version: 2 }),
    )!
    expect((state.columns.value[0] as ColumnType).visible).toBeUndefined()
    const onError = vi.fn()
    const broken = scope.run(() =>
      useColumnState(source, {
        storageKey: 'table',
        onError,
        storage: {
          getItem() {
            throw new Error('blocked')
          },
          setItem() {
            throw new Error('full')
          },
          removeItem() {},
        },
      }),
    )!
    expect(broken.columns.value).toHaveLength(1)
    broken.save()
    expect(onError).toHaveBeenCalledTimes(2)
    storage.setItem('table', '{invalid json')
    state.restore()
    expect(state.columns.value).toHaveLength(1)
    scope.stop()
  })

  it('keeps dynamic definitions authoritative and does not recreate removed columns', async () => {
    const definitions = shallowRef<ColumnsType>([{ key: 'a' }, { key: 'b' }])
    const scope = effectScope()
    const state = scope.run(() => useColumnState(definitions))!
    const entry = settingsEntries(state.columns.value)[0]!
    state.columns.value = setColumnFixed(state.columns.value, entry.id, 'right')
    expect((state.columns.value.at(-1) as ColumnType).key).toBe('a')
    definitions.value = [
      { key: 'a', disable: true },
      { key: 'c', visible: false },
    ]
    await nextTick()
    expect(state.columns.value.map((column) => typeof column !== 'symbol' && column.key)).toEqual([
      'a',
      'c',
    ])
    expect((state.columns.value[0] as ColumnType).fixed).toBeUndefined()
    state.reset()
    expect(state.columns.value).toHaveLength(2)
    expect((state.columns.value[1] as ColumnType).visible).toBe(false)
    scope.stop()
  })
})
