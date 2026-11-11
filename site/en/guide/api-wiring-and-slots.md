# Custom rows and slots

These features let you wire the table into more complex application interfaces.

When the default column rendering is no longer enough but you do not want to give up sorting, filtering, alignment and the theme system, entry points such as customRow, customHeaderRow, headerCell, bodyCell and summary are a better fit.

## Live demo

`headerCell` changes the header text, `bodyCell` turns the status into a badge, and `customRow` attaches a click event to the whole row.

<Demo src="api-wiring-and-slots/basic">

<<< @/demos/api-wiring-and-slots/basic.vue

</Demo>

## Common entry points

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VTable, type TableColumnsType, type TableProps } from '@vtable-guild/vtable-guild'

interface ReportRow {
  key: string
  status: 'active' | 'paused'
  score: number
}

const columns: TableColumnsType<ReportRow> = [
  { title: 'Status', key: 'status', dataIndex: 'status' },
  { title: 'Score', key: 'score', dataIndex: 'score' },
]
const dataSource: ReportRow[] = [{ key: '1', status: 'active', score: 95 }]
const clickedRowKey = ref('')
const rowClassName: NonNullable<TableProps<ReportRow>['rowClassName']> = (record) =>
  record.status === 'paused' ? 'paused-row' : ''
const customRow: NonNullable<TableProps<ReportRow>['customRow']> = (record) => ({
  onClick: () => {
    clickedRowKey.value = record.key
  },
})
const customHeaderRow: NonNullable<TableProps<ReportRow>['customHeaderRow']> = (
  _columns,
  index,
) => ({ 'data-header-row': index ?? 0 })
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :row-class-name="rowClassName"
    :custom-row="customRow"
    :custom-header-row="customHeaderRow"
  >
    <template #headerCell="{ title, column }">
      <span v-if="column.key === 'score'">{{ title }} metric</span>
      <template v-else>{{ title }}</template>
    </template>

    <template #bodyCell="{ text, column }">
      <span v-if="column.key === 'status'" class="badge">{{ text }}</span>
      <template v-else>{{ text }}</template>
    </template>

    <template #summary>
      <tr>
        <td colspan="2">Summary</td>
      </tr>
    </template>
  </VTable>
  <p>Last clicked: {{ clickedRowKey }}</p>
</template>
```

When you declare callbacks separately, use the type of the corresponding property of `TableProps<ReportRow>`; for column callbacks, use `ColumnType<ReportRow>`. `headerCell` and `bodyCell` are declared by `TableSlotsDecl<ReportRow>`, and `record` keeps the application row type. `bodyCell.text` is `unknown`; when you need a concrete type, narrow it first or read a `record` field whose type is known.

## What each entry point is for

- rowClassName: returns a class based on the row data.
- customRow: injects attributes, events and style into a row.
- customHeaderRow: injects attributes into a header row.
- customHeaderCell: adds attributes to a header cell.
- headerCell / bodyCell: replace the content inside a cell while keeping the table's built-in interactions.
- summary: appends a summary area after the body.
- paginationItem: shows application content such as the selection count or a refresh button at the position specified by the pagination layout.

## Application content in the pagination row

Place `{ slot: 'name' }` with `pagination.layout`, then tell the content apart by the `name` of `#paginationItem`. The selection state is still maintained by the parent component:

```vue
<VTable
  :columns="columns"
  :data-source="dataSource"
  :row-selection="rowSelection"
  :pagination="{
    layout: {
      left: [{ slot: 'selection' }],
      right: ['prev', 'pager', 'next'],
    },
  }"
>
  <template #paginationItem="{ name }">
    <span v-if="name === 'selection'">{{ selectedRowKeys.length }} selected</span>
  </template>
</VTable>
```

The slot also receives `current`, `pageSize`, `total`, `pageCount`, `range`, `disabled`, `position` and `region`, typed as `TablePaginationSlotProps`. Application buttons bind their own disabled state and call the load function themselves. When the pagination is hidden, the extension content is hidden too; put actions that must remain when there is no data in `title`, `footer` or an external toolbar. See [Pagination layout and content slots](/en/guide/pagination#composable-layouts-and-content-slots) for a complete example.

## When to use ui and when to use slots

- To change only styles, prefer ui and theme overrides.
- Use slots and customRow only when you need to change the content structure or inject application events.
- When you need to attach attributes dynamically per record, prefer customRow over manipulating the DOM.

## Usage tips

- Do structural extensions through the entry points the component provides wherever possible; do not query and rewrite the DOM by hand after mounted.
- bodyCell is better suited to content-level enhancements such as status tags, icons and supplementary text.
- Cell or whole-row editing is also composed through bodyCell; drafts, validation and submission are managed by the application. See [Editing](/en/guide/editing) for complete examples.
- If the same kind of style appears repeatedly, move it into the theme and ui first instead of repeating slot templates in every table.

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props api-wiring-and-slots -->

### Column fields

<!-- @api: columns api-wiring-and-slots -->

### Slots

<!-- @api: slots api-wiring-and-slots -->

## Theming

Custom slots provide the content, while the classes of the table's outer structure can still be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui api-wiring-and-slots -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how to override utilities in the default precompiled mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme api-wiring-and-slots -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately under `.dark`.

<!-- @api: css-vars api-wiring-and-slots -->

## Type Declarations

Table-level callbacks belong to `TableProps<TRecord>` and column-level callbacks belong to `ColumnType<TRecord>`; all Vue slots are declared together by `TableSlotsDecl<TRecord>`. `CellAdditionalProps` describes the return value for attributes and mouse events. The props / column configuration are excerpts of the relevant fields; `CustomStructureFields` and `MergedColumnFields` are documentation helper interfaces, not package exports. See the [Type reference](/en/guide/type-reference) for the full declarations and [Pagination](/en/guide/pagination#type-declarations) for the full context of the pagination slot.

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#CustomStructureFields

<<< @/.vitepress/type-declarations/features.ts#MergedColumnFields

<<< @/.vitepress/type-declarations/table.ts#RowClassName

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableHeaderCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

:::

## Related pages

- [Three-layer theme overrides](/en/guide/theme-overrides)
- [Title, footer and summary](/en/guide/title-footer-summary)
- [Editing](/en/guide/editing)
- [Pagination](/en/guide/pagination)
