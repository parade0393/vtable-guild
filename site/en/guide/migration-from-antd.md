# Migrating from ant-design-vue

The goal of this page is not to claim "full compatibility", but to help you quickly judge which table pages can migrate at low cost and where explicit adjustments are needed.

## Scenarios that migrate well

If your page mainly relies on these capabilities, migration cost is usually manageable:

- columns configuration
- sorter sorting
- filters filtering
- rowSelection row selection
- expandable expandable rows
- scroll for a fixed header and horizontal scrolling
- customRender, custom rows and common slots

## Main benefits

- Keeps the column definition style and common interaction model you know.
- Brings virtual scrolling into the same table, while you keep using the familiar column width control syntax.
- Replaces application-level style patches with first-class capabilities such as striped, hoverable and ui.
- Brings theme switching and local overrides into one unified model.

## Differences to watch for

### 1. Not every API is identical

vtable-guild is designed to be compatible with high-frequency table usage, not to copy every interface of the ant-design-vue Table one by one.

The most important known differences are:

- Built-in pagination is off by default; pass a `pagination` config object to enable it. See [Pagination](/en/guide/pagination).
- The `change` event signature is `(filters, sorter, extra)`. With pagination enabled, read the pagination state from `extra.pagination`; `extra.action === 'paginate'` is new.
- The resizeColumn event arguments are ordered (column, width), whereas the order in the ant-design-vue docs is (width, column).

Declare the migrated handlers with the public event types, and the arguments get type inference in order:

```ts
import type { VTableEventProps } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
}

const handleChange: NonNullable<VTableEventProps<UserRow>['onChange']> = (
  _filters,
  _sorter,
  extra,
) => {
  if (extra.action === 'paginate' && extra.pagination) {
    console.log(extra.pagination.current, extra.pagination.pageSize)
  }
}

const handleResizeColumn: NonNullable<VTableEventProps<UserRow>['onResizeColumn']> = (
  column,
  width,
) => {
  column.width = width
}
```

If you only care about pagination, use `pagination.onChange(page: number, pageSize: number): void`. See [Pagination](/en/guide/pagination) for a complete example.

The following used to need adjustment and are now fully aligned with ant-design-vue, so they migrate directly:

- `column.fixed: true` is equivalent to `'left'`
- `loading` accepts a `boolean` or a `{ spinning?, indicator?, tip? }` object
- `column.ellipsis` accepts a `boolean` or `{ showTitle?: boolean }`
- the three `size` levels are named `small` / `middle` / `large`

### 2. Do not assume every antdv prop exists

Only the props listed in the [API Reference](/en/guide/api-reference) are implemented. The following fields exist on the ant-design-vue Table but are not implemented at present, and passing them has no effect:

- `expandIconColumnIndex`: specifies which column holds the expand icon. The tree expand icon is currently always rendered in the first data column
- `sticky.offsetScroll` / `sticky.getContainer`: declared in the types but not wired up, so passing them has no effect; `offsetHeader` / `offsetSummary` in the same `sticky` object do work

To decide whether an API can be used, go by the API Reference and the [complete Agent API reference](https://github.com/parade0393/vtable-guild/blob/master/docs/AGENT_API.md), and do not fill in gaps from antdv experience.

## Common mappings

| ant-design-vue                                          | vtable-guild                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| bordered                                                | bordered                                                                                                          |
| rowSelection                                            | rowSelection                                                                                                      |
| expandable                                              | expandable                                                                                                        |
| scroll.x / scroll.y                                     | scroll.x / scroll.y                                                                                               |
| sorter / sortOrder / defaultSortOrder                   | sorter / sortOrder / defaultSortOrder                                                                             |
| filters / onFilter                                      | filters / onFilter                                                                                                |
| pagination / change(pagination, filters, sorter, extra) | Pass a pagination object to enable; change keeps three arguments, read the pagination state from extra.pagination |
| Zebra striping via rowClassName                         | Prefer striped                                                                                                    |
| Turning off the hover effect yourself                   | Prefer hoverable                                                                                                  |
| resizable / minWidth / maxWidth                         | Keep using the same field names; the resizeColumn event arguments are ordered (column, width)                     |

## Keeping existing override CSS (compatibility class names)

If the page already has a batch of override styles such as `.ant-table-thead > tr > th { ... }` or `:deep(.ant-table-cell)`, rewriting them one by one as Tailwind or the `ui` prop is expensive. You can enable compatibility class names so that vtable-guild also emits a set of `ant-table-*` classes on the original elements, and the old selectors keep matching:

```ts
app.use(
  createVTableGuild({
    compatClass: true, // off by default
  }),
)
```

This is a global switch that is read once at install time and cannot be toggled at runtime. Enabling it does not change the DOM structure or bring in any styles; it only adds classes to existing elements, so the visual result is exactly the same as when it is off.

Coverage includes structural classes (`ant-table-wrapper`, `ant-table-thead`, `ant-table-cell` and so on), variant classes (`ant-table-small`, `ant-table-bordered`) and state classes (`ant-table-row-selected`, `ant-table-cell-fix-left-last`, `ant-table-row-level-{n}` and so on).

With pagination enabled, `ant-table-pagination`, the matching alignment class and the `ant-pagination-*` structural and state classes are emitted too. `ant-table-cell-ellipsis` is emitted when ellipsis is enabled on a header, and the virtual body keeps `ant-table-body` as well.

### Do styles leak when coexisting with ant-design-vue?

Generally not. ant-design-vue 4.x by default uses cssinjs to inject a hash class into the selector of every rule, producing output such as:

```css
.ant-table-wrapper.css-dev-only-do-not-override-xxxxx .ant-table-thead > tr > th { ... }
```

Our elements do not carry that hash class, so **antdv's own styles cannot match our table**, while your hand-written `.ant-table-thead > tr > th` matches normally, which is exactly the effect you need.

We measured this on a page that also loads antdv: the page had 178 `ant-table` rules in total, and 0 of them matched our table elements.

::: warning Exception
If your project uses `<StyleProvider :hashed="false">`, antdv no longer generates the hash class and its selectors degrade to forms such as `[class^='ant-table']` and `.ant-table-wrapper .ant-table-cell`. In that case antdv's styles really do apply to our table: on the same page we measured 20 matching rules. Do not enable compatibility class names in this situation.
:::

### Stability boundary and authoring advice

The `compatClass` switch itself is a stable API. The list of class names also stays backward compatible, and removals or changes are called out explicitly in the changelog.

What is not promised is **the DOM structural relationship between class names**. We keep adjusting the DOM for performance. For example, 2.5.0 removed the per-row `<colgroup>` from virtual scrolling, which cut the DOM node count of wide tables by 40%. Adjustments like this do not make class names disappear, but they do break selectors that depend on parent-child relationships. So when you write override CSS, the two styles below differ greatly in how well they survive change:

```css
/* Recommended: depends only on the class being on the element, matches however the DOM changes */
.ant-table-cell {
  padding: 4px 8px;
}

/* Fragile: depends on the thead > tr > th hierarchy, breaks as soon as the DOM changes */
.ant-table-thead > tr > th {
  padding: 4px 8px;
}
```

The `.ant-table-thead > tr > th` example in the "Keeping existing override CSS" section above is exactly the fragile kind. It works right away, but if you get the chance to rewrite it along the way, prefer reducing it to a single-class selector.

::: tip
Compatibility class names are a transitional aid for the migration period. In the long run we still recommend migrating to the `ui` prop or theme overrides, which are the customization entry points we commit to keeping stable.
:::

## Recommended migration order

1. First migrate an ordinary application table that relies on sorting, filtering and selection.
2. Then replace the page's visual patches with bordered, striped, hoverable and ui overrides.
3. Finally enable enhancements such as virtual and resizable.

This order is safer, because you can verify interaction compatibility first and then bring in new table capabilities step by step.

## A simple migration approach

### The original page usually already has these

- dataSource
- columns
- rowKey
- onChange
- a number of style patches and rowClassName

### Do these first when migrating

1. Keep the original data structure and columns definition.
2. Replace the table component with VTable.
3. Check whether the change callback depends on the pagination argument; if it does, read it from extra.pagination instead.
4. Turn the parts of the style patches that deal with striped rows, hover rows and borders into the corresponding props.
5. If the page listens for resizeColumn, also confirm whether the event argument order needs adjusting.
6. Confirm whether you need virtual or resizable, then enable them step by step.

## When to be more careful

Validate on a small scope first in these cases:

- The page depends heavily on the pagination behavior of the ant-design-vue Table.
- You have many deeply customized headers, filter dropdowns or complex linked logic.
- The page already has a large number of CSS selectors written around the old table (you can enable [compatibility class names](#keeping-existing-override-css-compatibility-class-names) first as a transition).

Pages like these can still be migrated; they are just better served by first confirming the specific boundaries through the [API Reference](/en/guide/api-reference) and the feature pages.

## Type Declarations

The complete event, pagination, column and plugin declarations involved in migration. For the types these declarations reference and the other props, see the [type reference](/en/guide/type-reference).

::: details Type Declarations

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

<<< @/.vitepress/type-declarations/table.ts#TablePaginationConfig

<<< @/.vitepress/type-declarations/table.ts#TablePaginationState

<<< @/.vitepress/type-declarations/table.ts#ColumnType

<<< @/.vitepress/type-declarations/table.ts#TableSticky

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

:::
