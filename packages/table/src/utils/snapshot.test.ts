import { describe, expect, it } from 'vitest'
import { snapshot } from './snapshot'

describe('snapshot', () => {
  it('clones cyclic graphs and Dates without breaking shared references', () => {
    const date = new Date('2026-01-01')
    const node: { date: Date; self?: unknown } = { date }
    node.self = node
    const source = { node, alias: node, date }
    const result = snapshot(source)
    expect(result).not.toBe(source)
    expect(result.node).not.toBe(node)
    expect(result.node.self).toBe(result.node)
    expect(result.alias).toBe(result.node)
    expect(result.date).toBe(result.node.date)
    expect(result.date).not.toBe(date)
    result.date.setUTCFullYear(2030)
    expect(date.getUTCFullYear()).toBe(2026)
  })

  it('preserves array cycles and sparse positions', () => {
    const source: unknown[] = new Array(3)
    source[1] = source
    const result = snapshot(source)
    expect(result).not.toBe(source)
    expect(result).toHaveLength(3)
    expect(result[1]).toBe(result)
    expect(0 in result).toBe(false)
    expect(2 in result).toBe(false)
  })

  it('copies an own __proto__ field as data without changing the object prototype', () => {
    const source = Object.fromEntries([['__proto__', { value: 'ordinary field' }]])
    const result = snapshot(source)
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(result.__proto__).toEqual({ value: 'ordinary field' })
    expect(result.__proto__).not.toBe(source.__proto__)
  })

  it('leaves values outside ordinary objects, arrays and Dates to caller-defined cloning', () => {
    const map = new Map([['name', 'value']])
    expect(snapshot({ map }).map).toBe(map)
  })
})
