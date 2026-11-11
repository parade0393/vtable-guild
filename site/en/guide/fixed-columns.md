# Fixed columns

Fixed columns suit wide tables with many fields and noticeable horizontal scrolling. They rely on two things holding at the same time:

- The table provides `scroll.x`, which forms a horizontal scroll area
- The columns to fix declare `fixed: 'left'` or `fixed: 'right'`; `fixed: true` is shorthand for `fixed: 'left'` (aligned with ant-design-vue)

## Live demo

A nine-column wide table with the two left columns and the "Status" column on the right fixed. Drag the horizontal scrollbar to see the fixed columns and their shadows.

<Demo src="fixed-columns/basic">

<<< @/demos/fixed-columns/basic.vue

</Demo>

## Basic example

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
  address: string
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 96, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 220, fixed: 'right' },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada', age: 28, status: 'Active', address: 'Shanghai' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" :scroll="{ x: 720 }" />
</template>
```

## Common combinations

- Fixed columns + horizontal scrolling
- Fixed columns + fixed header
- Fixed columns + row selection / expand column

## Key boundaries

- Fixed columns should provide an explicit `width`, otherwise the `sticky` layout is more prone to misalignment
- If there are also grouped headers, keep the column widths stable and use `tableLayout="fixed"` when necessary
- Fixed columns can be combined with column resizing, but keep the width boundaries of the fixed columns stable first

## When to use

- Users need to keep the key primary columns in view while scrolling horizontally
- The table has status columns, action columns and a large number of content columns at the same time
- The page does not suit being split into several tables, yet carries a lot of horizontal information

## API

`TRecord` is the application row type. See [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props fixed-columns -->

### Column fields

<!-- @api: columns fixed-columns -->

## Theming

The classes of the fixed edges, shadows and scroll area can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui fixed-columns -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how utilities are overridden in the default prebuilt mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme fixed-columns -->

### CSS variables

The table lists the default values for light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars fixed-columns -->

## Type Declarations

Fixed columns use `ColumnType<TRecord>['fixed']`, and the scroll and sticky configuration belongs to `TableProps<TRecord>`. The props / column configuration are excerpts of the relevant fields; `FixedColumnFields` and `ScrollFields` are documentation helper interfaces, not package exports. See [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#FixedColumnFields

<<< @/.vitepress/type-declarations/table.ts#TableLayout

<<< @/.vitepress/type-declarations/table.ts#TableSticky

<<< @/.vitepress/type-declarations/features.ts#ScrollFields

:::

## Related pages

- [Column resizing](/en/guide/column-resize)
- [Virtual scrolling](/en/guide/virtualization)
