# Field renderers

A column's `valueType` selects the field renderer, and `fieldProps` passes the format options. This pairing follows [ProTable's column config](https://next-procomponents.ant.design/components/schema-form/), uses the Vue callback context and reuses the existing `valueEnum`, empty-value and copy protocols.

<Demo src="renderers/basic">

<<< @/demos/renderers/basic.vue

</Demo>

## Built-in types

| valueType                     | Behavior                                                                          | Common fieldProps                                |
| ----------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| `text`                        | Shows the enum text or the raw value; booleans show as `true` / `false`           | —                                                |
| `digit`                       | Formats finite numbers or non-empty numeric strings with `Intl.NumberFormat`      | `locale`, `numberFormat`                         |
| `money`                       | Currency format, `CNY` by default                                                 | `currency`, `locale`, `numberFormat`             |
| `date`                        | `YYYY-MM-DD` by default; accepts a Date, a date string or a millisecond timestamp | `locale`, `dateFormat`                           |
| `dateTime`                    | `YYYY-MM-DD HH:mm:ss` by default                                                  | `locale`, `dateFormat`                           |
| `time`                        | `HH:mm:ss` by default; also accepts `HH:mm` / `HH:mm:ss` strings                  | `locale`, `dateFormat`                           |
| `dateRange` / `dateTimeRange` | Date / date-time range with two endpoints                                         | `rangeSeparator`, `rangeEmptyText`, `dateFormat` |
| `percent`                     | Percentage; by default 25 shows as 25%                                            | `percentScale`, `numberFormat`, `locale`         |
| `progress`                    | Small progress bar, range 0–100, shows a success icon when complete               | `percentScale`, `showValue`, `status`            |
| `tag`                         | Shows the enum text and reuses the enum status theme                              | `status`                                         |

When a number or date cannot be parsed, the original display value is kept; numeric types do not implicitly convert booleans, empty strings or whitespace to zero. Dates output `YYYY-MM-DD` by default, consistent with ProField; date-only strings keep their calendar date, while Dates, timestamps and strings with a time zone use the local calendar date. Once `dateFormat` is provided explicitly, Intl localization is used, and for cross-time-zone display you state the time zone with `dateFormat.timeZone`. The default locale is the table's current locale; a field can override it with `locale`. `numberFormat` and `dateFormat` are standard Intl options, and Intl throws when the config is invalid.

`money` keeps the other Intl options of `numberFormat` but always uses `style: 'currency'`; the currency comes from `fieldProps.currency` and defaults to `CNY`. `style` and `currency` inside `numberFormat` cannot override these two.

`tag` and `valueEnum` share the same statuses: `success / warning / error / processing / default`; the colors, borders and spacing are provided by the two theme presets. Unknown enum values keep the raw value. When you need a more complex host UI tag, register a renderer that returns `a-tag` / `el-tag`.

## Date ranges, percentages and progress

<Demo src="renderers/extended">

<<< @/demos/renderers/extended.vue

</Demo>

`dateRange / dateTimeRange` take an array of exactly two endpoints, joined with `~` by default; a `null / undefined / ''` endpoint shows `rangeEmptyText` (`—` by default). A malformed non-empty endpoint keeps its original display value. Date-times use local time; date-only values are treated as calendar dates and are padded to midnight for date-times. When `dateFormat` is provided explicitly, those Intl options are used as is, and the field no longer appends the default hours, minutes and seconds.

`percent / progress` default to `percentScale: 'percent'`, meaning 25 stands for 25%; with `'ratio'`, 0.25 stands for 25%. `percent` shows at most two decimal places by default, adjustable through `numberFormat`, and always uses Intl's percent style. The progress bar clamps out-of-range values to 0–100; by default an unfinished value is `processing` and 100 is `success`, which you can override with the enum status or `fieldProps.status`. `showValue: false` hides the text and status icon on the right while keeping the progress semantics.

The progress bar follows ProField's small spec: a 6px track, a width of 100–320px and 12px text, with status icons for complete / error. The colors are provided by the current preset; you can override the `cellProgress / cellProgressTrack / cellProgressBar / cellProgressText` slots and the [progress theme variables](/en/guide/theme-tokens#field-progress). Regular and virtual rows share the same render path.

Explicit Intl formatting of time-only strings uses `1970-01-01 UTC` as the reference and keeps their wall-clock time by default; an explicit `timeZone` converts that reference value. When you need a real date, daylight saving time or cross-time-zone display, pass a Date or a timestamp.

## Registering application types

```ts
import { h } from 'vue'
import { createTableRenderers } from '@vtable-guild/vtable-guild'

const renderers = createTableRenderers<Member>({
  memberLink: ({ record, displayValue, fieldProps }) => ({
    children: h('a', { href: `/members/${record.key}` }, displayValue),
    tooltipText: String(fieldProps.tooltip ?? record.name),
  }),
})

const columns = [
  {
    dataIndex: 'name',
    valueType: 'memberLink',
    fieldProps: ({ record }) => ({ tooltip: `View ${record.name}` }),
  },
]
```

Bind `renderers` with `<VTable :renderers="renderers">`. `createTableRenderers` merges the built-in types with the application's overrides and returns an immutable map; you can also pass a map that contains only application types, and the built-in types you did not override stay available. Each table uses its own map and does not pollute other tables or SSR requests. An unknown `valueType` falls back to the enum or raw value display.

A renderer receives `text / value / record / column / index / renderIndex`, where `text / value` have already gone through `transformCellText`; `displayValue` is the matching enum label or the transformed value, and `status` comes from the same enum. Return a VNode or `{ children, tooltipText?, status?, presentation? }`; `presentation: 'tag'` uses the tag appearance from the theme. When a VNode is returned, its text is not read automatically, so provide `tooltipText` explicitly when you need the ellipsis tooltip.

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

1. `transformCellText` transforms the value that was read first; enums and field renderers consume the transformed value.
2. `customRender` and a valid `bodyCell` slot take precedence; the field renderer is used when there is no valid slot content.
3. `null / undefined` use `columnEmptyText` and do not call the field renderer; `0 / false / ''` are kept.
4. Sorting and filtering keep using the source records, and field display never rewrites the data. `filters: true` still generates filter items from the same `valueEnum`.
5. Copying uses the transformed raw scalar value by default and does not copy the currency symbol or the enum label. Use `copyable.text` to change the copied content explicitly.

Without `valueType`, the existing cell display flow is kept. Renderers only handle read-only display; query controls and editors are still composed by the application with its existing UI library.

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
