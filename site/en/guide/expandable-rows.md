# Expandable rows

Expandable rows show supplementary information right in the current table, without navigating to a detail page. They are not the same kind of feature as a tree table: a tree table handles data that is naturally hierarchical, while expandable rows handle "the current row needs an extra block of content expanded".

## Live demo

`defaultExpandedRowKeys` expands the first row in advance; `rowExpandable` marks the third row as not expandable, so it shows no expand icon.

<Demo src="expandable-rows/basic">

<<< @/demos/expandable-rows/basic.vue

</Demo>

## Basic example

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType, type Expandable } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  role: string
  city: string
}

const columns: TableColumnsType<UserRow> = [{ title: 'Name', dataIndex: 'name', key: 'name' }]

const expandable: Expandable<UserRow> = {
  expandRowByClick: true,
  expandedRowRender: (record) =>
    `${record.name} works on ${record.role} and is based in ${record.city}`,
}

const dataSource: UserRow[] = [{ key: '1', name: 'Ada', role: 'product design', city: 'Shanghai' }]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :expandable="expandable" />
</template>
```

## Common extension points

- `expandRowByClick`
  Expand by clicking anywhere on the row
- `rowExpandable: (record: TRecord) => boolean`
  Decide which rows can expand based on application conditions
- `expandIcon: NonNullable<Expandable<TRecord>['expandIcon']>`
  Customize the expand icon
- `showExpandColumn: false`
  Hide the dedicated expand column and keep only expanding by row click

`TRecord` is specified by the `UserRow` in `Expandable<UserRow>`; the expand icon's parameter object contains `expanded`, `record`, `expandable` and `onExpand`. See the declarations at the end of the page for the full fields and callback signatures.

## Expand column position and title

`expandable.expandIconColumnIndex` sets the position of the expand column among the application columns, starting from 0; the selection column still stays in front. Negative and out-of-range values are clamped to the valid range. An explicit `EXPAND_COLUMN` placeholder takes precedence over this position setting.

`expandable.columnTitle` accepts a text or numeric title. For complex content, use `#expandColumnTitle`, which takes precedence over columnTitle; the selection column's title is still configured through `rowSelection.columnTitle`. The tree indent icon can also use expandIconColumnIndex to pick an application column.

## When to use

- Inline detail previews
- Supplementary descriptions, tags and notes
- Content that clearly exceeds what a cell can hold but does not warrant a separate detail page

## Known limitations

- **preserve-expanded-content is not supported**: when a row is collapsed, its expanded content is removed from the DOM and rendered again the next time the row expands. The original element-plus Table (2.9.7+) provides a `preserve-expanded-content` attribute that keeps the DOM state of expanded content; vtable-guild does not implement this yet. If the expanded content contains a form or stateful components, their state is lost after collapsing.

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props expandable-rows -->

### Expandable

<!-- @api: reference expandable -->

### Slots

<!-- @api: slots expandable-rows -->

## Theming

The classes of the expanded content and the expand button can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui expandable-rows -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how to override utilities in the default precompiled mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme expandable-rows -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately under `.dark`.

<!-- @api: css-vars expandable-rows -->

## Type Declarations

The declarations below cover the expand state, detail rendering, icon parameters and expand callbacks. `VNodeChild` is Vue's renderable content type; see the [Type reference](/en/guide/type-reference) for the other dependent types.

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#Expandable

<<< @/.vitepress/type-declarations/table.ts#RowClassName

:::

## Related pages

- [Tree table](/en/guide/tree-table)
- [Custom rows and slots](/en/guide/api-wiring-and-slots)
- [API Reference](/en/guide/api-reference)
- [Type reference](/en/guide/type-reference)
