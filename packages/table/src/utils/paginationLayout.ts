import type { ThemePresetName } from '@vtable-guild/core'
import type {
  TablePaginationBuiltinLayoutItem,
  TablePaginationLayoutItem,
  TablePaginationSlotProps,
} from '../types/pagination'

const defaultLayouts: Record<ThemePresetName, readonly TablePaginationBuiltinLayoutItem[]> = {
  antdv: ['total', 'prev', 'pager', 'next', 'sizes', 'jumper'],
  'element-plus': ['total', 'sizes', 'prev', 'pager', 'next', 'jumper'],
}

const builtinItems = new Set<string>(defaultLayouts.antdv)

export interface ResolvedPaginationLayout {
  mode: 'inline' | 'split'
  regions: Array<{
    name: TablePaginationSlotProps['region']
    items: TablePaginationLayoutItem[]
  }>
  warnings: string[]
}

function isLayoutObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Resolve structure only; control visibility and slot rendering belong to TablePagination. */
export function resolvePaginationLayout(
  layout: unknown,
  preset: ThemePresetName,
): ResolvedPaginationLayout {
  const warnings = new Set<string>()
  const fallback = (): ResolvedPaginationLayout => ({
    mode: 'inline',
    regions: [{ name: 'inline', items: [...defaultLayouts[preset]] }],
    warnings: [...warnings],
  })

  if (layout === undefined) return fallback()

  if (!Array.isArray(layout) && !isLayoutObject(layout)) {
    warnings.add(
      'pagination.layout must be an array or an object with left/right arrays; using the preset default layout.',
    )
    return fallback()
  }

  if (!Array.isArray(layout)) {
    for (const key of Object.keys(layout)) {
      if (key !== 'left' && key !== 'right') {
        warnings.add(
          `pagination.layout contains unknown region "${key}"; using the preset default layout.`,
        )
      }
    }
    for (const region of ['left', 'right'] as const) {
      if (layout[region] !== undefined && !Array.isArray(layout[region])) {
        warnings.add(
          `pagination.layout.${region} must be an array when provided; using the preset default layout.`,
        )
      }
    }
    if (warnings.size > 0) return fallback()
  }

  const seenBuiltins = new Set<string>()
  const seenSlots = new Set<string>()
  const resolveItems = (items: readonly unknown[]): TablePaginationLayoutItem[] => {
    const result: TablePaginationLayoutItem[] = []
    for (const item of items) {
      if (typeof item === 'string') {
        if (!builtinItems.has(item)) {
          warnings.add(`pagination.layout contains unknown item "${item}"; it was ignored.`)
        } else if (seenBuiltins.has(item)) {
          warnings.add(`pagination.layout repeats "${item}"; only the first occurrence is used.`)
        } else {
          seenBuiltins.add(item)
          result.push(item as TablePaginationBuiltinLayoutItem)
        }
      } else if (isLayoutObject(item) && 'slot' in item) {
        if (typeof item.slot !== 'string' || item.slot.trim().length === 0) {
          warnings.add(
            'pagination.layout slot names must be non-blank strings; invalid slot entries were ignored.',
          )
        } else if (seenSlots.has(item.slot)) {
          warnings.add(
            `pagination.layout repeats slot "${item.slot}"; only the first occurrence is used.`,
          )
        } else {
          seenSlots.add(item.slot)
          result.push({ slot: item.slot })
        }
      } else {
        warnings.add(
          'pagination.layout items must be built-in names or objects with a slot name; invalid items were ignored.',
        )
      }
    }
    return result
  }

  const regions: ResolvedPaginationLayout['regions'] = Array.isArray(layout)
    ? [{ name: 'inline', items: resolveItems(layout) }]
    : (['left', 'right'] as const).map((name) => ({
        name,
        items: resolveItems((layout[name] as readonly unknown[] | undefined) ?? []),
      }))

  return {
    mode: Array.isArray(layout) ? 'inline' : 'split',
    regions,
    warnings: [...warnings],
  }
}
