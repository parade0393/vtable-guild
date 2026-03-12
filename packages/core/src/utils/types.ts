// ---------- 主题配置相关 ----------

/**
 * 组件主题的原始配置对象（传给 tv() 之前的形态）。
 *
 * 这是 @vtable-guild/theme 中每个文件导出的结构：
 * ```ts
 * export const tableTheme = {
 *   slots: { root: '...', table: '...' },
 *   variants: { size: { sm: {...}, md: {...} } },
 *   defaultVariants: { size: 'md' },
 * } as const satisfies ThemeConfig
 * ```
 */
export interface ThemeConfig {
  /** slot 名 → 默认 class 字符串 */
  slots: Record<string, string>
  /** variant 名 → 值 → slot class 覆盖 */
  variants?: Record<string, Record<string, Record<string, string> | string>>
  /** 默认 variant 值 */
  defaultVariants?: Record<string, string | boolean>
  /** 复合 variant 规则（当多个 variant 同时匹配时应用） */
  compoundVariants?: Array<Record<string, unknown>>
  /** 批量 slot 样式规则（多个 slot 共享相同条件下的样式） */
  compoundSlots?: Array<Record<string, unknown>>
}

/**
 * 组件 `ui` prop 的类型：每个 slot 可传入自定义 class 字符串。
 *
 * ```vue
 * <VTable :ui="{ root: 'shadow-lg', th: 'bg-blue-50' }" />
 * ```
 */
export type SlotProps<T extends ThemeConfig> = Partial<Record<keyof T['slots'] & string, string>>

/** 深度可选，用于 locale / theme 局部覆盖。 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K]
}

// ---------- 主题预设相关 ----------

/**
 * 可选的主题预设名称。
 *
 * - 'antdv'：默认预设，视觉对齐 ant-design-vue
 * - 'element-plus'：预留扩展，阶段三未实现时 fallback 到 antdv
 */
export type ThemePresetName = 'antdv' | 'element-plus'

// ---------- 插件配置相关 ----------

export interface VTableGuildTableHeaderLocale {
  sortTriggerAsc: string
  sortTriggerDesc: string
  cancelSort: string
  filterTriggerAriaLabel: string
}

export interface VTableGuildTableFilterDropdownLocale {
  searchPlaceholder: string
  emptyText: string
  resetText: string
  confirmText: string
}

export interface VTableGuildTableEmptyLocale {
  text: string
}

export interface VTableGuildTableLoadingLocale {
  text: string
}

export interface VTableGuildTableLocale {
  header: VTableGuildTableHeaderLocale
  filterDropdown: VTableGuildTableFilterDropdownLocale
  empty: VTableGuildTableEmptyLocale
  loading: VTableGuildTableLoadingLocale
}

export interface VTableGuildLocale {
  table: VTableGuildTableLocale
}

export type LocaleName = string
export type LocaleRegistry = Record<LocaleName, VTableGuildLocale>
export type VTableGuildThemeOverrides = Record<string, Partial<ThemeConfig>>

/**
 * createVTableGuild() 的配置参数。
 */
export interface VTableGuildOptions {
  /** 全局主题预设，默认 'antdv' */
  themePreset?: ThemePresetName
  /** 全局主题覆盖，key 为组件名（如 'table'、'pagination'） */
  theme?: VTableGuildThemeOverrides
  /** 当前激活语言标识，默认 'zh-CN' */
  locale?: LocaleName
  /** 用户注册的语言包映射 */
  locales?: LocaleRegistry
  /** 当前激活语言包的局部覆写 */
  localeOverrides?: DeepPartial<VTableGuildLocale>
}

/**
 * 通过 provide/inject 传递的全局配置。
 */
export interface VTableGuildContext {
  themePreset: ThemePresetName
  theme: VTableGuildThemeOverrides
  locale: LocaleName
  locales: LocaleRegistry
  localeOverrides: DeepPartial<VTableGuildLocale>
}
