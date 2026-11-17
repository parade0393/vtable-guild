---
'@vtable-guild/vtable-guild': minor
---

Redesign the alpha schema query API around `layoutType="QueryFilter"` and `layoutType="LightFilter"`. QueryFilter is the default and uses the query container width, `span`, and field `colSize` to lay out and collapse a responsive search form. LightFilter uses filter chips with popups and groups `secondary` fields under More filters. Both modes use the existing `useTableQuery` state and control factories for Ant Design Vue and Element Plus.

Replace `layout="form"` with `layoutType="QueryFilter"` or omit the mode prop. `layout` now sets the form direction. `layoutType="LightFilter"` applies popup filters on selection or confirmation. Rename column `query` to `search` and use `preserve` to control whether hidden and collapsed fields are included in request parameters. The new collapse options replace `collapsedCount` and `collapsible`. Popup interaction now determines submission timing for LightFilter, replacing `autoSubmit` and `debounceTime`.

LightFilter evaluates dependent field visibility against pending popup edits and submits newly revealed fields together on confirmation. Time, date-time and date-time-range controls wait for footer confirmation so intermediate selections do not submit early. Ant Design Vue tags mode stays open after each selection, like multiple mode.
