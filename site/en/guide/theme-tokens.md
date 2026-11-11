# Table CSS variables

If what you want to change are token values such as colors, font sizes, spacing, empty-state dimensions or the loading mask, override CSS variables instead of rewriting slot classes directly.

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
  --vtg-table-header-bg: #f8fafc;
}
```

This approach suits:

- keeping the preset and slot structure and changing only visual tokens
- sharing one set of visual rules across multiple pages and multiple table instances
- reducing the maintenance cost of rewritten classes when you upgrade presets in the future

## Recommended priority

Generally choose in this order:

1. To change only values such as colors, font sizes and spacing, use CSS variables
2. To change the class structure of a slot, use the global `theme` or the per-instance `ui`
3. To change the content structure, use Vue slots

The preset values in the tables are for light mode. If dark mode overrides a variable, the page uses the dark value.

## Core visual variables

<!-- @api: theme-reference tokens-core -->

## Field tag variables

`valueType: 'tag'` and renderers that return `presentation: 'tag'` use the same tokens. Status colors reuse `--vtg-cell-success / warning / error` and `--color-primary`.

<!-- @api: theme-reference tokens-tags -->

## Row state variables

<!-- @api: theme-reference tokens-row-states -->

> [!WARNING]
> `--vtg-table-row-striped-bg` is read only by the element-plus preset. **The default antdv preset hard-codes the striped row background in the slot class** (`rgba(0, 0, 0, 0.02)`, matching native antdv), so overriding this variable has no effect. To change striped rows under the antdv preset, override the `td` slot:
>
> ```vue
> <VTable :striped="true" :ui="{ td: 'group-even/row:bg-slate-50' }" />
> ```

## Typography and spacing variables

<!-- @api: theme-reference tokens-spacing -->

## Filter panel variables

<!-- @api: theme-reference tokens-filter -->

## Empty and loading state variables

<!-- @api: theme-reference tokens-empty-loading -->

> [!NOTE]
> The empty-state illustration variables mainly serve the current built-in empty-state visuals, the antdv preset in particular. If you only care about the empty-state text or layout, changing the `empty`, `emptyWrapper` and `emptyText` slots is usually more direct.

## Common scenarios

### Change the header background and border

```css
:root {
  --vtg-table-header-bg: #f8fafc;
  --vtg-table-border-color: #e2e8f0;
}
```

### Change the hover and selected states

```css
:root {
  --vtg-table-row-hover-bg: #eff6ff;
  --vtg-table-row-selected-bg: #dbeafe;
  --vtg-table-row-selected-hover-bg: #bfdbfe;
}
```

### Change compact spacing everywhere

```css
:root {
  --vtg-table-cell-padding-inline-sm: 10px;
  --vtg-table-cell-padding-block-sm: 6px;
}
```

## How variables, theme and ui divide the work

- To change only token values: prefer CSS variables
- To change the slot class structure everywhere: use the global `theme`
- To change a single table: use `ui`

## Pagination tokens

Colors reference semantic tokens and follow dark mode automatically.

<!-- @api: theme-reference tokens-pagination -->

## Table popup tokens

Filtering, bulk selection, column settings, density and page size share the following appearance variables. The background reuses `--color-surface`.

<!-- @api: theme-reference tokens-popup -->

## Toolbar and column settings tokens

Both presets support the variables below. Colors, the font family, the body font size and checkboxes reuse the existing semantic and component tokens, and can be adjusted together with `theme.toolbar.slots`, `theme.columnSettings.slots` or the per-instance `ui`.

<!-- @api: theme-reference tokens-toolbar -->

Application buttons such as export and create are provided by your project's UI library and use that library's style configuration. The toolbar is responsible for the layout of the button area; see [Toolbar](/en/guide/toolbar) for usage.

## Editor controls

<!-- @api: theme-reference tokens-editor -->

## Schema query area

Layout variables control the grid, label width, action spacing and the lightweight (`light`) layout. See [Schema query](/en/guide/schema-query) for usage.

<!-- @api: theme-reference tokens-query -->

## Selection alert

<!-- @api: theme-reference tokens-selection-alert -->

## Field progress

<!-- @api: theme-reference tokens-progress -->

The fill color reuses `--color-primary` and the cell status color variables; the success / error icons follow the status colors.

## Related pages

- [Three-layer theme overrides](/en/guide/theme-overrides)
- [ui slot reference](/en/guide/ui-slots-reference)
- [Presets and locales](/en/guide/presets-and-locales)
