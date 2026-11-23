# Field renderers

Set a column's `valueType` to display currency, dates, percentages or statuses in the corresponding format. Use `fieldProps` to adjust the format. Built-in types are available directly; register business types with the table's `renderers` prop.

## Basic usage

The currency, date and status columns below only configure `valueType`. `valueEnum` supplies the status labels and colors, so no renderer registry is needed.

<Demo src="renderers/basic">

<<< @/demos/renderers/basic.vue

</Demo>

## Built-in types {#builtin-types}

The option links lead directly to their field tables and examples. `fieldProps` has type `TableFieldProps` and also supports [per-cell configuration](#renderer-context). Built-in renderers consume only the options relevant to their type.

| valueType                     | Default behavior                                              | fieldProps options                                                                                   |
| ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `text`                        | Enum label or raw value; booleans display as `true` / `false` | No format options                                                                                    |
| `digit`                       | Formats finite numbers or non-empty numeric strings with Intl | `locale`, [`numberFormat`](#number-format)                                                           |
| `money`                       | Currency format, `CNY` by default                             | [`currency`](#number-options), `locale`, [`numberFormat`](#number-format)                            |
| `date`                        | `YYYY-MM-DD`                                                  | `locale`, [`dateFormat`](#date-format)                                                               |
| `dateTime`                    | `YYYY-MM-DD HH:mm:ss`                                         | `locale`, [`dateFormat`](#date-format)                                                               |
| `time`                        | `HH:mm:ss`; also accepts time-only strings                    | `locale`, [`dateFormat`](#date-format)                                                               |
| `dateRange` / `dateTimeRange` | Two dates or date-times, joined with `~`                      | [`rangeSeparator / rangeEmptyText`](#range-options), `locale`, [`dateFormat`](#date-format)          |
| `percent`                     | 25 displays as 25%, with at most two decimal places           | [`percentScale`](#percent-progress), `locale`, [`numberFormat`](#number-format)                      |
| `progress`                    | Progress bar from 0–100, with a success icon when complete    | [`percentScale / showValue / status`](#percent-progress), `locale`, [`numberFormat`](#number-format) |
| `tag`                         | Enum label and status tag                                     | [`status`](#tag-options)                                                                             |

## Dates and times {#date-options}

`date / dateTime / time` accept a `Date`, date string or millisecond timestamp. `time` also accepts `HH:mm` and `HH:mm:ss` strings; for example, `09:30` displays as `09:30:00` by default. Unparseable values keep their original display value.

| fieldProps field | Type                         | Default              | Purpose                                                                                |
| ---------------- | ---------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `locale`         | `string \| string[]`         | Current table locale | Intl language, such as `'zh-CN'` or `'en-US'`; applies when `dateFormat` is set.       |
| `dateFormat`     | `Intl.DateTimeFormatOptions` | Unset                | An options object using the fields below; enables localized dates and times with Intl. |

### dateFormat options {#date-format}

`dateFormat` is an object. Use `dateStyle / timeStyle` to select predefined formats, or component fields such as `year / month / day` to choose what to display. Set `timeZone` to select a time zone.

| dateFormat field         | Type / accepted values                                                                  | Purpose                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dateStyle`              | `'full' \| 'long' \| 'medium' \| 'short'`                                               | Date format detail.                                                                                                                               |
| `timeStyle`              | `'full' \| 'long' \| 'medium' \| 'short'`                                               | Time format detail; can be combined with `dateStyle`.                                                                                             |
| `timeZone`               | `string`                                                                                | Time zone, such as `'UTC'` or `'Asia/Shanghai'`. Usually defaults to the runtime's local zone; date-only and time-only rules are described below. |
| `year`                   | `'numeric' \| '2-digit'`                                                                | Full or two-digit year.                                                                                                                           |
| `month`                  | `'numeric' \| '2-digit' \| 'long' \| 'short' \| 'narrow'`                               | Numeric month or localized month name.                                                                                                            |
| `day`                    | `'numeric' \| '2-digit'`                                                                | Day of the month.                                                                                                                                 |
| `weekday`                | `'long' \| 'short' \| 'narrow'`                                                         | Localized weekday name.                                                                                                                           |
| `hour / minute / second` | `'numeric' \| '2-digit'`                                                                | Time components to display.                                                                                                                       |
| `hour12`                 | `boolean`                                                                               | Whether to use 12-hour time; `false` selects 24-hour time.                                                                                        |
| `hourCycle`              | `'h11' \| 'h12' \| 'h23' \| 'h24'`                                                      | Hour cycle; `hour12` takes precedence when both are provided.                                                                                     |
| `timeZoneName`           | `'short' \| 'long' \| 'shortOffset' \| 'longOffset' \| 'shortGeneric' \| 'longGeneric'` | Presentation of the time zone name or offset.                                                                                                     |

These are common fields; see [Intl.DateTimeFormat options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options) for the complete configuration. Locale and Intl determine the order, separators and text. Omit `dateFormat` to keep the default `YYYY-MM-DD` display.

::: code-group

```ts [Localized date]
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'createdAt',
  valueType: 'date',
  fieldProps: {
    locale: 'zh-CN',
    dateFormat: { dateStyle: 'medium', timeZone: 'UTC' },
  },
}
```

```ts [Date and time]
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'createdAt',
  valueType: 'dateTime',
  fieldProps: {
    locale: 'zh-CN',
    dateFormat: {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Shanghai',
      hour12: false,
    },
  },
}
```

```ts [Component options]
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'createdAt',
  valueType: 'dateTime',
  fieldProps: {
    locale: 'en-GB',
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    },
  },
}
```

:::

::: tip Combining format options
`dateStyle / timeStyle` cannot be combined with component options such as `year / month / day / hour / minute / second / timeZoneName`. Both approaches can use `timeZone` and `hour12`.

Providing `dateFormat`, including `{}`, switches entirely to Intl formatting; the renderer no longer appends the default time fields for its `valueType`. For example, `dateTime` with only `dateStyle` shows only a date. Add `timeStyle` or individual time fields to include time. Invalid Intl configurations throw an exception.
:::

### Calendar dates and time zones

- Without `dateFormat`, date-only strings keep their calendar date. A `Date`, timestamp or string with a time zone uses the runtime's local date and time.
- A date-only string such as `'2026-10-25'` displays as `'2026-10-25 00:00:00'` with `dateTime` by default. Intl formatting preserves the calendar date in UTC when `timeZone` is unset; an explicit zone converts that UTC midnight reference value.
- Intl formatting of a time-only string uses `1970-01-01 UTC` as its reference and preserves the wall-clock time when `timeZone` is unset. Pass a `Date` or timestamp when the real date, daylight saving time or display across time zones matters.

## Numbers and currency {#number-options}

`digit / money` accept finite numbers or non-empty numeric strings. Booleans, empty strings and whitespace are not implicitly converted to zero; unparseable values keep their original display value.

| fieldProps field | Type                       | Default              | Purpose                                                               |
| ---------------- | -------------------------- | -------------------- | --------------------------------------------------------------------- |
| `locale`         | `string \| string[]`       | Current table locale | Number grouping, separators and currency language.                    |
| `numberFormat`   | `Intl.NumberFormatOptions` | Intl defaults        | Precision, grouping and presentation; common fields are listed below. |
| `currency`       | `string`                   | `'CNY'`              | ISO 4217 currency code used by `money`, such as `'USD'` or `'EUR'`.   |

### numberFormat options {#number-format}

| numberFormat field                                    | Type / accepted values                                        | Purpose                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `minimumFractionDigits / maximumFractionDigits`       | `number`                                                      | Minimum and maximum decimal places; the minimum must not exceed the maximum. |
| `minimumSignificantDigits / maximumSignificantDigits` | `number`                                                      | Minimum and maximum significant digits.                                      |
| `minimumIntegerDigits`                                | `number`                                                      | Minimum integer digits; pads with zeros when needed.                         |
| `useGrouping`                                         | `boolean \| 'auto' \| 'always' \| 'min2'`                     | Whether to use grouping separators, such as thousands separators.            |
| `notation`                                            | `'standard' \| 'scientific' \| 'engineering' \| 'compact'`    | Standard, scientific, engineering or compact notation.                       |
| `compactDisplay`                                      | `'short' \| 'long'`                                           | Detail when `notation: 'compact'`.                                           |
| `signDisplay`                                         | `'auto' \| 'always' \| 'exceptZero' \| 'negative' \| 'never'` | When to display a plus or minus sign.                                        |
| `currencyDisplay`                                     | `'symbol' \| 'narrowSymbol' \| 'code' \| 'name'`              | Currency symbol, narrow symbol, code or name for `money`.                    |
| `currencySign`                                        | `'standard' \| 'accounting'`                                  | Standard or accounting presentation of negative currency values.             |

These are common fields; see [Intl.NumberFormat options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options) for the complete configuration. `digit` defaults to decimal style. `money` always uses `style: 'currency'` and `fieldProps.currency`, which cannot be overridden by `numberFormat.style / currency`. `percent / progress` always use percent style. Other valid Intl options are preserved; invalid configurations throw an exception.

```ts
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'amount',
  valueType: 'money',
  fieldProps: {
    currency: 'USD',
    locale: 'en-US',
    numberFormat: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code',
    },
  },
}
// 1234.5 displays as USD 1,234.50 (Intl determines the whitespace).
```

## Date ranges {#range-options}

`dateRange / dateTimeRange` accept an array with exactly two endpoints. Each endpoint follows the [date / dateTime format and time zone rules](#date-options).

| fieldProps field | Type                         | Default              | Purpose                                                        |
| ---------------- | ---------------------------- | -------------------- | -------------------------------------------------------------- |
| `rangeSeparator` | `string`                     | `' ~ '`              | Separator between the endpoints.                               |
| `rangeEmptyText` | `string`                     | `'—'`                | Placeholder for a `null / undefined / ''` endpoint.            |
| `locale`         | `string \| string[]`         | Current table locale | Shared Intl language for both endpoints.                       |
| `dateFormat`     | `Intl.DateTimeFormatOptions` | Unset                | Shared [date format options](#date-format) for both endpoints. |

```ts
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'period',
  valueType: 'dateRange',
  fieldProps: { rangeSeparator: ' to ', rangeEmptyText: 'TBD' },
}
// ['2026-10-26', null] displays as 2026-10-26 to TBD.
```

Invalid non-empty string endpoints keep their original text. A value that is not a two-endpoint array, or contains an object endpoint that cannot be displayed, falls back to the original display flow as a whole.

## Percentages and progress {#percent-progress}

`percent / progress` share numeric parsing, [numberFormat](#number-format) and scale options. The example also shows date ranges, ratio inputs and completed progress.

<Demo src="renderers/extended">

<<< @/demos/renderers/extended.vue

</Demo>

| fieldProps field | Type                       | Default                    | Purpose                                                                                          |
| ---------------- | -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `percentScale`   | `'percent' \| 'ratio'`     | `'percent'`                | With `'percent'`, 25 means 25%; with `'ratio'`, 0.25 means 25%.                                  |
| `numberFormat`   | `Intl.NumberFormatOptions` | At most two decimal places | Percentage precision and presentation.                                                           |
| `locale`         | `string \| string[]`       | Current table locale       | Intl language for the percentage text.                                                           |
| `showValue`      | `boolean`                  | `true`                     | `progress` only: shows the text or status icon on the right.                                     |
| `status`         | `ColumnValueStatus`        | Enum or automatic status   | `progress` only: overrides progress status; see [status tags](#tag-options) for accepted values. |

```ts
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'share',
  valueType: 'percent',
  fieldProps: {
    percentScale: 'ratio',
    numberFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  },
}
// 0.125 displays as 12.5%.
```

Progress values are clamped to 0–100. Status precedence is `fieldProps.status`, then the `valueEnum` status, then automatic status. The automatic status is `processing` before completion and `success` at 100. `showValue: false` hides the text and status icon while retaining progress semantics.

The default small progress bar has a 6px track, a width of 100–320px and 12px text, with icons for completion and errors. The current preset supplies its colors. Override the `cellProgress / cellProgressTrack / cellProgressBar / cellProgressText` slots or [progress theme variables](/en/guide/theme-tokens#field-progress) to customize its appearance. Regular and virtual rows share the same render path.

## Status tags {#tag-options}

`tag` uses the text and status from `valueEnum`; unknown enum values keep their original value. Both presets provide colors, borders and spacing.

| fieldProps field | Type / accepted values                                           | Default                            | Purpose                                                                  |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `status`         | `'success' \| 'warning' \| 'error' \| 'processing' \| 'default'` | Enum status, otherwise `'default'` | Overrides the `valueEnum` status; these values also apply to `progress`. |

For more complex host UI tags, register a business renderer that returns an `a-tag / el-tag` component.

## Registering application types {#custom-renderers}

Register business types with `createTableRenderers<TRecord>`, then select them with the column's `valueType`. The member link below computes `fieldProps` per row and supplies tooltip text for a truncated name.

<Demo src="renderers/custom">

<<< @/demos/renderers/custom.vue

</Demo>

`createTableRenderers` merges the built-in types with business overrides and returns an immutable map. You can also pass a map containing only business types directly to the table; the remaining built-in renderers stay available. Each table uses its own map, so registrations do not affect other tables or SSR requests. An unknown `valueType` falls back to the enum label or raw value.

### Callback context {#renderer-context}

`fieldProps` can be an options object or a function returning one. The function receives `CustomRenderContext<TRecord>`. A renderer receives `TableFieldRenderContext<TRecord>`, which extends that context with the enum display value, status, resolved options and locale.

| Field                 | Type                  | fieldProps callback | Renderer callback | Meaning                                                                       |
| --------------------- | --------------------- | ------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `text / value`        | `unknown`             | ✓                   | ✓                 | Value after `transformCellText`, before enum mapping.                         |
| `record`              | `TRecord`             | ✓                   | ✓                 | Current source row.                                                           |
| `column`              | `ColumnType<TRecord>` | ✓                   | ✓                 | Current column.                                                               |
| `index / renderIndex` | `number`              | ✓                   | ✓                 | Row index in the current render path.                                         |
| `displayValue`        | `VNodeChild`          | —                   | ✓                 | Enum label or transformed default display value; booleans become text.        |
| `status`              | `ColumnValueStatus`   | —                   | ✓                 | Current `valueEnum` status; may be undefined.                                 |
| `fieldProps`          | `TableFieldProps`     | —                   | ✓                 | Static options or the options callback's result.                              |
| `locale`              | `string`              | —                   | ✓                 | Current table locale; may be undefined. Built-ins prefer `fieldProps.locale`. |

Business renderers consume custom options such as the example's `tooltip`. `TableFieldProps` allows additional fields of type `unknown`; convert or validate them as your business logic requires.

### Content and display metadata {#renderer-result}

A renderer can return `VNodeChild` directly, including a string, number, VNode, array or `null`. To supply ellipsis tooltip text, status or themed presentation, return a `TableFieldRenderResult` object:

| Result field   | Type                                      | Purpose                                                                                                                |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `children`     | `VNodeChild`                              | Required display content.                                                                                              |
| `tooltipText`  | `string`                                  | Plain text for an ellipsis tooltip. When omitted, text is derived only from scalar `children`; VNode text is not read. |
| `status`       | `ColumnValueStatus`                       | Display status. Return the context's `status` explicitly to preserve the enum status.                                  |
| `presentation` | `'tag' \| 'progress'`                     | Uses the theme's tag or progress appearance. When unset, a status uses the default status dot.                         |
| `progress`     | `{ percent: number; showValue: boolean }` | Used with `presentation: 'progress'`; supplies a finite percentage from 0–100 and a text visibility flag.              |

`tooltipText` is used for ellipsis tooltips: the column must enable `ellipsis` and allow `showTitle`, and the content must actually overflow. For general hover tooltips, use a host Tooltip component in the business renderer.

### Images, avatars and links

Images, avatars and links can reuse the host components directly:

```ts
import { h } from 'vue'
import { Avatar, Image } from 'ant-design-vue'
import { createTableRenderers } from '@vtable-guild/vtable-guild'

const renderers = createTableRenderers({
  avatar: ({ value }) => h(Avatar, { src: String(value), size: 32 }),
  image: ({ value }) => h(Image, { src: String(value), width: 48 }),
  link: ({ value, displayValue }) => h('a', { href: String(value) }, displayValue),
})
```

Element Plus projects use `ElAvatar / ElImage`; the application is responsible for URL validation, placeholder images and the image preview policy.

## Combining with existing display features

1. `transformCellText` transforms the value first; enums and field renderers consume that transformed value.
2. `customRender` and a valid `bodyCell` slot take precedence; the field renderer is used when there is no valid slot content.
3. `null / undefined` use `columnEmptyText` and do not call the field renderer; `0 / false / ''` are kept.
4. Sorting and filtering keep using the source records, and field display never rewrites the data. `filters: true` still generates filter items from the same `valueEnum`.
5. Copying uses the transformed raw scalar value by default and does not copy the currency symbol or enum label. Use `copyable.text` to change the copied content explicitly.

Without `valueType`, the existing cell display flow is kept. Renderers only handle read-only display; query controls and editors are composed by the application with its existing UI library.

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the table's full configuration.

### Props

<!-- @api: props cell-render -->

### Column fields

<!-- @api: columns cell-render -->

### Slots

<!-- @api: slots cell-render -->

## Theming

The classes of field tags and the progress bar can be overridden with the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui cell-render -->

### Preset defaults

Switch between the default classes of the two presets with the tabs below. For how to override utilities in the default precompiled mode, see [prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme cell-render -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars cell-render -->

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#FieldRendererFields

<<< @/.vitepress/type-declarations/features.ts#RendererProtocol

:::
