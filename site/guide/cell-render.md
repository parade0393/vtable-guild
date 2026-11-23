# 字段渲染器

在列上设置 `valueType`，即可把金额、日期、百分比或状态渲染成对应的展示形式；通过 `fieldProps` 调整格式。内置类型可以直接使用，业务类型通过表格的 `renderers` 注册。

## 基础用法

下面的金额、日期和状态列只配置 `valueType`；状态文本与颜色由 `valueEnum` 提供，无需创建渲染器注册表。

<Demo src="renderers/basic">

<<< @/demos/renderers/basic.vue

</Demo>

## 内置类型 {#builtin-types}

配置项链接直接指向对应的字段表和示例。`fieldProps` 的类型是 `TableFieldProps`，也支持[按单元格计算配置](#renderer-context)；内置渲染器只使用与当前类型相关的选项。

| valueType                     | 默认行为                                        | fieldProps 配置                                                                                      |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `text`                        | 显示枚举文本或原值；布尔值显示 `true` / `false` | 无格式选项                                                                                           |
| `digit`                       | 使用 Intl 格式化有限数字或非空数字字符串        | `locale`、[`numberFormat`](#number-format)                                                           |
| `money`                       | 货币格式，默认 `CNY`                            | [`currency`](#number-options)、`locale`、[`numberFormat`](#number-format)                            |
| `date`                        | `YYYY-MM-DD`                                    | `locale`、[`dateFormat`](#date-format)                                                               |
| `dateTime`                    | `YYYY-MM-DD HH:mm:ss`                           | `locale`、[`dateFormat`](#date-format)                                                               |
| `time`                        | `HH:mm:ss`；也接受纯时间字符串                  | `locale`、[`dateFormat`](#date-format)                                                               |
| `dateRange` / `dateTimeRange` | 两端日期 / 日期时间，以 `~` 连接                | [`rangeSeparator / rangeEmptyText`](#range-options)、`locale`、[`dateFormat`](#date-format)          |
| `percent`                     | 25 显示为 25%，默认最多两位小数                 | [`percentScale`](#percent-progress)、`locale`、[`numberFormat`](#number-format)                      |
| `progress`                    | 0–100 的进度条，完成时显示成功图标              | [`percentScale / showValue / status`](#percent-progress)、`locale`、[`numberFormat`](#number-format) |
| `tag`                         | 显示枚举文本与状态标签                          | [`status`](#tag-options)                                                                             |

## 日期与时间 {#date-options}

`date / dateTime / time` 接收 `Date`、日期字符串或毫秒时间戳。`time` 还接受 `HH:mm`、`HH:mm:ss` 字符串，例如 `09:30` 默认显示为 `09:30:00`。无法解析时保留原展示值。

| fieldProps 字段 | 类型                         | 默认值       | 作用                                                                   |
| --------------- | ---------------------------- | ------------ | ---------------------------------------------------------------------- |
| `locale`        | `string \| string[]`         | 表格当前语言 | Intl 使用的语言，例如 `'zh-CN'`、`'en-US'`；设置 `dateFormat` 后生效。 |
| `dateFormat`    | `Intl.DateTimeFormatOptions` | 未设置       | 传入下表的格式选项对象后，使用 Intl 本地化日期与时间。                 |

### dateFormat 配置 {#date-format}

`dateFormat` 是一个对象。通过 `dateStyle / timeStyle` 选择预定义格式，或通过 `year / month / day` 等字段控制各部分的显示；时区通过 `timeZone` 指定。

| dateFormat 字段          | 类型 / 可选值                                                                           | 作用                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `dateStyle`              | `'full' \| 'long' \| 'medium' \| 'short'`                                               | 日期格式的详细程度。                                                                                  |
| `timeStyle`              | `'full' \| 'long' \| 'medium' \| 'short'`                                               | 时间格式的详细程度；可与 `dateStyle` 一起使用。                                                       |
| `timeZone`               | `string`                                                                                | 时区，例如 `'UTC'`、`'Asia/Shanghai'`；未指定时通常使用运行环境本地时区，纯日期与纯时间的规则见下文。 |
| `year`                   | `'numeric' \| '2-digit'`                                                                | 完整年份或两位年份。                                                                                  |
| `month`                  | `'numeric' \| '2-digit' \| 'long' \| 'short' \| 'narrow'`                               | 数字月份或本地化月份名称。                                                                            |
| `day`                    | `'numeric' \| '2-digit'`                                                                | 日期中的日。                                                                                          |
| `weekday`                | `'long' \| 'short' \| 'narrow'`                                                         | 本地化星期名称。                                                                                      |
| `hour / minute / second` | `'numeric' \| '2-digit'`                                                                | 要显示的时间部分。                                                                                    |
| `hour12`                 | `boolean`                                                                               | 是否使用 12 小时制；`false` 使用 24 小时制。                                                          |
| `hourCycle`              | `'h11' \| 'h12' \| 'h23' \| 'h24'`                                                      | 小时周期；同时提供时，`hour12` 优先。                                                                 |
| `timeZoneName`           | `'short' \| 'long' \| 'shortOffset' \| 'longOffset' \| 'shortGeneric' \| 'longGeneric'` | 时区名称或偏移的显示形式。                                                                            |

上表列出常用字段；完整选项见 [Intl.DateTimeFormat 配置（英文）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options)。格式顺序、分隔符和具体文本由语言与 Intl 决定。需要 `YYYY-MM-DD` 默认展示时，可以省略 `dateFormat`。

::: code-group

```ts [本地化日期]
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

```ts [日期与时间]
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

```ts [逐字段格式]
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

::: tip 格式选项的组合规则
`dateStyle / timeStyle` 不能与 `year / month / day / hour / minute / second / timeZoneName` 等逐字段格式选项混用；`timeZone` 和 `hour12` 可以与两种写法搭配。

显式提供 `dateFormat`（包括 `{}`）后，展示完全采用 Intl 配置，不再追加 `valueType` 的默认时分秒。例如 `dateTime` 只配置 `dateStyle` 时只显示日期；需要时间时同时提供 `timeStyle` 或具体时间字段。无效的 Intl 配置会抛出异常。
:::

### 日期与时区的处理

- 未设置 `dateFormat` 时，纯日期字符串保留日历日期；`Date`、时间戳和带时区字符串使用运行环境的本地日期与时间。
- 纯日期字符串（如 `'2026-10-25'`）在 `dateTime` 中默认显示为 `'2026-10-25 00:00:00'`。启用 Intl 且未指定 `timeZone` 时，以 UTC 保留日历日期；显式时区会转换这个 UTC 午夜参考值。
- 纯时间字符串启用 Intl 后，以 `1970-01-01 UTC` 为参考，未指定 `timeZone` 时保持钟面时间。需要实际日期、夏令时或跨时区展示时，传入 `Date` 或时间戳。

## 数字与货币 {#number-options}

`digit / money` 接收有限数字或非空数字字符串。布尔值、空字符串和空格不会被隐式转换成零；无法解析时保留原展示值。

| fieldProps 字段 | 类型                       | 默认值        | 作用                                                      |
| --------------- | -------------------------- | ------------- | --------------------------------------------------------- |
| `locale`        | `string \| string[]`       | 表格当前语言  | 数字的分组、分隔符与货币显示语言。                        |
| `numberFormat`  | `Intl.NumberFormatOptions` | Intl 默认格式 | 配置精度、分组和显示形式，常用字段见下表。                |
| `currency`      | `string`                   | `'CNY'`       | `money` 使用的 ISO 4217 货币代码，例如 `'USD'`、`'EUR'`。 |

### numberFormat 配置 {#number-format}

| numberFormat 字段                                     | 类型 / 可选值                                                 | 作用                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `minimumFractionDigits / maximumFractionDigits`       | `number`                                                      | 最少 / 最多小数位数；最小值不能大于最大值。          |
| `minimumSignificantDigits / maximumSignificantDigits` | `number`                                                      | 最少 / 最多有效数字位数。                            |
| `minimumIntegerDigits`                                | `number`                                                      | 整数部分的最少位数，不足时补零。                     |
| `useGrouping`                                         | `boolean \| 'auto' \| 'always' \| 'min2'`                     | 是否使用分组分隔符，例如千位分隔符。                 |
| `notation`                                            | `'standard' \| 'scientific' \| 'engineering' \| 'compact'`    | 普通、科学、工程或紧凑计数形式。                     |
| `compactDisplay`                                      | `'short' \| 'long'`                                           | `notation: 'compact'` 时的详细程度。                 |
| `signDisplay`                                         | `'auto' \| 'always' \| 'exceptZero' \| 'negative' \| 'never'` | 正负号的显示策略。                                   |
| `currencyDisplay`                                     | `'symbol' \| 'narrowSymbol' \| 'code' \| 'name'`              | 货币显示为符号、窄符号、代码或名称，适用于 `money`。 |
| `currencySign`                                        | `'standard' \| 'accounting'`                                  | 负数金额采用普通或会计形式。                         |

上表列出常用字段；完整选项见 [Intl.NumberFormat 配置（英文）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options)。`digit` 默认采用 decimal 样式；`money` 固定使用 `style: 'currency'` 和 `fieldProps.currency`，`numberFormat.style / currency` 不能覆盖它们。`percent / progress` 固定使用 percent 样式。其他有效 Intl 选项会保留，配置无效时由 Intl 抛出异常。

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
// 1234.5 显示为 USD 1,234.50（空格形式由 Intl 决定）
```

## 日期区间 {#range-options}

`dateRange / dateTimeRange` 接收恰好两个端点的数组。两端分别使用 [date / dateTime 的格式与时区规则](#date-options)。

| fieldProps 字段  | 类型                         | 默认值       | 作用                                     |
| ---------------- | ---------------------------- | ------------ | ---------------------------------------- |
| `rangeSeparator` | `string`                     | `' ~ '`      | 两个端点之间的分隔符。                   |
| `rangeEmptyText` | `string`                     | `'—'`        | `null / undefined / ''` 端点的占位文字。 |
| `locale`         | `string \| string[]`         | 表格当前语言 | 两端共用的 Intl 语言。                   |
| `dateFormat`     | `Intl.DateTimeFormatOptions` | 未设置       | 两端共用的[日期格式选项](#date-format)。 |

```ts
import type { TableColumnType } from '@vtable-guild/vtable-guild'

const column: TableColumnType = {
  dataIndex: 'period',
  valueType: 'dateRange',
  fieldProps: { rangeSeparator: ' 至 ', rangeEmptyText: '待定' },
}
// ['2026-10-26', null] 显示为 2026-10-26 至 待定
```

格式错误的非空字符串端点保留原文本；不是两个端点的数组，或含有无法展示的对象端点时，整个值回退到原展示流程。

## 百分比与进度 {#percent-progress}

`percent / progress` 共用数字解析、[numberFormat](#number-format) 与比例配置。示例同时展示日期区间、比例值和进度完成状态。

<Demo src="renderers/extended">

<<< @/demos/renderers/extended.vue

</Demo>

| fieldProps 字段 | 类型                       | 默认值             | 作用                                                            |
| --------------- | -------------------------- | ------------------ | --------------------------------------------------------------- |
| `percentScale`  | `'percent' \| 'ratio'`     | `'percent'`        | `'percent'` 中 25 表示 25%；`'ratio'` 中 0.25 表示 25%。        |
| `numberFormat`  | `Intl.NumberFormatOptions` | 最多两位小数       | 百分比文字的精度与显示格式。                                    |
| `locale`        | `string \| string[]`       | 表格当前语言       | 百分比文字的 Intl 语言。                                        |
| `showValue`     | `boolean`                  | `true`             | 仅 `progress`：显示右侧文字或状态图标。                         |
| `status`        | `ColumnValueStatus`        | 枚举状态或自动状态 | 仅 `progress`：覆盖进度状态，可选值见[状态标签](#tag-options)。 |

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
// 0.125 显示为 12.5%
```

进度条将越界值限制到 0–100；状态依次采用 `fieldProps.status`、`valueEnum` 状态、自动状态。自动状态在未完成时为 `processing`，100 时为 `success`。`showValue: false` 隐藏右侧文字与状态图标，保留进度语义。

进度条默认为小号规格：6px 轨道、100–320px 宽度、12px 文字，完成 / 错误使用状态图标。色彩由当前预设提供；可覆盖 `cellProgress / cellProgressTrack / cellProgressBar / cellProgressText` slots 和[进度主题变量](/guide/theme-tokens#字段进度)。普通与虚拟行共用同一条渲染路径。

## 状态标签 {#tag-options}

`tag` 使用 `valueEnum` 的文本与状态，未知枚举值保留原值。颜色、边框和间距由两套主题预设提供。

| fieldProps 字段 | 类型 / 可选值                                                    | 默认值                           | 作用                                                 |
| --------------- | ---------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------- |
| `status`        | `'success' \| 'warning' \| 'error' \| 'processing' \| 'default'` | 枚举状态，未提供时为 `'default'` | 覆盖 `valueEnum` 的状态；这些值也适用于 `progress`。 |

需要更复杂的宿主 UI 标签时，可注册业务 renderer 返回 `a-tag / el-tag`。

## 注册业务类型 {#custom-renderers}

用 `createTableRenderers<TRecord>` 注册自己的类型，再通过列的 `valueType` 选择。下面的成员链接按行计算 `fieldProps`，并提供名称被截断时的提示文字。

<Demo src="renderers/custom">

<<< @/demos/renderers/custom.vue

</Demo>

`createTableRenderers` 合并内置类型与业务覆盖，返回不可变映射；也可直接向表格传只包含业务类型的映射，未覆盖的内置类型仍可用。每个表格使用自己的映射，不会污染其他表格或 SSR 请求。未知 `valueType` 回退到枚举或原值展示。

### 回调上下文 {#renderer-context}

`fieldProps` 可以是选项对象，也可以是返回选项对象的函数。函数接收 `CustomRenderContext<TRecord>`；renderer 接收 `TableFieldRenderContext<TRecord>`，在此基础上增加枚举展示值、状态、解析后的配置和语言。

| 字段                  | 类型                  | fieldProps 回调 | renderer 回调 | 含义                                                         |
| --------------------- | --------------------- | --------------- | ------------- | ------------------------------------------------------------ |
| `text / value`        | `unknown`             | ✓               | ✓             | 经过 `transformCellText` 转换、枚举映射前的值。              |
| `record`              | `TRecord`             | ✓               | ✓             | 当前源记录。                                                 |
| `column`              | `ColumnType<TRecord>` | ✓               | ✓             | 当前列。                                                     |
| `index / renderIndex` | `number`              | ✓               | ✓             | 当前渲染路径中的行索引。                                     |
| `displayValue`        | `VNodeChild`          | —               | ✓             | 枚举标签或转换后的默认展示值；布尔值转成文本。               |
| `status`              | `ColumnValueStatus`   | —               | ✓             | 当前 `valueEnum` 的状态，可为空。                            |
| `fieldProps`          | `TableFieldProps`     | —               | ✓             | 对象配置，或回调计算后的配置。                               |
| `locale`              | `string`              | —               | ✓             | 表格当前语言，可为空；内置类型优先使用 `fieldProps.locale`。 |

自定义配置字段（如示例中的 `tooltip`）由业务 renderer 消费。`TableFieldProps` 允许扩展字段，值类型为 `unknown`，使用前应按业务需要转换或校验。

### 返回内容与展示元数据 {#renderer-result}

renderer 可以直接返回 `VNodeChild`，例如字符串、数字、VNode、数组或 `null`。需要省略提示、状态或主题外观时，返回 `TableFieldRenderResult` 对象：

| 返回字段       | 类型                                      | 作用                                                                          |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `children`     | `VNodeChild`                              | 要显示的内容，必填。                                                          |
| `tooltipText`  | `string`                                  | 省略提示的纯文本；未提供时，仅从标量 `children` 推导，不读取 VNode 内的文字。 |
| `status`       | `ColumnValueStatus`                       | 显示状态；需要保留枚举状态时，显式返回上下文中的 `status`。                   |
| `presentation` | `'tag' \| 'progress'`                     | 使用主题的标签或进度外观；未设置时，状态采用默认状态点外观。                  |
| `progress`     | `{ percent: number; showValue: boolean }` | 与 `presentation: 'progress'` 配合；提供 0–100 的有限百分比和文字显示开关。   |

`tooltipText` 用于省略提示：列需启用 `ellipsis` 且允许 `showTitle`，内容实际溢出时才显示。普通悬浮提示可以直接在业务 renderer 中使用宿主 Tooltip 组件。

### 图片、头像和链接

图片、头像和链接可直接复用宿主组件：

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

Element Plus 项目使用 `ElAvatar / ElImage`；业务负责 URL 校验、占位图和图片预览策略。

## 与现有展示功能组合

1. `transformCellText` 先转换读取的值，枚举与字段渲染器消费转换后的值。
2. `customRender` 与有效的 `bodyCell` 插槽优先；没有有效插槽内容时使用字段渲染器。
3. `null / undefined` 使用 `columnEmptyText`，不调用字段渲染器；`0 / false / ''` 保留。
4. 排序、筛选继续使用源记录，字段展示不会改写数据。`filters: true` 仍从同一份 `valueEnum` 生成筛选项。
5. 默认复制使用转换后的标量原值，不复制货币符号或枚举标签。使用 `copyable.text` 可以显式改变复制内容。

不设置 `valueType` 时保持既有单元格展示流程。渲染器只负责只读展示，查询控件与编辑器仍由业务使用已有 UI 库组合。

## API

`TRecord` 表示业务行类型。表格的完整配置见 [API Reference](/guide/api-reference)。

### Props

<!-- @api: props cell-render -->

### Column 字段

<!-- @api: columns cell-render -->

### Slots

<!-- @api: slots cell-render -->

## 主题

字段标签与进度条的 class 可通过实例 `ui` 或全局 `theme.table.slots` 覆盖。调整颜色或尺寸时可使用下方 [CSS 变量](#css-变量)。覆盖顺序见[三层主题覆盖](/guide/theme-overrides)。

### ui slots

<!-- @api: ui cell-render -->

### 预设默认值

两套预设的默认 class 可用下方标签切换。默认预编译模式下 utility 的覆盖方式见[前缀与覆盖规则](/guide/theme-overrides#utility-前缀与覆盖规则)。

<!-- @api: theme cell-render -->

### CSS 变量

表中列出亮色模式的默认值。暗色模式可通过 `.dark` 单独覆盖。

<!-- @api: css-vars cell-render -->

## Type Declarations

::: details 查看类型声明

<<< @/.vitepress/type-declarations/features.ts#FieldRendererFields

<<< @/.vitepress/type-declarations/features.ts#RendererProtocol

:::
