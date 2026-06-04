import { cn as cnBase } from 'tailwind-variants'
import type { ThemeConfig, VTableGuildCssMode } from './types'

export const DEFAULT_VTG_CLASS_PREFIX = 'vtg'

const DEFAULT_CSS_MODE: VTableGuildCssMode = 'prebuilt'

export function normalizeVtgClassPrefix(classPrefix?: string): string {
  const normalized = (classPrefix ?? DEFAULT_VTG_CLASS_PREFIX).trim().replace(/-+$/, '')
  return normalized || DEFAULT_VTG_CLASS_PREFIX
}

function splitAtTopLevelColon(className: string): string[] {
  const parts: string[] = []
  let bracketDepth = 0
  let parenDepth = 0
  let start = 0

  for (let index = 0; index < className.length; index++) {
    const char = className[index]
    if (char === '[') bracketDepth++
    else if (char === ']') bracketDepth--
    else if (char === '(') parenDepth++
    else if (char === ')') parenDepth--
    else if (char === ':' && bracketDepth === 0 && parenDepth === 0) {
      parts.push(className.slice(start, index))
      start = index + 1
    }
  }

  parts.push(className.slice(start))
  return parts
}

function prefixBaseClass(baseClass: string, classPrefix: string): string {
  if (!baseClass || baseClass.startsWith('[')) return baseClass
  if (baseClass.startsWith(`${classPrefix}-`)) return baseClass
  if (baseClass.startsWith(`-${classPrefix}-`)) return baseClass
  if (baseClass.startsWith('!')) return `!${prefixBaseClass(baseClass.slice(1), classPrefix)}`
  if (baseClass.startsWith('-')) return `-${classPrefix}-${baseClass.slice(1)}`
  return `${classPrefix}-${baseClass}`
}

function unprefixBaseClass(baseClass: string, classPrefix: string): string {
  if (baseClass.startsWith(`!${classPrefix}-`)) {
    return `!${baseClass.slice(classPrefix.length + 2)}`
  }
  if (baseClass.startsWith(`-${classPrefix}-`)) {
    return `-${baseClass.slice(classPrefix.length + 2)}`
  }
  if (baseClass.startsWith(`${classPrefix}-`)) {
    return baseClass.slice(classPrefix.length + 1)
  }
  return baseClass
}

function hasPrefixedBaseClass(className: string, classPrefix: string): boolean {
  const parts = splitAtTopLevelColon(className)
  const baseClass = parts[parts.length - 1] ?? ''
  return (
    baseClass.startsWith(`${classPrefix}-`) ||
    baseClass.startsWith(`-${classPrefix}-`) ||
    baseClass.startsWith(`!${classPrefix}-`)
  )
}

function transformBaseClass(className: string, transform: (baseClass: string) => string): string {
  const parts = splitAtTopLevelColon(className)
  const baseClass = parts.pop() ?? ''
  parts.push(transform(baseClass))
  return parts.join(':')
}

export function prefixVtgClassNames(
  className: string,
  cssMode: VTableGuildCssMode,
  classPrefix: string = DEFAULT_VTG_CLASS_PREFIX,
): string {
  if (cssMode !== DEFAULT_CSS_MODE || !className) return className
  const normalizedClassPrefix = normalizeVtgClassPrefix(classPrefix)

  return className
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => transformBaseClass(item, (base) => prefixBaseClass(base, normalizedClassPrefix)))
    .join(' ')
}

function unprefixVtgClassNames(className: string, classPrefix: string): string {
  return className
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => transformBaseClass(item, (base) => unprefixBaseClass(base, classPrefix)))
    .join(' ')
}

export function cnByCssMode(
  cssMode: VTableGuildCssMode,
  classPrefix: string,
  ...classes: Array<string | null | undefined | false>
): string {
  if (cssMode !== DEFAULT_CSS_MODE) return cnBase(...classes) ?? ''
  const normalizedClassPrefix = normalizeVtgClassPrefix(classPrefix)

  const prefixed: string[] = []
  const plain: string[] = []

  for (const className of classes) {
    if (!className) continue
    for (const item of className.split(/\s+/).filter(Boolean)) {
      if (hasPrefixedBaseClass(item, normalizedClassPrefix)) {
        prefixed.push(item)
      } else {
        plain.push(item)
      }
    }
  }

  const mergedPrefixed = prefixVtgClassNames(
    cnBase(unprefixVtgClassNames(prefixed.join(' '), normalizedClassPrefix)) ?? '',
    cssMode,
    normalizedClassPrefix,
  )
  const mergedPlain = cnBase(plain.join(' ')) ?? ''

  return [mergedPrefixed, mergedPlain].filter(Boolean).join(' ')
}

function prefixClassValue(
  value: unknown,
  cssMode: VTableGuildCssMode,
  classPrefix: string,
): unknown {
  if (typeof value === 'string') return prefixVtgClassNames(value, cssMode, classPrefix)
  if (Array.isArray(value)) return value.map((item) => prefixClassValue(item, cssMode, classPrefix))
  if (!value || typeof value !== 'object') return value

  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    result[key] = prefixClassValue(item, cssMode, classPrefix)
  }
  return result
}

function prefixCompoundRule<T extends Record<string, unknown>>(
  rule: T,
  cssMode: VTableGuildCssMode,
  classPrefix: string,
): T {
  const result: Record<string, unknown> = { ...rule }
  if ('class' in result) {
    result.class = prefixClassValue(result.class, cssMode, classPrefix)
  }
  return result as T
}

export function prefixThemeConfig<T extends ThemeConfig>(
  theme: T,
  cssMode: VTableGuildCssMode,
  classPrefix: string = DEFAULT_VTG_CLASS_PREFIX,
): T {
  if (cssMode !== DEFAULT_CSS_MODE) return theme
  const normalizedClassPrefix = normalizeVtgClassPrefix(classPrefix)

  const variants = theme.variants
    ? Object.fromEntries(
        Object.entries(theme.variants).map(([variantName, values]) => [
          variantName,
          Object.fromEntries(
            Object.entries(values).map(([valueName, value]) => [
              valueName,
              prefixClassValue(value, cssMode, normalizedClassPrefix),
            ]),
          ),
        ]),
      )
    : undefined

  return {
    ...theme,
    slots: Object.fromEntries(
      Object.entries(theme.slots ?? {}).map(([slot, className]) => [
        slot,
        prefixVtgClassNames(className, cssMode, normalizedClassPrefix),
      ]),
    ),
    variants: variants as T['variants'],
    compoundVariants: theme.compoundVariants?.map((rule) =>
      prefixCompoundRule(rule, cssMode, normalizedClassPrefix),
    ),
    compoundSlots: theme.compoundSlots?.map((rule) =>
      prefixCompoundRule(rule, cssMode, normalizedClassPrefix),
    ),
  }
}
