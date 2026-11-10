---
title: API Reference
description: Complete props, column fields, events, slots and summary components reference for the vtable-guild Vue table, with defaults and controlled/uncontrolled rules.
---

# API Reference

This page is the behavioral reference: props, events, slots, defaults and controlled/uncontrolled rules.

For the full relationships of TypeScript types such as `TableColumnsType`, `Breakpoint` and `RowSelection`, see the [type reference](/guide/type-reference) (Chinese). Complete declarations are available in [Type Declarations](#type-declarations) below.

## Import entry

Import components, constants and types from `@vtable-guild/vtable-guild`:

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

Compose the standalone `VTableToolbar` in `VTable`'s `#title` slot and share `v-model:columns` and `v-model:size` with the table. Reload, density and column settings are enabled by default. Full screen is enabled with `options.fullScreen` and targets the surrounding table; pass `fullscreenTarget` to include content outside it. Reload only emits an event; the application manages requests and `loading`.

Use `#actions` to add export or create buttons and `#settings` to replace the built-in tools. `options: false` keeps these business slots available. See [toolbar and business extensions](/guide/toolbar) (Chinese) for complete props, events, slot types and a working CSV export example.

Use standalone `VTableColumnSettings` when you only need density and column settings. It covers visibility, pinning to the left or right, and drag reordering of top-level columns within a fixed region. `options.density`, `options.setting`, `options.fixed` and `options.draggable` toggle each entry; the column fields `disable` and `hideInSetting` lock or hide an item, and `#columnLabel` customizes labels. The panel's reset restores initial visibility only; `useColumnState().reset()` restores visibility, pinning and order. See [column display and order](/guide/column-display) (Chinese).

## Query and editing protocols

These composables follow the query state of Ant Design ProTable and the row state of EditableProTable. They do not generate a form from columns: controls, form validation and submission stay with the host UI library, and both presets share the same protocol.

| Entry                             | Purpose                                                                                                               | Full API                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `useTableQuery<TValues, TParams>` | Query draft, parameter transforms, submit and reset. Input only changes the draft; `submit()` transforms and submits. | [Query](/guide/query#api) (Chinese)     |
| `useTableEdit<TRecord>`           | Row drafts, validation, save and cancel. A failure keeps the draft; a completed save ends editing.                    | [Editing](/guide/editing#api) (Chinese) |

Connect a query to the request manager with `onSubmit: request.submit` and `onReset: request.reset`. Both return to page one, and reset also clears sorting and filters. `useTableQuery` never issues the first request and does not clear fields hidden by collapsing. Editing defaults to single-row mode, where starting a second row returns `false`. Returning `false` from `onSave` or `onCancel` keeps the row in editing, and a thrown error becomes a row error.

## VTable Props

### Data and structure

| Prop                 | Type                                                             | Default      | Description                                                                                    |
| -------------------- | ---------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `dataSource`         | `TRecord[]`                                                      | `[]`         | Table data source.                                                                             |
| `pagination`         | `false \| TablePaginationConfig`                                 | `false`      | Pass `{}` to enable local or remote pagination; see [pagination](/en/guide/pagination).        |
| `columns`            | [`TableColumnsType<TRecord>`](/guide/type-reference#columnstype) | `[]`         | Column configuration: leaf columns, column groups and sentinel constants.                      |
| `columnOrder`        | [`Key[]`](/guide/type-reference#key)                             | -            | Column display order. See [column display](/guide/column-display) (Chinese).                   |
| `rowKey`             | `string \| ((record: TRecord) => Key)`                           | `'key'`      | Unique row identity. Selection and expansion are keyed by it, so it must be stable and unique. |
| `childrenColumnName` | `string`                                                         | `'children'` | Child field name for tree data.                                                                |
| `indentSize`         | `number`                                                         | `15`         | Tree data indent width in px.                                                                  |
| `loadData`           | `TableTreeLoadData<TRecord>`                                     | -            | `(record, { signal }) => Promise<TRecord[]>`; lazily loads nodes that provide no children.     |
| `isLeaf`             | `(record: TRecord) => boolean`                                   | -            | Marks leaf nodes of a lazy tree; an existing `children: []` also counts as a leaf.             |
| `onTreeLoadError`    | `(error: Error, record: TRecord) => void`                        | -            | Lazy-load error notification; can be bound with `@tree-load-error`.                            |
| `renderers`          | `TableFieldRenderers<TRecord>`                                   | built-in map | Override or extend the read-only renderers for `valueType` on this table.                      |

### Server-side calculation and requests

| Prop     | Type                           | Default | Description                                                                                                                                                                                                                         |
| -------- | ------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manual` | `boolean \| TableManualConfig` | `false` | `true` skips local sorting, filtering and pagination slicing; the object form sets `sort`, `filter` and `pagination` separately. Header state and the `change` event keep working. See [remote data](/guide/remote-data) (Chinese). |

`sorter: true` on its own still means local default sorting, so enable `manual.sort` for server-side sorting. Pass an explicit `total` for remote pagination; `manual.pagination` turns off local slicing for servers that already return the current page.

The optional [useTableRequest](/guide/remote-data) (Chinese) returns data, `loading`, `error`, controlled `pagination`, `manual` and a single `onChange`, plus `submit`, `reset`, `reload` and `cancel`. `manual` itself never issues a network request.

### Visuals and layout

| Prop              | Type                             | Default                                              | Description                                                                    |
| ----------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `size`            | `'small' \| 'middle' \| 'large'` | `'large'` for `antdv`, `'middle'` for `element-plus` | Table size, aligned with ant-design-vue naming.                                |
| `loading`         | `boolean \| object`              | `false`                                              | Loading state; see [config](#loading) for the object form.                     |
| `bordered`        | `boolean`                        | `false`                                              | Show borders.                                                                  |
| `striped`         | `boolean`                        | `false`                                              | Zebra striping.                                                                |
| `hoverable`       | `boolean`                        | `true`                                               | Row hover highlight.                                                           |
| `tableLayout`     | `'auto' \| 'fixed'`              | -                                                    | Table layout mode.                                                             |
| `showHeader`      | `boolean`                        | `true`                                               | Whether to show the header.                                                    |
| `headerEllipsis`  | `boolean`                        | `false`                                              | Also ellipsize headers of columns with `column.ellipsis`.                      |
| `class`           | `string`                         | -                                                    | Extra class on the root node.                                                  |
| `columnEmptyText` | `VNodeChild \| false`            | `false`                                              | Replaces `null` or `undefined` cells, keeping zero, `false` and empty strings. |

#### loading {#loading}

Fields of the object form of `loading`.

| Field              | Type         | Default          | Description                                                                  |
| ------------------ | ------------ | ---------------- | ---------------------------------------------------------------------------- |
| `spinning`         | `boolean`    | `true`           | Whether the table is loading.                                                |
| `indicator`        | `VNodeChild` | preset indicator | Custom loading indicator.                                                    |
| `tip`              | `string`     | -                | Text shown below the indicator.                                              |
| `delay`            | `number`     | `0`              | Milliseconds to wait before showing; nothing is shown if loading ends first. |
| `wrapperClassName` | `string`     | -                | Class added to the table root while loading.                                 |

### Scrolling and positioning

| Prop                | Type                                        | Default | Description                                                                                                                                                            |
| ------------------- | ------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll`            | `object`                                    | -       | Horizontal and vertical scrolling, see [config](#scroll). Providing `y` creates a fixed-header scroll area.                                                            |
| `sticky`            | `boolean \| TableSticky`                    | `false` | Sticky header and summary; see [config](#sticky) for the object form.                                                                                                  |
| `virtual`           | `boolean`                                   | `false` | Enable virtual scrolling; requires `scroll.y`.                                                                                                                         |
| `virtualColumn`     | `boolean`                                   | `false` | Horizontal virtualization: render only columns in the viewport; requires `virtual`. Pays off with many columns, see [virtualization](/guide/virtualization) (Chinese). |
| `rowHeight`         | `number`                                    | -       | Fixed row height (px), only in `virtual` mode. Declaring it skips all row measurement and makes viewport math O(1) — only pass it if every row truly has that height.  |
| `getPopupContainer` | `(triggerNode: HTMLElement) => HTMLElement` | -       | Mount container for filter, selection and page-size menus.                                                                                                             |

#### scroll {#scroll}

| Field                      | Type               | Default                | Description                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `x`                        | `number \| string` | -                      | Content width of the horizontal scroll area; numbers are treated as px. Horizontal scrolling appears when it exceeds the container.                                                                                                                                      |
| `y`                        | `number \| string` | -                      | Maximum body height; the header becomes fixed. `'auto'` fills a parent with a definite height and deducts the header and external summary. In `virtual` mode, other strings must be positive pixel values; relative units fall back to 400px with a development warning. |
| `scrollToFirstRowOnChange` | `boolean`          | `true` with pagination | Scroll back to the first row after sorting, filtering or paginating.                                                                                                                                                                                                     |

#### sticky {#sticky}

Fields of the object form of `sticky`; `true` equals `{}`.

| Field           | Type                          | Default | Description                                                                     |
| --------------- | ----------------------------- | ------- | ------------------------------------------------------------------------------- |
| `offsetHeader`  | `number`                      | `0`     | Distance between the sticky header and the top of the scroll container, in px.  |
| `offsetSummary` | `number`                      | `0`     | Distance between a bottom-fixed summary and the bottom of the container, in px. |
| `offsetScroll`  | `number`                      | -       | Reserved in the type; not used in the current version.                          |
| `getContainer`  | `() => Window \| HTMLElement` | -       | Reserved in the type; not used in the current version.                          |

### Theming and locale

| Prop              | Type                                                     | Default                    | Description                                                                                                           |
| ----------------- | -------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ui`              | `SlotProps<{ slots: Record<TableSlots, string> }>`       | -                          | Theme slot class overrides for this table instance. See the [ui slot reference](/guide/ui-slots-reference) (Chinese). |
| `locale`          | [`LocaleName`](/guide/type-reference#localename)         | global config or `'zh-CN'` | Locale identifier for this table instance.                                                                            |
| `locales`         | [`LocaleRegistry`](/guide/type-reference#localeregistry) | `{}`                       | Extra locale packs registered on this instance.                                                                       |
| `localeOverrides` | `DeepPartial<VTableGuildTableLocale>`                    | `{}`                       | Partial locale overrides for this instance.                                                                           |

### Interactive capabilities

| Prop                     | Type                                                          | Default                                        | Description                                                                   |
| ------------------------ | ------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `rowSelection`           | [`RowSelection<TRecord>`](/guide/type-reference#rowselection) | -                                              | Enable the selection column.                                                  |
| `expandable`             | [`Expandable<TRecord>`](/guide/type-reference#expandable)     | -                                              | Enable expandable rows.                                                       |
| `rowDraggable`           | `boolean`                                                     | `false`                                        | Enable row drag sorting, see [row drag sort](/guide/row-drag-sort) (Chinese). |
| `expandedRowKeys`        | `Key[]`                                                       | -                                              | Controlled expanded keys for tree data.                                       |
| `defaultExpandedRowKeys` | `Key[]`                                                       | -                                              | Default expanded keys for tree data.                                          |
| `defaultExpandAllRows`   | `boolean`                                                     | `false`                                        | Expand all tree nodes by default.                                             |
| `onExpand`               | `(expanded: boolean, record: TRecord) => void`                | -                                              | Tree expand/collapse callback.                                                |
| `onExpandedRowsChange`   | `(expandedKeys: Key[]) => void`                               | -                                              | Tree expanded-keys callback.                                                  |
| `transformCellText`      | `TransformCellText<TRecord>`                                  | -                                              | Transform cell text; `opt` contains `text`, `column`, `record` and `index`.   |
| `showSorterTooltip`      | [`boolean \| TableTooltipConfig`](#tabletooltipconfig)        | `true` for `antdv`, `false` for `element-plus` | Table-level sorter tooltip config, overridable per column.                    |
| `sortDirections`         | [`SortOrder[]`](/guide/type-reference#sortorder)              | `['ascend', 'descend']`                        | Table-level sort direction list, used as the default for columns.             |

### Custom structure

| Prop              | Type                                                                                                    | Default | Description                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| `rowClassName`    | `string \| RowClassName<TRecord>`                                                                       | -       | Extra class for body rows.                           |
| `customRow`       | `GetComponentProps<TRecord>`                                                                            | -       | Inject attributes, events and styles on body rows.   |
| `customHeaderRow` | `(columns: (ColumnType<TRecord> \| ColumnGroupType<TRecord>)[], index?: number) => CellAdditionalProps` | -       | Inject attributes, events and styles on header rows. |
| `title`           | `(data: TRecord[]) => VNodeChild`                                                                       | -       | Table title render function.                         |
| `footer`          | `(data: TRecord[]) => VNodeChild`                                                                       | -       | Table footer render function.                        |

## Cell display

| Field        | Type                                                                              | Default | Description                                                                     |
| ------------ | --------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `copyable`   | `boolean \| object`                                                               | -       | Show a copy button; see [config](#copyable) for the object form.                |
| `tooltip`    | `string \| TableTooltipConfig`                                                    | -       | Header help text; see [config](#tabletooltipconfig) for the object form.        |
| `valueEnum`  | `ColumnValueEnum`                                                                 | -       | Maps raw values to display text and status. Accepts an object or a Map.         |
| `valueType`  | `string`                                                                          | -       | A built-in field renderer type or a registered custom type.                     |
| `fieldProps` | `TableFieldProps \| ((context: CustomRenderContext<TRecord>) => TableFieldProps)` | -       | Options for the field renderer, as an object or a function of the cell context. |

### copyable

Fields of the object form of `copyable`; `true` copies the cell text.

| Field     | Type                                                                               | Default   | Description                                                                       |
| --------- | ---------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------- |
| `text`    | `string \| ((context: CustomRenderContext<TRecord>) => string \| Promise<string>)` | cell text | Content to copy. Required when the cell value is not a string, number or boolean. |
| `onCopy`  | `(text: string, record: TRecord) => void`                                          | -         | Called after a successful copy.                                                   |
| `onError` | `(error: unknown, record: TRecord) => void`                                        | -         | Called after a failed copy.                                                       |

### TableTooltipConfig

Fields of the object form of the column `tooltip` and of table-level and column-level `showSorterTooltip`.

| Field             | Type                                     | Default | Description                                                |
| ----------------- | ---------------------------------------- | ------- | ---------------------------------------------------------- |
| `title`           | `VNodeChild`                             | -       | Tooltip content.                                           |
| `placement`       | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Side on which the tooltip appears.                         |
| `mouseEnterDelay` | `number`                                 | `0.1`   | Delay before showing after the pointer enters, in seconds. |
| `mouseLeaveDelay` | `number`                                 | `0.1`   | Delay before hiding after the pointer leaves, in seconds.  |
| `color`           | `string`                                 | -       | Tooltip background color.                                  |
| `arrow`           | `boolean`                                | `true`  | Whether to show the arrow.                                 |
| `class`           | `string`                                 | -       | Class for the tooltip content.                             |

`filters: true` builds filter items from `valueEnum`, and `onFilter: true` uses equality matching. `valueType` selects `text`, `digit`, `money`, `date`, `dateTime`, `time`, `dateRange`, `dateTimeRange`, `percent`, `progress`, `tag` or a custom type registered through `createTableRenderers`. See [cell display](/guide/cell-display) and [field renderers](/guide/cell-render) (Chinese).

## Remote dictionary, schema query and column editing

- `createTableDictionary` and `useTableDictionary` share cached option lists between host controls, column `valueEnum` and header `filters`. See [remote dictionary](/guide/dictionary#api) (Chinese).
- `VTableQuery` renders a query area from `query`, `fields` and `controls` on top of `useTableQuery`. See [schema query](/guide/schema-query#api) (Chinese).
- `useTableEditable` connects `column.editor` to the row drafts of `useTableEdit`. See [column editing](/guide/editable-columns#api) and [detail forms](/guide/detail-form#api) (Chinese).

## VTable instance methods

Type the template ref with the public `TableInstance`. Regular and virtual bodies share the same interface.

| Method             | Type                                                  | Description                                                                                                                                                         |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrollTo`         | `(options: TableScrollToOptions) => Promise<boolean>` | Scroll to a row or position, see [options](#tablescrolltooptions). Returns `false` when the target is missing, the table is unmounted or the arguments are invalid. |
| `retryTreeLoad`    | `(key: Key) => Promise<boolean>`                      | Retry lazy loading for a node without changing its expanded state.                                                                                                  |
| `getTreeLoadError` | `(key: Key) => Error \| undefined`                    | Read the lazy-load error of a row.                                                                                                                                  |

### TableScrollToOptions

Provide at least one of `key`, `index`, `top` and `left`.

| Field    | Type                          | Default | Description                                                                                                    |
| -------- | ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `key`    | `Key`                         | -       | Stable row key; takes precedence over `index` and `top`. Number `0` and the empty string are valid.            |
| `index`  | `number`                      | -       | Zero-based index among visible rows on the current page; tree data counts expanded, flattened rows.            |
| `top`    | `number`                      | -       | Vertical pixel position, used when neither `key` nor `index` is given; clamped to the scrollable range.        |
| `left`   | `number`                      | -       | Horizontal pixel position; clamped to the scrollable range.                                                    |
| `align`  | `'top' \| 'bottom' \| 'auto'` | `'top'` | Row alignment. `auto` does not scroll when the row is fully visible, and otherwise aligns to the nearest edge. |
| `offset` | `number`                      | `0`     | Distance kept from the edge after aligning, in px.                                                             |

Positioning only covers loaded, visible records on the current page. Rows on other pages, inside collapsed tree nodes or removed by filters return `false`; change the page, load or expand first.

## Column behavior

### Basics

| Field        | Type                                               | Default | Description                                                                         |
| ------------ | -------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `key`        | [`Key`](/guide/type-reference#key)                 | -       | Unique column identity; passing it explicitly is recommended.                       |
| `title`      | `ColumnTitle<TRecord>`                             | -       | Column title: text, VNode or render function.                                       |
| `dataIndex`  | [`DataIndex`](/guide/type-reference#dataindex)     | -       | Data field path, e.g. `'name'` or `['address', 'city']`.                            |
| `width`      | `number \| string`                                 | -       | Column width; numbers are treated as px.                                            |
| `align`      | [`AlignType`](/guide/type-reference#aligntype)     | -       | Cell content alignment.                                                             |
| `ellipsis`   | `boolean \| { showTitle?: boolean }`               | `false` | Ellipsize overflowing cell content; `showTitle: false` disables the hover tooltip.  |
| `className`  | `string`                                           | -       | Extra class for the column's cells.                                                 |
| `colSpan`    | `number`                                           | -       | Header cell colSpan.                                                                |
| `visible`    | `boolean`                                          | `true`  | Whether the column is shown, see [column display](/guide/column-display) (Chinese). |
| `responsive` | [`Breakpoint[]`](/guide/type-reference#breakpoint) | -       | Show the column when any listed breakpoint matches the screen.                      |

### Custom rendering

| Field              | Type                                                                          | Default | Description                                                              |
| ------------------ | ----------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `customRender`     | `(ctx: CustomRenderContext<TRecord>) => VNodeChild \| RenderedCell`           | -       | Custom body cell content. Returning `RenderedCell` also sets cell props. |
| `customCell`       | `GetComponentProps<TRecord, TRecord>`                                         | -       | Inject attributes, events and styles on body cells.                      |
| `customHeaderCell` | `GetComponentProps<ColumnType<TRecord> \| ColumnGroupType<TRecord>, TRecord>` | -       | Inject attributes, events and styles on header cells.                    |

<<< @/.vitepress/type-declarations/examples.typecheck.ts#CustomRenderExample

### Fixed columns and resizing

| Field       | Type                        | Default | Description                                                                                                                                                    |
| ----------- | --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixed`     | `'left' \| 'right' \| true` | -       | Fixed side; `true` equals `'left'`.                                                                                                                            |
| `resizable` | `boolean`                   | `false` | Whether the column width is drag-adjustable.                                                                                                                   |
| `minWidth`  | `number`                    | -       | Leaf-column minimum in auto/fixed layouts and resizing, in finite nonnegative CSS pixels. Unset values add no layout minimum; resizing alone defaults to 50px. |
| `maxWidth`  | `number`                    | -       | Maximum resize target only; `minWidth` wins if the two conflict.                                                                                               |

`width` is a target and cannot override a valid `minWidth`, including explicit `0`. Negative or non-finite minimums are treated as unset. All visible leaf columns retain their minimums while another column is resized, regardless of `resizable`. If their total minimum exceeds the container, the table scrolls horizontally even without `scroll.x`. Group-header widths follow their children. Updating or removing a minimum recalculates the layout.

Resizing starts from the measured cell width and emits `(column: ColumnType<TRecord>, width: number) => void` on release after a valid move. The event reports the constrained target; auto-layout content can make the rendered column wider. The component does not mutate the supplied column configuration. Existing minimums may now cause wider columns or earlier horizontal overflow.

### Sorting

| Field               | Type                                                          | Default                 | Description                                                                |
| ------------------- | ------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `sorter`            | [`ColumnSorter<TRecord>`](/guide/type-reference#columnsorter) | -                       | Enable sorting: default compare, custom compare fn or multi-column object. |
| `sortOrder`         | [`SortOrder`](/guide/type-reference#sortorder)                | -                       | Controlled sort order.                                                     |
| `defaultSortOrder`  | [`SortOrder`](/guide/type-reference#sortorder)                | -                       | Uncontrolled default order, effective on first render only.                |
| `sortDirections`    | `SortOrder[]`                                                 | `['ascend', 'descend']` | Sort directions available for this column.                                 |
| `showSorterTooltip` | [`boolean \| TableTooltipConfig`](#tabletooltipconfig)        | inherits table config   | Column-level sorter tooltip switch and config.                             |

Table-level `sortDirections` and `showSorterTooltip` act as defaults; column-level config wins.

### Filtering

| Field                               | Type                                                                            | Default  | Description                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `filters`                           | [`ColumnFilterItem[]`](/guide/type-reference#columnfilteritem)                  | -        | Filter menu items; renders the filter icon in the header.      |
| `onFilter`                          | `(value: string \| number \| boolean, record: TRecord) => boolean`              | -        | Filter function; return `true` to keep the row.                |
| `filterMultiple`                    | `boolean`                                                                       | `true`   | Whether multiple filter values can be picked.                  |
| `filteredValue`                     | `Array<string \| number \| boolean> \| null`                                    | -        | Controlled filter values.                                      |
| `defaultFilteredValue`              | `Array<string \| number \| boolean>`                                            | -        | Uncontrolled default filter values.                            |
| `customFilterDropdown`              | `boolean`                                                                       | `false`  | Use the table-level `customFilterDropdown` slot.               |
| `filterSearch`                      | `boolean \| ((input: string, filter: ColumnFilterItem) => boolean)`             | `false`  | Search within filter items.                                    |
| `filterMode`                        | `'menu' \| 'tree'`                                                              | `'menu'` | Filter item presentation mode.                                 |
| `filterResetToDefaultFilteredValue` | `boolean`                                                                       | `false`  | Reset restores the default filter values.                      |
| `filterDropdownOpen`                | `boolean`                                                                       | -        | Controlled filter dropdown visibility.                         |
| `onFilterDropdownOpenChange`        | `(visible: boolean) => void`                                                    | -        | Filter dropdown visibility callback.                           |
| `filtered`                          | `boolean`                                                                       | -        | Externally control the filter icon highlight; does not filter. |
| `filterIcon`                        | `(opt: { filtered: boolean }) => VNodeChild`                                    | -        | Custom filter icon.                                            |
| `filterDropdown`                    | `VNodeChild \| ((props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild)` | -        | Column-level custom filter panel; overrides the table slot.    |

### Column settings

| Field           | Type                                                                  | Default | Description                                                                              |
| --------------- | --------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `hideInSetting` | `boolean`                                                             | `false` | Hide the column in the column settings panel.                                            |
| `disable`       | `boolean \| { checkbox?: boolean; fixed?: boolean; order?: boolean }` | -       | Lock column settings actions; visibility, pinning and ordering can be locked separately. |

### Column editing

| Field    | Type                                  | Default | Description                                                                               |
| -------- | ------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `editor` | `false \| TableColumnEditor<TRecord>` | -       | Column editor config, read by `useTableEditable` to connect host controls and row drafts. |

### Column groups

| Field      | Type                                                     | Default | Description                                                   |
| ---------- | -------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| `children` | `Array<ColumnType<TRecord> \| ColumnGroupType<TRecord>>` | -       | Child columns. With `children` present the column is a group. |

Column groups do not receive leaf-column behaviors such as sorting, filtering, `dataIndex` and `customRender`.

## Row Selection

`rowSelection` enables the selection column: multiple, single, tree-linked, batch menus and controlled state.

| Field                     | Type                                                                                                     | Default      | Description                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------ |
| `type`                    | `'checkbox' \| 'radio'`                                                                                  | `'checkbox'` | Selection type.                                  |
| `selectedRowKeys`         | `Key[]`                                                                                                  | -            | Controlled selected keys.                        |
| `defaultSelectedRowKeys`  | `Key[]`                                                                                                  | -            | Default selected keys.                           |
| `onChange`                | `(selectedRowKeys: Key[], selectedRows: TRecord[]) => void`                                              | -            | Selection change callback.                       |
| `onSelect`                | `(record: TRecord, selected: boolean, selectedRows: TRecord[]) => void`                                  | -            | Single-row selection callback.                   |
| `onSelectMultiple`        | `(selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void`                            | -            | Shift multi-select callback.                     |
| `onSelectAll`             | `(selected: boolean, selectedRows: TRecord[], changeRows: TRecord[]) => void`                            | -            | Select-all callback.                             |
| `onSelectInvert`          | `(selectedRowKeys: Key[]) => void`                                                                       | -            | Invert-selection callback.                       |
| `onSelectNone`            | `() => void`                                                                                             | -            | Clear-selection callback.                        |
| `getCheckboxProps`        | `(record: TRecord) => { disabled?: boolean; name?: string }`                                             | -            | Inject attributes on selection controls.         |
| `columnWidth`             | `number \| string`                                                                                       | -            | Selection column width.                          |
| `fixed`                   | `boolean \| 'left' \| 'right'`                                                                           | -            | Fixed position of the selection column.          |
| `columnTitle`             | `string \| VNodeChild`                                                                                   | -            | Selection column header content.                 |
| `renderCell`              | `(value: boolean, record: TRecord, index: number, originNode: VNodeChild) => VNodeChild \| RenderedCell` | -            | Custom selection cell.                           |
| `checkStrictly`           | `boolean`                                                                                                | `true`       | Parent/child independent selection in tree data. |
| `selections`              | `boolean \| (SelectionItem \| SelectionSentinel)[]`                                                      | `false`      | Default or custom batch-selection menu.          |
| `hideSelectAll`           | `boolean`                                                                                                | `false`      | Hide the select-all checkbox and dropdown.       |
| `preserveSelectedRowKeys` | `boolean`                                                                                                | `false`      | Keep selected keys when the data source changes. |

Default batch-selection constants: see [SelectionSentinel](/guide/type-reference#selectionsentinel) (Chinese).

With pagination enabled, the header checkbox and invert selection affect the current page. The “Select all data” menu (`selections: true` or `[SELECTION_ALL]`) selects all loaded, selectable records after filtering. Use `preserveSelectedRowKeys: true` to retain selected keys and records across remote pages; unloaded pages are never fetched automatically. See [pagination](/en/guide/pagination).

## Expandable

`expandable` configures expandable row content. Tree-data expand props live at the `VTable` top level.

| Field                    | Type                                                                                                                                | Default | Description                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expandedRowRender`      | `(record: TRecord, index: number, indent: number, expanded: boolean) => VNodeChild`                                                 | -       | Expanded row content render function.                                                                                      |
| `expandedRowKeys`        | `Key[]`                                                                                                                             | -       | Controlled expanded row keys.                                                                                              |
| `defaultExpandedRowKeys` | `Key[]`                                                                                                                             | -       | Default expanded row keys.                                                                                                 |
| `expandRowByClick`       | `boolean`                                                                                                                           | `false` | Expand on full-row click.                                                                                                  |
| `expandIcon`             | `(props: { expanded: boolean; record: TRecord; expandable: boolean; onExpand: (record: TRecord, e: Event) => void }) => VNodeChild` | -       | Custom expand icon.                                                                                                        |
| `onExpand`               | `(expanded: boolean, record: TRecord) => void`                                                                                      | -       | Expand/collapse callback.                                                                                                  |
| `onExpandedRowsChange`   | `(expandedKeys: Key[]) => void`                                                                                                     | -       | Expanded-keys callback.                                                                                                    |
| `columnWidth`            | `number \| string`                                                                                                                  | -       | Expand column width.                                                                                                       |
| `fixed`                  | `'left' \| 'right' \| true`                                                                                                         | -       | Fixed position of the expand column; `true` = `'left'`.                                                                    |
| `defaultExpandAllRows`   | `boolean`                                                                                                                           | `false` | Expand all rows by default.                                                                                                |
| `rowExpandable`          | `(record: TRecord) => boolean`                                                                                                      | -       | Whether a row is expandable.                                                                                               |
| `showExpandColumn`       | `boolean`                                                                                                                           | `true`  | Whether to show the expand column.                                                                                         |
| `expandIconColumnIndex`  | `number`                                                                                                                            | `0`     | Zero-based position of the expand column among business columns. An explicit `EXPAND_COLUMN` placeholder takes precedence. |
| `columnTitle`            | `string \| number`                                                                                                                  | `''`    | Expand column title; `#expandColumnTitle` overrides it.                                                                    |
| `expandedRowClassName`   | `string \| RowClassName<TRecord>`                                                                                                   | -       | Class for expanded rows.                                                                                                   |

## Events

`TRecord` is your business row type. `VTableEventProps<TRecord>` provides callback types for template listeners and event props. For pagination only, use `pagination.onChange(page, pageSize)`; the table event reads pagination from `extra.pagination`.

| Event          | Payload                                                                                                      | Description                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `change`       | `(filters: TableFiltersInfo, sorter: VTableSorterResult<TRecord>, extra: TableChangeExtra<TRecord>) => void` | Unified event after sorting, filtering, selection and pagination.                                               |
| `resizeColumn` | `(column: ColumnType<TRecord>, width: number) => void`                                                       | Fired after a column resize drag ends.                                                                          |
| `rowDragEnd`   | `(newData: TRecord[], info: RowDragSortInfo) => void`                                                        | Fired when row drag sorting finishes with a changed order, see [row drag sort](/guide/row-drag-sort) (Chinese). |

`change` keeps its three arguments. Enabled pagination adds `extra.pagination`; actions are `'sort'`, `'filter'`, `'select'` and `'paginate'`.

`extra.currentDataSource` contains processed data before pagination for sort/filter/paginate, and displayed page data for selection. Remote data is limited to loaded records.

<<< @/.vitepress/type-declarations/examples.typecheck.ts#PaginationChangeExample

## Slots

| Slot                   | Payload type                                                                                    | Description                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `bodyCell`             | [`TableBodyCellSlotProps<TRecord>`](/guide/type-reference#tablebodycellslotprops)               | Custom cell content.                                  |
| `headerCell`           | [`TableHeaderCellSlotProps<TRecord>`](/guide/type-reference#tableheadercellslotprops)           | Custom header cell content.                           |
| `empty`                | `()`                                                                                            | Custom empty state.                                   |
| `loading`              | `()`                                                                                            | Custom loading state.                                 |
| `customFilterDropdown` | [`CustomFilterDropdownSlotProps<TRecord>`](/guide/type-reference#customfilterdropdownslotprops) | Table-level custom filter panel.                      |
| `customFilterIcon`     | `{ column: ColumnType<TRecord>; filtered: boolean }`                                            | Table-level custom filter icon.                       |
| `title`                | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | Custom title area.                                    |
| `footer`               | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | Custom footer area.                                   |
| `summary`              | `()`                                                                                            | Custom summary area.                                  |
| `expandColumnTitle`    | `()`                                                                                            | Custom expand column title.                           |
| `paginationItem`       | [`TablePaginationSlotProps`](/en/guide/pagination#pagination-slot-context)                      | Content at `{ slot: 'name' }` in `pagination.layout`. |

> These are Vue slots. To restyle structure via classes, see the [ui slot reference](/guide/ui-slots-reference) (Chinese).

`paginationItem` receives the extension `name`, effective pagination state, `pageCount`, `range`, `disabled`, `position` and `region`. Keep selection and request functions in the parent; bind `disabled` to application buttons as needed. Extensions share the pagination row's visibility, including empty-data and single-page hiding. See [composable layouts and content slots](/en/guide/pagination#composable-layouts-and-content-slots).

## VTableSummary

`VTableSummary` renders summary rows.

| Component            | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `VTableSummary`      | Summary container, placed in the table's `#summary` slot. |
| `VTableSummary.Row`  | Summary row; it has no props.                             |
| `VTableSummary.Cell` | Summary cell.                                             |

### VTableSummary Props

| Prop    | Type                           | Default | Description                                |
| ------- | ------------------------------ | ------- | ------------------------------------------ |
| `fixed` | `boolean \| 'top' \| 'bottom'` | `false` | Fix the summary; `true` equals `'bottom'`. |

### VTableSummary.Cell Props

| Prop      | Type                                           | Default  | Description                          |
| --------- | ---------------------------------------------- | -------- | ------------------------------------ |
| `index`   | `number`                                       | required | Zero-based column index of the cell. |
| `colSpan` | `number`                                       | -        | Number of columns to span.           |
| `rowSpan` | `number`                                       | -        | Number of rows to span.              |
| `align`   | [`AlignType`](/guide/type-reference#aligntype) | -        | Content alignment.                   |

## Related pages

- [Type reference](/guide/type-reference) (Chinese)
- [ui slot reference](/guide/ui-slots-reference) (Chinese)
- [Sorting](/guide/sorting) (Chinese)
- [Filtering](/guide/filtering) (Chinese)

## Pagination

`pagination?: false | TablePaginationConfig` defaults to disabled. Pass `{}` to enable. See the [pagination configuration](/en/guide/pagination#configuration); [`scroll.scrollToFirstRowOnChange`](#scroll) controls whether paging scrolls back to the first row.

## Type Declarations

Types are imported from `@vtable-guild/vtable-guild`. Shared supporting types are indexed in the [type reference](/guide/type-reference) (Chinese). Summary props below are documentation helper types, not named package exports.

::: details Props and columns

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
