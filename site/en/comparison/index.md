---
title: ant-design-vue / element-plus table feature comparison
description: A feature-by-feature comparison of vtable-guild with the ant-design-vue Table and the element-plus Table, covering enhancements such as virtual scrolling, column resizing, row drag sorting and theme tokens, along with migration cost.
---

# Feature comparison

This page answers one question only: if you already use the ant-design-vue Table or the element-plus Table, what does vtable-guild add, and where does the migration cost mainly fall.

## Feature matrix

| Capability                                           | ant-design-vue                                  | element-plus                                      | vtable-guild                                                    |
| ---------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| Common column configuration and interaction patterns | Supported                                       | Relies mainly on `el-table-column`                | Supported, with a design closer to ant-design-vue               |
| Virtual scrolling                                    | Not supported                                   | Has a separate Virtualized Table solution         | Supported natively, used directly with `virtual` and `scroll.y` |
| Scrolling experience                                 | Default scrolling experience                    | Better experience, a useful reference             | Extra polish under the antdv preset, modelled on element-plus   |
| Column resizing                                      | Supports `resizable`, `minWidth`, `maxWidth`    | Supported, usually used in border mode            | Supported, keeping field conventions close to antdv             |
| Striped rows                                         | Mainly through `rowClassName`                   | Use `stripe` directly                             | Use `striped` directly                                          |
| Hover switch                                         | No dedicated switch                             | No dedicated switch                               | Use `hoverable` directly                                        |
| Border mode                                          | Supported                                       | Supported                                         | Supported, use `bordered` directly                              |
| Theme preset switching                               | Not supported                                   | Not supported                                     | Supports `antdv` / `element-plus`                               |
| Slot-level style overrides                           | Relies mainly on CSS overrides                  | Relies mainly on combining class, style and slots | Precise overrides through `ui` and the global `theme`           |
| Size naming                                          | `small / middle / large`                        | `large / default / small`                         | `small / middle / large`, the same as antdv                     |
| Built-in locale presets                              | Relies on the component library's global config | Relies on the component library's global config   | Built-in locales with partial overrides                         |

## Adopting the ProTable application enhancements

vtable-guild provides the following optional capabilities, modelled on Ant Design ProTable's query, EditableProTable and the ProField protocol. They compose independently with the base table, keep both the `antdv / element-plus` presets, and do not require you to bring in React or replace the form controls your project already uses.

| Capability                      | Entry in this library                                                           | What you need to handle when adopting it                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query submission                | [`useTableQuery`](/en/guide/query) + [`useTableRequest`](/en/guide/remote-data) | Bind your existing form to the draft, and route submit and reset through the unified request entry; controls and form validation are managed by the host                            |
| Row editing and cached new rows | [`useTableEdit`](/en/guide/editing) + `bodyCell`                                | Uses independent drafts, async validation and save state; the application updates the data and provides the editors and action buttons                                              |
| Pluggable field display         | [`valueType / fieldProps / createTableRenderers`](/en/guide/cell-render)        | Built-in read-only types such as date-time / range, percent and progress; application-defined mappings are shared with `valueEnum`; does not generate a complete query or edit form |
| Lazy-loaded tree                | [`loadData / isLeaf`](/en/guide/tree-table)                                     | Loading, errors, retries and race conditions are managed by the table; stable keys and leaf detection are provided by the application, and selection only counts loaded nodes       |
| Instance positioning            | [`TableInstance.scrollTo`](/en/guide/table-instance)                            | Positions by key, visible index or pixels; for unloaded pages and collapsed nodes, the application prepares the data first                                                          |

Column settings also provide pinning, locking, hidden setting items and drag reordering in the panel, and `useColumnState` persists user preferences. The [Schema query area](/en/guide/schema-query) and [column editors / detail forms](/en/guide/editable-columns) provide optional control wiring, transforms and full-draft validation. The guides are authoritative for the complete scope; a full ProForm, CRUD flows and server-side batch transactions are not included.

## Conclusion

- If you only need a basic table, the stock table is usually enough
- If you come from ant-design-vue, the main value of vtable-guild is bringing virtual scrolling, a theming system and more direct visual state switches into the same table model
- If you come from element-plus, the main value of vtable-guild is unifying table capabilities under the same columns + props model, instead of switching between the regular table and a separate enhanced solution

## Further reading

- [Enhancements and extras](/en/comparison/enhancements)
- [Query submission](/en/guide/query)
- [Field renderers](/en/guide/cell-render)
- [Why vtable-guild](/en/guide/why)
- [Migrating from ant-design-vue](/en/guide/migration-from-antd)
