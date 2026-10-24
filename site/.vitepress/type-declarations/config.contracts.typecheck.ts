import {
  cn,
  createVTableGuild,
  VTableGuildConfigProvider,
  VTableSummary,
  VTableSummaryCell,
  VTABLE_GUILD_INJECTION_KEY,
} from '@vtable-guild/vtable-guild'
import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from './config'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T
// 辅助接口描述可传入的 props；Vue 实例上的 readonly 修饰不限制调用方。
type PropInputs<T> = { -readonly [K in keyof T]: T[K] }

/** 所有手工声明都对比推荐包入口，而不是内部源码路径。 */
export type ConfigDeclarationContracts = [
  Assert<Equal<Docs.ThemeConfig, Public.ThemeConfig>>,
  Assert<Equal<Docs.ToolbarSlots, Public.ToolbarSlots>>,
  Assert<Equal<Docs.ToolbarThemeConfig, Public.ToolbarThemeConfig>>,
  Assert<Equal<Docs.VTableGuildToolbarLocale, Public.VTableGuildToolbarLocale>>,
  Assert<Equal<Docs.SelectionAlertSlots, Public.SelectionAlertSlots>>,
  Assert<Equal<Docs.SelectionAlertThemeConfig, Public.SelectionAlertThemeConfig>>,
  Assert<Equal<Docs.VTableGuildSelectionAlertLocale, Public.VTableGuildSelectionAlertLocale>>,
  Assert<Equal<Docs.SlotProps<Docs.TableThemeConfig>, Public.SlotProps<Public.TableThemeConfig>>>,
  Assert<
    Equal<Docs.DeepPartial<Docs.VTableGuildLocale>, Public.DeepPartial<Public.VTableGuildLocale>>
  >,
  Assert<Equal<Docs.ThemePresetName, Public.ThemePresetName>>,
  Assert<Equal<Docs.VTableGuildCssMode, Public.VTableGuildCssMode>>,
  Assert<Equal<Docs.TableSlots, Public.TableSlots>>,
  Assert<Equal<Docs.TableVariantProps, Public.TableVariantProps>>,
  Assert<Equal<Docs.TableThemeConfig, Public.TableThemeConfig>>,
  Assert<Equal<Docs.ButtonSlots, Public.ButtonSlots>>,
  Assert<Equal<Docs.ButtonThemeConfig, Public.ButtonThemeConfig>>,
  Assert<Equal<Docs.CheckboxSlots, Public.CheckboxSlots>>,
  Assert<Equal<Docs.CheckboxThemeConfig, Public.CheckboxThemeConfig>>,
  Assert<Equal<Docs.RadioSlots, Public.RadioSlots>>,
  Assert<Equal<Docs.RadioThemeConfig, Public.RadioThemeConfig>>,
  Assert<Equal<Docs.InputSlots, Public.InputSlots>>,
  Assert<Equal<Docs.InputThemeConfig, Public.InputThemeConfig>>,
  Assert<Equal<Docs.TooltipSlots, Public.TooltipSlots>>,
  Assert<Equal<Docs.TooltipThemeConfig, Public.TooltipThemeConfig>>,
  Assert<Equal<Docs.ScrollbarSlots, Public.ScrollbarSlots>>,
  Assert<Equal<Docs.ScrollbarThemeConfig, Public.ScrollbarThemeConfig>>,
  Assert<Equal<Docs.PaginationSlots, Public.PaginationSlots>>,
  Assert<Equal<Docs.PaginationThemeConfig, Public.PaginationThemeConfig>>,
  Assert<Equal<Docs.ColumnSettingsThemeConfig, Public.ColumnSettingsThemeConfig>>,
  Assert<Equal<Docs.ColumnSettingsSlots, Public.ColumnSettingsSlots>>,
  Assert<Equal<Docs.VTableGuildColumnSettingsLocale, Public.VTableGuildColumnSettingsLocale>>,
  Assert<Equal<Docs.VTableGuildThemeOverridesMap, Public.VTableGuildThemeOverridesMap>>,
  Assert<Equal<Docs.VTableGuildThemeOverrides, Public.VTableGuildThemeOverrides>>,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.TableThemeConfig>,
      Public.ThemeOverrideConfig<Public.TableThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.ButtonThemeConfig>,
      Public.ThemeOverrideConfig<Public.ButtonThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.CheckboxThemeConfig>,
      Public.ThemeOverrideConfig<Public.CheckboxThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.RadioThemeConfig>,
      Public.ThemeOverrideConfig<Public.RadioThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.InputThemeConfig>,
      Public.ThemeOverrideConfig<Public.InputThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.TooltipThemeConfig>,
      Public.ThemeOverrideConfig<Public.TooltipThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.ScrollbarThemeConfig>,
      Public.ThemeOverrideConfig<Public.ScrollbarThemeConfig>
    >
  >,
  Assert<
    Equal<
      Docs.ThemeOverrideConfig<Docs.PaginationThemeConfig>,
      Public.ThemeOverrideConfig<Public.PaginationThemeConfig>
    >
  >,
  Assert<Equal<Docs.LocaleName, Public.LocaleName>>,
  Assert<Equal<Docs.BuiltInLocaleName, Public.BuiltInLocaleName>>,
  Assert<Equal<Docs.LocaleRegistry, Public.LocaleRegistry>>,
  Assert<Equal<Docs.VTableGuildLocale, Public.VTableGuildLocale>>,
  Assert<Equal<Docs.VTableGuildTableLocale, Public.VTableGuildTableLocale>>,
  Assert<Equal<Docs.VTableGuildTableHeaderLocale, Public.VTableGuildTableHeaderLocale>>,
  Assert<
    Equal<Docs.VTableGuildTableFilterDropdownLocale, Public.VTableGuildTableFilterDropdownLocale>
  >,
  Assert<Equal<Docs.VTableGuildTableEmptyLocale, Public.VTableGuildTableEmptyLocale>>,
  Assert<Equal<Docs.VTableGuildTableLoadingLocale, Public.VTableGuildTableLoadingLocale>>,
  Assert<Equal<Docs.VTableGuildTableSelectionLocale, Public.VTableGuildTableSelectionLocale>>,
  Assert<Equal<Docs.VTableGuildPaginationLocale, Public.VTableGuildPaginationLocale>>,
  Assert<Equal<typeof Docs.paginationZhCN, typeof Public.paginationZhCN>>,
  Assert<Equal<typeof Docs.paginationEnUS, typeof Public.paginationEnUS>>,
  Assert<Equal<typeof Docs.elementPlusPaginationZhCN, typeof Public.elementPlusPaginationZhCN>>,
  Assert<Equal<typeof Docs.elementPlusPaginationEnUS, typeof Public.elementPlusPaginationEnUS>>,
  Assert<Equal<Docs.VTableGuildOptions, Public.VTableGuildOptions>>,
  Assert<Equal<Docs.VTableGuildContext, Public.VTableGuildContext>>,
  Assert<Equal<typeof Docs.createVTableGuild, typeof createVTableGuild>>,
  Assert<Equal<typeof Docs.VTABLE_GUILD_INJECTION_KEY, typeof VTABLE_GUILD_INJECTION_KEY>>,
]

export type ComponentDeclarationContracts = [
  Assert<
    Equal<
      Docs.VTableGuildConfigProviderProps,
      Pick<
        InstanceType<typeof VTableGuildConfigProvider>['$props'],
        keyof Docs.VTableGuildConfigProviderProps
      >
    >
  >,
  Assert<
    Equal<
      Docs.VTableSummaryProps,
      Pick<InstanceType<typeof VTableSummary>['$props'], keyof Docs.VTableSummaryProps>
    >
  >,
  Assert<
    Equal<
      Docs.VTableSummaryCellProps,
      PropInputs<
        Pick<InstanceType<typeof VTableSummaryCell>['$props'], keyof Docs.VTableSummaryCellProps>
      >
    >
  >,
]

export const pluginOptions: Public.VTableGuildOptions = {
  themePreset: 'element-plus',
  cssMode: 'prebuilt',
  classPrefix: 'vtg',
  compatClass: true,
  theme: {
    table: {
      slots: { th: 'font-semibold' },
      variants: { bordered: { true: { root: 'rounded-xl' } } },
      compoundSlots: [{ slots: ['th', 'td'], size: 'small', class: 'px-2' }],
      defaultVariants: { size: 'small', hoverable: false },
    },
    pagination: { slots: { left: 'gap-2' }, defaultVariants: { align: 'left' } },
  },
  locale: 'en-US',
  localeOverrides: {
    table: { empty: { text: 'No results' } },
    pagination: { page: 'Page' },
    columnSettings: { reset: 'Restore columns' },
    toolbar: { reload: 'Refresh rows' },
  },
}

export const plugin = createVTableGuild(pluginOptions)
export const providerProps: Docs.VTableGuildConfigProviderProps = {
  theme: pluginOptions.theme,
  locale: 'en-US',
  localeOverrides: { table: { loading: { text: 'Loading rows' } } },
}
export const summaryProps: Docs.VTableSummaryProps = { fixed: 'bottom' }
export const summaryCellProps: Docs.VTableSummaryCellProps = {
  index: 0,
  colSpan: 2,
  align: 'right',
}
export const classes: string | undefined = cn('px-2', ['px-4', false], { 'font-bold': true })

export const docsCn: typeof Docs.cn = cn
export const publicCn: typeof cn = docsCn
