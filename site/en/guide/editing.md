# Editing

To reduce per-column control binding code, use [Column editors](/en/guide/editable-columns); for submitting all detail rows at once from a master form, validating virtualized off-screen rows and controlled row addition, see [Detail forms](/en/guide/detail-form). The rest of this page keeps the hand-written slots and the basic row draft protocol.

vtable-guild supports cell editing and whole-row editing through the `bodyCell` slot. `useTableEdit` manages drafts stored by stable row key, validation and asynchronous saving; the editors directly use the Ant Design Vue, Element Plus or form controls your project already has.

## Editing state and validation protocol

`useTableEdit` aligns with the [editing protocol of EditableProTable](https://procomponents.ant.design/components/editable-table/): `editableKeys` holds the rows currently being edited; editing ends once a save completes, and the draft is kept when validation or saving fails; the draft is discarded after `onCancel` completes. `add()` corresponds to a cached new row, which disappears when cancelled. The add button and the action column are composed by the application.

<Demo src="editing/protocol">

<<< @/demos/editing/protocol.vue

</Demo>

```ts
const edit = useTableEdit<Member>({
  rowKey: 'key',
  mode: 'multiple',
  validate: (draft) =>
    draft.name.trim() ? undefined : { fields: { name: 'Please enter a name' } },
  onSave: async (draft, { key, original, isNew, signal }) => {
    const saved = await api.saveMember(draft, { signal })
    // Find the existing record by key, or insert when isNew; original is the edit-start snapshot.
    updateDataSource(saved, { key, isNew, original })
    return saved // Returning true / void also accepts the draft; returning false keeps editing.
  },
})
```

`context` contains `key / original / isNew / signal`. For a new row, `original` is `undefined`; an existing record keeps the same row key while it is being edited and saved, and a new row can use the new key assigned by the server in the save result.

While the user is typing, call only `setDraft()`; do not directly modify the source data or the return value of `getDraft()`. Repeated calls for the same row during a save reuse the same Promise and do not call `onSave` again. Cancelling or updating the draft aborts the old task, and a stale success or failure cannot close the new draft; disposing the component scope cleans up all tasks. Asynchronous application callbacks must still pass on and check `signal`, to keep an already cancelled request from writing back to application data.

The editing state lives in the composable, so drafts are not lost when virtual rows are unmounted off-screen. Pagination, refreshing and data replacement do not cancel drafts automatically either; the application needs to call `cancel / cancelAll` explicitly when leaving the page, switching datasets or deleting records.

This protocol does not include a React Form instance, automatic editor generation, delete confirmation or whole-table transactions; connect existing controls such as `a-input / el-input` to the same draft through `bodyCell` and it works with both presets.

## Cell editing

Click any cell to start editing. The input first stays in a separate draft; press Enter or move focus away to commit, and press Escape to discard. Enter handling skips the IME candidate selection stage.

<Demo src="editing/cell">

<<< @/demos/editing/cell.vue

</Demo>

The editing state in the example is located by the stable `rowKey` together with the column's `dataIndex`. Clicking "Reverse and replace data" creates new record objects and changes their order; the cell being edited still follows the same record and does not end up on another row because the row index changed.

The input maintains a local draft and does not modify `dataSource` directly on every keystroke. This matters especially for table re-rendering: it keeps the cursor from jumping because the editor updates repeatedly while you type.

## Whole-row editing

Whole-row editing copies a row-level draft when editing starts. After several fields have been changed, "Save" writes them back at once; "Cancel" only clears the draft and does not pollute the source record.

<Demo src="editing/row">

<<< @/demos/editing/row.vue

</Demo>

The example uses native `input` and `select`, so it runs both on the docs site and in the source Playground. In a real project you can replace them in place with `a-input`, `el-input`, Select, DatePicker or your existing form field components; the table does not restrict the editor type.

The example annotates the columns as `TableColumnsType<MemberRow>`, and the context of `#bodyCell` corresponds to `TableBodyCellSlotProps<MemberRow>`. In it, `record` is `MemberRow`, `text` is `unknown` and `column.dataIndex` is `DataIndex | undefined`; the `isEditableField` in the example checks the field name first, then reads or writes the draft. The draft type belongs to application code; see the declarations at the end of the page for the table's public slot types.

## Implementation principles

- Always set `row-key="key"` and store the editing state by stable row key; do not use the row index at render time.
- Identify the field with `dataIndex`; on commit, look up the record by row key, so the value is not written to another row even when the data is reordered or replaced.
- Cell input writes to a local draft first and commits to `dataSource` only on Enter or blur.
- The Enter event checks both `event.isComposing` and the composition state, to avoid saving early while a Chinese IME is selecting a candidate.
- Whole-row editing copies the record into a draft, commits it as a whole on Save and simply discards it on Cancel.

## Capability boundaries

`useTableEdit` already provides the row-level state, validation and save protocol; the following are still composed by the application:

- Automatic generation of query or edit forms, and dependency linkage between fields.
- Whole-table transactional submission, undo history or a concrete HTTP service.
- Excel-style arrow keys, continuous editing with Tab and cell range selection.

If these are core requirements, compose your project's existing form solution on top of `bodyCell`; when you need a complete spreadsheet-style editing engine, a more full-featured solution such as vxe-table is a better fit.

## Virtual scrolling

Virtual scrolling keeps only the rows near the viewport. After a cell being edited leaves the viewport, its editor component may be unmounted; as long as the draft is stored by stable row key it will not leak into other records, but the application still needs to decide explicitly whether going off-screen commits automatically, cancels, or keeps the draft until the row appears again.

## API

### useTableEdit options

`context` is `{ key, original, isNew, signal }`. For `dataSource`, `onChange`, `createRecord` and `maxRows`, which are used for master form details, see [Detail forms](/en/guide/detail-form#api).

<!-- @api: reference editing-options -->

### useTableEdit return value

For `records`, `validateAll`, `getValues` and the others related to full validation and the submission snapshot, see [Detail forms](/en/guide/detail-form#api).

<!-- @api: reference editing-state -->

### VTable Props

<!-- @api: props editing -->

## Theming

The styles below are used by the column-level `VTableEditCell`. Editing controls you render yourself through `bodyCell` use the styles of the host UI library; see [Column editors](/en/guide/editable-columns).

### ui slots

<!-- @api: ui editing -->

### Preset defaults

<!-- @api: theme editing -->

### CSS variables

<!-- @api: css-vars editing -->

## Type Declarations

Editing uses the public `bodyCell` slot and the column field path types; `TRecord` is the application row type. The column configuration is an excerpt of the relevant fields; `MergedColumnFields` is a documentation helper interface, not a package export. See the [Type reference](/en/guide/type-reference) for the full column configuration and slot declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#EditingProtocol

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/table.ts#DataIndex

<<< @/.vitepress/type-declarations/features.ts#MergedColumnFields

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

:::

## Related pages

- [Custom rows and slots](/en/guide/api-wiring-and-slots)
- [Virtual scrolling](/en/guide/virtualization)
- [API Reference](/en/guide/api-reference)
