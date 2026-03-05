// packages/theme/src/presets/index.ts

import type { ThemePreset } from './types'
import type { ThemePresetName } from '@vtable-guild/core'
import type { AntdvTableThemeConfig } from './antdv/table'
import { antdvTableTheme } from './antdv/table'
import { elementPlusTableTheme } from './element-plus/table'

/**
 * 预设注册表。
 */
const presetMap: Record<ThemePresetName, ThemePreset> = {
  antdv: {
    table: antdvTableTheme,
  },
  'element-plus': {
    table: elementPlusTableTheme,
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

export type { ThemePresetName } from './types'
