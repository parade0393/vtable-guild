# Sorting

Sorting revolves around these fields: sorter, sortOrder, defaultSortOrder and sortDirections.

If you come from ant-design-vue, this will look familiar. The difference is that vtable-guild puts more emphasis on column sorting that works out of the box, and funnels sorting results into the change event.

## Live demo

Single-column, multi-column and custom compare functions in one table. Click a header to toggle sorting, and click the columns that set `sorter.multiple` one after another to stack sorts.

<Demo src="sorting/basic">

<<< @/demos/sorting/basic.vue

</Demo>

## How to enable sorting

- sorter: true uses the default comparison rules. Numbers are sorted by value, and other values are compared as strings.
- `sorter: (a: TRecord, b: TRecord) => number` uses a custom compare function; `TRecord` is the row data type.
- sorter: { multiple: number } enables multi-column sorting and sets the priority.
- defaultSortOrder sets the default sort direction when the column is first initialized.
- sortOrder enters controlled mode, where external state decides the current sort direction.

## The most common usage

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface ScoreRow {
  key: string
  name: string
  score: number
}

const columns: TableColumnsType<ScoreRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    align: 'right',
    sorter: true,
  },
]

const dataSource: ScoreRow[] = [
  { key: '1', name: 'Charlie', score: 80 },
  { key: '2', name: 'Alice', score: 95 },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

## Controlled sorting

When the sorting state has to stay in sync with page query parameters, server requests or external state, controlled mode is the more reliable choice.

```ts
import { computed, ref } from 'vue'
import type { SortOrder, TableColumnsType, VTableEventProps } from '@vtable-guild/vtable-guild'

const scoreOrder = ref<SortOrder>('ascend')

const columns = computed<TableColumnsType<ScoreRow>>(() => [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Score',
    dataIndex: 'score',
    key: 'score',
    sorter: true,
    sortOrder: scoreOrder.value,
  },
])

const handleChange: NonNullable<VTableEventProps<ScoreRow>['onChange']> = (_filters, sorter) => {
  const results = Array.isArray(sorter) ? sorter : [sorter]
  scoreOrder.value = results.find((result) => result.columnKey === 'score')?.order ?? null
}
```

Reuse the `ScoreRow` above and bind `@change="handleChange"` on the table. `VTableEventProps<ScoreRow>['onChange']` provides the complete event parameter types, and `NonNullable` removes the `undefined` of the optional event prop. A single-column result is an object and a multi-column result is an array, so narrow it with `Array.isArray` before reading. In controlled mode, whether to update `sortOrder` is up to you.

## Server-side sorting

`sorter: true` uses the local default comparator; a controlled `sortOrder` does not disable local sorting automatically either. When the server has already sorted the data, also enable `manual.sort` to keep the order of the returned records:

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :manual="{ sort: true }"
  @change="handleChange"
/>
```

The sort controls, the single-column and multi-column state and the `change` event keep working; your application queries again when `extra.action === 'sort'`.
You can also use [useTableRequest](/en/guide/remote-data) to manage server-side sorting, filtering, pagination and refreshing in one place.

## Multi-column sorting

When several fields need to take part in sorting, use multiple to set the priority. The larger the number, the higher the priority.

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface TeamScoreRow {
  key: string
  age: number
  team: string
  score: number
}

const columns: TableColumnsType<TeamScoreRow> = [
  { title: 'Age', dataIndex: 'age', key: 'age', sorter: { multiple: 1 } },
  { title: 'Team', dataIndex: 'team', key: 'team', sorter: { multiple: 2 } },
  { title: 'Score', dataIndex: 'score', key: 'score', sorter: { multiple: 3 } },
]
```

## Practical usage tips

- For simple sorting prefer sorter: true, so you do not write compare functions again and again for ordinary number and string fields.
- If the page also has filtering, the current data processing order is filter first, then sort, so multi-column sorting runs on the filtered result.
- If you plan to work with the server, enable `manual.sort`; when sorting has to be reset from outside, also bind a controlled `sortOrder` so the header and the request state stay consistent.

## API

`TRecord` is your application's row type. The tables below list only the sorting-related configuration; for all props see the [API Reference](/en/guide/api-reference).

### Props

<!-- @api: props sorting -->

### Column fields

<!-- @api: columns sorting -->

### Events

<!-- @api: events sorting -->

When sorting triggers, `extra.action` is `'sort'` and `extra.currentDataSource` is the processed data before pagination. `sorter` is an array when more than one sort column is active, and an object otherwise. With controlled sorting, `sorter` reflects the sort requested by this operation, while `extra.currentDataSource` is still computed from the `sortOrder` currently passed in.

## Theming

To change only colors, override the [CSS variables](#css-variables) first; to change classes, use the per-instance `ui` or the global `theme.table.slots`. For how to choose between the three, see [Three-layer theme overrides](/en/guide/theme-overrides).

### ui slots

<!-- @api: ui sorting -->

### Preset defaults

The default classes of the two presets on the slots above, given in the structure of `createVTableGuild({ theme })`; copy and modify them as needed. Override values are merged with the defaults through `cn()`. In the default precompiled mode these utilities carry the `vtg-` prefix at runtime; for the override rules see [Utility prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme sorting -->

### CSS variables

The tables show the default values in light mode; dark mode overrides them separately under `.dark`.

<!-- @api: css-vars sorting -->

## Type Declarations

`TRecord` is your application's row type. The declarations below cover the column sorting configuration and the `change` event. The column configuration is an excerpt of the related fields; `SortingColumnFields` is a documentation helper interface, not a package export. For the complete declarations and how to import them, see the [Type reference](/en/guide/type-reference).

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#SortOrder

<<< @/.vitepress/type-declarations/table.ts#SorterFn

<<< @/.vitepress/type-declarations/table.ts#ColumnSorterObject

<<< @/.vitepress/type-declarations/table.ts#ColumnSorter

<<< @/.vitepress/type-declarations/features.ts#SortingColumnFields

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

:::

## Related pages

- [Filtering](/en/guide/filtering)
- [API Reference](/en/guide/api-reference)
- [Type reference](/en/guide/type-reference)
- [ui slot reference](/en/guide/ui-slots-reference)
