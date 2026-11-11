# Detail forms

Both `useTableEdit` and `useTableEditable` can connect to a controlled array of detail rows. The parent form holds the committed source records, while row input stays in the table drafts; a full submission can collect drafts that have not been saved row by row yet, including virtualized off-screen rows.

## Controlled source and drafts

```ts
const details = ref<Row[]>(initialRows)
const edit = useTableEditable<Row>({
  rowKey: 'id',
  mode: 'multiple',
  columns,
  controls,
  dataSource: details,
  onChange: (value) => {
    details.value = value
  },
})
const { records, errors, validating } = edit
```

`records` is a combined snapshot of the source records, row drafts and cached new rows; bind it directly to the table. `onChange` notifies once only after a successful row save or an add in source mode; keystroke input is not written back to the source data. Writes from the parent form or server refreshes do not overwrite local drafts that are already open. When a source record is deleted, its unfinished draft stays in records to avoid silently losing input; call cancel or reset once the application confirms discarding it.

When the controlled adapter is configured, onSave returns the canonical record from the server and onChange updates the parent source; avoid writing the same data back in both callbacks. Without the adapter, the original approach still applies: the application updates dataSource.

`getDraft(key) / getDrafts()` read the isolated editor values, and `getOriginal(key)` reads the source snapshot taken when editing started. `getValues()` combines the data currently held by the client and transforms drafts into submitted values, without triggering validation, saving or onChange. Use the result snapshot of `validateAll()` for the final submission, to avoid reading a changed copy of the data after validation.

## Submitting details at once

```ts
async function submitMaster() {
  await masterForm.value.validate()
  const result = await edit.validateAll()
  if (!result.valid) {
    const key = result.errors.keys().next().value
    if (key !== undefined) await table.value.scrollTo({ key })
    return
  }
  await saveOrder({ ...masterValues, details: result.values })
  details.value = result.values!
  edit.reset()
}
```

Mutual exclusion of external submissions, master form validation and network error messages are controlled by the application. `validateAll()` does not call onSave / onChange, nor does it close editing or change the source array; unedited source records are temporarily converted to editor values before validation, and the submission result still keeps their source values. When input, a source data change, a reset, a save or an unmount happens, the old validation returns `{ valid: false, obsolete: true }` and does not overwrite new errors; identical validations in progress are merged.

Errors are stored in `errors` under the row key and field path, so they can still be located even after the corresponding virtual row has been unmounted. `validating` indicates full validation; the per-row `savingKeys` indicate saving, and looping over save is not a substitute for pure validation. User drafts are kept when validation fails or the API submission fails.

`reset()` aborts operations and clears drafts and errors while keeping the current external source array; when resetting the master form, replace details first, then call reset. It does not run cancel callbacks or send save requests.

## Add strategies

```ts
const edit = useTableEditable<Row>({
  rowKey: 'id',
  mode: 'multiple',
  columns,
  controls,
  dataSource: details,
  onChange: (value) => {
    details.value = value
  },
  createRecord: () => ({ id: nextLocalId--, name: '', amount: 1 }),
  maxRows: 20,
})
edit.add(undefined, { position: 'top' })
edit.add(undefined, { position: 'bottom', mode: 'source' })
```

The defaults are `position: 'bottom' / mode: 'cache'`. A row added in cache mode exists only in the draft before it is saved and is removed on cancel; source mode inserts the row into the source array immediately through onChange, after which it is edited as an existing source row, and cancelling only discards the edits and keeps that source record. source mode requires dataSource and onChange to be configured together.

The `createRecord` factory creates a stable, unique key on each attempt; `maxRows` counts the current client-side source rows and cached new rows. Adding returns false when the limit is reached, the key is a duplicate, or single mode already has a row being edited. Saving an existing row cannot change its key; a cached new row can have its final key assigned by the server, but it must not conflict with the existing source.

These capabilities cover only records held by the client: rows not loaded under remote pagination cannot be validated; inserting nested tree nodes is handled by the application; server-side batch atomicity, undo history and spreadsheet navigation are not part of this protocol.

A complete demo for both presets is in the playground at `/#/pro-schema`, covering the master form, locating validation errors, keeping drafts when saving fails, adding at the top or bottom and the virtual body.

## API

Detail forms use the following options and return values of `useTableEdit` / `useTableEditable`; for the rest, see [Editing](/en/guide/editing#api).

### Options

<!-- @api: reference detail-form-options -->

### Return value

<!-- @api: reference detail-form-return -->

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#EditingProtocol

:::
