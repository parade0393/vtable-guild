// packages/theme/src/presets/index.ts

import type { ThemePreset } from './types'
import type { ThemePresetName } from '@vtable-guild/core'
import { antdvTableTheme } from './antdv/table'
import {
  ELEMENT_PLUS_THEME_IMPLEMENTED,
  elementPlusTableThemePlaceholder,
} from './element-plus/table'

/**
 * 预设注册表。
 *
 * 阶段三 element-plus 未实现时 fallback 到 antdv，
 * 避免选择 element-plus preset 后组件裸奔。
 */
const presetMap: Record<ThemePresetName, ThemePreset> = {
  antdv: {
    table: antdvTableTheme,
  },
  'element-plus': {
    table: ELEMENT_PLUS_THEME_IMPLEMENTED ? elementPlusTableThemePlaceholder : antdvTableTheme,
  },
}

/**
 * 解析主题预设。
 *
 * @param name - 预设名称，默认 'antdv'
 * @returns 完整的 ThemePreset 对象
 */
export function resolveThemePreset(name: ThemePresetName = 'antdv'): ThemePreset {
  if (name === 'element-plus' && !ELEMENT_PLUS_THEME_IMPLEMENTED) {
    console.warn(
      '[vtable-guild] element-plus theme preset is not yet implemented, falling back to antdv.',
    )
  }

  return presetMap[name] ?? presetMap.antdv
}

/**
 * 解析特定组件的主题预设。
 *
 * @param name - 预设名称
 * @returns Table 的 ThemeConfig
 */
export function resolveTableThemePreset(name: ThemePresetName = 'antdv') {
  return resolveThemePreset(name).table
}

export type { ThemePresetName } from './types'
