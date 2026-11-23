# Schema query area and light filtering

`VTableQuery` generates query controls from `fields` or `columns`. Place it above a table or use it on its own. [`useTableQuery`](/en/guide/query) manages the draft, parameter transforms, submission and reset.

| Mode        | How to use it                           | Interaction                                          |
| ----------- | --------------------------------------- | ---------------------------------------------------- |
| QueryFilter | Default, or `layout-type="QueryFilter"` | Query form with a Search button and Enter submission |
| LightFilter | `layout-type="LightFilter"`             | Filter chips show selected values and open popups    |

## QueryFilter

Register the host UI library's `Form` and `FormItem` with the control factory, and `QueryFilter` uses them by default. Set `form-mode="builtin"` to use VTable's form and labels while keeping the registered host controls. The built-in form is also the fallback when no host form is registered.

The native form defaults to `query-layout="inline"`. Items use their own widths and wrap when space runs out. The collapsed layout reserves room for the search, reset and expand actions. Expanding shows all fields, and toggling the layout keeps their values.

Native inline forms keep the host form items' horizontal spacing. Antdv inline items have no bottom margin, so VTable adds a gap between wrapped rows using the host's `--ant-margin`, or 16px when unavailable. Element Plus items already have a bottom margin, so the container adds no vertical gap by default. Use `searchGutter: [horizontal, vertical]` or `--vtg-query-row-gap` to set the container's extra row gap explicitly; this adds to any host form-item bottom margin.

To align fields across rows, set `query-layout="grid"` on a native form. It then shares the built-in form's 24-unit grid, including `span` and `search.colSize`. The separate `layout` prop controls label placement and accepts `horizontal`, `inline` and `vertical`.

In native mode, `formProps` configures the host form, while `search.formItemProps` on a column or `formItemProps` on an explicit field configures its form item. For example, with Ant Design Vue or Antdv Next, use `:form-props="{ colon: false }"` to hide the label colons or `search: { formItemProps: { tooltip: 'Supports partial matches' } }` for a single label. `fieldProps` still controls input width, placeholders and other control props.

```vue
<!-- Registering Form and FormItem enables native inline rendering by default. -->
<VTableQuery :query="query" :columns="columns" :controls="controls" />

<!-- Align native form items on a 24-unit grid with 8 units per ordinary field. -->
<VTableQuery :query="query" :columns="columns" :controls="controls" query-layout="grid" :span="8" />

<!-- Keep host input controls and switch back to VTable's built-in form. -->
<VTableQuery :query="query" :columns="columns" :controls="controls" form-mode="builtin" />
```

<Demo src="query/schema">

<<< @/demos/query/schema.vue

</Demo>

Toggle **Narrow container** to see the same schema fit a smaller area. Expand the form to edit the two-column date range and inspect the submitted parameters.

| Query area width | Default columns | Default label placement |
| ---------------- | --------------- | ----------------------- |
| Below 513px      | 1               | Above                   |
| 513px to 700px   | 2               | Above                   |
| 701px to 1351px  | 3               | Beside                  |
| 1352px and up    | 4               | Beside                  |

The grid has 24 units. `span` sets the number of units per column and accepts a breakpoint map such as `{ xs: 24, md: 12, xl: 8 }`. A field's `colSize` sets how many columns it occupies and defaults to 1. For example, with `span: 8`, a field with `search: { colSize: 2 }` occupies 16 units. Fields with a larger `order` appear first. Ties retain their original order.

The grid's default collapsed layout reserves a column for the actions, then fits the fields in order and shows at least the first visible field. `defaultColsNumber` can lower the first-row limit. `defaultFormItemsNumber` takes precedence and can show more than one row while collapsed; both count options apply only to the grid. Native inline packing measures item widths to determine its first-row capacity. Use `defaultCollapsed` to change the initial state, `v-model:collapsed` to control it, or `:collapse-render="false"` to hide the toggle.

## LightFilter

Click a primary filter chip to open its popup. Single selects and `date / dateRange` controls submit on selection. Text, number and time-bearing controls (`time / dateTime / dateTimeRange`) wait for confirmation in the filter popup footer. Multiple selects submit individual changes and stay open for further choices, including both Ant Design Vue `multiple / tags` modes. The clear button on a chip submits immediately.

Fields marked `secondary: true` appear under **More filters**. Set `collapse` to group every field in one popup. Edits in the group are submitted together on confirmation. Closing the popup discards pending edits. The footer's clear button clears the group and submits. Customize these actions with `footerRender` or set the popup mount point with `getPopupContainer`.

<Demo src="query/light-filter">

<<< @/demos/query/light-filter.vue

</Demo>

## Registering controls from your existing UI library

Pass the host components your application has already installed to the adapter factory; the library does not import another UI library. Both factories register all 10 built-in control keys listed below.

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

With Antdv Next, import `Form`, `FormItem` and `Button` directly from `antdv-next`. For Element Plus, pass `ElForm`, `ElFormItem` and `ElButton` as `Form`, `FormItem` and `Button` to `createElementPlusTableControls`, alongside controls such as `Input: ElInput`, `Select: ElSelect` and `Option: ElOption`.
Dates use strings by default through the host `valueFormat`, which the application can adjust with `fieldProps.valueFormat`. Query and editing can share the same registry, but each has its own field rules and value transforms.

## Query control valueType {#control-value-types}

`TableQueryField.valueType` selects a control from the `controls` registry and defaults to `text`. Both adapter factories register the 10 built-in keys below. See [`TableControlValueType`](/en/guide/type-reference#tablecontrolvaluetype) for the field type and [`TableBuiltinControlValueType`](/en/guide/type-reference#tablebuiltincontrolvaluetype) for the built-in keys.

<!-- @api: reference control-value-types -->

`enum` uses the same control as `select`. `money` uses a number input and does not add a currency symbol, thousands separators or two decimal places automatically. `select / enum` use the field's `options` or `dictionary` and preserve string, number and boolean identities on update. Clearing a single select normalizes the host's empty value to `undefined`. Multiple-select arrays are decoded item by item, so clearing to `[]` preserves the empty array. If the host instead returns a non-array empty value, it is normalized to `undefined`.

Ant Design Vue range controls require `RangePicker` and time controls require `TimePicker` in the factory input. Element Plus selects require `Option: ElOption`. Cleared date and time values follow the host control; normalize them with `fieldTransforms` when your API requires a different value. Explicitly setting `fieldProps.valueFormat: undefined` uses the host's native date values instead of the formatted strings listed above.

### Common configuration

`fieldProps` is passed directly to the host control and uses that UI library's prop names. For example, Ant Design Vue enables multiple selection with `mode: 'multiple'`, while Element Plus uses `multiple: true`.

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
    label: 'Username',
    valueType: 'text',
    fieldProps: { placeholder: 'Enter a username', style: { width: '200px' } },
  },
  {
    name: 'status',
    label: 'Status',
    valueType: 'select',
    options: [
      { value: 1, label: 'Enabled' },
      { value: 0, label: 'Disabled' },
    ],
    fieldProps: { style: { width: '120px' } },
  },
  { name: 'amount', label: 'Amount', valueType: 'money', fieldProps: { min: 0, precision: 2 } },
  {
    name: 'createdAt',
    label: 'Created',
    valueType: 'dateRange',
    fieldProps: { valueFormat: 'YYYY-MM-DD' },
  },
]
```

### Custom registration and spelling errors

`TableControlValueType` provides built-in key suggestions while accepting custom strings. Each custom name must match a registry key. Factory registries are read-only, so create a new registry with object spread:

```ts
import { h } from 'vue'
import UserPicker from './UserPicker.vue'
import type { TableControls, TableQueryField } from '@vtable-guild/vtable-guild'

// controls is the built-in registry above. This UserPicker uses the modelValue protocol.
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
  { name: 'owner', label: 'Owner', valueType: 'userPicker' },
]
```

Pass `businessControls` as the `controls` prop of `VTableQuery`. Call `context.onChange(value)` to update the current draft. A custom LightFilter control can set `renderer.lightFilter.formatValue(context)` to render its selected-value summary. Standalone popups wait for confirmation by default. Use `submitOnChange` to submit immediately and `closeOnChange` to control whether the popup closes after submission. Use `context.lightFilter?.getPopupContainer` to mount any nested control menus inside the filter popup.

An unregistered name, such as `sleect` instead of `select`, falls back to `controls.text`. If `text` is also missing, there is no default control to render. The component does not automatically register a control or raise a validation error for a spelling mistake. The open `TableControlValueType` also accepts arbitrary strings; use `satisfies TableBuiltinControlValueType` when a configuration must accept built-in keys only.

### Difference from cell display types

| Configuration                                           | Registry    | Purpose                                                        |
| ------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `TableQueryField.valueType` / column `search.valueType` | `controls`  | Selects a query input using `TableControlValueType`            |
| Column `editor.valueType`                               | `controls`  | Selects an editing input with the same control types           |
| Column `valueType`                                      | `renderers` | Selects a cell display, such as formatted money, dates or tags |

The `money` display type formats an amount, and the `money` query control uses a number input. `deriveTableQueryFields` uses `select` for columns with a nonempty `valueEnum`, `digit` for `digit / money` columns, the same key for date and time types, and `text` for other types. Set `search.valueType` to override the result. For example, a column can display `date` and query with `dateRange`.

## Explicit schema and column derivation

A schema field's `name` maps to a top-level key of the query draft. `valueType` selects the control and `fieldProps` configures the host props; `fieldProps / hidden / disabled / readonly` can be callbacks that read the whole draft. Inside a LightFilter popup, these callbacks include pending edits so dependent fields appear or disappear immediately. Confirmation submits the edits together; dismissal discards them.

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
  { dataIndex: 'name', title: 'Name', visible: false, search: { order: 1 } },
  {
    dataIndex: 'range',
    title: 'Date',
    valueType: 'date',
    search: { valueType: 'dateRange', order: 2 },
  },
  {
    dataIndex: 'status',
    title: 'Status',
    valueEnum: new Map([[1, 'In progress']]),
    search: { order: 3 },
  },
]
const fields = deriveTableQueryFields(columns)
```

Pass `columns` directly to `VTableQuery`, or pass `fields` to supply an explicit schema. `search: false` and `hideInSearch: true` exclude a column. `search.hidden` controls visibility and `search.order` controls order. The table's `visible / responsive` options control column display.
You can also use the helper's second argument to override the config by name, or pass false to exclude a field. A nested array `dataIndex` does not infer the query param automatically and needs an explicit `search.name`; grouped columns are expanded recursively, and only the first field with a given name is kept.

`valueEnum` derives select options automatically only from string labels, and preserves the string, number and boolean identity of Map keys; numeric, boolean and VNode labels are not converted automatically, so use explicit options or the field slot instead.

## Hidden fields, collapsed fields and reset

- The default `preserve: true` keeps hidden fields and collapsed QueryFilter fields in the submitted parameters.
- `:preserve="false"` omits those fields from the request and retains the values in the draft. Omitted fields skip their individual `fieldTransforms`.
- Expanding or collapsing QueryFilter changes the display only. LightFilter `secondary` fields still participate in the query while the popup is closed.
- QueryFilter reset restores `defaultValues` and clears host validation feedback in native mode. It then runs the custom `validate` callback and calls `onReset` once, falling back to `onSubmit` if `onReset` was omitted.

## Host validation runs before the query

Native mode automatically validates the host form when the search button, Enter or the component's `submit()` method runs. Failed validation blocks the request and the host `FormItem` displays its feedback. Define form-wide rules in `formProps.rules` or field-specific rules in `search.formItemProps.rules`. By default, validation includes non-hidden fields, including collapsed fields; with `preserve: false`, it includes only currently displayed fields. Reset restores defaults and clears validation feedback without requiring those defaults to pass host rules.

```ts
const columns: TableQueryColumn<Values>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
    search: {
      formItemProps: {
        tooltip: 'Supports partial matches',
        rules: [{ required: true, message: 'Enter a name' }],
      },
      fieldProps: { placeholder: 'Enter a name', allowClear: true },
    },
  },
]
```

When `validate(values, { fields, action, signal })` returns false or throws, the request is blocked. values is a snapshot and fields contains the fields that are not hidden; repeated calls while the same action is pending share the result. An input change or the component unmounting invalidates the old validation, so a stale result never submits a newer draft.

In native mode, host validation runs before this callback. If your application already wraps the query area in its own `Form`, use the built-in integration shown below.

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

When your own host Form wraps the query area, use built-in mode with `rootTag="div"` to avoid nesting forms. `errors` accepts error text indexed by field name; when the host FormItem already shows the errors, it can take care of the feedback.
Query rules and editing rules are provided separately, and query fields do not inherit required from editing automatically. The concrete rules, cross-field relations and validation messages are still provided by the host form or the application's validate.

## Query state and requests

Connect requests through `useTableQuery({ onSubmit, onReset })`. With `useTableRequest`, pass `request.submit` and `request.reset` respectively. Use the `submitted` and `reset` events to observe the result. To update several fields together, edit `query.draft` and then call the component's `submit()` once.

The component instance exposes `submit()`, `reset()` and `cancel()`. The first two return `Promise<boolean>`. The last cancels host validation and keeps the draft editable. `useTableRequest` manages requests already sent to the server.

## Dictionaries, dependencies and application controls

A field's `dictionary` takes the return value of [`useTableDictionary`](/en/guide/dictionary); the component wires up options, loading, error and search, and fills in the labels of selected values from valueEnum. Several query fields or table displays can share one dictionary instance.

```ts
const teams = useTableDictionary({
  dictionary: teamDictionary,
  params: () => ({ region: query.draft.value.region }),
  selectedOptions: selectedTeamLabels,
  debounceTime: 200,
})
const fields = [{ name: 'team', label: 'Team', valueType: 'select', dictionary: teams }]
```

A dependency change refreshes the candidate options and **does not clear the application's selection automatically**. When downstream conditions need to be cleared, the application modifies the draft explicitly; existing values should not be cleared out of nowhere, even when the options have not loaded yet. An explicit `options` config takes precedence over the dictionary's candidate options.
`controls` is a table-level, read-only registry; add a key to register an application control. The `field` slot receives `{ field, values, control, layoutType }`; calling `control.onChange(value)` enters the same update / debounce protocol, and `control.onSearch(keyword)` connects to the dictionary search.

The `actions` slot receives `{ submit, reset, submitting, collapsed, toggleCollapsed, showCollapseButton }`. Set `type="button"` on custom native buttons so that they do not trigger the form's default submit.

## API

### VTableQuery Props

<!-- @api: reference schema-query-props -->

### TableQueryField

<!-- @api: reference schema-query-fields -->

### VTableQuery Slots

<!-- @api: reference schema-query-slots -->

## Theming and layout

In the built-in grid, `labelWidth` sets the label width. It defaults to 80px and also accepts `'auto'`. The grid's `searchGutter` accepts a horizontal gap or `[horizontal, vertical]`, with 24px as the default gap. Set `fieldProps.style.width` to size a host control within its field.

Override query area classes with the instance's `ui` or global `theme.query.slots`. The selected preset supplies the query area and popup styles, and the host UI library styles its own inputs.

`QueryFilter` animates its height when expanding or collapsing, with a default duration of 180ms. Adjust the duration and easing with `--vtg-query-motion-duration` and `--vtg-query-motion-easing`; set the duration to `0s` to disable the animation. The component also respects the system's reduced-motion preference.

### ui slots

<!-- @api: ui schema-query -->

### Preset defaults

<!-- @api: theme schema-query -->

### CSS variables

<!-- @api: css-vars schema-query -->

A full ProForm, ModalForm, DrawerForm or CRUD page engine is outside the scope of this adapter layer.

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#QuerySchemaProtocol

:::
