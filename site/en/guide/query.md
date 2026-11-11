# Query submission and reset

When you need controls and a responsive layout generated from a schema or the column config, use the optional [Schema query](/en/guide/schema-query). It reuses the state protocol described on this page and can call the host form's validation first.

`useTableQuery` gives an existing form a draft, a submitted snapshot, field transforms and the expand / collapse state. Inputs, date ranges and layout keep using the Ant Design Vue or Element Plus your project already integrates; the composable does not generate a form from columns.

The query interaction is aligned with the [Ant Design ProTable search form](https://github.com/ant-design/pro-components/blob/master/site/components/table.md): input changes do not query on their own, and every click on search or reset sends a request; field transforms correspond to `search.transform`, whole-request transforms keep using `useTableRequest.beforeSearchSubmit`, and the expanded state corresponds to `collapsed / onCollapse`. Here the form state is split out into a Vue composable, while the controls and form validation are left to the host UI library.

The example below uses native inputs so that the docs site does not depend on a whole extra UI library. In a real project you can replace `input` with `a-input` / `el-input` and the range field with the host DatePicker; just bind the same `draft` and submit methods. The two presets do not need different data protocols.

<Demo src="query/basic">

<<< @/demos/query/basic.vue

</Demo>

## Draft and submitted params

Bind the controls to `draft`. Editing the draft, toggling `collapsed` and calling `resetFields()` never send a request. Only `submit()` / `reset()` invoke a callback, and each call invokes exactly one callback.

```ts
const table = useTableRequest<Row, Params>({
  request,
  manualRequest: true,
})
const query = useTableQuery<FormValues, Params>({
  defaultValues: { keyword: '', range: undefined },
  fieldTransforms: {
    range: (range) => range && { start: range[0], end: range[1] },
  },
  transform: (params) => ({ ...params, keyword: params.keyword?.trim() }),
  onSubmit: (params) => table.submit(params),
  onReset: (params) => table.reset(params),
})
```

`submitted` holds a snapshot of the form values from the most recent successful transform, and `params` holds the snapshot of the corresponding request fields; both are published before `onSubmit` / `onReset` is called and are `undefined` until the first successful transform. Plain objects, arrays and Dates are snapshotted independently between the draft, the default values and the callback arguments. Do not use custom class instances with internal mutable state as form values.

A failed submit does not roll the draft back automatically. When a transform throws, the previous `submitted` / `params` are kept; when the callback throws or the Promise it returns rejects, the snapshots already published for this call are not rolled back, so read the error from `error` and retry. `submit()` / `reset()` return `Promise<boolean>`: `true` when the current call completes successfully, and `false` when a transform or the callback fails, when the call is superseded by a newer submit or when the scope has already been disposed. The failure of a stale callback does not overwrite the error state of a newer submit.

`onSubmit` / `onReset` receive only the transformed params and the form snapshot; they are not given an `AbortSignal`. Cancelling a standalone request callback is managed by the application; once connected to `useTableRequest`, the request manager handles the cancellation when a new request supersedes an old one.

`useTableRequest` itself reports network errors through `error` and settles its Promise normally, so in the combined setup you should still read the request result from `table.error`; the query's return value only reflects how the query transforms and the callback ran.

## Field param transforms

1. Fields without a `fieldTransforms` entry keep their original key and value.
2. Fields with a transform have their original key removed; the function can return several request fields, or return `undefined` to omit the field.
3. All field transforms are merged in the key order of the config and override untransformed fields of the same name; later transforms override earlier results.
4. Finally the overall `transform(params, values)` is called, which suits uniform processing such as trimming and removing empty values.

Field transforms run only on submit and reset. Collapsing the form changes only the layout state, and the fields in the collapsed area still take part in the submit; whether to clear or omit them is decided by the application's field transforms.

Once connected to `useTableRequest`, its param merge order is still `defaultParams`, the params of this submit, then the extra `params`, after which `beforeSearchSubmit` runs. The pagination fields are written by the request manager. Avoid putting the same param in both the reactive extra `params` and the draft; otherwise a change to the extra param still triggers a request under the request manager's protocol.

## Reset conventions

<!-- @api: reference query-reset -->

`reset()` does not change the expanded state, row selection, tree node expansion or column preferences; the application handles those per scenario. `defaultValues` is snapshotted at creation, so later external changes do not alter the reset baseline.

`useTableQuery` itself does not send a first request. To load the default query initially, use `manualRequest: true` and call `query.submit()` once after initialization; avoid having the request manager load automatically while you also submit the default values manually.

When created inside a component `setup` or an `effectScope`, disposing the scope stops the watcher on the expanded state, clears the submitting state and ignores the results of stale callbacks; submits and resets after that return `false`. The query protocol is not responsible for cancelling application requests made inside the callbacks; once connected to `useTableRequest`, the request manager cancels them when the same scope is disposed. Do not create query state that has to be released with the page at the top level of a module, where there is no scope.

## API

`TValues` is the form value type and `TParams` is the request param type, which defaults to `TValues`.

### useTableQuery options

<!-- @api: reference query-options -->

### useTableQuery return value

<!-- @api: reference query-return -->

When validation is needed, call the host form's validate first, then call `submit()` once it succeeds.

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#QueryProtocol

:::
