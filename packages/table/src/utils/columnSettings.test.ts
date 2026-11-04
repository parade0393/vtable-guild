import { describe, expect, it } from 'vitest'
import type { ColumnGroupType, ColumnType, ColumnsType } from '../types'
import { EXPAND_COLUMN, SELECTION_COLUMN } from '../constants'
import {
  configurableEntries,
  moveSettingColumn,
  setColumnFixed,
  setColumnVisibility,
  settingsEntries,
} from './columnSettings'

describe('column settings constraints', () => {
  it('does not hide protected descendants or settings-hidden columns via a parent or all toggle', () => {
    const columns: ColumnsType = [
      { key: 'private', hideInSetting: true, visible: true },
      {
        key: 'group',
        children: [{ key: 'required', disable: { checkbox: true } }, { key: 'optional' }],
      },
    ]
    const entries = settingsEntries(columns)
    const values = new Map(
      entries
        .flatMap((entry) => [entry, ...entry.children])
        .map((entry) => [entry.id, false] as const),
    )
    const changed = setColumnVisibility(columns, values) as ColumnType[]
    expect(changed[0]).toBe(columns[0])
    expect(changed[1]!.visible).toBeUndefined()
    expect((changed[1] as ColumnGroupType).children[0]!.visible).toBeUndefined()
    expect((changed[1] as ColumnGroupType).children[1]!.visible).toBe(false)
    expect(configurableEntries(columns).map((entry) => entry.column.key)).toEqual(['group'])
  })

  it('pins grouped leaves together and keeps symbols in their input slots', () => {
    const renderer = () => 'value'
    const columns: ColumnsType = [
      SELECTION_COLUMN,
      { key: 'name', customRender: renderer },
      { key: 'group', children: [{ key: 'a' }, { key: 'b' }] },
      EXPAND_COLUMN,
    ]
    const group = settingsEntries(columns)[1]!
    const changed = setColumnFixed(columns, group.id, 'left')
    expect(changed[0]).toBe(SELECTION_COLUMN)
    expect(changed[3]).toBe(EXPAND_COLUMN)
    expect(changed[2]).toBe(columns[1])
    expect((changed[2] as ColumnType).customRender).toBe(renderer)
    expect(
      (changed[1] as ColumnGroupType).children.every((column) => column.fixed === 'left'),
    ).toBe(true)
    expect((columns[2] as ColumnGroupType).children[0]!.fixed).toBeUndefined()
  })

  it('only reorders within a fixed region and cannot cross a locked column', () => {
    const columns: ColumnsType = [
      { key: 'left', fixed: 'left' },
      { key: 'a' },
      { key: 'locked', disable: { order: true } },
      { key: 'b' },
      { key: 'c' },
      { key: 'right', fixed: 'right' },
    ]
    const entries = settingsEntries(columns)
    const id = (key: string) => entries.find((entry) => entry.column.key === key)!.id
    expect(moveSettingColumn(columns, id('a'), id('c'))).toBe(columns)
    expect(moveSettingColumn(columns, id('left'), id('right'))).toBe(columns)
    expect(
      moveSettingColumn(columns, id('b'), id('c')).map((column) =>
        typeof column === 'symbol' ? '' : column.key,
      ),
    ).toEqual(['left', 'a', 'locked', 'c', 'b', 'right'])
    expect(setColumnFixed(columns, id('c'), 'left')).toBe(columns)
  })

  it('inserts before or after the target while the default keeps the target slot', () => {
    const columns: ColumnsType = [{ key: 'a' }, { key: 'b' }, { key: 'c' }]
    const entries = settingsEntries(columns)
    const id = (key: string) => entries.find((entry) => entry.column.key === key)!.id
    const keys = (result: ColumnsType) =>
      result.map((column) => (typeof column === 'symbol' ? '' : column.key))
    // 下移（from < to）
    expect(keys(moveSettingColumn(columns, id('a'), id('c'), 'before'))).toEqual(['b', 'a', 'c'])
    expect(keys(moveSettingColumn(columns, id('a'), id('c'), 'after'))).toEqual(['b', 'c', 'a'])
    // 上移（from > to）
    expect(keys(moveSettingColumn(columns, id('c'), id('a'), 'before'))).toEqual(['c', 'a', 'b'])
    expect(keys(moveSettingColumn(columns, id('c'), id('a'), 'after'))).toEqual(['a', 'c', 'b'])
    // 缺省 position 占据目标槽位（顺序恢复语义：下移同 after，上移同 before）
    expect(keys(moveSettingColumn(columns, id('a'), id('c')))).toEqual(['b', 'c', 'a'])
    expect(keys(moveSettingColumn(columns, id('c'), id('a')))).toEqual(['c', 'a', 'b'])
  })

  it('does not bypass a child pin lock with a group action', () => {
    const columns: ColumnsType = [
      { key: 'group', children: [{ key: 'a', disable: { fixed: true } }, { key: 'b' }] },
    ]
    expect(setColumnFixed(columns, settingsEntries(columns)[0]!.id, 'right')).toBe(columns)
  })
})
