import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Table 主题占位。
 *
 * 阶段三未实现，运行时 resolveThemePreset() 会 fallback 到 antdv。
 * 后续阶段在此文件中补全 element-plus 的 token 和 slot 样式。
 */
export const elementPlusTableThemePlaceholder = {
  slots: {},
} as const satisfies ThemeConfig

/** 标记 element-plus 主题是否已实现 */
export const ELEMENT_PLUS_THEME_IMPLEMENTED = false
