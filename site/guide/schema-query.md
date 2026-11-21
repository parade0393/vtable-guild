# Schema 查询区与轻量筛选

`VTableQuery` 根据 `fields` 或 `columns` 生成查询控件，可放在表格上方或独立使用。[`useTableQuery`](/guide/query) 管理草稿、参数转换、提交和重置。

| 模式        | 使用方式                             | 交互                              |
| ----------- | ------------------------------------ | --------------------------------- |
| QueryFilter | 默认，或 `layout-type="QueryFilter"` | 查询表单，点击查询或按 Enter 提交 |
| LightFilter | `layout-type="LightFilter"`          | 标签展示已选值，点击打开筛选弹层  |

## QueryFilter

向控件工厂注册宿主 UI 库的 `Form` 和 `FormItem` 后，`QueryFilter` 默认使用它们渲染表单。设 `form-mode="builtin"` 可使用 VTable 自带的表单和标签，控件仍由所注册的 UI 库渲染。未注册宿主表单时，默认使用内置表单。

原生表单默认采用 `query-layout="inline"`，按表单项实际宽度排列，空间不足就换行。收起时先为查询、重置和展开按钮留出空间；展开后显示全部条件。展开和收起只改变显示，已输入的条件会保留。

如果需要跨行对齐，在原生表单上设置 `query-layout="grid"`。这时它与内置表单共用下文的 24 格规则，`span` 和 `search.colSize` 都可调整字段占用的格数。`layout` 控制标签布局，支持 `horizontal`、`inline` 和 `vertical`，与 `query-layout` 控制的字段排布独立。

在原生模式下，可用 `formProps` 配置整份宿主表单，用列的 `search.formItemProps` 或显式字段的 `formItemProps` 配置表单项。例如在 Ant Design Vue 或 Antdv Next 中，可用 `:form-props="{ colon: false }"` 关闭标签冒号，或用 `search: { formItemProps: { tooltip: '支持模糊查询' } }` 给单个标签加提示。输入框宽度、占位文字等仍由 `fieldProps` 控制。

```vue
<!-- 注册 Form 和 FormItem 后，默认使用原生内联表单 -->
<VTableQuery :query="query" :columns="columns" :controls="controls" />

<!-- 原生表单按 24 格对齐，每个普通条件占 8 格 -->
<VTableQuery :query="query" :columns="columns" :controls="controls" query-layout="grid" :span="8" />

<!-- 保留宿主输入控件，切回 VTable 内置表单 -->
<VTableQuery :query="query" :columns="columns" :controls="controls" form-mode="builtin" />
```

<Demo src="query/schema">

<<< @/demos/query/schema.vue

</Demo>

勾选“窄容器”可以观察同一份 schema 的布局变化。展开表单后可以编辑占两格的日期区间，并查看提交后的参数。

| 查询区宽度      | 默认列数 | 默认标签方向 |
| --------------- | -------- | ------------ |
| 小于 513px      | 1        | 上方         |
| 513px 至 700px  | 2        | 上方         |
| 701px 至 1351px | 3        | 左侧         |
| 1352px 及以上   | 4        | 左侧         |

栅格布局按 24 格计算，`span` 指定每列的格数，也接受断点对象，如 `{ xs: 24, md: 12, xl: 8 }`。`colSize` 指定字段占用几列，默认为 1。例如 `span: 8` 时，`search: { colSize: 2 }` 占 16 格。字段按 `order` 从大到小排列，相同值保留原有顺序。

栅格布局默认收起时先留出一列给操作区，再按顺序放入字段，至少显示第一个可见字段。`defaultColsNumber` 可以进一步限制首行字段，`defaultFormItemsNumber` 优先级更高，允许初次收起时就显示多行；这两个数量配置仅用于栅格布局。原生内联布局按实际宽度计算首行容量。通过 `defaultCollapsed` 修改初始状态，或使用 `v-model:collapsed` 控制当前状态。用 `:collapse-render="false"` 隐藏展开按钮。

## LightFilter

点击常用条件标签打开弹层。单选及 `date / dateRange` 控件选定后提交，文本、数字以及 `time / dateTime / dateTimeRange` 等包含时间的控件等待筛选弹层底部确认。多选更新后提交，同时保留弹层供继续选择；Ant Design Vue 的 `multiple / tags` 模式均如此。点击标签的清除按钮会立即提交。

将字段设为 `secondary: true` 后，它会进入“更多筛选”。设置 `collapse` 可以把全部条件并入同一个弹层。弹层内的编辑在确认后一次提交，关闭弹层会丢弃尚未确认的修改。使用底部的清除按钮会清除这组条件并提交。`footerRender` 可自定义确认和清除操作，`getPopupContainer` 可指定弹层挂载位置。

<Demo src="query/light-filter">

<<< @/demos/query/light-filter.vue

</Demo>

## 注册已有 UI 库的控件

应用已经安装的宿主组件传给适配工厂，组件库不会导入另一套 UI 库。两个工厂都注册下文列出的 10 种内置控件键。

```ts
import { Button, DatePicker, Form, Input, InputNumber, Select, TimePicker } from 'ant-design-vue'
import { createAntdvTableControls, type TableControls } from '@vtable-guild/vtable-guild'

const controls: TableControls = createAntdvTableControls({
  Form,
  FormItem: Form.Item,
  Button,
  Input,
  Select,
  InputNumber,
  DatePicker,
  RangePicker: DatePicker.RangePicker,
  TimePicker,
})
```

Antdv Next 可直接从 `antdv-next` 导入 `Form`、`FormItem` 和 `Button`。使用 Element Plus 时，把 `ElForm`、`ElFormItem` 和 `ElButton` 分别作为 `Form`、`FormItem` 和 `Button` 传给 `createElementPlusTableControls`，同时注册 `Input: ElInput`、`Select: ElSelect`、`Option: ElOption` 等控件。
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

将 `businessControls` 传给 `VTableQuery` 的 `controls`。调用 `context.onChange(value)` 更新当前草稿。自定义控件可以设置 `renderer.lightFilter.formatValue(context)` 来渲染标签上的已选值。单字段弹层默认等待确认，可用 `submitOnChange` 开启实时提交，再通过 `closeOnChange` 控制提交后是否关闭弹层。控件内部还会打开选择菜单时，可使用 `context.lightFilter?.getPopupContainer` 将菜单挂在筛选弹层中。

未注册的名称（例如把 `select` 写成 `sleect`）会回退到 `controls.text`；如果连 `text` 也未注册，则没有默认控件可渲染。组件不会因为拼写错误而自动注册控件或抛出校验错误。开放的 `TableControlValueType` 也不会把任意字符串判为类型错误；如果某份配置只允许内置键，可以用 `satisfies TableBuiltinControlValueType` 限制它。

### 与表格展示类型的区别

| 配置位置                                            | 注册表      | 作用                                               |
| --------------------------------------------------- | ----------- | -------------------------------------------------- |
| `TableQueryField.valueType` / 列 `search.valueType` | `controls`  | 选择查询输入控件，使用 `TableControlValueType`     |
| 列 `editor.valueType`                               | `controls`  | 选择编辑输入控件，与查询共享控件类型               |
| 列 `valueType`                                      | `renderers` | 选择单元格展示方式，例如格式化金额、日期或渲染标签 |

列展示的 `money` 可格式化金额，查询控件的 `money` 使用数字输入框。`deriveTableQueryFields` 会为具有非空 `valueEnum` 的列选用 `select`，为 `digit / money` 列选用 `digit`，保留日期和时间类型，其余类型使用 `text`。可用 `search.valueType` 覆盖派生结果，例如为展示 `date` 的列设置 `dateRange` 查询控件。

## 显式 schema 与列派生

schema 的 `name` 对应查询草稿的顶层 key。`valueType` 选择控件，`fieldProps` 配置宿主属性；`fieldProps / hidden / disabled / readonly` 可用回调读取整份草稿。LightFilter 弹层内的这些回调包含尚未确认的编辑值，联动字段会立即显示或隐藏；确认时一次提交，关闭时丢弃编辑。

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
  { dataIndex: 'name', title: '名称', visible: false, search: { order: 1 } },
  {
    dataIndex: 'range',
    title: '日期',
    valueType: 'date',
    search: { valueType: 'dateRange', order: 2 },
  },
  { dataIndex: 'status', title: '状态', valueEnum: new Map([[1, '进行中']]), search: { order: 3 } },
]
const fields = deriveTableQueryFields(columns)
```

可以将 `columns` 直接传给 `VTableQuery`，也可以传入 `fields` 使用显式 schema。列设置 `search: false` 或 `hideInSearch: true` 时跳过派生，`search.hidden` 控制字段可见性，`search.order` 控制顺序。表格的 `visible / responsive` 只控制列的展示。
也可用 helper 的第二参数按 name 覆盖配置或传 false 排除字段。嵌套数组 `dataIndex` 不自动推断查询参数，需显式 `search.name`；分组列递归展开，同名字段只保留第一个。

`valueEnum` 仅将字符串标签自动派生为 select 选项，并保留 Map 的字符串、数字与布尔值身份；数字、布尔文本和 VNode 标签不自动转换，改用显式 options 或 field 插槽。

## 隐藏、折叠与重置

- 默认 `preserve: true` 将隐藏字段和已折叠的 QueryFilter 字段保留在提交参数中。
- `:preserve="false"` 从请求参数中省略这些字段，草稿仍保留原值。省略的字段会跳过各自的 `fieldTransforms`。
- 展开或收起 QueryFilter 只更新显示状态。LightFilter 的 `secondary` 条件在弹层外仍会参与查询。
- QueryFilter 重置先恢复 `defaultValues`；原生模式清除宿主表单校验提示。随后执行自定义 `validate` 并调用一次 `onReset`，未提供 `onReset` 时使用 `onSubmit`。

## 宿主校验先于查询

原生模式会在查询按钮、Enter 和组件 `submit()` 调用时自动校验宿主表单，校验失败时由宿主 `FormItem` 展示错误并阻止请求。可在 `formProps.rules` 配置整份表单规则，或在 `search.formItemProps.rules` 配置单个条件。默认校验未隐藏的条件，包括收起的条件；`preserve: false` 时只校验当前显示的条件。重置恢复默认值并清除校验提示，不要求默认值通过宿主表单规则。

```ts
const columns: TableQueryColumn<Values>[] = [
  {
    dataIndex: 'name',
    title: '名称',
    search: {
      formItemProps: {
        tooltip: '支持模糊查询',
        rules: [{ required: true, message: '请输入名称' }],
      },
      fieldProps: { placeholder: '请输入名称', allowClear: true },
    },
  },
]
```

`validate(values, { fields, action, signal })` 返回 false 或抛错时阻止请求。values 是快照，fields 包含未隐藏的字段；同一动作等待时重复调用会共享结果。输入变化或组件卸载会让旧校验失效，避免旧结果提交新草稿。

原生模式先执行宿主表单校验，再执行此回调。若业务已有自己的 `Form` 包装查询区，可用以下内置模式接入方式。

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
    form-mode="builtin"
    root-tag="div"
    :query="query"
    :fields="fields"
    :controls="controls"
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

业务自己用宿主 Form 包裹查询区时，使用内置模式与 `rootTag="div"`，避免嵌套 form。`errors` 可传按字段名索引的错误文字；宿主 FormItem 已展示错误时可由其负责反馈。
查询规则与编辑规则分别提供，查询字段不会自动继承编辑的 required。具体规则、跨字段关系和校验消息继续由宿主表单或业务 validate 提供。

## 查询状态与请求

通过 `useTableQuery({ onSubmit, onReset })` 连接请求。使用 `useTableRequest` 时，可分别接入 `request.submit` 和 `request.reset`。`submitted` 和 `reset` 事件用于读取操作结果。直接修改 `query.draft` 可以同步调整多个条件，再调用组件的 `submit()` 一次提交。

组件实例提供 `submit()`、`reset()` 和 `cancel()`。前两个方法返回 `Promise<boolean>`，`cancel()` 取消组件宿主校验，草稿可以继续编辑。已经发出的服务端请求由 `useTableRequest` 管理。

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
`controls` 是表级的只读注册表；添加键即可注册业务控件。`field` 插槽收到 `{ field, values, control, layoutType }`，调用 `control.onChange(value)` 进入同一更新协议，`control.onSearch(keyword)` 连接字典搜索。

`actions` 插槽收到 `{ submit, reset, submitting, collapsed, toggleCollapsed, showCollapseButton }`。自定义原生按钮请设置 `type="button"`，避免触发表单默认提交。

## API

### VTableQuery Props

<!-- @api: reference schema-query-props -->

### TableQueryField

<!-- @api: reference schema-query-fields -->

### VTableQuery Slots

<!-- @api: reference schema-query-slots -->

## 主题与布局

内置栅格布局的 `labelWidth` 控制标签宽度，默认 80px，也可设为 `'auto'`。栅格布局的 `searchGutter` 接收横向间距或 `[横向, 纵向]`，默认间距为 24px。字段内可用 `fieldProps.style.width` 调整宿主控件宽度。

使用实例的 `ui` 或全局 `theme.query.slots` 覆盖查询区 class。查询区和弹层默认样式由相应的 preset 提供，宿主输入控件沿用各自 UI 库的样式。

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
