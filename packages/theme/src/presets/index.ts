// packages/theme/src/presets/index.ts

import type { BuiltInLocaleName, ThemePreset } from './types'
import type {
  LocaleName,
  ThemePresetName,
  VTableGuildLocale,
  VTableGuildTableLocale,
} from '@vtable-guild/core'
import type { AntdvTableThemeConfig } from './antdv/table'
import type { AntdvButtonThemeConfig } from './antdv/button'
import type { AntdvCheckboxThemeConfig } from './antdv/checkbox'
import type { AntdvRadioThemeConfig } from './antdv/radio'
import type { AntdvInputThemeConfig } from './antdv/input'
import type { AntdvTooltipThemeConfig } from './antdv/tooltip'
import type { AntdvScrollbarThemeConfig } from './antdv/scrollbar'
import { antdvTableTheme } from './antdv/table'
import { antdvTableEnUSLocale, antdvTableLocale } from './antdv/table-locale'
import { antdvButtonTheme } from './antdv/button'
import { antdvCheckboxTheme } from './antdv/checkbox'
import { antdvRadioTheme } from './antdv/radio'
import { antdvInputTheme } from './antdv/input'
import { antdvTooltipTheme } from './antdv/tooltip'
import { antdvScrollbarTheme } from './antdv/scrollbar'
import { elementPlusTableTheme } from './element-plus/table'
import { elementPlusTableEnUSLocale, elementPlusTableLocale } from './element-plus/table-locale'
import { elementPlusButtonTheme } from './element-plus/button'
import { elementPlusCheckboxTheme } from './element-plus/checkbox'
import { elementPlusRadioTheme } from './element-plus/radio'
import { elementPlusInputTheme } from './element-plus/input'
import { elementPlusTooltipTheme } from './element-plus/tooltip'
import { elementPlusScrollbarTheme } from './element-plus/scrollbar'

/**
 * 预设注册表。
 */
const presetMap: Record<ThemePresetName, ThemePreset> = {
  antdv: {
    table: antdvTableTheme,
    button: antdvButtonTheme,
    checkbox: antdvCheckboxTheme,
    radio: antdvRadioTheme,
    input: antdvInputTheme,
    tooltip: antdvTooltipTheme,
    scrollbar: antdvScrollbarTheme,
    tableLocale: antdvTableLocale,
    locales: {
      'zh-CN': { table: antdvTableLocale },
      'en-US': { table: antdvTableEnUSLocale },
    },
  },
  'element-plus': {
    table: elementPlusTableTheme,
    button: elementPlusButtonTheme,
    checkbox: elementPlusCheckboxTheme,
    radio: elementPlusRadioTheme,
    input: elementPlusInputTheme,
    tooltip: elementPlusTooltipTheme,
    scrollbar: elementPlusScrollbarTheme,
    tableLocale: elementPlusTableLocale,
    locales: {
      'zh-CN': { table: elementPlusTableLocale },
      'en-US': { table: elementPlusTableEnUSLocale },
    },
  },
}

/**
 * 解析主题预设。
 *
 * @param name - 预设名称，默认 'antdv'
 * @returns 完整的 ThemePreset 对象
 */
export function resolveThemePreset(name: ThemePresetName = 'antdv'): ThemePreset {
  return presetMap[name] ?? presetMap.antdv
}

/**
 * 解析特定组件的主题预设。
 *
 * 返回窄类型 AntdvTableThemeConfig，确保消费端 useTheme 能推导出
 * 具体 slot 名称（root、table、th 等），而非拓宽为 string。
 *
 * @param name - 预设名称
 * @returns Table 的 AntdvTableThemeConfig（保留字面量 slot key）
 */
export function resolveTableThemePreset(name: ThemePresetName = 'antdv'): AntdvTableThemeConfig {
  return resolveThemePreset(name).table as AntdvTableThemeConfig
}

export function resolveButtonThemePreset(name: ThemePresetName = 'antdv'): AntdvButtonThemeConfig {
  return (resolveThemePreset(name).button ?? antdvButtonTheme) as AntdvButtonThemeConfig
}

export function resolveCheckboxThemePreset(
  name: ThemePresetName = 'antdv',
): AntdvCheckboxThemeConfig {
  return (resolveThemePreset(name).checkbox ?? antdvCheckboxTheme) as AntdvCheckboxThemeConfig
}

export function resolveRadioThemePreset(name: ThemePresetName = 'antdv'): AntdvRadioThemeConfig {
  return (resolveThemePreset(name).radio ?? antdvRadioTheme) as AntdvRadioThemeConfig
}

export function resolveInputThemePreset(name: ThemePresetName = 'antdv'): AntdvInputThemeConfig {
  return (resolveThemePreset(name).input ?? antdvInputTheme) as AntdvInputThemeConfig
}

export function resolveTooltipThemePreset(
  name: ThemePresetName = 'antdv',
): AntdvTooltipThemeConfig {
  return (resolveThemePreset(name).tooltip ?? antdvTooltipTheme) as AntdvTooltipThemeConfig
}

export function resolveScrollbarThemePreset(
  name: ThemePresetName = 'antdv',
): AntdvScrollbarThemeConfig {
  return (resolveThemePreset(name).scrollbar ?? antdvScrollbarTheme) as AntdvScrollbarThemeConfig
}

export function resolveTableLocalePreset(name: ThemePresetName = 'antdv'): VTableGuildTableLocale {
  return resolveThemePreset(name).tableLocale
}

export function resolveBuiltInTableLocale(
  name: ThemePresetName = 'antdv',
  localeName: LocaleName = 'zh-CN',
): VTableGuildTableLocale | undefined {
  return resolveThemePreset(name).locales[localeName as BuiltInLocaleName]?.table
}

export function resolveBuiltInLocale(
  name: ThemePresetName = 'antdv',
  localeName: LocaleName = 'zh-CN',
): VTableGuildLocale | undefined {
  return resolveThemePreset(name).locales[localeName as BuiltInLocaleName]
}

export type { BuiltInLocaleName, ThemePresetName } from './types'
