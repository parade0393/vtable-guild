# Row selection

rowSelection enables the row selection column and manages single selection, multiple selection, select-all, custom batch selection and tree linkage in one place.

If your page needs things like batch actions, editing in a side panel after checking rows, or exporting the selected items, this is the set of features you will reach for most often.

## Live demo

Controlled multiple selection, a single row disabled through `getCheckboxProps`, and the header selections dropdown (with one custom item).

<Demo src="selection/basic">

<<< @/demos/selection/basic.vue

</Demo>

## Basic multiple selection

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType, type RowSelection } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  disabled?: boolean
}

const columns: TableColumnsType<UserRow> = [{ title: 'Name', dataIndex: 'name', key: 'name' }]

const rowSelection: RowSelection<UserRow> = {
  type: 'checkbox',
  getCheckboxProps: (record) => ({
    disabled: record.disabled,
  }),
}

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada' },
  { key: '2', name: 'Grace', disabled: true },
]
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :row-selection="rowSelection"
  />
</template>
```

## Controlled selection

When the selection has to stay in sync with page state, a side action panel or API requests, use controlled mode directly.

The snippet below reuses `UserRow` from the basic example. `RowSelection<UserRow>` gives inline callbacks their contextual types: the `onChange` parameters are `Key[]` and `UserRow[]`, so you don't need to annotate them one by one.

```ts
import { computed, ref } from 'vue'
import type { Key, RowSelection } from '@vtable-guild/vtable-guild'

const selectedRowKeys = ref<Key[]>([])

const rowSelection = computed<RowSelection<UserRow>>(() => ({
  type: 'checkbox',
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = [...keys]
  },
}))
```

## Single selection and batch selection

- type: 'radio' switches to single selection mode.
- selections: true enables the default batch selection menu.
- selections also accepts custom menu items, for application actions such as "select only the current results" or "select only actionable rows".
- hideSelectAll hides the select-all control in the header.

## Pagination and cross-page selection

With `pagination` enabled, the header checkbox selects or deselects only the selectable rows on the current page; invert selection and Shift range selection are limited to the current page as well. With local pagination, switching pages keeps the selection on other pages.

`selections: true` enables the "Select all data / Invert current page / Clear all" menu, and `[SELECTION_ALL]` enables "Select all data" on its own. "Select all data" selects every loaded selectable record after filtering, regardless of the current page. Remote pagination usually loads only the current page, so this neither requests nor selects pages that have not been loaded.

Remote paging replaces `dataSource`, so set `preserveSelectedRowKeys: true` to keep the keys and selected records across pages; `onChange: (keys: Key[], rows: TRecord[]) => void` can then return the records selected on earlier pages. Give every record a stable `rowKey`.

Use the [local pagination example](/en/guide/pagination#local-pagination) to check the scope of the header select-all and the menu select-all, and the [remote pagination example](/en/guide/pagination#remote-pagination) to check cross-page retention and the backfill of selected records.

## Tree data linkage

When checkStrictly is false, parent and child nodes are linked:

- Once all child nodes are selected, the parent node is selected automatically.
- When only some child nodes are selected, the parent node shows as indeterminate.
- Clicking a parent node toggles its whole subtree recursively.

If your application cares more about selecting each row independently, keeping checkStrictly at true is clearer.

## Usage tips

- Use preserveSelectedRowKeys when the selection has to be kept for a long time.
- If some rows cannot be acted on, disable them through getCheckboxProps instead of rolling the state back after a click.
- Tree linkage suits permission trees, organization charts and grouped data, not tables where every row is semantically independent.

## API

`TRecord` is the application row type. The tables below list only the options related to row selection; see the [API Reference](/en/guide/api-reference) for all props.

### Props

<!-- @api: props selection -->

### RowSelection

<!-- @api: row-selection selection -->

With pagination enabled, the header select-all and invert selection are limited to the current page; "Select all data" selects every loaded selectable record after filtering. See [Pagination and cross-page selection](#pagination-and-cross-page-selection).

### Events

<!-- @api: events selection -->

When the selection changes, `extra.action` is `'select'` and `extra.currentDataSource` is the data displayed on the current page. If you only care about the selected items, using `rowSelection.onChange` directly is simpler.

## Theming

To change only colors, override the [CSS variables](#css-variables) first; to change classes, use the per-instance `ui` or the global `theme.table.slots`. See [Three-layer theme overrides](/en/guide/theme-overrides) for how to choose between the three.

### ui slots

<!-- @api: ui selection -->

### Preset defaults

The default classes of both presets on the slots above, given in the shape of `createVTableGuild({ theme })` so you can copy and modify them; overrides are merged with the defaults through `cn()`. element-plus matches the original Element Plus: selected rows do not change their background. In the default precompiled mode these utilities carry the `vtg-` prefix at runtime; see [utility prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules) for the override rules.

<!-- @api: theme selection -->

### CSS variables

The table lists the defaults in light mode; dark mode overrides them separately under `.dark`. The popup variables are shared by table popups such as the batch selection menu and the filter panel.

<!-- @api: css-vars selection -->

## Type Declarations

Every row callback in `RowSelection<TRecord>` keeps the application row type. The selection sentinel is the type of the `SELECTION_ALL`, `SELECTION_INVERT` and `SELECTION_NONE` constants; see the [Type reference](/en/guide/type-reference) for how to import them and for the render return types.

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#RowSelectionType

<<< @/.vitepress/type-declarations/table.ts#SelectionItem

<<< @/.vitepress/type-declarations/table.ts#SelectionSentinel

<<< @/.vitepress/type-declarations/table.ts#RowSelection

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

:::

## Related pages

- [Tree table](/en/guide/tree-table)
- [Selection alert](/en/guide/selection-alert)
- [API Reference](/en/guide/api-reference)
- [Type reference](/en/guide/type-reference)
