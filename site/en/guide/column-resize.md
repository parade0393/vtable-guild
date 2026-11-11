# Column resizing

Column resizing suits application tables with many fields and widely varying content lengths, where users want to fine-tune the layout on the spot. It keeps a field mental model close to ant-design-vue, but ships as a built-in capability.

## Live demo

Move the mouse over a header divider and drag left or right. The "Category" column is limited to 100–280px, and the `resizeColumn` event writes the new width back to the column configuration.

<Demo src="column-resize/basic">

<<< @/demos/column-resize/basic.vue

</Demo>

## Basic example

Set `resizable: true` on a column. `width` can be a pixel number, `auto`, a percentage or another CSS width, and can also be omitted. `minWidth` constrains both normal layout and dragging, while `maxWidth` only limits the drag target.

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { VTable, type ColumnType, type VTableEventProps } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns = shallowRef<ColumnType<UserRow>[]>([
  { title: 'Name', dataIndex: 'name', key: 'name', width: 180, resizable: true, minWidth: 120 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 96, resizable: true, maxWidth: 180 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 140, resizable: true },
])

const dataSource: UserRow[] = [{ key: '1', name: 'Ada', age: 28, status: 'Active' }]

const handleResize: NonNullable<VTableEventProps<UserRow>['onResizeColumn']> = (column, width) => {
  columns.value = columns.value.map((item) => (item.key === column.key ? { ...item, width } : item))
}
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="dataSource"
    @resize-column="handleResize"
  />
</template>
```

This example only has leaf columns, so `ColumnType<UserRow>[]` lets you write the width back by key directly. The column configuration is held in a `shallowRef` and the array is replaced as a whole, which avoids deep reactive unwrapping of complex configuration such as render functions. `TableColumnsType<UserRow>` also includes column groups and sentinels, so you need to tell the kinds of columns apart first when using it. The exact signature of the event is `(column: ColumnType<UserRow>, width: number) => void`.

## Key behavior

- Only columns with `resizable: true` show a drag handle
- Dragging starts from the actual rendered width of the header cell, including for a numeric `width`, which avoids a jump at the start when slack distribution or a minimum width makes the actual column width larger than the declared value
- The column width updates in real time while dragging
- When a valid drag ends, the `resizeColumn` event fires with the arguments `(column: ColumnType<TRecord>, width: number)`; `width` is the constrained pixel target and can be written back to the column configuration, and the component never modifies the `columns` you pass in
- In auto layout, content may stretch a column wider than the drag target; the event value is not guaranteed to equal the final measured width
- Without a valid `minWidth`, only the drag interaction uses a default lower bound of `50px`; normal layout gains no default lower bound

## Minimum column width and layout

The `minWidth` of a leaf column is a finite, non-negative number of CSS pixels, and an explicit `0` is valid. Negative numbers, `NaN` and `Infinity` are treated as not configured, with a warning in development. The width is computed on the layout track of the visible cell and includes padding and border; content may make it wider.

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface WidthRow {
  key: string
  a: string
  b: string
  c: string
}

const columns: TableColumnsType<WidthRow> = [
  { title: 'A', key: 'a', dataIndex: 'a', minWidth: 160, resizable: true },
  { title: 'B', key: 'b', dataIndex: 'b', width: 60, minWidth: 100 },
  { title: 'C', key: 'c', dataIndex: 'c', minWidth: 240, resizable: true },
]
```

In a 400px container, these three columns take at least 500px and produce horizontal scrolling, even without `scroll.x`. B is not resizable and declares `width: 60`, yet still keeps its 100px lower bound. When A is dragged to 300px, the total width is at least 640px; when A is dragged toward 80px, the event target is clamped to 160px.

| Configuration                              | Behavior                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `width < minWidth`                         | `minWidth` wins, and `width` serves as the target width                                                                |
| `maxWidth < minWidth`                      | Dragging still keeps the lower bound, and the conflict is reported in development                                      |
| `tableLayout="auto"`                       | Keeps the browser's content layout and does not switch to fixed because of a lower bound or a drag                     |
| `tableLayout="fixed"`                      | Pixel widths are allocated in one place, then used by the header, body, fixed columns, summary row and virtual columns |
| `minWidth` increased, decreased or removed | The constraints are reapplied; existing drag targets are clamped again as well                                         |

Only the leaf columns that end up visible are counted; hidden columns take no lower bound, and a grouped header is determined by the widths of its children. Other flexible columns can shrink back or absorb slack during a drag, but never go below their own lower bound. `maxWidth` does not limit normal layout, and the target width may still be expanded to fill the table when there is enough space.

When auto is combined with a fixed header, a fixed summary row or virtual rows, a browser auto reference layout is built from the header and the currently rendered content, and the same set of pixel widths is then synced to the displayed table. The displayed table uses fixed to guarantee alignment, while the column widths are still decided by the auto content layout; virtual records that are not rendered do not take part in the measurement.

An existing `minWidth` configuration now affects layout as well, which may make columns wider or bring up horizontal scrolling earlier; tables without a configured lower bound keep their original layout path.

## When to use

- Operations consoles, report pages or dashboards with many fields
- Users want to fine-tune column widths themselves and persist them
- You previously had to piece column resizing together from CSS or a third-party drag library

## API

`TRecord` is the application row type. See [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props column-resize -->

### Column fields

<!-- @api: columns column-resize -->

### Events

<!-- @api: events column-resize -->

## Theming

The class of the drag handle can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui column-resize -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how utilities are overridden in the default prebuilt mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme column-resize -->

### CSS variables

The table lists the default values for light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars column-resize -->

## Type Declarations

The width, its lower and upper bounds, and the drag switch belong to the column configuration, and the signature of `resizeColumn` is declared by `VTableEventProps<TRecord>`. The column configuration is an excerpt of the relevant fields; `ResizableColumnFields` is a documentation helper interface, not a package export. See [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#ResizableColumnFields

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

:::

## Related pages

- [Fixed columns](/en/guide/fixed-columns)
- [Feature comparison](/en/comparison/)
