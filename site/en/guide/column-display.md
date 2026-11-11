---
title: Column display and order
description: Configure column visibility, fixing and order with VTableColumnSettings, and save user preferences with useColumnState.
---

# Column display and order

`VTableColumnSettings` gives a table column visibility, fixing, drag sorting and density switching. The panel and the table bind to the same `columns` and `size`: the panel only emits updates, and your application owns the applied state.

## Column settings panel

<Demo src="column-display/settings">

<<< @/demos/column-display/settings.vue

</Demo>

`v-model:columns` receives the new columns array; `v-model:size` receives `'large' | 'middle' | 'small'` and follows the table theme's default density when omitted. Both must also be passed to the table to take effect. The panel can go in the table's `title` slot or in an external toolbar; when you need a title, export, reload and fullscreen, use [VTableToolbar](/en/guide/toolbar).

The panel only adjusts top-level columns: dragging reorders within the same fixed region, the fix buttons move a column across regions, and a group moves as a whole. The order is written straight back to `columns`, so do not also pass [`columnOrder`](#column-order-columnorder) to the table, or it overrides the panel's order. "Reset" only restores visibility; to restore order and fixing as well, use [`useColumnState().reset()`](#saving-user-preferences).

### Column configuration

- Give columns and groups a stable `key` that is unique among siblings; when omitted, `dataIndex` and then the position are used. After columns without a stable identity are reordered, a reset may map to the wrong column.
- A function `title` is not called by the panel, which shows `key` / `dataIndex` by default; provide a label through `#columnLabel="{ column }"`.
- `hideInSetting: true` keeps a column and its children out of the panel and out of select-all and reset, without affecting how the table displays them.
- `disable: true` locks visibility, fixing and order; the object form locks `checkbox`, `fixed` and `order` separately. A column with a locked order is a drag boundary that other columns cannot cross.

::: details More behavior details

- When a group is hidden, its children are temporarily disabled and keep their own visibility state; when a group contains a child with locked visibility, the whole group cannot be hidden. The panel allows hiding every application column.
- Fixing a group syncs all of its leaf columns; when a child forbids fixing, the whole group cannot be fixed. Fixed columns move to the corresponding end.
- `EXPAND_COLUMN` / `SELECTION_COLUMN` do not appear in the panel and keep their positions.
- Checked means `visible !== false`; a column with `responsive` may still be hidden at the current breakpoint.
- The reset baseline is the visibility the panel first received, so preferences loaded before the panel mounts also become the baseline. Dynamically added columns use their state when they first appear, and removed columns are not added back. To rebuild the baseline, change the panel's Vue `key` to remount it.
- Column width, sorting and filtering are not affected by panel actions.
- Buttons and checkboxes can be operated with the keyboard; Escape closes the panel and returns to the trigger, and tabbing out of the panel closes it.

:::

### Changes not taking effect?

| Symptom                                                                       | Cause                                                                | Fix                                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| After switching density, neither the selected item nor the row height changes | Density is controlled and `size` is not bound                        | Use `v-model:size` on the panel and pass the same value to the table's `size`           |
| After checking, fixing or dragging, the panel does not change                 | The `columns` update emitted by the panel is not received            | Use `v-model:columns` on the panel and pass the same columns to the table               |
| After dragging, the panel order changes but the table order does not          | `columnOrder` is passed as well and overrides the order of `columns` | Remove `columnOrder` and write the initial order in `columns`                           |
| After fixing, nothing is visible while scrolling                              | The table does not scroll horizontally                               | Make `scroll.x` larger than the container width, or shrink the container and look again |
| After clicking "Reset", order and fixing are not restored                     | "Reset" only restores visibility                                     | Use `useColumnState().reset()`                                                          |

### Panel API

Props, events and slots of `VTableColumnSettings`. `TRecord` is the application row type.

#### Props {#column-settings-props}

<!-- @api: reference column-settings-props -->

#### options {#column-settings-options}

<!-- @api: reference column-settings-options -->

#### Events {#column-settings-events}

The panel does not trigger the table's `change` event.

<!-- @api: reference column-settings-events -->

#### Slots {#column-settings-slots}

<!-- @api: reference column-settings-slots -->

## Saving user preferences

When columns are only adjusted on the current page, holding them in a `ref` is enough. When preferences must survive a reload, be [saved to the server](#saving-to-the-server) per user, or when column definitions change with the locale or permissions, use `useColumnState`: it combines the source column definitions and the user preferences into a writable `columns` that you bind to both the table and the panel. After the source definitions update, the recorded preferences are layered onto the new definitions.

<Demo src="column-display/preferences">

<<< @/demos/column-display/preferences.vue

</Demo>

```ts
const { columns, state, setState, reset, restore, save } = useColumnState(baseColumns, {
  storageKey: 'members:columns',
  storageType: 'localStorage',
  version: 1,
})
```

- `baseColumns` accepts an array, a ref or a getter. Assigning to `columns` only records preferences and does not write back to the source definitions; renderers, sorters and the like always come from the source definitions.
- `state` is the read-only applied preferences, indexed by paths generated from each column's `key` / `dataIndex`; it can be saved as is and restored through `setState`. Do not rely on how the path strings are concatenated.
- `setState` replaces the preferences and ignores invalid fields; added columns use the source definitions, and removed columns are not restored.
- `defaultValue` is the default preferences given by the application, and `reset` restores to it, so do not use it to load preferences the user has saved.
- `reset` restores the first recorded visibility, fixing, order and `defaultValue`; it does not restore column width, density, sorting or filtering.
- The lock rules also constrain restored preferences, so old storage cannot hide or move protected columns.

### Storage, versions and restoring

- With `storageKey` configured, preferences are written to storage automatically when they change and read in `onMounted`; nothing is read during server-side rendering. `storageType` can be `localStorage` / `sessionStorage`, or you can pass a `storage` that implements synchronous `getItem / setItem / removeItem`. Without `storageKey`, no storage is read or written.
- `version` defaults to `1` and is written together with the preferences. When the version does not match on read, the saved preferences are ignored and the table displays the source definitions and `defaultValue`.
- Adding or removing columns in the source definitions does not require bumping `version`: added columns use the source definitions, and removed columns are ignored. Users with saved preferences, however, see added columns at the end of their fixed region. Bump `version` when you want new columns to appear at their defined position, or when you changed the default visibility, fixing or order and want everyone to see the new defaults; bumping discards the saved preferences of all users.
- `restore` re-reads the preferences from storage and is already called once automatically on mount; it keeps the current preferences when there is no storage or the version does not match. When another tab modifies the same preferences, call it in the `storage` event of `window` to sync.
- `save` writes the current preferences to storage. Preference changes and `reset` both save automatically, so you usually do not need to call it; after bumping `version`, old data is only overwritten the next time the user changes a preference, so call it once to overwrite immediately.
- Unavailable storage and JSON errors are reported through `onError(error)` and do not affect rendering.

### Saving to the server

The `storage` adapter is a synchronous interface and does not suit asynchronous requests. To save to the server, do not configure `storageKey`; load with `setState`, save by watching `state`, and carry the version yourself:

```ts
const COLUMN_VERSION = 1
const { columns, state, setState, reset } = useColumnState(baseColumns)

let stop: (() => void) | undefined
onMounted(async () => {
  try {
    const saved = await api.getColumnPreference('system-user')
    if (saved?.version === COLUMN_VERSION) setState(saved.state)
  } finally {
    // Watch only after loading, so the just-loaded preferences are not written back
    stop = watch(
      state,
      debounce((value) => {
        api.saveColumnPreference('system-user', { version: COLUMN_VERSION, state: value })
      }, 500),
      { deep: true },
    )
  }
})
onUnmounted(() => stop?.())
```

Before the preferences load, the table displays the source definitions; if you do not want the switch to be visible, render the table after loading completes. The panel's "Reset" and `reset()` both change `state`, so they are saved as well.

### Saving in application code

Without `useColumnState`, save only serializable values such as column keys, visibility and density; do not serialize the whole column configuration, or function renderers and sorters are lost. On read, validate the structure, column keys and density value first, then merge them back into the column definitions; groups, fixing, order and versions are yours to handle.

::: details Example of saving visibility for flat columns

```ts
watch([columns, size], ([currentColumns, currentSize]) => {
  const visibility = currentColumns.flatMap((column) =>
    typeof column !== 'symbol' && column.key !== undefined
      ? [{ key: column.key, visible: column.visible !== false }]
      : [],
  )
  try {
    localStorage.setItem('members-table:v1', JSON.stringify({ size: currentSize, visibility }))
  } catch {
    // Keep the table usable when storage is unavailable.
  }
})
```

:::

## Without the panel

The panel is built on two table props: the column-level `visible` controls whether a column is displayed, and the table-level `columnOrder` controls the display order. You can also use them directly to implement your own column management; the example below toggles visibility with checkboxes and adjusts the order with the ‹ › buttons:

<Demo src="column-display/basic">

<<< @/demos/column-display/basic.vue

</Demo>

### Column visibility: visible

Set `visible: false` on a column to remove it from the header and body. It is a controlled prop: to display the column again, change `visible` back or delete the field.

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
  // The user unchecked this column in "Column settings"
  { title: 'Age', dataIndex: 'age', key: 'age', width: 96, visible: false },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
]
```

- Hiding only affects the display layer. Active sort / filter state on the column is **not** discarded: when you hide a column that is being sorted, the row order is still affected by it, and the sort still applies once the column is displayed again.
- A column group with `visible: false` hides the whole group; when all children of a group are hidden, the empty group is removed as well.
- It can be combined with `responsive`: the column is not displayed when either condition fails.

### Column order: columnOrder

The type of `columnOrder` is `Key[]`, where `Key = string | number`. Do not pass it when using the column settings panel.

```vue
<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :column-order="['status', 'name']"
  />
</template>
```

With the configuration above, the columns render in the order `status → name → age` (if `columns` contains other columns that are not mentioned):

- Columns that appear in `columnOrder` come first in array order; when the same key appears more than once, its first position is used.
- Columns that do not appear (including columns without a key) keep their relative order and come after the matched columns.
- The selection / expand columns do not take part in order matching and stay at the start of the row.
- Only top-level columns are reordered: a column group moves as a whole, and moving a child out of its group is not supported.

## Known limitations

- Reordering may break the structure where left-fixed columns form a prefix and right-fixed columns form a suffix. In non-virtual mode sticky fixed columns still work, but the fixed column shadows may misbehave when fixed and non-fixed columns are interleaved; with `virtualColumn` horizontal virtualization enabled, a structure that does not hold produces a dev warning and falls back to rendering all columns.
- Width overrides from column resizing are recorded by column key and are kept automatically after reordering.

## API

`TRecord` is the application row type. See [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props column-display -->

### Column fields

<!-- @api: columns column-display -->

## Theming

The classes of the column settings panel can be overridden through the per-instance `ui` of `VTableColumnSettings` or the global `theme.columnSettings.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui column-display -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how utilities are overridden in the default prebuilt mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme column-display -->

### CSS variables

The table lists the default values for light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars column-display -->

## Type Declarations

`visible` and `responsive` belong to the column configuration, and `columnOrder` belongs to the table configuration. The props / column configuration are excerpts of the relevant fields; `DisplayColumnFields` and `ColumnOrderFields` are documentation helper interfaces, not package exports. See [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSize

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsProps

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSlots

<<< @/.vitepress/type-declarations/config.ts#VTableGuildColumnSettingsLocale

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#Breakpoint

<<< @/.vitepress/type-declarations/features.ts#DisplayColumnFields

<<< @/.vitepress/type-declarations/features.ts#ColumnOrderFields

:::

## Related pages

- [Column resizing](/en/guide/column-resize)
- [Fixed columns](/en/guide/fixed-columns)
- [API Reference](/en/guide/api-reference)
