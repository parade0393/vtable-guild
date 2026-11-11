# Pagination

Enable it with `:pagination="{}"`. It is off by default: when omitted or `false`, the table keeps showing all the data. The configuration follows ant-design-vue 4.2.6, while `change` keeps this library's three-argument signature.

## Local pagination

The component filters and sorts first, then paginates by root records, and finally expands tree nodes. Children and expanded content do not consume additional page slots. Configure a stable `rowKey` to keep selection and expansion state across pages.

The demo also enables row selection: the header checkbox selects the current page, while the "Select all data" menu item selects all loaded, selectable records after filtering. After changing pages, check the selection scope through the selected count and the checkbox states.

<Demo src="pagination/basic">

<<< @/demos/pagination/basic.vue

</Demo>

## Pagination-only callback

If you only need pagination, use `TablePaginationConfig.onChange` directly. Its arguments are `(page: number, pageSize: number)`; you do not need to handle the table's filters or sorter. Below is a complete controlled pagination example that gets its parameter types through `NonNullable<TablePaginationConfig['onChange']>`.

<Demo src="pagination/callback">

<<< @/demos/pagination/callback.vue

</Demo>

## Controlled pagination

`current` and `pageSize` can be controlled independently. When omitted, internal state is used, and `defaultCurrent` and `defaultPageSize` initialize it only once. The parent component must accept the new state in the callback; the component never mutates the configuration object. The top and bottom pagers share the same state.

<Demo src="pagination/controlled">

<<< @/demos/pagination/controlled.vue

</Demo>

## Remote pagination

Pass the records of the current page plus the full `total`. When the processed record count is below `total` and does not exceed `pageSize`, the data is not sliced again. When the record count is greater than `pageSize` but below `total`, the table warns and slices locally. When no positive integer `total` is provided, it falls back to the root record count after filtering and sorting.

Requests can be managed by application code, or you can use [useTableRequest request management](/en/guide/remote-data). When you manage them yourself, keep the total during loading, and use request sequence numbers or AbortController to prevent stale responses from overwriting the new page.

`sorter: true` still sorts locally by default. For server-side sorting, also pass `:manual="{ sort: true }"`; for server-side filtering, pass `manual.filter: true`, which keeps the filter controls and state while skipping local computation. Passing `manual.pagination: true` skips pagination slicing and uses the explicit `total`; `manual: true` enables all three. The `manual` returned by `useTableRequest` already enables all three, so you can bind it directly.

The demo below enables `preserveSelectedRowKeys` and shows the selected count and record names across pages. Select a record, change pages and select more, then return to the original page to check the checkbox state. "Select all data" only affects loaded data and does not request other pages.

<Demo src="pagination/remote">

<<< @/demos/pagination/remote.vue

</Demo>

## Composable layouts and content slots

`pagination.layout` uses the same API under both presets. An ordered array determines the order of the controls; `{ left, right }` places content on the left and right sides of the pagination row:

```ts
import type { TablePaginationConfig } from '@vtable-guild/vtable-guild'

const pagination: TablePaginationConfig = {
  showTotal: (total) => `${total} records`,
  showSizeChanger: true,
  showQuickJumper: true,
  layout: {
    left: [{ slot: 'selection' }, 'total'],
    right: ['sizes', 'prev', 'pager', 'next', 'jumper', { slot: 'refresh' }],
  },
}

// To reorder a single group only:
// layout: ['sizes', 'prev', 'pager', 'next', 'total']
```

The built-in items are `total`, `sizes`, `prev`, `pager`, `next` and `jumper`. `pager` contains the numbered pages and the ellipsis jump buttons, or the current-page input and the page count in `simple` mode; the previous and next buttons are controlled by `prev` and `next` respectively. Element's native comma-separated strings, `'->'` and bare `'slot'` are not part of this library's layout syntax.

Array layouts keep using the top / bottom position and the Left / Center / Right alignment from `position`. A left-right layout fills the pagination row: `position` only decides top or bottom, and the content inside aligns by `left` / `right`; when only one side is passed, the other side is not filled in automatically. Both regions can wrap, and the right region stays right-aligned after wrapping. In very narrow containers, control the width with `pagerCount`, `simple` or the styles of your application content.

Put `{ slot: 'selection' }` in the layout, then tell the content apart with `name` in `#paginationItem`. The demo below supports switching between reordering, left-right regions, top and bottom pagers and a narrow container: the selection state is maintained by the parent component, refresh calls an application function and updates the Revision of the current page, and the counter lets you check that refreshing and switching layouts do not trigger pagination callbacks.

<Demo src="pagination/layout">

<<< @/demos/pagination/layout.vue

</Demo>

### Layout and visibility rules

- When `layout` is omitted, each preset keeps its original order and visibility behavior; an explicit layout renders only the listed items and does not append controls automatically.
- `showTotal`, `showSizeChanger` and `showQuickJumper` still control visibility. Listing `sizes` does not override `showSizeChanger: false`, and listing `jumper` does not enable quick jumping automatically. When its switch is not specified, `sizes` still uses the existing total threshold.
- `simple` still hides `total` and `sizes`, and `jumper` shows only a configured Go button. When `pager` is omitted, a Go button with no input to submit is not kept.
- Switching layouts dynamically does not change the page, the page size or the data slice, and triggers neither pagination events nor the table-level `change` event. `itemRender` and `buildOptionText` keep working.
- When pagination is off, `position: ['none']` is set, the effective total is 0 or `hideOnSinglePage` applies, the pager and the application slots are hidden together. With `layout: []`, `layout: {}`, empty regions or all content hidden, no empty container is kept, but pagination state and data slicing still apply. A refresh action that must remain available with empty data should go in `title`, `footer` or an external toolbar.
- Duplicate built-in items and extension points with the same name keep only their first occurrence (left before right). Invalid items, blank slot names and extension points without `#paginationItem` are skipped with a warning in development; a wrong top-level or region type, or unknown fields other than `left` / `right` in the region object, warn and fall back to the default layout as a whole. `{}` is still a valid empty layout. When a slot deliberately returns empty content, no placeholder is left and no warning is shown.

### Pagination content slot

The parameter type of `#paginationItem` is `TablePaginationSlotProps`, which contains the readonly effective state:

<!-- @api: reference pagination-slot-props -->

Application state such as the selected count references the parent component's data directly. The context does not contain refresh, paging or request functions; application actions are handled by you and do not trigger pagination events automatically. When pagers are shown at both the top and the bottom, an extension point with the same name renders once in each pager and receives its own `position`.

The layout types `TablePaginationBuiltinLayoutItem`, `TablePaginationLayoutItem`, `TablePaginationLayout` and `TablePaginationSlotProps` can all be imported from `@vtable-guild/vtable-guild`.

## API

### Props

<!-- @api: props pagination -->

### Events

<!-- @api: events pagination -->

### Slots

<!-- @api: slots pagination -->

### Configuration reference

Fields of the `pagination` object (`TablePaginationConfig`).

<!-- @api: reference pagination-config -->

Supported positions are `topLeft`, `topCenter`, `topRight`, `bottomLeft`, `bottomCenter`, `bottomRight` and `none`. Each region holds at most one pager and uses the first matching item in the array.

### Page button count

`pagerCount` includes the first and last numbered pages and excludes the ellipses and the previous / next buttons; when there are fewer pages in total, all of them are shown. When it is set explicitly, both presets use the Element Plus pager algorithm, and the ellipses jump `pagerCount - 2` pages backward or forward.

```vue
<VTable :pagination="{ pagerCount: 9 }" />
```

`pagerCount` takes precedence over `showLessItems`. When it is not specified, each preset keeps its existing default / compact arrangement and 5 / 3-page jumps. Only odd integers from 5 to 21 are accepted; invalid values warn in development and fall back to the unspecified behavior. `simple` mode shows no page list and therefore ignores both options. Changing the page window dynamically does not change the current page, the page size or the data slice, and triggers no pagination events.

Element Plus's native `pager-count` validation only warns in development; invalid values still take part in the pager calculation, so you may see out-of-range values take effect in its Playground. VTable Guild falls back to the unspecified rules for invalid values in every environment and warns in development.

## Advanced configuration and theming

<Demo src="pagination/advanced">

<<< @/demos/pagination/advanced.vue

</Demo>

Customize with `theme.pagination.slots` / `variants` and the `--vtg-pagination-*` tokens; both presets support them. A global locale pack can contain an optional `pagination` group, or you can use `localeOverrides.pagination`; the per-instance `pagination.locale` overrides last. Existing locale packs do not need new fields.

The layout structure can be customized through `theme.pagination.slots.layout`, `left`, `right` and `extension`; the spacing between the two regions and between extension points reuses `--vtg-pagination-gap`. Consecutive previous / pager / next items still use the existing `pages` slot and keep each preset's navigation spacing.

The ellipsis jump text can be customized through the optional locale fields `prev_pages` / `next_pages`; `{count}` in the template is replaced with the actual jump distance, for example `prev_pages: 'Previous {count} pages'`. Jumps of 3 / 5 pages keep using the existing `prev_3` / `next_3` and `prev_5` / `next_5` fields. The button's title and aria-label use the same text.

### Element Plus preset

Pagination configuration and events keep using the Ant-style API above, and the two presets share the same default visibility rules and page-size options. After switching to `element-plus`, the pagination visuals and interaction follow Element Plus:

- Page buttons sit next to each other with no gap, and the current page is bold with no border; when `layout` is omitted, the total, page-size select, pager and jumper are arranged in that order.
- When `pagerCount` is not specified, the native 7-page window is used, and `showLessItems: true` maps to a 5-page window; the ellipses jump 5 / 3 pages backward or forward respectively.
- The quick-jump input shows the current page; Enter or blur submits and restores the effective page, and decimals keep only their integer part; when a Go button is configured, submission still happens through the button or Enter.
- The Chinese jump text is "前往", and English does not show the `Page` after the input; per-instance locale overrides still apply.
- Default pagination buttons are 32px, and `size: 'small'` is 24px with a 12px font size; when no pagination size is specified, a `small` table maps to compact pagination, and `middle` / `large` map to default pagination.

Shared extensions such as `simple`, the Go button and `itemRender` remain available. Element's native string `layout` should be migrated to the array or left-right region object described above; `currentPage` / `pageSizes` correspond to `current` / `pageSizeOptions` respectively.

Ant's internal `selectComponentClass`, `selectPrefixCls` and `prefixCls` are not supported; use this project's theme, `classPrefix` and the table-level `getPopupContainer`. The first version does not export a standalone Pagination component.

The table below lists the styling entry points of the pager and the page-size menu. Override classes through the global `theme.pagination`; for per-instance styles use `pagination.class` or `pagination.style`.

### ui slots

<!-- @api: ui pagination -->

### Preset defaults

The code lists the slots and variants you can override directly. When the pager is in simple mode and disabled, the presets also apply compound styles to the jump control.

<!-- @api: theme pagination -->

### CSS variables

<!-- @api: css-vars pagination -->

## Events and other features

The arguments of the table's `change` are `(filters: TableFiltersInfo, sorter: VTableSorterResult<Row>, extra: TableChangeExtra<Row>)`, which differ from the pagination-only callback above. `extra.pagination?: TablePaginationState` contains `current`, `pageSize` and `total`. Use the public callback type to infer all the parameters automatically:

<<< @/.vitepress/type-declarations/examples.typecheck.ts#PaginationChangeExample

- The argument order of `change(filters, sorter, extra)` is unchanged. With pagination enabled, every action carries `extra.pagination`; when it is not enabled, the field is not added. `'paginate'` is a new action, so exhaustive checks need this branch.
- Changing the page and changing the page size each trigger one table event; filtering returns to page 1 and triggers only `'filter'`. Sorting keeps the page; a page-size change keeps the page and clamps it to the last page when necessary.
- For sorting, filtering and pagination, `currentDataSource` is the processed data before pagination; in remote scenarios it contains only loaded records. `select` keeps its existing displayed-data semantics.
- When the data shrinks, the effective page clamps to the last page, and external prop updates do not trigger events in return. If a new request is needed after the remote total shrinks, application code is responsible for it.
- Header select-all, invert and Shift range selection are limited to the current page; the "Select all data" menu item selects all loaded records. Remote cross-page selection uses `preserveSelectedRowKeys` and does not request unloaded pages.
- `title` / `footer` receive the displayed data of the current page. Dragging happens only within the current page but returns the complete input `dataSource`.
- The pager does not scroll horizontally with the body. `scroll.y: 'auto'` automatically reserves space for the top and bottom pagers and is compatible with virtual scrolling.
- With pagination enabled, paginating / filtering / sorting scrolls back to the top of the body by default and keeps the horizontal position. Turn it off with `scroll.scrollToFirstRowOnChange: false`; without pagination, the existing scroll behavior is kept by default.

When migrating from Ant, read what used to be the first argument of the four-argument callback from `extra.pagination` instead; pass a pagination object explicitly to enable the feature.

## Type Declarations

The following types are all imported from `@vtable-guild/vtable-guild`. `TRecord` is your application's row type; Vue rendering types such as `VNodeChild` are imported from `vue`. For the column, sorter and base types that the declarations depend on, see the [Type reference](/en/guide/type-reference).

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#TablePaginationConfig

<<< @/.vitepress/type-declarations/table.ts#TablePaginationState

<<< @/.vitepress/type-declarations/table.ts#TablePaginationPosition

<<< @/.vitepress/type-declarations/table.ts#PaginationItemType

<<< @/.vitepress/type-declarations/table.ts#TablePaginationBuiltinLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayout

<<< @/.vitepress/type-declarations/table.ts#TablePaginationSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

<<< @/.vitepress/type-declarations/config.ts#VTableGuildPaginationLocale

:::
