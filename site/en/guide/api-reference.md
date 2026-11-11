# API Reference

This page is the component behavior reference: look up props, events, slots, defaults and controlled-mode rules.

For the full relationships of TypeScript types such as `TableColumnsType`, `Breakpoint` and `RowSelection`, see the [Type reference](/en/guide/type-reference). The complete [Type Declarations](#type-declarations) at the end of this page let you look up parameters and return values directly.

## Import entry

We recommend importing components, constants and types from the single `@vtable-guild/vtable-guild` entry.

```ts
import {
  VTable,
  VTableToolbar,
  VTableColumnSettings,
  VTableSummary,
  useTableRequest,
  useTableQuery,
  useTableEdit,
  createTableRenderers,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
  type TableColumnsType,
  type RowSelection,
  type Expandable,
  type TableInstance,
} from '@vtable-guild/vtable-guild'
```

## Toolbar and column settings

`VTableToolbar` is a standalone component; place it in `VTable`'s `#title` slot to compose the two. It shares `v-model:columns` and `v-model:size` with the table. Reload, density and column settings are enabled by default; full screen is enabled with `options.fullScreen` and targets the surrounding table by default, and `fullscreenTarget` can point at another element. Reload only emits `reload`; the application manages data requests and `loading`.

`#actions` adds application buttons such as export or create; `#settings` replaces the built-in tools entirely; `options: false` turns off only the built-in tools and keeps the application slots. See [Toolbar](/en/guide/toolbar) for the complete props, events, slots and a runnable export example.

Use `VTableColumnSettings` on its own when you only need density and column settings. It covers visibility, pinning to the left or right, and drag reordering of top-level columns within the same fixed region. `options.density / setting / fixed / draggable` toggle each entry; the column field `disable` locks actions, `hideInSetting` hides the item, and `#columnLabel` customizes labels. The panel's reset restores initial visibility only; `useColumnState().reset()` restores visibility, pinning and order. See [Column display and order](/en/guide/column-display).

## Query and editing protocols

These Vue composables follow the query state of Ant Design ProTable and the row state of EditableProTable. They do not generate a complete form from columns. Controls, form validation and data submission stay with the host UI library and application services, and `antdv / element-plus` share the same protocol.

<!-- @api: reference query-edit-protocol -->

Connect a query to the request manager with `onSubmit: request.submit` and `onReset: request.reset`. Both submit and reset return to the first page, and reset also clears sorting and filters. `useTableQuery` never issues the first request itself and does not clear fields hidden by collapsing. Editing defaults to single-row mode, where starting a second row returns `false`; multi-row mode handles rows one by one. Returning `false` from `onSave / onCancel` keeps the row in editing, and a thrown error becomes a row error. Drafts do not depend on visible row components; the application updates the data source and explicitly cancels old drafts when switching data sets.

## VTable Props

### Data and structure

<!-- @api: reference props-data -->

Lazy loading requires stable row keys. Concurrent requests for the same node are deduplicated, and a response that arrives after the node is collapsed goes into the cache without expanding it again. Removing a node, replacing a record that has the same key, or unmounting invalidates the old task, and loaded results are not written into the input data. Selection relationships only cover loaded descendants, and pagination still counts root nodes. See [Tree table](/en/guide/tree-table).

### Server-side calculation and requests

<!-- @api: reference props-manual -->

The corresponding header state, filter controls and `change(filters, sorter, extra)` keep working. `sorter: true` on its own still means local default sorting, so enable `manual.sort` as well for server-side sorting.
Pass an explicit `total` for remote pagination; `manual.pagination` turns off local slicing, which suits servers that already return the current page of records.

The optional [useTableRequest](/en/guide/remote-data) returns data, loading, error, controlled pagination, manual and a single onChange entry, and provides submit, reset, reload and cancel.
If you only need to manage requests yourself, you can also pass the data and state directly; `manual` never issues a network request on its own.

### Visuals and layout

<!-- @api: reference props-layout -->

#### loading {#loading}

Options for the object form of `loading`.

<!-- @api: reference loading-config -->

### Scrolling and positioning

<!-- @api: reference props-scroll -->

#### scroll {#scroll}

<!-- @api: reference scroll-config -->

#### sticky {#sticky}

Options for the object form of `sticky`; `true` equals `{}`.

<!-- @api: reference sticky-config -->

### Themes and locales

<!-- @api: reference props-theme -->

### Interactive capabilities

<!-- @api: reference props-interaction -->

### Custom structure

<!-- @api: reference props-structure -->

## Cell display enhancements

<!-- @api: reference columns-cell-display -->

See [Cell display and enums](/en/guide/cell-display#api) for the object forms of `copyable` and `tooltip`; table-level and column-level `showSorterTooltip` use the same [`TableTooltipConfig`](/en/guide/cell-display#tabletooltipconfig).

Column-level `valueEnum?: ColumnValueEnum` accepts an object or a Map whose values are text or `{ text, status }`; status can be success, warning, error, processing or default.
`filters: true` builds filter items from the enum. `filters: false` provides no default filter items. `onFilter: false` skips local filtering, and `onFilter: true` uses equality matching.
See [Cell display and enums](/en/guide/cell-display).

Column-level `valueType?: string` selects `text / digit / money / date / dateTime / time / dateRange / dateTimeRange / percent / progress / tag` or a custom type; `fieldProps` is an options object or a callback that receives the cell context. `createTableRenderers<TRecord>(overrides)` merges the built-in and application maps and returns an immutable registry, which you pass through the table's `renderers` without modifying any global registry. Numbers, money and percentages use Intl, and dates can opt into Intl through dateFormat; tag / progress share the status theme with `valueEnum`.

`transformCellText` runs first, and the field renderer consumes the transformed value and the enum label. `customRender` and valid `bodyCell` content take precedence, empty values use the existing `columnEmptyText`, and unknown types fall back to the enum or the raw value. The data contracts for sorting, filtering and default copying stay unchanged. Renderers only provide read-only display. See [Field renderers](/en/guide/cell-render).

## Remote dictionaries

`createTableDictionary({ key, request, cacheTime?, maxEntries? })` creates an instance-isolated cache; `useTableDictionary({ dictionary, params?, selectedOptions?, debounceTime? })` turns the shared result into `options` for host controls, column `valueEnum` and `filters` for the complete dictionary. It returns `search / reload / cancel` plus loading/error state; partial search results do not generate header filters automatically. See [Remote dictionaries](/en/guide/dictionary) for the full protocol.

## Schema query and column editors

`VTableQuery` takes `query / fields / controls` and reuses useTableQuery; `deriveTableQueryFields` derives fields from column definitions that carry query metadata. Regular queries submit explicitly, and the light layout submits with a debounce only when autoSubmit is enabled. Host forms plug in through validate; use `rootTag="div"` when wrapping an existing Form. See [Schema query](/en/guide/schema-query).

`useTableEditable` takes columns, controls and row-editing options, and connects the conditions, transforms, rules and dictionaries of `column.editor` to the same row draft. Templates bridge through `VTableEditCell`, and TSX can call renderEditor; when there is no editor content, the read-only fallback is kept. See [Column editors](/en/guide/editable-columns).

The controlled dataSource/onChange, records, getOriginal/getDrafts/getValues/validateAll/reset, createRecord/maxRows and the position/cache strategy of add in `useTableEdit / useTableEditable` serve detail tables inside a main form. validateAll returns the submission snapshot from the same validation pass, including off-screen records held by the client, and does not call save; onChange does not fire on every keystroke. See [Detail forms](/en/guide/detail-form).

## VTable instance methods

Type the template ref with the public `TableInstance`. Regular and virtual bodies share the same interface. See [Table instance](/en/guide/table-instance).

<!-- @api: reference instance-methods -->

Positioning only covers loaded, visible records on the current page. Records on other pages, inside collapsed tree nodes or removed by filters return false; change the page, load or expand first, then position. Virtual lists with variable row heights rely on the existing measurement and correction, so the Promise means the positioning has been committed and does not guarantee the final pixel position after images load later.

## Column behavior

### Basic fields

<!-- @api: reference columns-base -->

### Custom rendering

<!-- @api: reference columns-render -->

<<< @/.vitepress/type-declarations/examples.typecheck.ts#CustomRenderExample

### Fixed columns and column resizing

<!-- @api: reference columns-sizing -->

`width` is a target width and cannot override a valid `minWidth`. When the minimums add up to more than the container, the table scrolls horizontally, whether or not the columns are `resizable`. See [Minimum column width and layout](/en/guide/column-resize#minimum-column-width-and-layout).

### Sorting

<!-- @api: reference columns-sorting -->

Table-level `sortDirections` and `showSorterTooltip` act as defaults; column-level config takes precedence.

### Filtering

<!-- @api: reference columns-filtering -->

### Column settings

<!-- @api: reference columns-settings -->

### Column editors

<!-- @api: reference columns-editing -->

### Grouped headers

<!-- @api: reference columns-group -->

Column groups do not receive leaf-column behaviors such as sorting, filtering, `dataIndex` and `customRender`.

## Row Selection

`rowSelection` enables the selection column, with support for multiple selection, single selection, linked selection in tree data, batch-selection menus and controlled selection state.

<!-- @api: reference row-selection -->

For the default batch-selection constants, see [SelectionSentinel](/en/guide/type-reference#selectionsentinel).

With pagination enabled, the header select-all checkbox and invert selection are limited to the current page. The "Select all data" menu (`selections: true` or `[SELECTION_ALL]`) selects all loaded, selectable records after filtering. Remote pagination uses `preserveSelectedRowKeys: true` to keep keys and selected records across pages; unloaded pages are never requested automatically. See [Pagination and cross-page selection](/en/guide/selection#pagination-and-cross-page-selection).

## Expandable

`expandable` configures expandable row content. The expand props for tree data are configured at the top level of `VTable`.

<!-- @api: reference expandable -->

## Events

`TRecord` is your application's row type. `VTableEventProps<TRecord>` provides types for template event handlers and event props. If you only need pagination, use `pagination.onChange(page, pageSize)`; in the table event, read the pagination state from `extra.pagination`.

<!-- @api: reference events -->

`change` keeps its three-argument signature. With pagination enabled it adds `extra.pagination`; `extra.action` supports `'sort'`, `'filter'`, `'select'` and `'paginate'`.

For sort, filter and paginate events, `extra.currentDataSource` is the processed data before pagination; for selection events it is the data displayed on the current page. With remote data it only contains loaded records.

<<< @/.vitepress/type-declarations/examples.typecheck.ts#PaginationChangeExample

## Slots

<!-- @api: reference slots -->

> These are Vue slots. To override structural styles through classes, see the [ui slot reference](/en/guide/ui-slots-reference).

## VTableSummary

`VTableSummary` renders summary rows.

<!-- @api: reference summary -->

### VTableSummary Props

<!-- @api: reference summary-props -->

### VTableSummary.Cell Props

<!-- @api: reference summary-cell-props -->

## Related pages

- [Type reference](/en/guide/type-reference)
- [ui slot reference](/en/guide/ui-slots-reference)
- [Sorting](/en/guide/sorting)
- [Filtering](/en/guide/filtering)

## Pagination

`pagination?: false | TablePaginationConfig` is disabled by default; pass `{}` to enable it. See the [pagination configuration reference](/en/guide/pagination#configuration-reference) for the options; [`scroll.scrollToFirstRowOnChange`](#scroll) controls whether changing pages scrolls back to the first row.

## Type Declarations

Import all types from `@vtable-guild/vtable-guild`. For base types and the relationships between types, see the [Type reference](/en/guide/type-reference). The summary component props below are helper types used to document the declarations, not names exported by the package.

::: details Props and column configuration

<<< @/.vitepress/type-declarations/table.ts#TableProps

<<< @/.vitepress/type-declarations/table.ts#ColumnType

<<< @/.vitepress/type-declarations/table.ts#ColumnGroupType

<<< @/.vitepress/type-declarations/table.ts#ColumnsType

<<< @/.vitepress/type-declarations/table.ts#ColumnTitleProps

<<< @/.vitepress/type-declarations/table.ts#ColumnTitle

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

<<< @/.vitepress/type-declarations/table.ts#CustomRenderContext

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

<<< @/.vitepress/type-declarations/table.ts#RowClassName

<<< @/.vitepress/type-declarations/table.ts#TransformCellText

<<< @/.vitepress/type-declarations/table.ts#TableSticky

:::

::: details Selection and expansion

<<< @/.vitepress/type-declarations/table.ts#RowSelection

<<< @/.vitepress/type-declarations/table.ts#SelectionItem

<<< @/.vitepress/type-declarations/table.ts#Expandable

:::

::: details Events and slots

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#RowDragSortInfo

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableHeaderCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

:::

::: details Pagination

<<< @/.vitepress/type-declarations/table.ts#TablePaginationConfig

<<< @/.vitepress/type-declarations/table.ts#TablePaginationState

<<< @/.vitepress/type-declarations/table.ts#TablePaginationPosition

<<< @/.vitepress/type-declarations/table.ts#PaginationItemType

<<< @/.vitepress/type-declarations/table.ts#TablePaginationBuiltinLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayout

<<< @/.vitepress/type-declarations/table.ts#TablePaginationSlotProps

:::

::: details Summary components

<<< @/.vitepress/type-declarations/table.ts#SummaryFixed

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryProps

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryCellProps

:::
