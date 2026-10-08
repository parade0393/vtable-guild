# Pagination

Opt in with `:pagination="{}"`. Omitted or `false` preserves the existing unpaginated behavior. Configuration follows Ant Design Vue 4.2.6, while the table keeps `change(filters, sorter, extra)`.

## Local and controlled data

The pipeline is filter → sort → paginate root records → expand trees → render. Children and expanded detail rows do not consume additional page slots. Provide a stable `rowKey` for selection and expansion.

This demo also enables row selection: the header checkbox selects the current page, while “Select all data” selects all loaded, selectable records after filtering. Change pages and inspect the selected count and checkboxes to compare their scope.

<Demo src="pagination/basic">

<<< @/demos/pagination/basic.vue

</Demo>

Control `current` and `pageSize` independently, or initialize internal state once with `defaultCurrent` (1) and `defaultPageSize` (10). Props are never mutated. Parent components must accept requested changes. Both pagers share state.

<Demo src="pagination/controlled">

<<< @/demos/pagination/controlled.vue

</Demo>

## Remote data

Pass one page plus `total`. If processed data length is below total and does not exceed pageSize, it is rendered without another slice. A length between pageSize and total warns and uses local slicing. A missing or invalid positive integer total falls back to the processed root count.

The component does not fetch data. Keep total during loading and reject stale responses with request IDs or AbortController. For server sorting use `sorter: true`; for server filtering omit local `onFilter`. Handle the corresponding table action in your request code.

The remote demo enables `preserveSelectedRowKeys` and displays the selected count and record names across pages. Select a row, select another on a different page, then return to verify the first selection. “Select all data” only affects loaded records and never fetches other pages.

<Demo src="pagination/remote">

<<< @/demos/pagination/remote.vue

</Demo>

## Configuration

| Field                                       | Type / default                                    | Purpose                                                                  |
| ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| `current`, `defaultCurrent`                 | `number` / 1                                      | Controlled / initial page                                                |
| `pageSize`, `defaultPageSize`               | `number` / 10                                     | Controlled / initial size                                                |
| `total`                                     | `number`                                          | Positive explicit total, otherwise processed root count                  |
| `disabled`, `hideOnSinglePage`              | `boolean` / false                                 | Disable interaction / hide one-page controls; total zero hides the pager |
| `showSizeChanger`                           | `boolean`                                         | Defaults to total > 50                                                   |
| `totalBoundaryShowSizeChanger`              | `number` / 50                                     | Threshold for automatic size changer                                     |
| `pageSizeOptions`                           | `(string \| number)[]`                            | Defaults to `['10','20','50','100']`; current size remains available     |
| `buildOptionText`                           | `({ value }) => VNodeChild`                       | Custom option content                                                    |
| `showQuickJumper`                           | `boolean \| { goButton?: VNodeChild }`            | Submit on Enter/blur; with a Go button, blur does not submit             |
| `showTotal`                                 | `(total, [start, end]) => VNodeChild`             | One-based range; empty range is `[0, 0]`                                 |
| `size`                                      | `'default' \| 'small'`                            | Follows table size when omitted                                          |
| `simple`, `showLessItems`                   | `boolean` / false                                 | Input pager / smaller page window                                        |
| `pagerCount`                                | `number`                                          | Odd integer 5–21; overrides `showLessItems`                              |
| `responsive`                                | `boolean` / false                                 | Compact size below 576px unless size is explicit                         |
| `itemRender`                                | `({ page, type, originalElement }) => VNodeChild` | Types: page, prev, next, jump-prev, jump-next                            |
| `position`                                  | `TablePaginationPosition[]`                       | Default `['bottomRight']`; top/bottom Left/Center/Right or none          |
| `locale`, `class`, `style`                  | Partial pagination locale, string, CSSProperties  | Text and presentation overrides                                          |
| `onChange`                                  | `(current, pageSize) => void`                     | Navigation, size changes and filter resets                               |
| `onShowSizeChange`                          | `(current, pageSize) => void`                     | Size changes                                                             |
| `'onUpdate:current'`, `'onUpdate:pageSize'` | `(value: number) => void`                         | Controlled state update notifications                                    |

Only the first matching position in each top/bottom region is used. `position: ['none']` hides controls but retains slicing; `pagination: false` disables both.

### Page window

`pagerCount` includes the first and last numbered pages, excluding ellipses and previous/next buttons. All pages appear when the total page count is smaller. When explicitly set, both presets use the Element Plus page-window algorithm, and ellipses jump `pagerCount - 2` pages.

```vue
<VTable :pagination="{ pagerCount: 9 }" />
```

`pagerCount` takes precedence over `showLessItems`. When omitted, each preset retains its existing default/compact window and 5/3-page jumps. Only odd integers from 5 through 21 are accepted; invalid values warn during development and fall back to the omitted-value behavior. `simple` has no numbered page list and ignores both options. Changing the page window does not change the current page, page size or data slice, and emits no pagination events.

Element Plus's native `pager-count` validation only warns during development; invalid values still participate in page-window calculations, so values outside the documented range may appear to work in its Playground. VTable Guild falls back to the omitted-value behavior in all environments and warns during development.

<Demo src="pagination/advanced">

<<< @/demos/pagination/advanced.vue

</Demo>

## Events, migration and integration

- Keep `change(filters, sorter, extra)`. Enabled pagination adds `extra.pagination: { current, pageSize, total }`. Handle the new `extra.action === 'paginate'` in exhaustive switches.
- Pagination and size changes emit one table event. Filtering requests page 1 with one `filter` event. Sorting retains the page. Size changes keep the page or clamp to the last page.
- Controlled values remain owned by the parent; callbacks report requested values. External updates do not emit events. Shrinking data clamps the effective page; refetch an adjusted remote page in application code if needed.
- For sort/filter/paginate, `currentDataSource` contains processed data before pagination, limited to loaded records remotely. Selection retains its existing displayed-data semantics.
- Header select-all, invert and Shift selection affect the current page. The “Select all data” menu affects all loaded records. `preserveSelectedRowKeys` retains remote keys and previously loaded selected records.
- Title/footer receive displayed page data. Row dragging remains within the page and returns the entire input dataSource. Tree expansion, virtual scrolling and automatic height are supported.
- Enabled pagination defaults to scrolling to the first row on sort/filter/paginate while keeping the horizontal offset. Set `scroll.scrollToFirstRowOnChange: false` to opt out. Unpaginated tables retain their old default.
- When migrating from Ant, opt in explicitly and read the original first callback argument from `extra.pagination`.

## Themes and locales

Both presets use `theme.pagination` slots/variants and `--vtg-pagination-*` tokens: size, size-sm, gap, margin, radius, input-width, border, bg, active-bg, active-color, active-border, popup-z and popup-shadow. Semantic colors follow dark mode. Style generation supports prebuilt CSS and Tailwind 3/4 with custom class prefixes.

The `element-plus` preset retains the same Ant-style configuration, callbacks, visibility defaults and page-size options. It uses contiguous, borderless page buttons with a bold active page; the order is total, sizes, pages, jumper. With `pagerCount` omitted, its page window follows Element Plus (7, or 5 with `showLessItems`), with 5/3-page jumps. The quick-jump input shows the current page, truncates decimals on submission, and restores the effective page after Enter or blur; an explicit Go button retains the existing submission rules. Chinese uses “前往”; English omits the trailing “Page”. Default buttons are 32px; small buttons are 24px with 12px text. Without an explicit pagination size, small tables use small pagination, while middle/large tables use default pagination. `simple`, Go buttons and `itemRender` remain supported extensions.

Existing locale packs remain valid. Add an optional global `pagination` group or `localeOverrides.pagination`; table `pagination.locale` takes final precedence. Locale keys include items_per_page, jump_to, jump_to_confirm, page, prev_page, next_page, prev_3/next_3, prev_5/next_5, navigation and page_size.

Optional `prev_pages` / `next_pages` locale templates use `{count}` for the actual ellipsis jump distance, for example `prev_pages: 'Previous {count} pages'`. Jumps of 3 or 5 pages continue to use the existing `prev_3` / `next_3` and `prev_5` / `next_5` keys. Each jump button uses the same text for its title and aria-label.

Ant internal `selectComponentClass`, `selectPrefixCls` and `prefixCls` are unsupported. Use the existing theme system, `classPrefix` and table `getPopupContainer`. A standalone Pagination component is not exported.
