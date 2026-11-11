# Schema query area and light filtering

`VTableQuery` handles the fields, the control wiring and the layout of the query area; [`useTableQuery`](/en/guide/query) keeps handling the draft, transforms, submit and reset.
It is a standalone, optional component that can sit above a table or be used on pages that only show a list. The base table never creates a form automatically.

<Demo src="query/schema">

<<< @/demos/query/schema.vue

</Demo>

## Registering controls from your existing UI library

Pass the host components your application has already installed to the adapter factory; the library does not import another UI library. The first batch of controls includes `text / select / digit / date / dateTime / dateRange / dateTimeRange / time`.

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

Element Plus uses `createElementPlusTableControls({ Input: ElInput, Select: ElSelect, Option: ElOption, InputNumber: ElInputNumber, DatePicker: ElDatePicker, TimePicker: ElTimePicker })`.
Dates use strings by default through the host `valueFormat`, which the application can adjust with `fieldProps.valueFormat`. Query and editing can share the same registry, but each has its own field rules and value transforms.

## Explicit schema and column derivation

A schema field's `name` maps to a top-level key of the query draft. `valueType` selects the control and `fieldProps` configures the host props; `fieldProps / hidden / disabled / readonly` can be callbacks that read the whole draft.

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
  { dataIndex: 'name', title: 'Name', visible: false, query: { order: 1 } },
  {
    dataIndex: 'range',
    title: 'Date',
    valueType: 'date',
    query: { valueType: 'dateRange', order: 2 },
  },
  {
    dataIndex: 'status',
    title: 'Status',
    valueEnum: new Map([[1, 'In progress']]),
    query: { order: 3 },
  },
]
const fields = deriveTableQueryFields(columns)
```

The table's `visible / responsive` have nothing to do with whether a field shows in the query; `query: false` on a column excludes the query field, `query.hidden` decides the query visibility and `query.order` decides the query order. A table `date` can therefore map to a query `dateRange`.
You can also use the helper's second argument to override the config by name, or pass false to exclude a field. A nested array `dataIndex` does not infer the query param automatically and needs an explicit `query.name`; grouped columns are expanded recursively, and only the first field with a given name is kept.

`valueEnum` derives select options automatically only from string labels, and preserves the string, number and boolean identity of Map keys; numeric, boolean and VNode labels are not converted automatically, so use explicit options or the field slot instead.

## Hiding, collapsing and reset

- `hiddenPolicy="preserve"` is the default. A hidden control keeps its draft value, and the field is still included on submit.
- `hiddenPolicy="omit"` omits only the fields with `hidden: true` in the schema. The draft and the submitted snapshot still keep the field, and its field transform does not run; the overall `transform` is the application's last step and can still produce other params explicitly.
- Collapsing only changes the layout and never omits the conditions in the collapsed area. `collapsedCount` defaults to 3, the expanded state reuses `query.collapsed` directly, and `:collapsible="false"` shows every field that is not hidden.
- Reset first restores `defaultValues`, then runs `query.reset()` based on the visibility after the reset and on the host validation; one operation calls `onReset` once (onSubmit when it is not provided). Reset does not trigger an extra light auto-submit.

## Host validation runs before the query

When `validate(values, { fields, action, signal })` returns false or throws, the request is blocked. values is a snapshot and fields contains the fields that are not hidden; repeated calls while the same action is pending share the result. An input change or the component unmounting invalidates the old validation, so a stale result never submits a newer draft.

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

When a host Form wraps the query area, use `rootTag="div"` to avoid nesting native forms. `errors` accepts error text indexed by field name; when the host FormItem already shows the errors, it can take care of the feedback.
Query rules and editing rules are provided separately, and query fields do not inherit required from editing automatically. The concrete rules, cross-field relations and validation messages are still provided by the host form or the application's validate.

## Light mode and single submission

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

The regular form layout always submits explicitly; the light layout also submits explicitly by default. Only when `layout="light"` and `autoSubmit` is true does a control update schedule one debounced submit. Repeated updates with the same value do not submit, clicking search cancels the pending debounce and clicking reset cancels the old automatic task.

Changing layout, autoSubmit or disabled cancels automatic tasks that have not run yet; turning it back on does not replay the old task, and scheduling only resumes with the next control update.
Modifying query.draft directly does not request automatically; for cross-field linkage, change several fields first and then call the component's submit explicitly, so that the linkage chain does not trigger several queries. The component's `submitted / reset` events are only result notifications; do not call the request again in these events.

The `TableQueryInstance` instance provides `submit(): Promise<boolean>`, `reset(): Promise<boolean>` and `cancel()`. cancel cancels the component's automatic task and the host validation without clearing the application draft; server requests that have already been submitted are cancelled by useTableRequest.

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
`controls` is a table-level, read-only registry; add a key to register an application control. The `field` slot receives `{ field, values, control }`; calling `control.onChange(value)` enters the same update / debounce protocol, and `control.onSearch(keyword)` connects to the dictionary search.

The `actions` slot receives `{ submit, reset, submitting, collapsed, toggleCollapsed }`. Set `type="button"` on custom native buttons so that they do not trigger the form's default submit.

## API

### VTableQuery Props

<!-- @api: reference schema-query-props -->

### TableQueryField

<!-- @api: reference schema-query-fields -->

### VTableQuery Slots

<!-- @api: reference schema-query-slots -->

## Theming and layout

The default is a responsive grid; the light layout uses compact fields and an action area that can wrap.
Override it with the per-instance `ui` or the global `theme.query.slots`; the host controls themselves are styled by their own UI library.

The default classes for the layout, validation feedback and action area are provided by the presets.

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
