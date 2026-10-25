/** Clone ordinary state values while preserving cycles and shared references. */
export function snapshot<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value) as T
  if (value instanceof Date) {
    const result = new Date(value.getTime())
    seen.set(value, result)
    return result as T
  }
  if (Array.isArray(value)) {
    const result = new Array<unknown>(value.length)
    seen.set(value, result)
    value.forEach((item, index) => {
      result[index] = snapshot(item, seen)
    })
    return result as T
  }
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const result: Record<string, unknown> = {}
    seen.set(value, result)
    for (const [key, item] of Object.entries(value)) {
      Object.defineProperty(result, key, {
        value: snapshot(item, seen),
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
    return result as T
  }
  return value
}
