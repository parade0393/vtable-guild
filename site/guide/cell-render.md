# 字段渲染器

列的 `valueType` 选择字段渲染器，`fieldProps` 传递格式选项。这个组合参考 [ProTable 的列配置](https://next-procomponents.ant.design/components/schema-form/)，采用 Vue 回调上下文，并复用已有的 `valueEnum`、空值与复制协议。

<Demo src="renderers/basic">

<<< @/demos/renderers/basic.vue

</Demo>

## 内置类型

| valueType                     | 行为                                                    | 常用 fieldProps                                  |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `text`                        | 显示枚举文本或原值；布尔值显示 `true` / `false`         | —                                                |
| `digit`                       | 使用 `Intl.NumberFormat` 格式化有限数字或非空数字字符串 | `locale`、`numberFormat`                         |
| `money`                       | 货币格式，默认 `CNY`                                    | `currency`、`locale`、`numberFormat`             |
| `date`                        | 默认 `YYYY-MM-DD`，支持 Date、日期字符串或毫秒时间戳    | `locale`、`dateFormat`                           |
| `dateTime`                    | 默认 `YYYY-MM-DD HH:mm:ss`                              | `locale`、`dateFormat`                           |
| `time`                        | 默认 `HH:mm:ss`；也接受 `HH:mm` / `HH:mm:ss` 字符串     | `locale`、`dateFormat`                           |
| `dateRange` / `dateTimeRange` | 两端日期 / 日期时间区间                                 | `rangeSeparator`、`rangeEmptyText`、`dateFormat` |
| `percent`                     | 百分数，默认 25 显示为 25%                              | `percentScale`、`numberFormat`、`locale`         |
| `progress`                    | 小号进度条，范围 0–100，完成时显示成功图标              | `percentScale`、`showValue`、`status`            |
| `tag`                         | 显示枚举文本，复用枚举状态主题                          | `status`                                         |

数字、日期无法解析时保留原展示值；数字类型不会将布尔值、空字符串或空格隐式转为零。日期默认输出与 ProField 一致的 `YYYY-MM-DD`；纯日期字符串保留日历日期，Date、时间戳与带时区字符串取本地日历日期。显式提供 `dateFormat` 后使用 Intl 本地化，跨时区展示通过 `dateFormat.timeZone` 明确时区。默认语言取表格当前语言；字段可通过 `locale` 覆盖。`numberFormat` 和 `dateFormat` 是标准 Intl 配置，配置无效时会由 Intl 抛出异常。

`money` 保留 `numberFormat` 的其他 Intl 选项，但固定使用 `style: 'currency'`；货币以 `fieldProps.currency` 为准，默认 `CNY`。`numberFormat` 内的 `style` 和 `currency` 不能覆盖这两项。

`tag` 与 `valueEnum` 共用相同的状态：`success / warning / error / processing / default`，颜色、边框和间距由两套主题预设提供。未知枚举值保留原值。需要更复杂的宿主 UI 标签时注册一个 renderer 返回 `a-tag` / `el-tag` 即可。

## 日期区间、百分比与进度

<Demo src="renderers/extended">

<<< @/demos/renderers/extended.vue

</Demo>

`dateRange / dateTimeRange` 接收恰好两个端点的数组，默认用 `~` 连接；`null / undefined / ''` 端点显示 `rangeEmptyText`（默认 `—`）。格式错误的非空端点保留原展示值。日期时间使用本地时间；纯日期作为日历日期处理，日期时间补为午夜。显式提供 `dateFormat` 时直接使用这些 Intl 配置，字段不会再追加默认时分秒。

`percent / progress` 默认 `percentScale: 'percent'`，即 25 表示 25%；设置 `'ratio'` 后 0.25 表示 25%。`percent` 默认最多两位小数，可通过 `numberFormat` 调整，固定使用 Intl 的 percent 样式。进度条将越界值限制到 0–100；默认未完成为 `processing`、100 为 `success`，可用枚举状态或 `fieldProps.status` 覆盖。`showValue: false` 隐藏右侧文字和状态图标，保留进度语义。

进度条遵循 ProField 的 small 规格：6px 轨道、100–320px 宽度、12px 文字，完成 / 错误使用状态图标。色彩由当前预设提供；可覆盖 `cellProgress / cellProgressTrack / cellProgressBar / cellProgressText` slots 和 [进度主题变量](/guide/theme-tokens#字段进度)。普通与虚拟行共用同一条渲染路径。

纯时间字符串的显式 Intl 格式以 `1970-01-01 UTC` 为参考，默认保持其钟面时间；显式 `timeZone` 对此参考值进行转换。需要实际日期、夏令时或跨时区展示时，传入 Date 或时间戳。

## 注册业务类型

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
    fieldProps: ({ record }) => ({ tooltip: `查看 ${record.name}` }),
  },
]
```

将 `renderers` 绑定到 `<VTable :renderers="renderers">`。`createTableRenderers` 合并内置类型与业务覆盖，返回不可变映射；也可直接传只包含业务类型的映射，未覆盖的内置类型仍可用。每个表格使用自己的映射，不会污染其他表格或 SSR 请求。未知 `valueType` 回退到枚举或原值展示。

renderer 接收 `text / value / record / column / index / renderIndex`，其中 `text / value` 已经过 `transformCellText`；`displayValue` 是对应枚举标签或转换后的值，`status` 来自同一份枚举。返回 VNode 或 `{ children, tooltipText?, status?, presentation? }`；`presentation: 'tag'` 可使用主题中的标签外观。返回 VNode 时不会自动读取其中的文字，需要省略提示时显式提供 `tooltipText`。

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
