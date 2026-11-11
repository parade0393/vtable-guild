# Presets and locales

This part of the configuration answers two higher-level questions:

- Which UI system the overall look should match.
- Which language the table's built-in text uses, and how to override it locally.

## Live demo

The same column definitions and data, with the preset and locale switched to show the effect. This is the most distinctive point of this library: changing the skin requires neither a different table nor a different API.

<Demo src="presets-and-locales/preset-switch">

<<< @/demos/presets-and-locales/preset-switch.vue

</Demo>

> In an application you usually configure it once with `createVTableGuild({ themePreset })`. The demo above provides a scoped context in place only to compare the two skins on the same page.

## Theme presets

There are currently two built-in theme presets:

- antdv, the default preset, suited to projects that already use ant-design-vue.
- element-plus, suited to projects that already use the element-plus visual system.

Choose a preset at initialization:

```ts
app.use(
  createVTableGuild({
    themePreset: 'antdv',
  }),
)
```

To change to element-plus, switch on the JS side directly; no extra CSS is needed (`@vtable-guild/vtable-guild/css/style`, `@vtable-guild/vtable-guild/css/tailwind3` and `@vtable-guild/vtable-guild/css/tailwind4` all already contain the styles of every preset):

```ts
app.use(
  createVTableGuild({
    themePreset: 'element-plus',
  }),
)
```

You do not need to add the `data-vtg-preset` attribute to the HTML manually; the plugin handles it automatically. For more ways to integrate see [Installation and usage](/en/guide/installation).

## Built-in locales

The built-in preset locales currently cover at least the two common language scenarios zh-CN and en-US, mainly including:

- Sorting tooltip text
- Filter panel text
- Empty-state text
- Loading-state text
- Row selection menu text
- Pagination, density, column settings and toolbar text

## Register and override locale packs

To switch to English or customize the text, pass locale, locales and localeOverrides at the plugin layer:

```ts
app.use(
  createVTableGuild({
    locale: 'en-US',
    locales: {
      'en-US': {
        table: {
          header: {
            sortTriggerAsc: 'Sort ascending',
            sortTriggerDesc: 'Sort descending',
            cancelSort: 'Cancel sorting',
            filterTriggerAriaLabel: 'Filter',
          },
          filterDropdown: {
            searchPlaceholder: 'Search filters',
            emptyText: 'No filters',
            resetText: 'Reset',
            confirmText: 'OK',
            selectAllText: 'Select all',
          },
          empty: { text: 'No data' },
          loading: { text: 'Loading...' },
          selection: {
            selectAll: 'Select all',
            selectInvert: 'Invert selection',
            selectNone: 'Clear selection',
            selectionsTriggerAriaLabel: 'Selection options',
          },
        },
      },
    },
  }),
)
```

If you only want to override a few fields, prefer localeOverrides; there is no need to rewrite the whole locale.

`selection.selectionsTriggerAriaLabel` is the accessible name of the bulk selection menu trigger in the header (the button name announced by screen readers), with the built-in values `选择操作` / `Selection options`. It is an optional field: existing locale packs do not need to add it, and the built-in text is used when it is missing.

## Scoped switching

When you need to override the locale or theme styles inside a subtree, use `VTableGuildConfigProvider`:

```vue
<VTableGuildConfigProvider locale="en-US">
  <VTable :columns="columns" :data-source="dataSource" />
</VTableGuildConfigProvider>
```

This approach suits local comparison pages, multilingual admin consoles or embedded application modules.

The provider supports `theme`, `cssMode`, `classPrefix`, `locale`, `locales` and `localeOverrides`; see the declarations at the end of the page for the full types. `themePreset` and `compatClass` are inherited from the plugin context; the preset is configured through `createVTableGuild({ themePreset })`, and the provider does not have these two props.

## Related pages

- [Three-layer theme overrides](/en/guide/theme-overrides)
- [Installation and usage](/en/guide/installation)

## Pagination locale

Locale packs provide an optional `pagination` group; existing locale packs need no changes. Chinese and English are built in; override globally with `localeOverrides.pagination`, or per instance with `pagination.locale` (highest priority). See `VTableGuildPaginationLocale` for the full fields; `prev_pages` / `next_pages` are optional jump text templates, where `{count}` is replaced with the number of pages jumped.

`localeOverrides` supports deep partial overrides, including the optional `pagination`, `columnSettings` and `toolbar` groups, so you can pass just a few fields. The per-instance `pagination.locale` also supports partial overrides.

```ts
import { createVTableGuild } from '@vtable-guild/vtable-guild'

app.use(
  createVTableGuild({
    localeOverrides: {
      pagination: { items_per_page: 'records / page' },
      columnSettings: { reset: 'Restore default columns' },
      toolbar: { reload: 'Reload data' },
    },
  }),
)
```

## Toolbar and column settings locale

`columnSettings` and `toolbar` are also optional locale groups; existing locale packs do not need to add them. Default text is built in for Chinese and English and follows the `locale` of the plugin or provider; use `localeOverrides.columnSettings` / `localeOverrides.toolbar` to override the global text.

`VTableToolbar.locale` overrides toolbar text such as refresh and fullscreen, and `columnSettings.locale` overrides the text of the inner column settings; when using `VTableColumnSettings` on its own, pass `locale` directly. Per-instance overrides take precedence over the global configuration. For component usage see [Toolbar](/en/guide/toolbar) and [Column display and order](/en/guide/column-display).

## Type Declarations

Below are the complete configuration and locale declarations used on this page. For the types that theme overrides depend on see the [Type reference](/en/guide/type-reference#vtableguildthemeoverrides). The provider props interface is a documentation helper type, not a package export.

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildConfigProviderProps

<<< @/.vitepress/type-declarations/config.ts#VTableGuildContext

<<< @/.vitepress/type-declarations/config.ts#VTABLE_GUILD_INJECTION_KEY

<<< @/.vitepress/type-declarations/config.ts#LocaleName

<<< @/.vitepress/type-declarations/config.ts#BuiltInLocaleName

<<< @/.vitepress/type-declarations/config.ts#LocaleRegistry

<<< @/.vitepress/type-declarations/config.ts#DeepPartial

<<< @/.vitepress/type-declarations/config.ts#VTableGuildLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableHeaderLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableFilterDropdownLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableEmptyLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLoadingLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableSelectionLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildPaginationLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildColumnSettingsLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildToolbarLocale

<<< @/.vitepress/type-declarations/config.ts#PaginationLocaleConstants

:::
