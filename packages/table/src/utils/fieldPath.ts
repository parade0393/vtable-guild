import type { DataIndex } from '../types/column'

export function fieldPath(value: DataIndex): Array<string | number> {
  const parts = Array.isArray(value) ? value : [value]
  if (parts.some((key) => ['__proto__', 'constructor', 'prototype'].includes(String(key))))
    throw new Error('Unsafe table field path')
  return parts
}
export function getField(record: object, path: DataIndex): unknown {
  return fieldPath(path).reduce<unknown>(
    (value, key) => (value && typeof value === 'object' ? Reflect.get(value, key) : undefined),
    record,
  )
}
/** Mutates only an already isolated draft snapshot. */
export function setField(record: object, path: DataIndex, value: unknown) {
  const keys = fieldPath(path)
  let parent = record
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      Reflect.set(parent, key, value)
      return
    }
    let child = Reflect.get(parent, key)
    if (!child || typeof child !== 'object') {
      child = typeof keys[index + 1] === 'number' ? [] : {}
      Reflect.set(parent, key, child)
    }
    parent = child
  })
}
