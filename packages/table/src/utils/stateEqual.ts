/** Compare ordinary snapshot values without serializing, preserving primitive key types. */
export function stateEqual(
  a: unknown,
  b: unknown,
  seen = new WeakMap<object, WeakSet<object>>(),
): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
  if (Object.getPrototypeOf(a) !== Object.prototype && !Array.isArray(a)) return false
  if (seen.get(a)?.has(b)) return true
  const matches = seen.get(a) ?? new WeakSet<object>()
  seen.set(a, matches)
  matches.add(b)
  const left = Object.entries(a)
  const right = Object.entries(b)
  return (
    left.length === right.length &&
    left.every(
      ([key, value]) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        stateEqual(value, Reflect.get(b, key), seen),
    )
  )
}
