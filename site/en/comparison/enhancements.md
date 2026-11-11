---
title: What vtable-guild adds over the stock tables
description: Capabilities vtable-guild offers beyond the ant-design-vue and element-plus tables, including virtual scrolling, column display and order, row dragging and three-layer theme overrides, with migration notes.
---

# Enhancements and extras

This page focuses only on what you get on top of the stock table solutions and does not repeat the full tutorials. For specific usage, jump to the matching guide page.

## A more convenient API

### Size naming matches ant-design-vue

Table sizes keep `small`, `middle` and `large`, exactly the same as ant-design-vue, so this is one thing you do not need to change when migrating from antdv. The default is `large`.

### More complete TypeScript coverage

VTable provides explicit column types, row data types and event payload types, along with type boundaries for theme keys and slot keys, which holds up in long-lived application code.

### A clearer style override path

Besides Vue slots, this library splits style overrides into three layers:

- `themePreset`
  switches the overall visual baseline
- global `theme`
  unifies application-level rules
- per-instance `ui`
  handles single-table exceptions

See [Three-layer theme overrides](/en/guide/theme-overrides) for details.

## More direct table capabilities

### Virtual scrolling

Enabled directly through `virtual` together with `scroll.y`, and suited to long lists and performance-sensitive pages. See [Virtual scrolling](/en/guide/virtualization).

### Column settings: column display and order

`column.visible` controls whether a column is shown and `columnOrder` reorders top-level columns by column key. Both are controlled props, so the display state can be persisted as a user preference. With the stock antdv / element-plus tables you have to assemble this kind of "column settings" panel yourself. See [Column display and order](/en/guide/column-display).

`VTableColumnSettings` provides grouped show/hide, select all, indeterminate state, pinning left and right, top-level drag reordering within the same fixed region, and a density menu. `disable` locks operations column by column, and `hideInSetting` hides the setting item. The panel updates controlled columns through `update:columns`, and the panel's reset only restores the initial visibility; `useColumnState` can persist visibility, pinning and order, and resets all preferences independently.

### Composable toolbar

`VTableToolbar` combines a title, refresh, search, density, column settings and an opt-in fullscreen. The application adds buttons such as export and create through `#actions`, and composes the query area through the filter and multi-row extension slots; refresh can be connected to `useTableRequest.reload`, or you can keep your existing request approach. See [Toolbar](/en/guide/toolbar).

### Query, editing and field display aligned with ProTable

The application enhancements are modelled on Ant Design ProTable and split along existing Vue props, slots and composables, with both presets using the same state protocol:

| Capability                               | How to use                                                                                                                 | Boundaries                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Query and requests](/en/guide/query)    | `useTableQuery` manages the draft, submit, reset, field parameter transforms and collapsing; connects to `useTableRequest` | Input does not trigger a query automatically; controls and form validation reuse the host UI, and a complete form is not generated automatically |
| [Editing](/en/guide/editing)             | `useTableEdit` manages `editableKeys`, independent drafts, async validation, save, cancel and cached new rows              | Editors are wired in through `bodyCell` and the application submits the data; no whole-table transactions or spreadsheet navigation              |
| [Field rendering](/en/guide/cell-render) | `valueType / fieldProps / createTableRenderers` provide text, digit, money, date, tag and custom read-only renderers       | Shares enums and statuses with `valueEnum`; custom rendering takes precedence, and no query or edit controls are generated                       |

These capabilities can be adopted separately and do not require switching existing pages to a full ProTable page framework.

### Lazy-loaded tree and instance positioning

`loadData(record, { signal })` and `isLeaf` give tree data a loading state, errors and retries; concurrent requests for the same node are deduplicated, results are cached after collapsing, and stale tasks are invalidated when records are replaced or the table unmounts. Loaded descendants take part in parent-child selection and virtualization, and selection only counts nodes the client has already loaded. See [Tree table](/en/guide/tree-table).

`TableInstance.scrollTo({ key, index, top, left })` on the template ref unifies positioning for regular and virtual bodies, and `retryTreeLoad / getTreeLoadError` provide tree load retries and error reads. Positioning is limited to records that are loaded and visible on the current page; for other pages or collapsed tree nodes, the application switches pages, loads or expands first. See [Table instance](/en/guide/table-instance).

### Row drag sorting

`rowDraggable` enables native HTML5 whole-row dragging, and when the drop finishes `rowDragEnd` returns the reordered data (controlled mode), so you do not need a third-party drag library. See [Row drag sorting](/en/guide/row-drag-sort).

### More direct visual state switches

- `striped`
  striped rows
- `hoverable`
  row hover highlight
- `bordered`
  border mode

These states can all be switched on directly through props or theme configuration, with no need to scatter them across application CSS.

### Multiple presets

Two presets, `antdv` and `element-plus`, are currently built in, letting the same table logic plug into different Vue UI systems. See [Presets and locales](/en/guide/presets-and-locales).

## Further reading

- [Feature comparison](/en/comparison/)
- [Virtual scrolling](/en/guide/virtualization)
- [Column resizing](/en/guide/column-resize)
- [Column display and order](/en/guide/column-display)
- [Toolbar](/en/guide/toolbar)
- [Query submission](/en/guide/query)
- [Editing](/en/guide/editing)
- [Field renderers](/en/guide/cell-render)
- [Tree table](/en/guide/tree-table)
- [Table instance](/en/guide/table-instance)
- [Row drag sorting](/en/guide/row-drag-sort)
- [Three-layer theme overrides](/en/guide/theme-overrides)
