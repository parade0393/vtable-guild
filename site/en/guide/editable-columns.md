# Column editors

`useTableEditable` adds column configuration wiring on top of `useTableEdit`. It uses the same draft, error and saving state and renders the registered host controls through `bodyCell`; the base table does not enter editing mode automatically.

## Registering controls

If your project already has Ant Design Vue installed, pass in the components you need:

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

Element Plus uses the same registry protocol:

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

These two factories only receive the components you pass in and do not import the UI library. The application imports the host component styles. The built-in wired types are `text / select / enum / digit / money / date / dateRange / dateTime / dateTimeRange / time`; queries and editing can share the same registry.

Date controls use formatted strings by default: `YYYY-MM-DD` for date, `YYYY-MM-DD HH:mm:ss` for dateTime and `HH:mm:ss` for time. Range types return an array of the two ends. Override this through `fieldProps.valueFormat`; set it explicitly to undefined to use the host's native date objects. Converting between the date object protocols of different UI libraries is up to the application.

The control value of Select uses an internal encoding, and the string, number or boolean identity is restored on update, so `false`, `'false'`, `1` and `'1'` are never confused. Clearing returns undefined; multiple selection receives an array. Other value protocols such as `labelInValue` need a custom renderer.

## Configuration and wiring

```ts
import { ref } from 'vue'
import { useTableEditable, VTableEditCell, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface Row {
  id: number
  name: string
  amount: number
  team: number
}
const rows = ref<Row[]>([{ id: 1, name: 'Item A', amount: 2, team: 1 }])
const columns: TableColumnsType<Row> = [
  {
    dataIndex: 'name',
    title: 'Name',
    editor: {
      validate: (value) =>
        typeof value === 'string' && value.trim() ? undefined : 'Please enter a name',
    },
  },
  {
    dataIndex: 'amount',
    title: 'Quantity',
    valueType: 'digit',
    editor: {
      valueType: 'digit',
      fieldProps: { min: 1 },
      disabled: ({ draft }) => draft.team === 2,
    },
  },
  {
    dataIndex: 'team',
    title: 'Team',
    valueEnum: { 1: 'Platform', 2: 'Trading' },
    editor: {
      valueType: 'select',
      options: [
        { value: 1, label: 'Platform' },
        { value: 2, label: 'Trading' },
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

You can also call `edit.renderEditor(context)` directly from a TSX slot. `VTableEditCell` provides a stable component bridge that avoids remounting the host control while you type; in templates, `v-if="edit.getCell(cell)"` keeps the default read-only fallback. The action column is provided by the application and calls `start(record) / save(key) / cancel(key)`; buttons, confirmation dialogs and application requests keep reusing the host UI library. A custom `bodyCell` can take over certain columns first; a column's `customRender` still follows its existing priority.

`editor: false` or no editor configuration means no wiring; `editor.editable / readonly / disabled` accept booleans and callbacks that receive the row context. readonly / editable=false use the read-only display, while disabled keeps the control and blocks updates. Conversion and validation still run for every field that has an editor configured, which keeps the input/output formats of read-only fields consistent.

## Conversion, linkage and validation

`convertValue(value, context)` runs only when editing starts; `transform(value, context)` produces the submitted value from the draft snapshot and does not modify the value the user is typing. `dataIndex: ['profile', 'name']` supports nested fields; a string `dataIndex` is read as the complete field name, consistent with the read-only table. Updates run on an isolated draft, and modifying the row key is not allowed. When records contain mutable class instances, use `clone(record)` to define the snapshot behavior.

`onValueChange(value, context)` can return a `Partial<Row>` to update other linked fields; one input updates the draft only once. The context contains `key / column / name / value / draft / original / isNew`, where draft and original are isolated copies.

Saving first runs the column `validate`; once the field rules pass, it runs the row-level `validate` you passed in once, then performs the submission transform and `onSave`. A string returned by field validation is shown below the control; row-level validation can return `{ message, fields }`, where fields uses dot-separated field paths. When wiring a host form, put the form's validate in the row-level validate to avoid validating again in onSave. On failure the draft is kept, and `savingKeys / cancellingKeys` disable the controls of the current row.

`getCell(context)` returns the complete control context and supports custom controls and slots. To register an application type, just return a VNode:

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

`editor.dictionary` can connect to [Remote dictionaries](/en/guide/dictionary), which automatically provides loading, options and remote search and keeps the selected labels. Dependency parameters are defined when the dictionary subscription is created; whether an application value is cleared or kept is decided by the application's linkage rules. An explicit `editor.options` takes precedence over the dictionary's candidates, including an empty array; when neither options nor dictionary is specified, options are generated only from the string labels of the same column's valueEnum. Numeric, boolean-text and VNode labels need explicit options or a custom control.

Controls, errors and spacing are configured through the table's `editCell / editControl / editError` slots and the `--vtg-editor-*` variables, and work with both presets. A regular table only gains the column type declarations; it creates no editors, forms or watchers.

For submitting once from an external master form, validating all drafts without saving, adding rows at the top or bottom and row count limits, see [Detail forms](/en/guide/detail-form).

## API

### Column fields

<!-- @api: columns editable-columns -->

### useTableEditable configuration

<!-- @api: reference editable-options -->

### TableColumnEditor

<!-- @api: reference editable-editor-fields -->

## Theming

Use the per-instance `ui` or the global `theme.table.slots` to adjust the editing area. The appearance of host controls follows their UI library.

### ui slots

<!-- @api: ui editable-columns -->

### Preset defaults

<!-- @api: theme editable-columns -->

### CSS variables

<!-- @api: css-vars editable-columns -->

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#EditingProtocol

:::
