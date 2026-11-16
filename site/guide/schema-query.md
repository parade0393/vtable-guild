# Schema 查询区与轻量筛选

`VTableQuery` 负责字段、控件接线和查询区布局；[`useTableQuery`](/guide/query) 继续负责草稿、转换、提交和重置。
它是独立的可选组件，可以放在表格上方，也可以用于只展示列表的页面。基础表格不会自动创建表单。

<Demo src="query/schema">

<<< @/demos/query/schema.vue

</Demo>

## 注册已有 UI 库的控件

应用已经安装的宿主组件传给适配工厂，组件库不会导入另一套 UI 库。两个工厂都注册下文列出的 10 种内置控件键。

```ts
import { Input, Select, InputNumber, DatePicker, TimePicker } from 'ant-design-vue'
import { createAntdvTableControls, type TableControls } from '@vtable-guild/vtable-guild'

const controls: TableControls = createAntdvTableControls({
  Input,
  Select,
  InputNumber,
  DatePicker,
  RangePicker: DatePicker.RangePicker,
  TimePicker,
})
```

Element Plus 使用 `createElementPlusTableControls({ Input: ElInput, Select: ElSelect, Option: ElOption, InputNumber: ElInputNumber, DatePicker: ElDatePicker, TimePicker: ElTimePicker })`。
日期默认通过宿主 `valueFormat` 使用字符串，业务可通过 `fieldProps.valueFormat` 调整。查询与编辑可共享同一份注册表，但各自拥有字段规则与值转换。

## 查询控件的 valueType {#control-value-types}

`TableQueryField.valueType` 从 `controls` 注册表中选择控件，默认为 `text`。两个适配工厂都注册下表的 10 个内置键。字段类型由 [`TableControlValueType`](/guide/type-reference#tablecontrolvaluetype) 定义，内置键见 [`TableBuiltinControlValueType`](/guide/type-reference#tablebuiltincontrolvaluetype)。

<!-- @api: reference control-value-types -->

`enum` 与 `select` 使用同一个控件；`money` 使用数字输入框，不会自动添加货币符号、千分位或两位小数。`select / enum` 接收字段的 `options` 或 `dictionary`，并在更新时保留字符串、数字和布尔值的身份。单选清除时，宿主返回的空值归一为 `undefined`；多选值逐项还原，清空后的 `[]` 保留为空数组。宿主若返回非数组空值，则归一为 `undefined`。

Ant Design Vue 范围类型需要向工厂传入 `RangePicker`，时间类型需要 `TimePicker`；Element Plus 选择框需要 `Option: ElOption`。日期和时间的清除值遵循宿主控件，可用 `fieldTransforms` 统一为接口要求的值。显式设置 `fieldProps.valueFormat: undefined` 时使用宿主原生日期值，而不是上表的格式化字符串。

### 常用配置

`fieldProps` 直接传给当前宿主控件，属性名称遵循该 UI 库。例如 Ant Design Vue 多选使用 `mode: 'multiple'`，Element Plus 使用 `multiple: true`。

```ts
import type { TableQueryField } from '@vtable-guild/vtable-guild'

interface SearchValues {
  username: string
  status?: number
  amount?: number
  createdAt?: [string, string]
}

const fields: TableQueryField<SearchValues>[] = [
  {
    name: 'username',
    label: '用户名',
    valueType: 'text',
    fieldProps: { placeholder: '请输入用户名', style: { width: '200px' } },
  },
  {
    name: 'status',
    label: '状态',
    valueType: 'select',
    options: [
      { value: 1, label: '启用' },
      { value: 0, label: '停用' },
    ],
    fieldProps: { style: { width: '120px' } },
  },
  { name: 'amount', label: '金额', valueType: 'money', fieldProps: { min: 0, precision: 2 } },
  {
    name: 'createdAt',
    label: '创建日期',
    valueType: 'dateRange',
    fieldProps: { valueFormat: 'YYYY-MM-DD' },
  },
]
```

### 自定义注册与拼写错误

`TableControlValueType` 保留内置键的补全，同时接受自定义字符串。自定义名称必须和注册表的键一致。工厂返回的注册表是只读的，使用展开语法创建新注册表：

```ts
import { h } from 'vue'
import UserPicker from './UserPicker.vue'
import type { TableControls, TableQueryField } from '@vtable-guild/vtable-guild'

// controls 是上面工厂创建的内置注册表；本例 UserPicker 使用 modelValue 协议。
const businessControls = {
  ...controls,
  userPicker: (context) =>
    h(UserPicker, {
      ...context.fieldProps,
      id: context.id,
      modelValue: context.value,
      disabled: context.disabled || context.readonly,
      'onUpdate:modelValue': context.onChange,
    }),
} satisfies TableControls

const ownerFields: TableQueryField<{ owner?: string }>[] = [
  { name: 'owner', label: '负责人', valueType: 'userPicker' },
]
```

将 `businessControls` 传给 `VTableQuery` 的 `controls`。调用 `context.onChange(value)` 才会进入查询草稿、校验失效和自动提交协议；自定义控件应自行适配它的值、只读和搜索接口。

未注册的名称（例如把 `select` 写成 `sleect`）会回退到 `controls.text`；如果连 `text` 也未注册，则没有默认控件可渲染。组件不会因为拼写错误而自动注册控件或抛出校验错误。开放的 `TableControlValueType` 也不会把任意字符串判为类型错误；如果某份配置只允许内置键，可以用 `satisfies TableBuiltinControlValueType` 限制它。

### 与表格展示类型的区别

| 配置位置                                           | 注册表      | 作用                                               |
| -------------------------------------------------- | ----------- | -------------------------------------------------- |
| `TableQueryField.valueType` / 列 `query.valueType` | `controls`  | 选择查询输入控件，使用 `TableControlValueType`     |
| 列 `editor.valueType`                              | `controls`  | 选择编辑输入控件，与查询共享控件类型               |
| 列 `valueType`                                     | `renderers` | 选择单元格展示方式，例如格式化金额、日期或渲染标签 |

列展示的 `money` 可格式化金额，查询控件的 `money` 使用数字输入框。`deriveTableQueryFields` 会为具有非空 `valueEnum` 的列选用 `select`，为 `digit / money` 列选用 `digit`，保留日期和时间类型，其余类型使用 `text`。可用 `query.valueType` 覆盖派生结果，例如为展示 `date` 的列设置 `dateRange` 查询控件。

## 显式 schema 与列派生

schema 的 `name` 对应查询草稿的顶层 key。`valueType` 选择控件，`fieldProps` 配置宿主属性；`fieldProps / hidden / disabled / readonly` 可用回调读取整份草稿。

```ts
import {
  useTableQuery,
  deriveTableQueryFields,
  type TableQueryColumn,
} from '@vtable-guild/vtable-guild'

interface Values {
  name: string
  range?: [string, string]
  status?: number
}
const query = useTableQuery<Values>({ defaultValues: { name: '' }, onSubmit: request.submit })

const columns: TableQueryColumn<Values>[] = [
  { dataIndex: 'name', title: '名称', visible: false, query: { order: 1 } },
  {
    dataIndex: 'range',
    title: '日期',
    valueType: 'date',
    query: { valueType: 'dateRange', order: 2 },
  },
  { dataIndex: 'status', title: '状态', valueEnum: new Map([[1, '进行中']]), query: { order: 3 } },
]
const fields = deriveTableQueryFields(columns)
```

列用 `query: false` 排除查询字段，`query.hidden` 决定查询可见性，`query.order` 决定查询顺序。表格的 `visible / responsive` 只控制列的展示。
也可用 helper 的第二参数按 name 覆盖配置或传 false 排除字段。嵌套数组 `dataIndex` 不自动推断查询参数，需显式 `query.name`；分组列递归展开，同名字段只保留第一个。

`valueEnum` 仅将字符串标签自动派生为 select 选项，并保留 Map 的字符串、数字与布尔值身份；数字、布尔文本和 VNode 标签不自动转换，改用显式 options 或 field 插槽。

## 隐藏、折叠与重置

- `hiddenPolicy="preserve"` 是默认值。隐藏控件保留草稿，提交时仍包含该字段。
- `hiddenPolicy="omit"` 只省略 schema 中 `hidden: true` 的字段。草稿和 submitted 快照仍保留字段，字段转换不会执行；整体 `transform` 是业务的最后一步，仍可显式产生其他参数。
- 收起只改变布局，绝不会省略折叠区域中的条件。`collapsedCount` 默认 3，展开状态直接复用 `query.collapsed`，`:collapsible="false"` 显示所有未隐藏字段。
- 重置先恢复 `defaultValues`，再按重置后的可见性与宿主校验执行 `query.reset()`；一次操作调用一次 `onReset`（缺省时为 onSubmit）。重置不会额外触发轻量自动提交。

## 宿主校验先于查询

`validate(values, { fields, action, signal })` 返回 false 或抛错时阻止请求。values 是快照，fields 包含未隐藏的字段；同一动作等待时重复调用会共享结果。输入变化或组件卸载会让旧校验失效，避免旧结果提交新草稿。

```ts
import type { TableQueryFieldSlotProps } from '@vtable-guild/vtable-guild'

const FieldControl = ({ field, control }: TableQueryFieldSlotProps<Values>) => {
  const valueType = field.valueType ?? 'text'
  const render = Object.hasOwn(controls, valueType) ? controls[valueType] : controls.text
  return render?.(control)
}
```

```vue
<a-form ref="form" :model="query.draft.value" :rules="queryRules">
  <VTableQuery
    root-tag="div"
    :query="query"
    :fields="fields"
    :controls="controls"
    layout="form"
    :validate="() => form.validate().then(() => true)"
  >
    <template #field="{ field, control }">
      <a-form-item :name="field.name">
        <FieldControl :field="field" :control="control" :values="query.draft.value" />
      </a-form-item>
    </template>
  </VTableQuery>
</a-form>
```

宿主 Form 包裹查询区时使用 `rootTag="div"`，避免嵌套原生 form。`errors` 可传按字段名索引的错误文字；宿主 FormItem 已展示错误时可由其负责反馈。
查询规则与编辑规则分别提供，查询字段不会自动继承编辑的 required。具体规则、跨字段关系和校验消息继续由宿主表单或业务 validate 提供。

## 轻量模式与单次提交

```vue
<VTableQuery
  :query="query"
  :fields="fields"
  :controls="controls"
  layout="light"
  auto-submit
  :debounce-time="300"
/>
```

`layout` 默认为 `light`，`autoSubmit` 默认为 `false`，因此省略两者时使用手动提交。`light` 布局开启 `autoSubmit` 后，控件值发生变化会安排一次防抖提交。手动查询或重置会取消待执行的自动提交。`form` 布局始终手动提交。

从默认 `form` 的版本升级时，需要保留原栅格布局的页面应显式设置 `layout="form"`。若旧页面已传 `autoSubmit: true` 却省略了 `layout`，升级后控件更新会开始自动提交；继续手动查询时应移除 `autoSubmit`、设为 `false`，或显式使用 `form`。

改变 layout、autoSubmit 或 disabled 会取消尚未执行的自动任务；重新开启不会补发旧任务，下一次控件更新才重新安排。
直接修改 query.draft 不会自动请求；跨字段联动可先改多个字段，再显式调用组件 submit，避免联动链触发多次查询。组件 `submitted / reset` 事件只是结果通知，不要再在这些事件里调用请求。

实例 `TableQueryInstance` 提供 `submit(): Promise<boolean>`、`reset(): Promise<boolean>` 与 `cancel()`。cancel 取消组件自动任务与宿主校验，不清理业务草稿；已经提交的服务端请求由 useTableRequest 负责取消。

## 字典、依赖与业务控件

字段 `dictionary` 接 [`useTableDictionary`](/guide/dictionary) 的返回值；组件连接 options、loading、error 与搜索，并从 valueEnum 补齐已选标签。多个查询字段或表格展示可以共享一个字典实例。

```ts
const teams = useTableDictionary({
  dictionary: teamDictionary,
  params: () => ({ region: query.draft.value.region }),
  selectedOptions: selectedTeamLabels,
  debounceTime: 200,
})
const fields = [{ name: 'team', label: '团队', valueType: 'select', dictionary: teams }]
```

依赖变化会刷新候选项，**不会自动清除业务选择**。需要清空下游条件时由业务明确修改草稿；即使选项尚未加载也不应凭空清掉已有值。`options` 显式配置优先于 dictionary 的候选项。
`controls` 是表级的只读注册表；添加键即可注册业务控件。`field` 插槽收到 `{ field, values, control }`，调用 `control.onChange(value)` 进入同一更新/防抖协议，`control.onSearch(keyword)` 连接字典搜索。

`actions` 插槽收到 `{ submit, reset, submitting, collapsed, toggleCollapsed }`。自定义原生按钮请设置 `type="button"`，避免触发表单默认提交。

## API

### VTableQuery Props

<!-- @api: reference schema-query-props -->

### TableQueryField

<!-- @api: reference schema-query-fields -->

### VTableQuery Slots

<!-- @api: reference schema-query-slots -->

## 主题与布局

默认 `light` 按标签和控件的实际宽度依次排列字段，操作按钮跟随字段，空间不足时换行。普通控件默认宽度为 `200px`，`dateRange / dateTimeRange` 默认为 `320px`；字段不再默认占据 `240px` 或拉伸以填满整行。显式 `layout="form"` 使用原有响应式栅格，标签定宽，控件填满字段，操作区靠右。

单个控件可用 `fieldProps.style.width` 覆盖，例如上例状态选择框的 `120px`。`--vtg-query-light-control-width` 和 `--vtg-query-light-range-width` 调整默认控件宽度；已有 `--vtg-query-light-field-width` 仍控制标签与控件组成的整个字段，其默认值改为 `auto`。
可通过实例 `ui` 或全局 `theme.query.slots` 覆盖；宿主控件本身由对应 UI 库控制样式。

布局、校验反馈与操作区的默认 class 由预设提供。

### ui slots

<!-- @api: ui schema-query -->

### 预设默认值

<!-- @api: theme schema-query -->

### CSS 变量

<!-- @api: css-vars schema-query -->

完整 ProForm、ModalForm、DrawerForm 与 CRUD 页面引擎不在此适配层范围内。

## Type Declarations

::: details 查看类型声明

<<< @/.vitepress/type-declarations/features.ts#QuerySchemaProtocol

:::
