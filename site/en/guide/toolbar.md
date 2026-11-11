---
title: Toolbar
description: Use VTableToolbar to combine reload, density, column settings and fullscreen, and add application actions such as export and create through the actions and settings slots.
---

# Toolbar

`VTableToolbar` provides a title, an application action area and common tools. Its layout follows React ProTable, and it supports the Ant Design Vue and Element Plus presets. Put it in the `title` slot of `VTable` to use it.

Reload, density and column settings are provided by default; fullscreen is opt-in. Application capabilities such as export, create and batch actions are added through slots, and can use buttons from the UI library your project already has installed.

## Adding an export button

The "Export CSV" button below comes from `#actions` and is displayed side by side with the built-in tools. The example reads `data` from the `title` slot and the toolbar's controlled column configuration, and exports only the visible fields of the currently displayed data; after column settings, pagination or filtering change, the application can choose to export the current page, all data or the selected records.

<Demo src="toolbar/basic">

<<< @/demos/toolbar/basic.vue

</Demo>

The component does not make data requests or convert export files. You can replace the export function in the example with Excel, PDF or a server-side export job; the button's permissions, confirmation and progress are up to the application.

## Search, filtering and view switching

`search` enables a combined keyword input with a search icon button on its right, 32px high by default. When you only care about the submitted result, listening to `search` is enough: pressing Enter, clicking the search button or clicking the clear icon all trigger it, with the submitted keyword as the argument, which is an empty string on clear.

```vue
<VTableToolbar search @search="keyword = $event" />
```

The input draft is held by the component by default, and input changes do not submit or reload automatically. When you need to read or modify the draft from outside (for example a "Reset" button that also clears the input), take it over with `v-model:search-value`; the input then always displays the value passed in.

The clear icon triggers `update:searchValue('')`, `clearSearch` and `search('')` in that order. Handle the request for an empty keyword in `search`; `clearSearch` only serves to tell the "clear" action apart, so do not send the request again in both events.

`#filter` holds the filter controls your application already has; by default it shares a row with the action buttons, and `multipleLine` moves it to a second row. `#extra` always takes a full row of its own and can combine Tabs, a selection alert or other application content. Whether the state, page number and selection reset when the view switches is up to the application.

<Demo src="toolbar/search">

<<< @/demos/toolbar/search.vue

</Demo>

`#search` can replace the built-in search control entirely. It shares `searchValue`, `updateSearchValue(value)`, `submitSearch(value?)` and `clearSearch()` with the other toolbar slots, and the draft can likewise be left unbound. During `loading` the search draft can still be modified while submitting and clearing are temporarily disabled; `disabled` disables both the input and the actions. Submitting with Enter skips the IME composition state.

```vue
<VTableToolbar @search="submitQuery">
  <template #search="{ searchValue, updateSearchValue, submitSearch, disabled }">
    <a-input-search
      :value="searchValue"
      :disabled="disabled"
      @update:value="updateSearchValue"
      @search="submitSearch"
    />
  </template>
</VTableToolbar>
```

## Toggling and replacing

Hide an individual built-in tool through `options`; `false` turns off all built-in tools. `#actions` and `#settings` are kept, so application buttons can be used on their own.

```vue
<VTableToolbar
  v-model:columns="columns"
  v-model:size="size"
  title="Orders"
  :options="{ reload: false, density: false }"
>
  <template #actions="{ disabled }">
    <a-button :disabled="disabled" @click="exportOrders">Export Excel</a-button>
    <a-button type="primary" :disabled="disabled" @click="createOrder">New order</a-button>
  </template>
</VTableToolbar>
```

`#title` customizes the title area. `#settings` replaces the built-in tools area entirely, which suits custom icons, action order or menus; the slot params provide the `reload` and `toggleFullscreen` methods and the current state.

```vue
<VTableToolbar title="Orders" :loading="loading" @reload="loadOrders">
  <template #title><strong>Orders</strong><a-tag>This month</a-tag></template>
  <template #settings="{ reload, loading, disabled }">
    <a-button :loading="loading" :disabled="disabled" @click="reload">Reload</a-button>
  </template>
</VTableToolbar>
```

## State

- `columns` and `size` are shared with the table and accept updates through `v-model`. Without `columns`, column settings are hidden; without `size`, the default density of the table theme is read.
- Reload only triggers `reload`. The application sets `loading` during the request; the reload button shows a loading state and prevents repeated clicks, while density and column settings remain usable.
- `disabled` disables the built-in actions. Custom buttons read `disabled` and `loading` from the slot params and decide their own disabling rules.

## Fullscreen

When the toolbar is placed in the `title` or `footer` slot of `VTable`, enabling `options.fullScreen` is all it takes, and the whole table (including the title and pagination) enters browser fullscreen:

```vue
<VTable :columns="columns" :data-source="rows">
  <template #title>
    <VTableToolbar :options="{ fullScreen: true }" />
  </template>
</VTable>
```

When content outside the table, such as a query form, needs to go fullscreen together with it, or the toolbar is not inside a table slot, specify an element with `fullscreenTarget`; it takes precedence over the containing table:

```vue
<div ref="page">
  <QueryForm />
  <VTableToolbar :options="{ fullScreen: true }" :fullscreen-target="() => page" />
  <VTable :columns="columns" :data-source="rows" />
</div>
```

- A fullscreen table uses `--vtg-table-bg` as its background and scrolls when the content exceeds the screen. The background, padding and scrolling of a custom target are set by the application through `:fullscreen`.
- The button is disabled when there is no usable target or the browser does not support fullscreen; when the toolbar is neither inside a table nor given a `fullscreenTarget`, a warning is issued in development.
- `fullscreenChange` fires after the browser confirms the change, and exiting with Escape is synced too; `fullscreenError` fires when the request is rejected.
- In fullscreen, the filter menu, column settings, page size menu and tooltips are mounted inside the fullscreen element by default. When you customize the container through `getPopupContainer`, it should return a descendant of the fullscreen element.

## API

`TRecord` is the application row type.

### Props

<!-- @api: reference toolbar-props -->

### options

Switches for the built-in tools. `fixed` and `draggable` are passed to the column settings panel.

<!-- @api: reference toolbar-options -->

### search

The configuration fields when `search` is an object; passing `true` uses the defaults.

<!-- @api: reference toolbar-search-config -->

### columnSettings

The configuration passed to the embedded column settings panel; the fields mean the same as the props of the same name on [`VTableColumnSettings`](/en/guide/column-display#panel-api).

<!-- @api: reference toolbar-column-settings -->

### Events

<!-- @api: reference toolbar-events -->

### Slots

<!-- @api: reference toolbar-slots -->

### Slot Props

Every slot except `columnLabel` receives `TableToolbarSlotProps<TRecord>`.

<!-- @api: reference toolbar-slot-props -->

## Themes and locales

The toolbar uses the global `theme.toolbar.slots` or the per-instance `ui`; the embedded column settings are overridden through `theme.columnSettings.slots` or `columnSettings.ui`.

Toolbar text follows the global locale and supports `localeOverrides.toolbar` and the per-instance `locale`. Column settings text is still controlled by `columnSettings.locale` or `localeOverrides.columnSettings`.

The theme code lists the default classes of the toolbar and of the column settings panel separately.

### ui slots

<!-- @api: ui toolbar -->

### Preset defaults

<!-- @api: theme toolbar -->

### CSS variables

<!-- @api: css-vars toolbar -->

## Type Declarations

::: details Toolbar types

<<< @/.vitepress/type-declarations/toolbar.ts

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/config.ts#VTableGuildToolbarLocale

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

:::
