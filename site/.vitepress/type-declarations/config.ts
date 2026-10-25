import type { InjectionKey, Plugin } from 'vue'
import type {
  tableTheme,
  buttonTheme,
  checkboxTheme,
  radioTheme,
  inputTheme,
  tooltipTheme,
  scrollbarTheme,
  paginationTheme,
  columnSettingsTheme,
  toolbarTheme,
  selectionAlertTheme,
} from '@vtable-guild/vtable-guild'
import type { AlignType, SummaryFixed } from './table'

// #region ThemeConfig
export interface ThemeConfig {
  slots: Record<string, string>
  variants?: Record<string, Record<string, Record<string, string> | string>>
  defaultVariants?: Record<string, string | boolean>
  compoundVariants?: Array<Record<string, unknown>>
  compoundSlots?: Array<Record<string, unknown>>
}
// #endregion ThemeConfig

// #region SlotProps
export type SlotProps<T extends ThemeConfig> = Partial<Record<keyof T['slots'] & string, string>>
// #endregion SlotProps

// #region DeepPartial
export type DeepPartial<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends Array<infer U>
    ? Array<DeepPartial<U>>
    : NonNullable<T[K]> extends object
      ? DeepPartial<T[K]>
      : T[K]
}
// #endregion DeepPartial

// #region ThemeOverrideConfig
// 以下 Theme* 辅助类型用于展开声明，不是包导出。
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
// #endregion ThemeOverrideConfig

// #region ThemePresetName
export type ThemePresetName = 'antdv' | 'element-plus'
// #endregion ThemePresetName

// #region VTableGuildCssMode
export type VTableGuildCssMode = 'prebuilt' | 'tailwind3' | 'tailwind4'
// #endregion VTableGuildCssMode

// #region TableSlots
export type TableSlots =
  | 'root'
  | 'wrapper'
  | 'rootAutoHeight'
  | 'wrapperAutoHeight'
  | 'table'
  | 'thead'
  | 'tbody'
  | 'widthConstraintCell'
  | 'widthConstraintInner'
  | 'widthLayoutCell'
  | 'tr'
  | 'groupedHeaderTable'
  | 'groupedHeaderTh'
  | 'groupedHeaderTd'
  | 'th'
  | 'td'
  | 'empty'
  | 'loading'
  | 'headerCellInner'
  | 'bodyCellEllipsis'
  | 'thSortable'
  | 'thSorted'
  | 'tdSorted'
  | 'sortButton'
  | 'sortIconDown'
  | 'sortAreaOuter'
  | 'sortAreaWrapper'
  | 'sortAreaTitle'
  | 'headerHelp'
  | 'cellContent'
  | 'copyButton'
  | 'cellStatus'
  | 'cellTag'
  | 'filterIconWrapper'
  | 'filterIcon'
  | 'filterDropdown'
  | 'filterDropdownList'
  | 'filterDropdownItem'
  | 'filterDropdownItemSelected'
  | 'filterDropdownItemSelectedSingle'
  | 'filterDropdownItemHover'
  | 'filterDropdownSwitcher'
  | 'filterDropdownSwitcherExpanded'
  | 'filterDropdownSwitcherCollapsed'
  | 'filterDropdownSwitcherNoop'
  | 'filterDropdownContentWrapper'
  | 'filterDropdownTreeWrapper'
  | 'filterDropdownTreeList'
  | 'filterDropdownTreeItem'
  | 'filterDropdownTreeContentWrapper'
  | 'filterDropdownTreeItemSelected'
  | 'filterDropdownTreeItemMatched'
  | 'filterDropdownTreeCheckAll'
  | 'filterDropdownActions'
  | 'filterDropdownResetButton'
  | 'filterDropdownConfirmButton'
  | 'filterDropdownSearch'
  | 'filterDropdownSearchField'
  | 'filterDropdownSearchIcon'
  | 'filterDropdownSearchInput'
  | 'filterDropdownListEmpty'
  | 'emptyWrapper'
  | 'emptyIcon'
  | 'emptyText'
  | 'loadingSpinner'
  | 'tdSelected'
  | 'tdRowHover'
  | 'tdRowSelectedHover'
  | 'trDragging'
  | 'trDropAbove'
  | 'trDropBelow'
  | 'selectionDropdown'
  | 'selectionDropdownItem'
  | 'selectionExtra'
  | 'title'
  | 'footer'
  | 'summary'
  | 'summaryRow'
  | 'summaryCell'
  | 'headerWrapper'
  | 'bodyWrapper'
  | 'fixedCell'
  | 'fixedDividerLeft'
  | 'fixedDividerRight'
  | 'fixedShadowLeft'
  | 'fixedShadowRight'
  | 'fixedShadowLeftHidden'
  | 'fixedShadowRightHidden'
  | 'expandIcon'
  | 'expandIconExpanded'
  | 'expandIconCollapsed'
  | 'expandIconSpaced'
  | 'expandIconDisabled'
  | 'expandIconSymbol'
  | 'expandIconSymbolExpanded'
  | 'expandIconSymbolCollapsed'
  | 'treeExpandIcon'
  | 'treeExpandIconExpanded'
  | 'treeExpandIconCollapsed'
  | 'treeExpandIconSpaced'
  | 'treeExpandIconDisabled'
  | 'treeExpandIconSymbol'
  | 'treeExpandIconLoading'
  | 'treeExpandIconError'
  | 'treeExpandIconSymbolExpanded'
  | 'treeExpandIconSymbolCollapsed'
  | 'expandedRow'
  | 'expandedRowCell'
  | 'resizeHandle'
// #endregion TableSlots

// #region TableVariantProps
export type TableVariantProps = {
  size?: 'large' | 'middle' | 'small'
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
}
// #endregion TableVariantProps

// #region TableThemeConfig
// tableTheme 是公开的默认 antdv 主题；typeof 保留 readonly 与字面量 variant 配置。
export type TableThemeConfig = typeof tableTheme
// #endregion TableThemeConfig

// #region ComponentThemeTypes
export type ButtonSlots = 'root' | 'inner'
export type ButtonThemeConfig = typeof buttonTheme
export type CheckboxSlots = 'root' | 'checkMark' | 'indeterminateMark'
export type CheckboxThemeConfig = typeof checkboxTheme
export type RadioSlots = 'root' | 'dot'
export type RadioThemeConfig = typeof radioTheme
export type InputSlots = 'root'
export type InputThemeConfig = typeof inputTheme
export type TooltipSlots = 'content' | 'arrow' | 'arrowOuter' | 'arrowInner'
export type TooltipThemeConfig = typeof tooltipTheme
export type ScrollbarSlots =
  | 'root'
  | 'wrap'
  | 'view'
  | 'track'
  | 'trackVertical'
  | 'trackHorizontal'
  | 'thumb'
export type ScrollbarThemeConfig = typeof scrollbarTheme
// #endregion ComponentThemeTypes

// #region PaginationSlots
export type PaginationSlots =
  | 'root'
  | 'layout'
  | 'left'
  | 'right'
  | 'extension'
  | 'pages'
  | 'item'
  | 'active'
  | 'jump'
  | 'jumpEllipsis'
  | 'jumpIcon'
  | 'controls'
  | 'simpleControls'
  | 'simpleInput'
  | 'slash'
  | 'go'
  | 'input'
  | 'select'
  | 'popup'
  | 'option'
  | 'optionActive'
  | 'total'
  | 'icon'
// #endregion PaginationSlots

// #region PaginationThemeConfig
export type PaginationThemeConfig = typeof paginationTheme
// #endregion PaginationThemeConfig

// #region ColumnSettingsThemeTypes
export type ColumnSettingsThemeConfig = typeof columnSettingsTheme
export type ColumnSettingsSlots = keyof ColumnSettingsThemeConfig['slots']
// #endregion ColumnSettingsThemeTypes

// #region ToolbarThemeTypes
export type ToolbarThemeConfig = typeof toolbarTheme
export type ToolbarSlots = keyof ToolbarThemeConfig['slots']
// #endregion ToolbarThemeTypes

// #region SelectionAlertThemeTypes
export type SelectionAlertThemeConfig = typeof selectionAlertTheme
export type SelectionAlertSlots = keyof SelectionAlertThemeConfig['slots']
// #endregion SelectionAlertThemeTypes

// #region VTableGuildThemeOverridesMap
export interface VTableGuildThemeOverridesMap {
  table: ThemeOverrideConfig<TableThemeConfig>
  button: ThemeOverrideConfig<ButtonThemeConfig>
  checkbox: ThemeOverrideConfig<CheckboxThemeConfig>
  radio: ThemeOverrideConfig<RadioThemeConfig>
  input: ThemeOverrideConfig<InputThemeConfig>
  tooltip: ThemeOverrideConfig<TooltipThemeConfig>
  scrollbar: ThemeOverrideConfig<ScrollbarThemeConfig>
  pagination: ThemeOverrideConfig<PaginationThemeConfig>
  columnSettings: ThemeOverrideConfig<ColumnSettingsThemeConfig>
  toolbar: ThemeOverrideConfig<ToolbarThemeConfig>
  selectionAlert: ThemeOverrideConfig<SelectionAlertThemeConfig>
}
// #endregion VTableGuildThemeOverridesMap

// #region VTableGuildThemeOverrides
export type VTableGuildThemeOverrides = {
  [K in keyof VTableGuildThemeOverridesMap]?: VTableGuildThemeOverridesMap[K]
}
// #endregion VTableGuildThemeOverrides

// #region LocaleName
export type LocaleName = string
// #endregion LocaleName

// #region BuiltInLocaleName
export type BuiltInLocaleName = 'zh-CN' | 'en-US'
// #endregion BuiltInLocaleName

// #region LocaleRegistry
export type LocaleRegistry = Record<LocaleName, VTableGuildLocale>
// #endregion LocaleRegistry

// #region VTableGuildTableHeaderLocale
export interface VTableGuildTableHeaderLocale {
  sortTriggerAsc: string
  sortTriggerDesc: string
  cancelSort: string
  filterTriggerAriaLabel: string
}
// #endregion VTableGuildTableHeaderLocale

// #region VTableGuildTableFilterDropdownLocale
export interface VTableGuildTableFilterDropdownLocale {
  searchPlaceholder: string
  emptyText: string
  resetText: string
  confirmText: string
  selectAllText: string
}
// #endregion VTableGuildTableFilterDropdownLocale

// #region VTableGuildTableEmptyLocale
export interface VTableGuildTableEmptyLocale {
  text: string
}
// #endregion VTableGuildTableEmptyLocale

// #region VTableGuildTableLoadingLocale
export interface VTableGuildTableLoadingLocale {
  text: string
}
// #endregion VTableGuildTableLoadingLocale

// #region VTableGuildTableSelectionLocale
export interface VTableGuildTableSelectionLocale {
  selectAll: string
  selectInvert: string
  selectNone: string
}
// #endregion VTableGuildTableSelectionLocale

// #region VTableGuildTableLocale
export interface VTableGuildTableLocale {
  tree?: { expand: string; collapse: string; retry: string }
  cell?: { copy: string; copied: string; copyFailed: string }
  header: VTableGuildTableHeaderLocale
  filterDropdown: VTableGuildTableFilterDropdownLocale
  empty: VTableGuildTableEmptyLocale
  loading: VTableGuildTableLoadingLocale
  selection: VTableGuildTableSelectionLocale
}
// #endregion VTableGuildTableLocale

// #region VTableGuildPaginationLocale
export interface VTableGuildPaginationLocale {
  items_per_page: string
  jump_to: string
  jump_to_confirm: string
  page: string
  prev_page: string
  next_page: string
  prev_5: string
  next_5: string
  prev_3: string
  next_3: string
  /** {count} 会被替换为跳转页数。 */
  prev_pages?: string
  next_pages?: string
  navigation: string
  page_size: string
}
// #endregion VTableGuildPaginationLocale

// #region PaginationLocaleConstants
export declare const paginationZhCN: VTableGuildPaginationLocale
export declare const paginationEnUS: VTableGuildPaginationLocale
export declare const elementPlusPaginationZhCN: VTableGuildPaginationLocale
export declare const elementPlusPaginationEnUS: VTableGuildPaginationLocale
// #endregion PaginationLocaleConstants

// #region VTableGuildLocale
export interface VTableGuildLocale {
  table: VTableGuildTableLocale
  pagination?: VTableGuildPaginationLocale
  columnSettings?: VTableGuildColumnSettingsLocale
  toolbar?: VTableGuildToolbarLocale
  selectionAlert?: VTableGuildSelectionAlertLocale
}
// #endregion VTableGuildLocale

// #region VTableGuildColumnSettingsLocale
export interface VTableGuildColumnSettingsLocale {
  fixed?: string
  fixedLeft?: string
  fixedRight?: string
  unfixed?: string
  mixed?: string
  move?: string
  title: string
  reset: string
  density: string
  large: string
  middle: string
  small: string
  columns: string
  empty: string
}
// #endregion VTableGuildColumnSettingsLocale

// #region VTableGuildToolbarLocale
export interface VTableGuildToolbarLocale {
  searchPlaceholder?: string
  search?: string
  clearSearch?: string
  label: string
  reload: string
  fullScreen: string
  exitFullScreen: string
}
// #endregion VTableGuildToolbarLocale

// #region VTableGuildSelectionAlertLocale
export interface VTableGuildSelectionAlertLocale {
  label: string
  selected: string
  clear: string
}
// #endregion VTableGuildSelectionAlertLocale

// #region VTableGuildOptions
export interface VTableGuildOptions {
  themePreset?: ThemePresetName
  cssMode?: VTableGuildCssMode
  classPrefix?: string
  theme?: VTableGuildThemeOverrides
  locale?: LocaleName
  locales?: LocaleRegistry
  localeOverrides?: DeepPartial<VTableGuildLocale>
  /** 安装时读取一次，不支持运行时切换。 */
  compatClass?: boolean
}
// #endregion VTableGuildOptions

// #region VTableGuildContext
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
// #endregion VTableGuildContext

// #region createVTableGuild
export declare function createVTableGuild(options?: VTableGuildOptions): Plugin
// #endregion createVTableGuild

// #region VTABLE_GUILD_INJECTION_KEY
export declare const VTABLE_GUILD_INJECTION_KEY: InjectionKey<VTableGuildContext>
// #endregion VTABLE_GUILD_INJECTION_KEY

// #region VTableGuildConfigProviderProps
/** 文档说明用辅助接口，不是包导出。描述 Provider 可传入的配置 props。 */
export interface VTableGuildConfigProviderProps {
  theme?: VTableGuildThemeOverrides
  cssMode?: VTableGuildCssMode
  classPrefix?: string
  locale?: LocaleName
  locales?: LocaleRegistry
  localeOverrides?: DeepPartial<VTableGuildLocale>
}
// #endregion VTableGuildConfigProviderProps

// #region VTableSummaryProps
/** 文档说明用辅助接口，不是包导出。 */
export interface VTableSummaryProps {
  fixed?: SummaryFixed
}
// #endregion VTableSummaryProps

// #region VTableSummaryCellProps
/** 文档说明用辅助接口，不是包导出。index 是必填的列索引。 */
export interface VTableSummaryCellProps {
  index: number
  colSpan?: number
  rowSpan?: number
  align?: AlignType
}
// #endregion VTableSummaryCellProps

// #region cn
/** 文档说明用辅助类型，不是包导出。对象值按 truthy/falsy 决定是否添加对应 class。 */
type CnClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | CnClassValue[]

export declare const cn: <T extends CnClassValue[]>(...classes: T) => string | undefined
// #endregion cn
