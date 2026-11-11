# Grouped headers and merged cells

This set of features mainly serves report-style pages. Simple data tables usually do not need it, but it becomes important once a table starts to carry grouped metrics, structured summaries or complex horizontal layouts.

## Live demo

Three levels of nested headers, with the `rowSpan` returned by `customCell` merging the "Region" column vertically.

<Demo src="grouped-and-merged-cells/basic">

<<< @/demos/grouped-and-merged-cells/basic.vue

</Demo>

## Grouped headers

Grouped headers form their hierarchy through children.

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface ProfileRow {
  key: string
  name: string
  age: number
  region: string
}

const columns: TableColumnsType<ProfileRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: 'Profile',
    key: 'profile',
    children: [
      { title: 'Age', dataIndex: 'age', key: 'age', width: 96 },
      { title: 'Region', dataIndex: 'region', key: 'region', width: 150 },
    ],
  },
]
```

## Merging body cells

Body cells are merged mainly in two ways:

- customCell returns rowSpan or colSpan.
- customRender returns a RenderedCell with props.

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface ReportRow {
  key: string
  group: string
  name: string
  score: number
}

const columns: TableColumnsType<ReportRow> = [
  {
    title: 'Group',
    dataIndex: 'group',
    key: 'group',
    customCell: (_record, index) => {
      if (index === 0) return { rowSpan: 2 }
      if (index === 1) return { rowSpan: 0 }
      return {}
    },
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    customRender: ({ text, record, index }) =>
      index === 4
        ? {
            children: `${String(text)} / ${record.score}`,
            props: { colSpan: 2 },
          }
        : String(text),
  },
]
```

Once `columns` is annotated with `TableColumnsType<ReportRow>`, the `record` and `index` of `customCell` and the context of `customRender` are inferred automatically. In `customRender`, `record` is `ReportRow` and `text` / `value` are `unknown`; use `String(text)` when you need to output it as text, and do not bypass the check with `any`.

## Usage boundaries

- Grouped headers rely on a relatively stable column structure; providing explicit widths is recommended.
- Cell merging is better suited to static reports and clearly grouped structures.
- Row-spanning merges are not supported once `virtual` is enabled: the virtual body renders only the row nodes in the viewport, so merges would be misaligned. In that case a `customCell` / `customRender` on a column triggers a dev warning, and `virtualColumn` is ignored as well; see [Virtual scrolling](/en/guide/virtualization#key-boundaries) for details.

## Usage tips

- Once a table combines fixed columns, grouped headers and merged cells, make sure the layout is stable first, then add other interactions.
- If you only want to emphasize the style of certain cells, do not rush to merge; consider ui, customRender or summary first.

## Hover behavior of merged cells

When the table has `hoverable` enabled (`true` by default), the hover highlight handles row-spanning merges correctly:

- When you hover any row, all cells in that row are highlighted, including a row-spanning merged cell (even if its starting row is not the current row).
- When you hover the row-spanning merged cell itself, all the rows it spans are highlighted as a whole.

This matches the behavior of ant-design-vue. It is implemented with a JS range-overlap check and does not rely on CSS group-hover.

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props grouped-and-merged-cells -->

### Column fields

<!-- @api: columns grouped-and-merged-cells -->

## Theming

The classes of the header and cells can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui grouped-and-merged-cells -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how to override utilities in the default precompiled mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme grouped-and-merged-cells -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately under `.dark`.

<!-- @api: css-vars grouped-and-merged-cells -->

## Type Declarations

`TableColumnsType<TRecord>` is an alias of `ColumnsType<TRecord>` and includes leaf columns, column groups and column sentinels. The declarations below cover grouping, the render context and the merge return values. The column configuration is an excerpt of the relevant fields; `MergedColumnFields` is a documentation helper interface, not a package export. See the [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#ColumnsType

<<< @/.vitepress/type-declarations/features.ts#MergedColumnFields

<<< @/.vitepress/type-declarations/table.ts#ColumnGroupType

<<< @/.vitepress/type-declarations/table.ts#CustomRenderContext

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

:::

## Related pages

- [Title, footer and summary](/en/guide/title-footer-summary)
- [Fixed columns](/en/guide/fixed-columns)
