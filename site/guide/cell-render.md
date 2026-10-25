# 字段渲染器

列的 `valueType` 选择字段渲染器，`fieldProps` 传递格式选项。这个组合参考 [ProTable 的列配置](https://next-procomponents.ant.design/components/schema-form/)，采用 Vue 回调上下文，并复用已有的 `valueEnum`、空值与复制协议。

<Demo src="renderers/basic">

<<< @/demos/renderers/basic.vue

</Demo>

## 内置类型

| valueType | 行为                                                    | 常用 fieldProps                      |
| --------- | ------------------------------------------------------- | ------------------------------------ |
| `text`    | 显示枚举文本或原值；布尔值显示 `true` / `false`         | —                                    |
| `digit`   | 使用 `Intl.NumberFormat` 格式化有限数字或非空数字字符串 | `locale`、`numberFormat`             |
| `money`   | 货币格式，默认 `CNY`                                    | `currency`、`locale`、`numberFormat` |
| `date`    | 默认 `YYYY-MM-DD`，支持 Date、日期字符串或毫秒时间戳    | `locale`、`dateFormat`               |
| `tag`     | 显示枚举文本，复用枚举状态主题                          | `status`                             |

数字、日期无法解析时保留原展示值；数字类型不会将布尔值、空字符串或空格隐式转为零。日期默认输出与 ProField 一致的 `YYYY-MM-DD`；纯日期字符串保留日历日期，Date、时间戳与带时区字符串取本地日历日期。显式提供 `dateFormat` 后使用 Intl 本地化，跨时区展示通过 `dateFormat.timeZone` 明确时区。默认语言取表格当前语言；字段可通过 `locale` 覆盖。`numberFormat` 和 `dateFormat` 是标准 Intl 配置，配置无效时会由 Intl 抛出异常。

`money` 保留 `numberFormat` 的其他 Intl 选项，但固定使用 `style: 'currency'`；货币以 `fieldProps.currency` 为准，默认 `CNY`。`numberFormat` 内的 `style` 和 `currency` 不能覆盖这两项。

`tag` 与 `valueEnum` 共用相同的状态：`success / warning / error / processing / default`，颜色、边框和间距由两套主题预设提供。未知枚举值保留原值。需要更复杂的宿主 UI 标签时注册一个 renderer 返回 `a-tag` / `el-tag` 即可。

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

## 与现有展示功能组合

1. `transformCellText` 先转换读取的值，枚举与字段渲染器消费转换后的值。
2. `customRender` 与有效的 `bodyCell` 插槽优先；没有有效插槽内容时使用字段渲染器。
3. `null / undefined` 使用 `columnEmptyText`，不调用字段渲染器；`0 / false / ''` 保留。
4. 排序、筛选继续使用源记录，字段展示不会改写数据。`filters: true` 仍从同一份 `valueEnum` 生成筛选项。
5. 默认复制使用转换后的标量原值，不复制货币符号或枚举标签。使用 `copyable.text` 可以显式改变复制内容。

不设置 `valueType` 时保持既有单元格展示流程。渲染器只负责只读展示，查询控件与编辑器仍由业务使用已有 UI 库组合。
