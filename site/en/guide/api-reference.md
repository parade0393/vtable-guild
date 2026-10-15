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
  VTableSummary,
  EXPAND_COLUMN,
  SELECTION_COLUMN,
  type TableColumnsType,
  type RowSelection,
  type Expandable,
} from '@vtable-guild/vtable-guild'
```

## VTable Props

### Data and structure

| Prop                 | Type                                                             | Default      | Description                                                                             |
| -------------------- | ---------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `dataSource`         | `TRecord[]`                                                      | `[]`         | Table data source.                                                                      |
| `pagination`         | `false \| TablePaginationConfig`                                 | `false`      | Pass `{}` to enable local or remote pagination; see [pagination](/en/guide/pagination). |
| `columns`            | [`TableColumnsType<TRecord>`](/guide/type-reference#columnstype) | `[]`         | Column configuration: leaf columns, column groups and sentinel constants.               |
| `columnOrder`        | [`Key[]`](/guide/type-reference#key)                             | -            | Column display order. See [column display](/guide/column-display) (Chinese).            |
| `rowKey`             | `string \| ((record: TRecord) => Key)`                           | -            | Unique row identity; passing it explicitly is recommended.                              |
| `childrenColumnName` | `string`                                                         | `'children'` | Child field name for tree data.                                                         |
| `indentSize`         | `number`                                                         | `15`         | Tree data indent width in px.                                                           |

### Visuals and layout

| Prop             | Type                                                                      | Default   | Description                                                            |
| ---------------- | ------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `size`           | `'small' \| 'middle' \| 'large'`                                          | `'large'` | Table size, aligned with ant-design-vue naming.                        |
| `loading`        | `boolean \| { spinning?: boolean; indicator?: VNodeChild; tip?: string }` | `false`   | Loading state; the object form accepts `spinning`, `indicator`, `tip`. |
| `bordered`       | `boolean`                                                                 | `false`   | Show borders.                                                          |
| `striped`        | `boolean`                                                                 | `false`   | Zebra striping.                                                        |
| `hoverable`      | `boolean`                                                                 | `true`    | Row hover highlight.                                                   |
| `tableLayout`    | `'auto' \| 'fixed'`                                                       | -         | Table layout mode.                                                     |
| `showHeader`     | `boolean`                                                                 | `true`    | Whether to show the header.                                            |
| `headerEllipsis` | `boolean`                                                                 | `false`   | Also ellipsize headers of columns with `column.ellipsis`.              |
| `class`          | `string`                                                                  | -         | Extra class on the root node.                                          |

### Scrolling and positioning

| Prop                | Type                                                                                 | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll`            | `{ x?: number \| string; y?: number \| string; scrollToFirstRowOnChange?: boolean }` | -       | Horizontal and vertical scroll config; providing `y` creates a fixed-header scroll area. A numeric `y` sets a fixed viewport; `y: 'auto'` fills a parent with a definite height and deducts the header and external summary. In `virtual` mode, other strings must be positive pixel values; relative units fall back to 400px with a development warning. `scrollToFirstRowOnChange` resets vertical scroll after sort/filter/paginate; defaults to true with pagination and false otherwise. |
| `sticky`            | `boolean \| TableSticky`                                                             | `false` | Sticky header, summary or horizontal scrollbar config.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `virtual`           | `boolean`                                                                            | `false` | Enable virtual scrolling; requires `scroll.y`.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `virtualColumn`     | `boolean`                                                                            | `false` | Horizontal virtualization: render only columns in the viewport; requires `virtual`. Pays off with many columns, see [virtualization](/guide/virtualization) (Chinese).                                                                                                                                                                                                                                                                                                                         |
| `rowHeight`         | `number`                                                                             | -       | Fixed row height (px), only in `virtual` mode. Declaring it skips all row measurement and makes viewport math O(1) — only pass it if every row truly has that height.                                                                                                                                                                                                                                                                                                                          |
| `getPopupContainer` | `(triggerNode: HTMLElement) => HTMLElement`                                          | -       | Mount container for filter, selection and page-size menus.                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Theming and locale

| Prop              | Type                                                     | Default                    | Description                                                                                                           |
| ----------------- | -------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ui`              | `SlotProps<{ slots: Record<TableSlots, string> }>`       | -                          | Theme slot class overrides for this table instance. See the [ui slot reference](/guide/ui-slots-reference) (Chinese). |
| `locale`          | [`LocaleName`](/guide/type-reference#localename)         | global config or `'zh-CN'` | Locale identifier for this table instance.                                                                            |
| `locales`         | [`LocaleRegistry`](/guide/type-reference#localeregistry) | `{}`                       | Extra locale packs registered on this instance.                                                                       |
| `localeOverrides` | `DeepPartial<VTableGuildTableLocale>`                    | `{}`                       | Partial locale overrides for this instance.                                                                           |

### Interactive capabilities

| Prop                     | Type                                                          | Default | Description                                                                   |
| ------------------------ | ------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `rowSelection`           | [`RowSelection<TRecord>`](/guide/type-reference#rowselection) | -       | Enable the selection column.                                                  |
| `expandable`             | [`Expandable<TRecord>`](/guide/type-reference#expandable)     | -       | Enable expandable rows.                                                       |
| `rowDraggable`           | `boolean`                                                     | `false` | Enable row drag sorting, see [row drag sort](/guide/row-drag-sort) (Chinese). |
| `expandedRowKeys`        | `Key[]`                                                       | -       | Controlled expanded keys for tree data.                                       |
| `defaultExpandedRowKeys` | `Key[]`                                                       | -       | Default expanded keys for tree data.                                          |
| `defaultExpandAllRows`   | `boolean`                                                     | `false` | Expand all tree nodes by default.                                             |
| `onExpand`               | `(expanded: boolean, record: TRecord) => void`                | -       | Tree expand/collapse callback.                                                |
| `onExpandedRowsChange`   | `(expandedKeys: Key[]) => void`                               | -       | Tree expanded-keys callback.                                                  |
| `transformCellText`      | `TransformCellText<TRecord>`                                  | -       | Transform cell text; `opt` contains `text`, `column`, `record` and `index`.   |
| `showSorterTooltip`      | `boolean`                                                     | `true`  | Table-level sorter tooltip switch, overridable per column.                    |
| `sortDirections`         | [`SortOrder[]`](/guide/type-reference#sortorder)              | -       | Table-level sort direction list, used as the default for columns.             |

### Custom structure

| Prop              | Type                                                                                                    | Default | Description                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| `rowClassName`    | `string \| RowClassName<TRecord>`                                                                       | -       | Extra class for body rows.                           |
| `customRow`       | `GetComponentProps<TRecord>`                                                                            | -       | Inject attributes, events and styles on body rows.   |
| `customHeaderRow` | `(columns: (ColumnType<TRecord> \| ColumnGroupType<TRecord>)[], index?: number) => CellAdditionalProps` | -       | Inject attributes, events and styles on header rows. |
| `title`           | `(data: TRecord[]) => VNodeChild`                                                                       | -       | Table title render function.                         |
| `footer`          | `(data: TRecord[]) => VNodeChild`                                                                       | -       | Table footer render function.                        |

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
| `showSorterTooltip` | `boolean`                                                     | inherits table config   | Column-level sorter tooltip switch.                                        |

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

| Field                    | Type                                                                                                                                | Default | Description                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `expandedRowRender`      | `(record: TRecord, index: number, indent: number, expanded: boolean) => VNodeChild`                                                 | -       | Expanded row content render function.                   |
| `expandedRowKeys`        | `Key[]`                                                                                                                             | -       | Controlled expanded row keys.                           |
| `defaultExpandedRowKeys` | `Key[]`                                                                                                                             | -       | Default expanded row keys.                              |
| `expandRowByClick`       | `boolean`                                                                                                                           | `false` | Expand on full-row click.                               |
| `expandIcon`             | `(props: { expanded: boolean; record: TRecord; expandable: boolean; onExpand: (record: TRecord, e: Event) => void }) => VNodeChild` | -       | Custom expand icon.                                     |
| `onExpand`               | `(expanded: boolean, record: TRecord) => void`                                                                                      | -       | Expand/collapse callback.                               |
| `onExpandedRowsChange`   | `(expandedKeys: Key[]) => void`                                                                                                     | -       | Expanded-keys callback.                                 |
| `columnWidth`            | `number \| string`                                                                                                                  | -       | Expand column width.                                    |
| `fixed`                  | `'left' \| 'right' \| true`                                                                                                         | -       | Fixed position of the expand column; `true` = `'left'`. |
| `defaultExpandAllRows`   | `boolean`                                                                                                                           | `false` | Expand all rows by default.                             |
| `rowExpandable`          | `(record: TRecord) => boolean`                                                                                                      | -       | Whether a row is expandable.                            |
| `showExpandColumn`       | `boolean`                                                                                                                           | `true`  | Whether to show the expand column.                      |
| `expandedRowClassName`   | `string \| RowClassName<TRecord>`                                                                                                   | -       | Class for expanded rows.                                |

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
| `paginationItem`       | [`TablePaginationSlotProps`](/en/guide/pagination#pagination-slot-context)                      | Content at `{ slot: 'name' }` in `pagination.layout`. |

> These are Vue slots. To restyle structure via classes, see the [ui slot reference](/guide/ui-slots-reference) (Chinese).

`paginationItem` receives the extension `name`, effective pagination state, `pageCount`, `range`, `disabled`, `position` and `region`. Keep selection and request functions in the parent; bind `disabled` to application buttons as needed. Extensions share the pagination row's visibility, including empty-data and single-page hiding. See [composable layouts and content slots](/en/guide/pagination#composable-layouts-and-content-slots).

## VTableSummary

`VTableSummary` renders summary rows.

| Component            | Common props                                                                            | Description                                                     |
| -------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `VTableSummary`      | `fixed?: SummaryFixed`                                                                  | Summary container; `fixed` accepts `true`, `'top'`, `'bottom'`. |
| `VTableSummary.Row`  | -                                                                                       | Summary row.                                                    |
| `VTableSummary.Cell` | `index: number` (required), `colSpan?: number`, `rowSpan?: number`, `align?: AlignType` | Summary cell.                                                   |

## Related pages

- [Type reference](/guide/type-reference) (Chinese)
- [ui slot reference](/guide/ui-slots-reference) (Chinese)
- [Sorting](/guide/sorting) (Chinese)
- [Filtering](/guide/filtering) (Chinese)

## Pagination

`pagination?: false | TablePaginationConfig` defaults to disabled. Pass `{}` to enable. See [configuration and examples](/en/guide/pagination). `scroll.scrollToFirstRowOnChange?: boolean` controls vertical scroll reset on sort/filter/paginate; enabled pagination defaults to true, other tables retain their previous behavior.

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
