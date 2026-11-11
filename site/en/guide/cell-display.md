---
title: Cell display
description: Configure cell copying, header descriptions and empty-value placeholders, as well as enum text, status styles and filter linkage.
---

# Cell display

Common display needs can be written directly in the column config: `copyable` copies content, `tooltip` provides a header description and `valueEnum` maps text and status.
The table-level `columnEmptyText` sets the empty-value placeholder in one place. Custom `customRender` and `bodyCell` keep receiving their original context, so you can compose your application's own components.

<Demo src="column-display/presentation">

<<< @/demos/column-display/presentation.vue

</Demo>

## Copying content

`copyable: true` uses the text after `transformCellText` and before enum mapping. Custom-rendered VNodes are not copied by reading their DOM text,
and objects do not automatically turn into `[object Object]`. To copy a specific value, use `copyable.text`:

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Order {
  key: number
  number: string
}

const columns: TableColumnsType<Order> = [
  {
    key: 'number',
    dataIndex: 'number',
    title: 'Order number',
    copyable: {
      text: ({ record }) => record.number,
      onCopy: (text, record) => console.log('Copied', text, record.key),
      onError: (error) => console.error(error),
    },
  },
]
```

`text` accepts a string, or a callback that returns a string / Promise; the callback argument is the same as the `customRender` context.
Success and failure are reported through the component text and the `onCopy` / `onError` callbacks. The actual clipboard capability depends on the browser environment;
the copy button stops the event from going on to trigger row selection, row expansion and similar actions.

## Header descriptions and sorter tooltips

The column-level `tooltip` and the sorter tooltip are independent of each other: the former explains what the field means, the latter describes the sort action.
`tooltip` accepts a string or a `TableTooltipConfig`; the table-level and column-level `showSorterTooltip` also support this config object.

| Option                                | Description                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `title`                               | Tooltip content; a sorter tooltip without it uses the text of the current sort action. |
| `placement`                           | top, bottom, left, right.                                                              |
| `mouseEnterDelay` / `mouseLeaveDelay` | Show and hide delays, in seconds.                                                      |
| `color` / `arrow` / `class`           | Background color, arrow and extra class.                                               |

Column-level config takes precedence over table-level config; `showSorterTooltip: false` on a column turns off the sorter tooltip for that column.
To adjust the look globally, use the existing Tooltip theme and tokens, so that the two table presets stay consistent.

## Empty-value placeholder and render priority

`columnEmptyText` defaults to `false`, which keeps showing a blank. With `column-empty-text="—"`, only `null` and `undefined` use the placeholder;
the number `0`, the boolean `false` and the empty string are still valid values, and the default rendering shows booleans as text.

The processing order is: read the value → `transformCellText` → enum mapping and default empty-value display → custom renderer or slot.
`customRender` receives the `text` after the transform and before enum mapping, and takes precedence over `bodyCell`; content explicitly returned by custom rendering is not replaced by the shared placeholder or by enum styles.

## Enum mapping and filtering

`valueEnum` accepts a plain object or a Map, and an enum item can be a string or `{ text, status }`.
The supported statuses are `success`, `warning`, `error`, `processing` and `default`, rendered through the theme slots and tokens of both presets.

Object enums are matched by string key; use a Map when you need to distinguish primitive types such as `0`, `'0'` and `false`.
Values without a match fall back to the default value display, and enums never modify the input records.

- `filters: true` generates filter items from the enum, keeps the original value types and uses equality comparison by default.
- `filters: false` turns off the enum filter entry; you can also pass an array of filter items explicitly.
- `onFilter: true` uses equality comparison, `onFilter: false` skips local filtering, and a custom function takes precedence and applies the application's own rules.
- `manual.filter: true` skips all local filtering while keeping the filter state and events, which suits server-side handling.

Sorting still uses the raw record values, and a custom compare function can choose its own rules. Copying uses the transformed raw value by default; to copy the displayed enum text, specify `copyable.text` explicitly.
For export, the application decides whether to use the raw value or the displayed text; the table does not replace export fields automatically.

The related types `ColumnCopyable`, `ColumnValueEnum`, `ColumnValueEnumItem`, `ColumnValueStatus` and `TableTooltipConfig`
are all imported from `@vtable-guild/vtable-guild`.

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the table's full configuration.

### Props

<!-- @api: props cell-display -->

### Column fields

<!-- @api: columns cell-display -->

### copyable

The options when `copyable` is an object; passing `true` copies the cell text.

<!-- @api: reference copyable-config -->

### TableTooltipConfig

The options when the column `tooltip` or the table-level and column-level `showSorterTooltip` is an object.

<!-- @api: reference tooltip-config -->

### Slots

<!-- @api: slots cell-display -->

## Theming

The classes of the copy button, header description and enum labels can be overridden with the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui cell-display -->

### Preset defaults

Switch between the default classes of the two presets with the tabs below. For how to override utilities in the default precompiled mode, see [prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme cell-display -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars cell-display -->

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#ColumnType

<<< @/.vitepress/type-declarations/table.ts#TransformCellText

:::
