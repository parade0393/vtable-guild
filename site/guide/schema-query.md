# Schema 查询区与轻量筛选

`VTableQuery` 负责字段、控件接线和查询区布局；[`useTableQuery`](/guide/query) 继续负责草稿、转换、提交和重置。
它是独立的可选组件，可以放在表格上方，也可以用于只展示列表的页面。基础表格不会自动创建表单。

<Demo src="query/schema">

<<< @/demos/query/schema.vue

</Demo>

## 注册已有 UI 库的控件

应用已经安装的宿主组件传给适配工厂，组件库不会导入另一套 UI 库。首批控件包括 `text / select / digit / date / dateTime / dateRange / dateTimeRange / time`。

```ts
import { Input, Select, InputNumber, DatePicker, TimePicker } from 'ant-design-vue'
import { createAntdvTableControls } from '@vtable-guild/vtable-guild'

const controls = createAntdvTableControls({
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

表格的 `visible / responsive` 与查询是否显示无关；列 `query: false` 排除查询字段，`query.hidden` 决定查询可见性，`query.order` 决定查询顺序。因此表格 `date` 可以对应查询 `dateRange`。
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
const FieldControl = ({ field, control }: TableQueryFieldSlotProps<Values>) =>
  controls[field.valueType || 'text'](control)
```

```vue
<a-form ref="form" :model="query.draft.value" :rules="queryRules">
  <VTableQuery
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

普通 form 布局始终显式提交；light 布局默认也显式提交。只有 `layout="light"` 且 `autoSubmit` 为 true 时，控件更新才安排一次防抖提交。相同值的重复更新不提交，点击查询会取消待执行的防抖，点击重置会取消旧自动任务。

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

## 主题与布局

默认使用 ProTable 风格的间距和响应式栅格，两套预设共用 `query` slots：`root / fields / field / label / control / error / actions / feedback / collapse`。
可通过实例 `ui` 或全局 `theme.query.slots` 覆盖；宿主控件本身由对应 UI 库控制样式。

| token                                             | 默认值 / 含义                                 |
| ------------------------------------------------- | --------------------------------------------- |
| `--vtg-query-padding`                             | `24px`，普通查询区内边距                      |
| `--vtg-query-light-padding`                       | `16px`，轻量查询区内边距                      |
| `--vtg-query-column-gap / --vtg-query-row-gap`    | `24px / 16px`，栅格间距                       |
| `--vtg-query-field-min-width`                     | `240px`，普通字段最小布局宽度，窄容器自动收缩 |
| `--vtg-query-label-width / --vtg-query-label-gap` | `80px / 12px`                                 |
| `--vtg-query-control-height`                      | `32px`，标签和操作区对齐高度                  |
| `--vtg-query-light-field-width`                   | `240px`，轻量字段宽度                         |
| `--vtg-query-action-gap`                          | `8px`                                         |
| `--vtg-query-radius`                              | Ant `6px`、Element Plus `4px`                 |
| `--vtg-query-error-font-size`                     | `12px`                                        |

完整 ProForm、ModalForm、DrawerForm 与 CRUD 页面引擎不在此适配层范围内。
