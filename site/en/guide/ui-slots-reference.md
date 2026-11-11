# ui slot reference

The `ui` prop of `VTable` is the per-instance entry for style overrides. Each key corresponds to a **theme slot**, and its value is a Tailwind CSS class string that is merged intelligently with the preset's default classes through `cn()`.

```vue
<VTable
  :columns="columns"
  :data-source="data"
  :ui="{
    th: 'bg-blue-50',
    td: 'align-top',
  }"
/>
```

> [!TIP]
> After you install and import `@vtable-guild/vtable-guild`, all slot keys of the `ui` prop are autocompleted in TypeScript projects.

---

## This page is not only for `ui`

The slots and variants listed on this page are not just a reference table for the `ui` prop; they also map to how the global `theme` is written:

- `ui.th`
  maps to `theme.table.slots.th`
- `ui.td`
  maps to `theme.table.slots.td`
- `hoverable.true.td`
  maps to `theme.table.variants.hoverable.true.td`
- `size: 'small'`
  maps to `theme.table.defaultVariants.size = 'small'`

In other words, you can read this page as the complete list of what the Table theme system lets you override.

## Mapping the slot tables to the global theme

```ts
createVTableGuild({
  theme: {
    table: {
      slots: {
        th: 'bg-slate-50 text-slate-900',
        td: 'align-top',
      },
      variants: {
        hoverable: {
          true: {
            td: 'group-hover/row:bg-blue-50',
          },
        },
      },
      defaultVariants: {
        size: 'small',
      },
    },
  },
})
```

If you want an app-wide convention, read [Three-layer theme overrides](/en/guide/theme-overrides) first. If you only need to change a single table, come back to `ui`.

## Quick example: changing the row hover background

The row hover effect is controlled by the `hoverable` variant. The hover highlight is driven by JS state, so it handles cells merged across rows correctly. To customize the hover background, overriding the CSS variable is recommended:

### Option 1: override the CSS variable (recommended)

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

### Option 2: override the `tdRowHover` slot through the `ui` prop

```vue
<VTable :columns="columns" :data-source="data" :ui="{ tdRowHover: 'bg-blue-50' }" />
```

### Option 3: through the global `theme`

```ts
app.use(
  createVTableGuild({
    theme: {
      table: {
        slots: {
          tdRowHover: 'bg-blue-50',
        },
      },
    },
  }),
)
```

---

## Complete slot list

All available theme slot keys are listed below, grouped by feature. They work both in `ui` and in the global `theme.table.slots`.

### Core structure

<!-- @api: theme-reference slots-structure -->

### Header and cell wrappers

<!-- @api: theme-reference slots-cell-wrappers -->

### Grouped headers

<!-- @api: theme-reference slots-grouped-header -->

### Sorting

<!-- @api: theme-reference slots-sorting -->

### Filter icon

<!-- @api: theme-reference slots-filter-icon -->

### Filter dropdown panel

<!-- @api: theme-reference slots-filter-menu -->

### Filter tree

<!-- @api: theme-reference slots-filter-tree -->

### Empty state

<!-- @api: theme-reference slots-empty -->

### Loading state

<!-- @api: theme-reference slots-loading -->

### Selected rows

<!-- @api: theme-reference slots-row-states -->

### Row drag sorting

<!-- @api: theme-reference slots-row-drag -->

### Row selection dropdown

<!-- @api: theme-reference slots-selection-menu -->

### Title, footer and summary

<!-- @api: theme-reference slots-summary -->

### Fixed columns and fixed header

<!-- @api: theme-reference slots-fixed -->

### Expandable rows

<!-- @api: theme-reference slots-expand -->

### Tree expansion

`treeExpandIconLoading` and `treeExpandIconError` control the lazy-loading feedback and the retryable error respectively; colors, sizes and animations are defined by the preset layer.

<!-- @api: theme-reference slots-tree -->

### Field tags

`cellTag` controls the tag appearance of `valueType: 'tag'`, while `cellStatus` still controls the enum status marker. Both share `data-status` and the status color variables; a custom renderer can also return `presentation: 'tag'` to use the tag theme.

<!-- @api: theme-reference slots-tags -->

### Field progress

<!-- @api: theme-reference slots-progress -->

### Editing controls

<!-- @api: theme-reference slots-edit -->

The query area uses a separate `theme.query`; see [Schema query area](#schema-query-area).

### Column resizing

<!-- @api: theme-reference slots-resize -->

### Column width layout

<!-- @api: theme-reference slots-width-layout -->

---

## Variant list

The table applies conditional styles based on props. The global `theme.table.variants` can override the preset's conditional classes. When a table is not given `size`, you can adjust the default size through `theme.table.defaultVariants.size`.

<!-- @api: theme-reference table-variants -->

## Theme slots for the toolbar and column settings

These two components have their own theme configs: globally, use `theme.toolbar.slots` / `theme.columnSettings.slots`; per instance, use each component's own `ui`. Instance styles for the column settings inside `VTableToolbar` are passed through `columnSettings.ui`; when you use `VTableColumnSettings` on its own, pass `ui` directly.

### VTableToolbar

<!-- @api: theme-reference slots-toolbar -->

### VTableColumnSettings

<!-- @api: theme-reference slots-column-settings -->

Theme slots change styles; the Vue content slots `#actions`, `#settings` and `#columnLabel` extend content and belong to the toolbar or column settings component. See [Toolbar](/en/guide/toolbar) for complete examples.

## Theme slots for pagination, the selection alert and the query area

Pagination uses the global `theme.pagination.slots`. The selection alert and the Schema query area also have their own global theme and per-instance `ui`.

### Pagination

<!-- @api: theme-reference slots-pagination -->

### Selection alert

<!-- @api: theme-reference slots-selection-alert -->

### Schema query area

<!-- @api: theme-reference slots-query -->

## Further reading

- [Three-layer theme overrides](/en/guide/theme-overrides)
- [Table CSS variables](/en/guide/theme-tokens)
- [Presets and locales](/en/guide/presets-and-locales)
- [API Reference](/en/guide/api-reference)

## Type Declarations

`ui` uses `SlotProps<TableThemeConfig>`, whose values are optional class strings. The declarations below provide all Table theme slots and variant props; for the complete global override mapping, see the [Type reference](/en/guide/type-reference#themeoverrideconfig). The helper parameter type of `cn()` is not a package export.

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#TableSlots

<<< @/.vitepress/type-declarations/config.ts#TableVariantProps

<<< @/.vitepress/type-declarations/config.ts#TableThemeConfig

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

<<< @/.vitepress/type-declarations/config.ts#ColumnSettingsThemeTypes

<<< @/.vitepress/type-declarations/config.ts#SlotProps

<<< @/.vitepress/type-declarations/config.ts#ThemeOverrideConfig

<<< @/.vitepress/type-declarations/config.ts#cn

:::
