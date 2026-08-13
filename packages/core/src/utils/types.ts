// ---------- 主题配置相关 ----------

/**
 * 组件主题的原始配置对象（传给 tv() 之前的形态）。
 *
 * 这是 @vtable-guild/theme 中每个文件导出的结构：
 * ```ts
 * export const tableTheme = {
 *   slots: { root: '...', table: '...' },
 *   variants: { size: { small: {...}, large: {...} } },
 *   defaultVariants: { size: 'large' },
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
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K]
}

type ThemeSlotKeys<T extends ThemeConfig> = keyof T['slots'] & string

type ThemeVariantOverrides<T extends ThemeConfig> = {
  [TVariant in keyof NonNullable<T['variants']>]?: NonNullable<
    T['variants']
  >[TVariant] extends Record<string, unknown>
    ? {
        [TValue in keyof NonNullable<T['variants']>[TVariant]]?: NonNullable<
          T['variants']
        >[TVariant][TValue] extends string
          ? string
          : Partial<Record<ThemeSlotKeys<T>, string>>
      }
    : never
}

type ThemeDefaultVariantOverrides<T extends ThemeConfig> = {
  [TVariant in keyof NonNullable<T['defaultVariants']>]?: NonNullable<
    T['defaultVariants']
  >[TVariant] extends boolean
    ? boolean
    : string
}

type ThemeCompoundRuleOverride<T, TSlotKey extends string> = T extends string
  ? string
  : T extends boolean
    ? boolean
    : T extends readonly (infer U)[]
      ? Array<U extends string ? Extract<U, TSlotKey> : ThemeCompoundRuleOverride<U, TSlotKey>>
      : T extends object
        ? {
            [K in keyof T]?: K extends 'class'
              ? string
              : K extends 'slots'
                ? T[K] extends readonly (infer U)[]
                  ? Array<Extract<U, TSlotKey>>
                  : ThemeCompoundRuleOverride<T[K], TSlotKey>
                : ThemeCompoundRuleOverride<T[K], TSlotKey>
          }
        : T

/**
 * Theme override type used by `createVTableGuild({ theme })` and nested config providers.
 *
 * It preserves slot / variant keys for completion while widening override values back to
 * writable types such as `string`.
 */
export type ThemeOverrideConfig<T extends ThemeConfig> = {
  slots?: Partial<Record<ThemeSlotKeys<T>, string>>
  variants?: ThemeVariantOverrides<T>
  defaultVariants?: ThemeDefaultVariantOverrides<T>
  compoundVariants?: T extends { compoundVariants?: readonly (infer U)[] }
    ? Array<ThemeCompoundRuleOverride<U, ThemeSlotKeys<T>>>
    : never
  compoundSlots?: T extends { compoundSlots?: readonly (infer U)[] }
    ? Array<ThemeCompoundRuleOverride<U, ThemeSlotKeys<T>>>
    : never
}

// ---------- 主题预设相关 ----------

/**
 * 可选的主题预设名称。
 *
 * - 'antdv'：默认预设，视觉对齐 ant-design-vue
 * - 'element-plus'：预留扩展，阶段三未实现时 fallback 到 antdv
 */
export type ThemePresetName = 'antdv' | 'element-plus'

/**
 * 样式入口模式。
 *
 * - 'prebuilt'：默认模式，库内部 class 输出 vtg- 前缀，配合预构建 CSS 使用。
 * - 'tailwind3'：Tailwind CSS 3 项目使用，库内部 class 保持无前缀，由用户 Tailwind 构建生成。
 * - 'tailwind4'：Tailwind CSS 4 项目使用，库内部 class 保持无前缀，由用户 Tailwind 构建生成。
 */
export type VTableGuildCssMode = 'prebuilt' | 'tailwind3' | 'tailwind4'

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
  selectAllText: string
}

export interface VTableGuildTableEmptyLocale {
  text: string
}

export interface VTableGuildTableLoadingLocale {
  text: string
}

export interface VTableGuildTableSelectionLocale {
  selectAll: string
  selectInvert: string
  selectNone: string
}

export interface VTableGuildTableLocale {
  header: VTableGuildTableHeaderLocale
  filterDropdown: VTableGuildTableFilterDropdownLocale
  empty: VTableGuildTableEmptyLocale
  loading: VTableGuildTableLoadingLocale
  selection: VTableGuildTableSelectionLocale
}

export interface VTableGuildLocale {
  table: VTableGuildTableLocale
}

export type LocaleName = string
export type LocaleRegistry = Record<LocaleName, VTableGuildLocale>

/**
 * 可通过 module augmentation 扩展的组件主题映射接口。
 *
 * `@vtable-guild/theme` 会自动增强该接口，注入所有内置组件的精确主题类型，
 * 使 `createVTableGuild({ theme: { table: { slots: { ... } } } })` 拥有完整补全。
 *
 * 用户也可在自己的项目中继续增强：
 * ```ts
 * declare module '@vtable-guild/core' {
 *   interface VTableGuildThemeOverridesMap {
 *     myComponent: ThemeOverrideConfig<MyThemeConfig>
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VTableGuildThemeOverridesMap {}

export type VTableGuildThemeOverrides = {
  [K in keyof VTableGuildThemeOverridesMap]?: VTableGuildThemeOverridesMap[K]
}

/**
 * createVTableGuild() 的配置参数。
 */
export interface VTableGuildOptions {
  /** 全局主题预设，默认 'antdv' */
  themePreset?: ThemePresetName
  /** CSS 入口模式，默认 'prebuilt' */
  cssMode?: VTableGuildCssMode
  /** 库内部 utility class 前缀，默认 'vtg'；仅 prebuilt 模式生效 */
  classPrefix?: string
  /** 全局主题覆盖，key 为组件名（如 'table'） */
  theme?: VTableGuildThemeOverrides
  /** 当前激活语言标识，默认 'zh-CN' */
  locale?: LocaleName
  /** 用户注册的语言包映射 */
  locales?: LocaleRegistry
  /** 当前激活语言包的局部覆写 */
  localeOverrides?: DeepPartial<VTableGuildLocale>
  /** 兼容类名开关，默认关闭；开启后为元素添加 antdv 语义类名以兼容旧项目的覆盖 CSS。安装时读取一次，不支持运行时切换 */
  compatClass?: boolean
}

/**
 * 通过 provide/inject 传递的全局配置。
 */
export interface VTableGuildContext {
  themePreset: ThemePresetName
  cssMode: VTableGuildCssMode
  classPrefix: string
  theme: VTableGuildThemeOverrides
  locale: LocaleName
  locales: LocaleRegistry
  localeOverrides: DeepPartial<VTableGuildLocale>
  compatClass?: boolean
}
