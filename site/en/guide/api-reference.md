---
title: API Reference
description: Complete props, column fields, events, slots and summary components reference for the vtable-guild Vue table, with defaults and controlled/uncontrolled rules.
---

# API Reference

This page is the behavioral reference: props, events, slots, defaults and controlled/uncontrolled rules.

For the full relationships of TypeScript types such as `TableColumnsType`, `Breakpoint` and `RowSelection`, see the [type reference](/guide/type-reference) (Chinese). This page only mentions type names without re-expanding their definitions.

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

| Prop                 | Type                                                             | Default      | Description                                                                  |
| -------------------- | ---------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `dataSource`         | `TRecord[]`                                                      | `[]`         | Table data source.                                                           |
| `columns`            | [`TableColumnsType<TRecord>`](/guide/type-reference#columnstype) | `[]`         | Column configuration: leaf columns, column groups and sentinel constants.    |
| `columnOrder`        | [`Key[]`](/guide/type-reference#key)                             | -            | Column display order. See [column display](/guide/column-display) (Chinese). |
| `rowKey`             | `string \| (record) => Key`                                      | -            | Unique row identity; passing it explicitly is recommended.                   |
| `childrenColumnName` | `string`                                                         | `'children'` | Child field name for tree data.                                              |
| `indentSize`         | `number`                                                         | `15`         | Tree data indent width in px.                                                |

### Visuals and layout

| Prop             | Type                             | Default   | Description                                                            |
| ---------------- | -------------------------------- | --------- | ---------------------------------------------------------------------- |
| `size`           | `'small' \| 'middle' \| 'large'` | `'large'` | Table size, aligned with ant-design-vue naming.                        |
| `loading`        | `boolean \| object`              | `false`   | Loading state; the object form accepts `spinning`, `indicator`, `tip`. |
| `bordered`       | `boolean`                        | `false`   | Show borders.                                                          |
| `striped`        | `boolean`                        | `false`   | Zebra striping.                                                        |
| `hoverable`      | `boolean`                        | `true`    | Row hover highlight.                                                   |
| `tableLayout`    | `'auto' \| 'fixed'`              | -         | Table layout mode.                                                     |
| `showHeader`     | `boolean`                        | `true`    | Whether to show the header.                                            |
| `headerEllipsis` | `boolean`                        | `false`   | Also ellipsize headers of columns with `column.ellipsis`.              |
| `class`          | `string`                         | -         | Extra class on the root node.                                          |

### Scrolling and positioning

| Prop                | Type                                             | Default | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scroll`            | `{ x?: number \| string; y?: number \| string }` | -       | Horizontal and vertical scroll config; providing `y` creates a fixed-header scroll area. A numeric `y` sets a fixed viewport; `y: 'auto'` fills a parent with a definite height and deducts the header and external summary. In `virtual` mode, other strings must be positive pixel values; relative units fall back to 400px with a development warning. |
| `sticky`            | `boolean \| TableSticky`                         | `false` | Sticky header, summary or horizontal scrollbar config.                                                                                                                                                                                                                                                                                                     |
| `virtual`           | `boolean`                                        | `false` | Enable virtual scrolling; requires `scroll.y`.                                                                                                                                                                                                                                                                                                             |
| `virtualColumn`     | `boolean`                                        | `false` | Horizontal virtualization: render only columns in the viewport; requires `virtual`. Pays off with many columns, see [virtualization](/guide/virtualization) (Chinese).                                                                                                                                                                                     |
| `rowHeight`         | `number`                                         | -       | Fixed row height (px), only in `virtual` mode. Declaring it skips all row measurement and makes viewport math O(1) — only pass it if every row truly has that height.                                                                                                                                                                                      |
| `getPopupContainer` | `(triggerNode) => HTMLElement`                   | -       | Mount container for filter and selection menus.                                                                                                                                                                                                                                                                                                            |

### Theming and locale

| Prop              | Type                                                     | Default                    | Description                                                                                                           |
| ----------------- | -------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ui`              | `SlotProps`                                              | -                          | Theme slot class overrides for this table instance. See the [ui slot reference](/guide/ui-slots-reference) (Chinese). |
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
| `onExpand`               | `(expanded, record) => void`                                  | -       | Tree expand/collapse callback.                                                |
| `onExpandedRowsChange`   | `(expandedKeys) => void`                                      | -       | Tree expanded-keys callback.                                                  |
| `transformCellText`      | `(opt) => unknown`                                            | -       | Transform cell text; `opt` contains `text`, `column`, `record` and `index`.   |
| `showSorterTooltip`      | `boolean`                                                     | `true`  | Table-level sorter tooltip switch, overridable per column.                    |
| `sortDirections`         | [`SortOrder[]`](/guide/type-reference#sortorder)              | -       | Table-level sort direction list, used as the default for columns.             |

### Custom structure

| Prop              | Type                                       | Default | Description                                          |
| ----------------- | ------------------------------------------ | ------- | ---------------------------------------------------- |
| `rowClassName`    | `string \| RowClassName<TRecord>`          | -       | Extra class for body rows.                           |
| `customRow`       | `GetComponentProps<TRecord>`               | -       | Inject attributes, events and styles on body rows.   |
| `customHeaderRow` | `(columns, index?) => CellAdditionalProps` | -       | Inject attributes, events and styles on header rows. |
| `title`           | `(data) => VNodeChild`                     | -       | Table title render function.                         |
| `footer`          | `(data) => VNodeChild`                     | -       | Table footer render function.                        |

## Column behavior

### Basics

| Field        | Type                                               | Default | Description                                                                         |
| ------------ | -------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `key`        | [`Key`](/guide/type-reference#key)                 | -       | Unique column identity; passing it explicitly is recommended.                       |
| `title`      | `VNodeChild \| function`                           | -       | Column title: text, VNode or render function.                                       |
| `dataIndex`  | [`DataIndex`](/guide/type-reference#dataindex)     | -       | Data field path, e.g. `'name'` or `['address', 'city']`.                            |
| `width`      | `number \| string`                                 | -       | Column width; numbers are treated as px.                                            |
| `align`      | [`AlignType`](/guide/type-reference#aligntype)     | -       | Cell content alignment.                                                             |
| `ellipsis`   | `boolean \| { showTitle?: boolean }`               | `false` | Ellipsize overflowing cell content; `showTitle: false` disables the hover tooltip.  |
| `className`  | `string`                                           | -       | Extra class for the column's cells.                                                 |
| `colSpan`    | `number`                                           | -       | Header cell colSpan.                                                                |
| `visible`    | `boolean`                                          | `true`  | Whether the column is shown, see [column display](/guide/column-display) (Chinese). |
| `responsive` | [`Breakpoint[]`](/guide/type-reference#breakpoint) | -       | Show the column when any listed breakpoint matches the screen.                      |

### Custom rendering

| Field              | Type                                              | Default | Description                                                              |
| ------------------ | ------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `customRender`     | `(ctx) => VNodeChild \| RenderedCell`             | -       | Custom body cell content. Returning `RenderedCell` also sets cell props. |
| `customCell`       | `(record, index, column?) => CellAdditionalProps` | -       | Inject attributes, events and styles on body cells.                      |
| `customHeaderCell` | `(column, index) => CellAdditionalProps`          | -       | Inject attributes, events and styles on header cells.                    |

```ts
customRender: ({ text, index }) =>
  index === 0
    ? { children: String(text), props: { colSpan: 2, style: { fontWeight: 'bold' } } }
    : String(text)
```

### Fixed columns and resizing

| Field       | Type                        | Default | Description                                  |
| ----------- | --------------------------- | ------- | -------------------------------------------- |
| `fixed`     | `'left' \| 'right' \| true` | -       | Fixed side; `true` equals `'left'`.          |
| `resizable` | `boolean`                   | `false` | Whether the column width is drag-adjustable. |
| `minWidth`  | `number`                    | `50`    | Minimum width while resizing.                |
| `maxWidth`  | `number`                    | -       | Maximum width while resizing.                |

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

| Field                               | Type                                                           | Default  | Description                                                    |
| ----------------------------------- | -------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `filters`                           | [`ColumnFilterItem[]`](/guide/type-reference#columnfilteritem) | -        | Filter menu items; renders the filter icon in the header.      |
| `onFilter`                          | `(value, record) => boolean`                                   | -        | Filter function; return `true` to keep the row.                |
| `filterMultiple`                    | `boolean`                                                      | `true`   | Whether multiple filter values can be picked.                  |
| `filteredValue`                     | `Array<string \| number \| boolean> \| null`                   | -        | Controlled filter values.                                      |
| `defaultFilteredValue`              | `Array<string \| number \| boolean>`                           | -        | Uncontrolled default filter values.                            |
| `customFilterDropdown`              | `boolean`                                                      | `false`  | Use the table-level `customFilterDropdown` slot.               |
| `filterSearch`                      | `boolean \| (input, filter) => boolean`                        | `false`  | Search within filter items.                                    |
| `filterMode`                        | `'menu' \| 'tree'`                                             | `'menu'` | Filter item presentation mode.                                 |
| `filterResetToDefaultFilteredValue` | `boolean`                                                      | `false`  | Reset restores the default filter values.                      |
| `filterDropdownOpen`                | `boolean`                                                      | -        | Controlled filter dropdown visibility.                         |
| `onFilterDropdownOpenChange`        | `(visible) => void`                                            | -        | Filter dropdown visibility callback.                           |
| `filtered`                          | `boolean`                                                      | -        | Externally control the filter icon highlight; does not filter. |
| `filterIcon`                        | `({ filtered }) => VNodeChild`                                 | -        | Custom filter icon.                                            |
| `filterDropdown`                    | `VNodeChild \| (props) => VNodeChild`                          | -        | Column-level custom filter panel; overrides the table slot.    |

### Column groups

| Field      | Type                                                     | Default | Description                                                   |
| ---------- | -------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| `children` | `Array<ColumnType<TRecord> \| ColumnGroupType<TRecord>>` | -       | Child columns. With `children` present the column is a group. |

Column groups do not receive leaf-column behaviors such as sorting, filtering, `dataIndex` and `customRender`.

## Row Selection

`rowSelection` enables the selection column: multiple, single, tree-linked, batch menus and controlled state.

| Field                     | Type                                                               | Default      | Description                                      |
| ------------------------- | ------------------------------------------------------------------ | ------------ | ------------------------------------------------ |
| `type`                    | `'checkbox' \| 'radio'`                                            | `'checkbox'` | Selection type.                                  |
| `selectedRowKeys`         | `Key[]`                                                            | -            | Controlled selected keys.                        |
| `defaultSelectedRowKeys`  | `Key[]`                                                            | -            | Default selected keys.                           |
| `onChange`                | `(keys, rows) => void`                                             | -            | Selection change callback.                       |
| `onSelect`                | `(record, selected, rows) => void`                                 | -            | Single-row selection callback.                   |
| `onSelectMultiple`        | `(selected, rows, changeRows) => void`                             | -            | Shift multi-select callback.                     |
| `onSelectAll`             | `(selected, rows, changeRows) => void`                             | -            | Select-all callback.                             |
| `onSelectInvert`          | `(keys) => void`                                                   | -            | Invert-selection callback.                       |
| `onSelectNone`            | `() => void`                                                       | -            | Clear-selection callback.                        |
| `getCheckboxProps`        | `(record) => { disabled?, name? }`                                 | -            | Inject attributes on selection controls.         |
| `columnWidth`             | `number \| string`                                                 | -            | Selection column width.                          |
| `fixed`                   | `boolean \| 'left' \| 'right'`                                     | -            | Fixed position of the selection column.          |
| `columnTitle`             | `string \| VNodeChild`                                             | -            | Selection column header content.                 |
| `renderCell`              | `(value, record, index, originNode) => VNodeChild \| RenderedCell` | -            | Custom selection cell.                           |
| `checkStrictly`           | `boolean`                                                          | `true`       | Parent/child independent selection in tree data. |
| `selections`              | `boolean \| array`                                                 | `false`      | Default or custom batch-selection menu.          |
| `hideSelectAll`           | `boolean`                                                          | `false`      | Hide the select-all checkbox and dropdown.       |
| `preserveSelectedRowKeys` | `boolean`                                                          | `false`      | Keep selected keys when the data source changes. |

Default batch-selection constants: see [SelectionSentinel](/guide/type-reference#selectionsentinel) (Chinese).

## Expandable

`expandable` configures expandable row content. Tree-data expand props live at the `VTable` top level.

| Field                    | Type                                              | Default | Description                                             |
| ------------------------ | ------------------------------------------------- | ------- | ------------------------------------------------------- |
| `expandedRowRender`      | `(record, index, indent, expanded) => VNodeChild` | -       | Expanded row content render function.                   |
| `expandedRowKeys`        | `Key[]`                                           | -       | Controlled expanded row keys.                           |
| `defaultExpandedRowKeys` | `Key[]`                                           | -       | Default expanded row keys.                              |
| `expandRowByClick`       | `boolean`                                         | `false` | Expand on full-row click.                               |
| `expandIcon`             | `(props) => VNodeChild`                           | -       | Custom expand icon.                                     |
| `onExpand`               | `(expanded, record) => void`                      | -       | Expand/collapse callback.                               |
| `onExpandedRowsChange`   | `(expandedKeys) => void`                          | -       | Expanded-keys callback.                                 |
| `columnWidth`            | `number \| string`                                | -       | Expand column width.                                    |
| `fixed`                  | `'left' \| 'right' \| true`                       | -       | Fixed position of the expand column; `true` = `'left'`. |
| `defaultExpandAllRows`   | `boolean`                                         | `false` | Expand all rows by default.                             |
| `rowExpandable`          | `(record) => boolean`                             | -       | Whether a row is expandable.                            |
| `showExpandColumn`       | `boolean`                                         | `true`  | Whether to show the expand column.                      |
| `expandedRowClassName`   | `string \| RowClassName<TRecord>`                 | -       | Class for expanded rows.                                |

## Events

| Event          | Payload                    | Description                                                                                                     |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `change`       | `(filters, sorter, extra)` | Unified event after sorting, filtering and selection.                                                           |
| `resizeColumn` | `(column, width)`          | Fired after a column resize drag ends.                                                                          |
| `rowDragEnd`   | `(newData, info)`          | Fired when row drag sorting finishes with a changed order, see [row drag sort](/guide/row-drag-sort) (Chinese). |

`change` currently has no pagination payload. `extra.action` is `'sort'`, `'filter'` or `'select'`.

```ts
function handleChange(filters, sorter, extra) {
  if (extra.action === 'sort') {
    // sync sort state or request remote data
  }
}
```

## Slots

| Slot                   | Payload type                                                                                    | Description                      |
| ---------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------- |
| `bodyCell`             | [`TableBodyCellSlotProps<TRecord>`](/guide/type-reference#tablebodycellslotprops)               | Custom cell content.             |
| `headerCell`           | [`TableHeaderCellSlotProps<TRecord>`](/guide/type-reference#tableheadercellslotprops)           | Custom header cell content.      |
| `empty`                | `()`                                                                                            | Custom empty state.              |
| `loading`              | `()`                                                                                            | Custom loading state.            |
| `customFilterDropdown` | [`CustomFilterDropdownSlotProps<TRecord>`](/guide/type-reference#customfilterdropdownslotprops) | Table-level custom filter panel. |
| `customFilterIcon`     | `{ column, filtered }`                                                                          | Table-level custom filter icon.  |
| `title`                | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | Custom title area.               |
| `footer`               | [`TableDataSlotProps<TRecord>`](/guide/type-reference#tabledataslotprops)                       | Custom footer area.              |
| `summary`              | `()`                                                                                            | Custom summary area.             |

> These are Vue slots. To restyle structure via classes, see the [ui slot reference](/guide/ui-slots-reference) (Chinese).

## VTableSummary

`VTableSummary` renders summary rows.

| Component            | Common props                           | Description                                                     |
| -------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `VTableSummary`      | `fixed`                                | Summary container; `fixed` accepts `true`, `'top'`, `'bottom'`. |
| `VTableSummary.Row`  | -                                      | Summary row.                                                    |
| `VTableSummary.Cell` | `index`, `colSpan`, `rowSpan`, `align` | Summary cell.                                                   |

## Related pages

- [Type reference](/guide/type-reference) (Chinese)
- [ui slot reference](/guide/ui-slots-reference) (Chinese)
- [Sorting](/guide/sorting) (Chinese)
- [Filtering](/guide/filtering) (Chinese)
