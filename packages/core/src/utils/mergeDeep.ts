import type { DeepPartial } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mergeDeep<T extends object>(base: T, override?: DeepPartial<T>): T {
  if (!override) return { ...base }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue

    const current = result[key]
    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = mergeDeep(current, value as DeepPartial<typeof current>)
      continue
    }

    result[key] = value
  }

  return result as T
}
