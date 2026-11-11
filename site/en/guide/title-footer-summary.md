# Title, footer and summary

This set of features adds structured information above and below the table. Their roles can be summarized as:

- `title`
  The information area above the table
- `footer`
  Supplementary notes below the table
- `summary`
  Summary rows directly related to the current data

`title` can also hold a `VTableToolbar`, which combines the title, refresh, density, column settings and application buttons. Add actions such as export through the toolbar's `#actions`; see [Toolbar](/en/guide/toolbar) for a complete example. The outer `VTable #title` provides `{ data }`, while the inner toolbar slots provide the tool state and methods; the two have different scopes.

## Live demo

<Demo src="title-footer-summary/basic">

<<< @/demos/title-footer-summary/basic.vue

</Demo>

## Basic example

Import the summary row component as `VTableSummary`; `Row` / `Cell` are attached to it. The `index` of a `Cell` corresponds to the column index.

```vue
<script setup lang="ts">
import {
  VTable,
  VTableSummary,
  type TableColumnsType,
  type TableProps,
} from '@vtable-guild/vtable-guild'

interface ScoreRow {
  key: string
  name: string
  score: number
}

const columns: TableColumnsType<ScoreRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name' },
  { title: 'Score', key: 'score', dataIndex: 'score', align: 'right' },
]
const dataSource: ScoreRow[] = [
  { key: '1', name: 'Ada', score: 95 },
  { key: '2', name: 'Grace', score: 92 },
]

const totalScore = dataSource.reduce((sum, row) => sum + row.score, 0)
const title: NonNullable<TableProps<ScoreRow>['title']> = (data) =>
  `Department performance overview · ${data.length} people`
const footer: NonNullable<TableProps<ScoreRow>['footer']> = () => 'Data updated: today 09:30'
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    :title="title"
    :footer="footer"
  >
    <template #summary>
      <VTableSummary>
        <VTableSummary.Row>
          <VTableSummary.Cell :index="0">Total</VTableSummary.Cell>
          <VTableSummary.Cell :index="1" align="right">{{ totalScore }}</VTableSummary.Cell>
        </VTableSummary.Row>
      </VTableSummary>
    </template>
  </VTable>
</template>
```

The function signature of both `title` and `footer` is `(data: TRecord[]) => VNodeChild`; with pagination enabled they receive the data displayed on the current page. The corresponding `#title` / `#footer` slots receive `{ data: TRecord[] }`, while `#summary` provides no parameters. `VNodeChild` is Vue's renderable content type.

## When to use which

- `title`
  Titles, statistics summaries, filter descriptions and batch action hints
- `footer`
  Descriptive text, update times and notes on how the figures are calculated
- `summary`
  Amount totals, averages, counts and summaries of the selected items

## Usage boundaries

- When you only need to place a piece of descriptive text, prefer `title` or `footer`
- `summary` is better suited to results directly related to the current data than to general descriptions
- If the page already has a complete card header around the table, the table `title` can carry only local state information

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props title-footer-summary -->

### Slots

<!-- @api: slots title-footer-summary -->

### VTableSummary

<!-- @api: reference summary -->

#### VTableSummary Props

<!-- @api: reference summary-props -->

#### VTableSummary.Cell Props

<!-- @api: reference summary-cell-props -->

## Theming

The classes of the title, footer and summary areas can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui title-footer-summary -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how to override utilities in the default precompiled mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme title-footer-summary -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately under `.dark`.

<!-- @api: css-vars title-footer-summary -->

## Type Declarations

The function declarations of `title` / `footer` belong to `TableProps<TRecord>`, and the slot parameters use `TableDataSlotProps<TRecord>`. The props are an excerpt of the relevant fields; `TitleFooterFields`, `VTableSummaryProps` and `VTableSummaryCellProps` are documentation helper interfaces, not package exports. `VTableSummary.Row` has no custom props. See the [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#TitleFooterFields

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

<<< @/.vitepress/type-declarations/table.ts#SummaryFixed

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryProps

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryCellProps

:::

## Related pages

- [Grouped headers and merged cells](/en/guide/grouped-and-merged-cells)
- [Custom rows and slots](/en/guide/api-wiring-and-slots)
