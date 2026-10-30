# 列级编辑与宿主控件

`useTableEditable` 在 `useTableEdit` 上增加列配置接线。它使用同一份草稿、错误和保存状态，通过 `bodyCell` 渲染注册的宿主控件，基础表格不自动进入编辑模式。

## 注册控件

项目已经安装 Ant Design Vue 时，传入需要的组件：

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

Element Plus 使用相同的注册表协议：

```ts
import {
  ElInput,
  ElSelect,
  ElOption,
  ElInputNumber,
  ElDatePicker,
  ElTimePicker,
} from 'element-plus'
import { createElementPlusTableControls } from '@vtable-guild/vtable-guild'

const controls = createElementPlusTableControls({
  Input: ElInput,
  Select: ElSelect,
  Option: ElOption,
  InputNumber: ElInputNumber,
  DatePicker: ElDatePicker,
  TimePicker: ElTimePicker,
})
```

这两个工厂只接收传入的组件，不导入 UI 库。由应用导入宿主组件样式。内置接线类型包括 `text / select / enum / digit / money / date / dateRange / dateTime / dateTimeRange / time`，查询和编辑可共享同一注册表。

日期控件默认使用格式化字符串：date 为 `YYYY-MM-DD`，dateTime 为 `YYYY-MM-DD HH:mm:ss`，time 为 `HH:mm:ss`。范围类型返回两端数组。通过 `fieldProps.valueFormat` 覆盖；显式设为 undefined 可使用宿主原生日期对象。不同 UI 库的日期对象协议由应用转换。

Select 的控件值使用内部编码，更新时恢复字符串、数字和布尔值身份，`false`、`'false'`、`1`、`'1'` 不会混同。清除返回 undefined；多选接收数组。`labelInValue` 等其他值协议需要自定义 renderer。

## 配置与接入

```ts
import { ref } from 'vue'
import { useTableEditable, VTableEditCell, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface Row {
  id: number
  name: string
  amount: number
  team: number
}
const rows = ref<Row[]>([{ id: 1, name: '明细 A', amount: 2, team: 1 }])
const columns: TableColumnsType<Row> = [
  {
    dataIndex: 'name',
    title: '名称',
    editor: {
      validate: (value) => (typeof value === 'string' && value.trim() ? undefined : '请输入名称'),
    },
  },
  {
    dataIndex: 'amount',
    title: '数量',
    valueType: 'digit',
    editor: {
      valueType: 'digit',
      fieldProps: { min: 1 },
      disabled: ({ draft }) => draft.team === 2,
    },
  },
  {
    dataIndex: 'team',
    title: '团队',
    valueEnum: { 1: '平台', 2: '交易' },
    editor: {
      valueType: 'select',
      options: [
        { value: 1, label: '平台' },
        { value: 2, label: '交易' },
      ],
    },
  },
]
const edit = useTableEditable({
  rowKey: 'id',
  mode: 'multiple',
  columns,
  controls,
  dataSource: rows,
  onChange: (value) => {
    rows.value = value
  },
  onSave: async (value) => value,
})
const { records } = edit
```

```vue
<VTable :columns="columns" :data-source="records" row-key="id">
  <template #bodyCell="cell">
    <VTableEditCell v-if="edit.getCell(cell)" :edit="edit" :cell="cell" />
  </template>
</VTable>
```

也可用 TSX 插槽直接调用 `edit.renderEditor(context)`。`VTableEditCell` 提供稳定组件桥接，避免输入时重复挂载宿主控件；模板中通过 `v-if="edit.getCell(cell)"` 保留默认只读回退。操作列由业务提供 `start(record) / save(key) / cancel(key)`，按钮、确认框及业务请求继续复用宿主 UI 库。自定义 `bodyCell` 可优先接管某些列；列 `customRender` 仍遵守原有优先级。

`editor: false` 或不配置 editor 表示不接线；`editor.editable / readonly / disabled` 支持布尔值和按行上下文回调。readonly / editable=false 使用只读展示，disabled 保留控件并禁止更新。转换与校验仍对所有配置了 editor 的字段执行，便于只读字段保持输入/输出格式一致。

## 转换、联动与校验

`convertValue(value, context)` 只在进入编辑时执行；`transform(value, context)` 从草稿快照生成提交值，不改写用户正在输入的值。`dataIndex: ['profile', 'name']` 支持嵌套字段；字符串 `dataIndex` 按完整字段名读取，与只读表格一致。更新在隔离草稿上执行，禁止修改行键。包含可变类实例时，使用 `clone(record)` 定义快照行为。

`onValueChange(value, context)` 可以返回 `Partial<Row>` 联动其他字段，一次输入只更新一次草稿。上下文含 `key / column / name / value / draft / original / isNew`，其中 draft 和 original 是隔离副本。

保存先执行列 `validate`，字段规则通过后执行传入的行级 `validate` 一次，再进行提交转换与 `onSave`。字段校验返回字符串显示在控件下方；行级校验可返回 `{ message, fields }`，fields 使用点分字段路径。接宿主表单时，将表单 validate 放在行级 validate，避免在 onSave 再校验一次。失败保留草稿，`savingKeys / cancellingKeys` 禁用当前行的控件。

`getCell(context)` 返回完整控件上下文，支持自定义控件和插槽。注册业务类型只需返回 VNode：

```ts
import { h } from 'vue'
import type { TableControls } from '@vtable-guild/vtable-guild'

const extendedControls: TableControls = {
  ...controls,
  project: (field) =>
    h(ProjectSelect, {
      modelValue: field.value,
      'onUpdate:modelValue': field.onChange,
      disabled: field.disabled,
    }),
}
```

`editor.dictionary` 可接 [远程字典](/guide/dictionary)，自动提供 loading、选项与远程搜索，并保留已选标签。依赖参数在创建字典订阅时定义；清除或保留业务值由业务联动规则决定。显式 `editor.options` 优先于 dictionary 的候选项，包括空数组；未指定 options/dictionary 时，仅从同列 valueEnum 的字符串标签生成选项。数字、布尔文本和 VNode 标签需使用显式 options 或自定义控件。

控件、错误与间距通过 table 的 `editCell / editControl / editError` slots 及 `--vtg-editor-*` 变量配置，兼容两套预设。普通表格只增加列类型声明，不创建编辑器、表单或监听。

外部主表单一次提交、纯校验全部草稿、新增首尾与数量限制见 [明细表单](/guide/detail-form)。

<<< @/.vitepress/type-declarations/features.ts#EditingProtocol
