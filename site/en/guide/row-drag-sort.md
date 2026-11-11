# Row drag sorting

Enable `rowDraggable` on the table and the rows themselves become draggable (native HTML5 drag and drop, with no third-party drag library required). Dragging follows a controlled data flow: the component does not change the data, and when the drop finishes it returns the reordered new array through the `rowDragEnd` event for you to update `dataSource` with — the data always has a single source.

## Live demo

Press and hold any row and drag it up or down; dropping on the upper half of the target row inserts above it, and dropping on the lower half inserts below it.

<Demo src="row-drag-sort/basic">

<<< @/demos/row-drag-sort/basic.vue

</Demo>

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VTable, type RowDragSortInfo, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface TaskRow {
  key: string
  task: string
  owner: string
}

const columns: TableColumnsType<TaskRow> = [
  { title: 'Task', dataIndex: 'task', key: 'task' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner' },
]

const dataSource = ref<TaskRow[]>([
  { key: '1', task: 'Organize type docs', owner: 'Ada' },
  { key: '2', task: 'Review examples', owner: 'Grace' },
])

function handleRowDragEnd(newData: TaskRow[], _info: RowDragSortInfo) {
  dataSource.value = newData
}
</script>

<template>
  <VTable
    row-key="key"
    row-draggable
    :columns="columns"
    :data-source="dataSource"
    @row-drag-end="handleRowDragEnd"
  />
</template>
```

The arguments of `rowDragEnd`:

- `newData: TRecord[]`: the full data array after the drag completes (derived by moving the dragged row within the current `dataSource`).
- `info: RowDragSortInfo`: `{ draggedKey: Key, targetKey: Key, orderedKeys: Key[] }`, which are the key of the dragged row, the key of the drop target row, and the full key order matching `newData` (for tree data, children are included recursively in data order).

## Key behavior

- When the order does not change (for example the row is dragged back to where it was), `rowDragEnd` is **not** triggered.
- Row-level opt-out: rows for which `customRow` returns `draggable: false` do not take part in dragging — they cannot be picked up and do not become drop targets, while other rows are unaffected (suited to fixed rows such as pinned rows and summary rows).
- `rowKey` must be able to resolve a stable row identifier; when it is not configured it falls back to the row index and triggers a dev warning, and the drag result is unreliable.
- It works with virtual scrolling (`virtual`) as well: the drag events are attached to each row and do not conflict with scrolling. The move is computed on `dataSource` by rowKey and does not depend on indexes in the visible window. Note that there is **no auto-scroll when dragging to the container edge** — a target row that has not been rendered into the window cannot be dragged to, so scroll it into place first and then drop.
- Use it when no sort/filter is active: the display order is derived from the `dataSource → filter → sort` pipeline, dragging rewrites the order of the data source, and an active sort takes effect again on the next render.
- Tree data uses **cross-parent move** semantics: dragging before / after the target row inserts at the **same level** as the target row — when the target is a root row the node returns to the top level, and when the target is a child of some parent the node becomes a child of that parent; the dragged node brings its whole subtree, and expanded / selected state is recorded by rowKey and kept after reordering. There is a cycle guard: dragging a node into its own subtree triggers no event and does not change the data.
- Expanded row content (the `<tr>` rendered by `expandedRowRender`) cannot be dragged.
- Row hover highlighting is suppressed automatically during a drag so that it does not interfere with the drop indicator line.

## Style customization

The drag state is customized through three ui slots and one token (provided by both presets):

```vue
<template>
  <VTable
    row-draggable
    :columns="columns"
    :data-source="dataSource"
    :ui="{ trDragging: 'opacity-30' }"
  />
</template>
```

See [Theming](#theming) for the default classes and colors of dragging and the drop indicator line.

## API

`TRecord` is the application row type. See [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props row-drag-sort -->

### Events

<!-- @api: events row-drag-sort -->

## Theming

The classes of the row being dragged and the drop indicator line can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui row-drag-sort -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how utilities are overridden in the default prebuilt mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme row-drag-sort -->

### CSS variables

The table lists the default values for light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars row-drag-sort -->

## Type Declarations

`rowDraggable` belongs to `TableProps<TRecord>`, and `rowDragEnd` returns `TRecord[]` and `RowDragSortInfo`. The props are an excerpt of the relevant fields; `RowDragFields` is a documentation helper interface, not a package export. See [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#RowDragSortInfo

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

<<< @/.vitepress/type-declarations/features.ts#RowDragFields

:::

## Related pages

- [Sorting](/en/guide/sorting)
- [ui slot reference](/en/guide/ui-slots-reference)
- [API Reference](/en/guide/api-reference)
