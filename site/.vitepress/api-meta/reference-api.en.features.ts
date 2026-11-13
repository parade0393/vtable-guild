import type { ReferenceApiTable } from './types'

// English counterpart of the tables in reference-api.ts: same ids, same rows in the same order.
// Rows that contain only a field name reuse the metadata in table.ts (`descriptionEn`).
export const referenceApiTablesEnFeatures = {
  'pagination-slot-props': {
    headers: ['Field', 'Type', 'Description'],
    rows: [
      ['`name`', '`string`', "Name from `{ slot: 'name' }`."],
      ['`current`', '`number`', 'Current page.'],
      ['`pageSize`', '`number`', 'Page size.'],
      ['`total`', '`number`', 'Record count.'],
      ['`pageCount`', '`number`', 'Page count, the same one the built-in pager uses.'],
      [
        '`range`',
        '`readonly [number, number]`',
        'Range of the current page, one-based, matching `showTotal`.',
      ],
      [
        '`disabled`',
        '`boolean`',
        'Whether pagination is disabled; bind this to application buttons as needed.',
      ],
      [
        '`position`',
        "`Exclude<TablePaginationPosition, 'none'>`",
        'Actual pager position, such as `topLeft` or `bottomRight`.',
      ],
      [
        '`region`',
        "`'inline' \\| 'left' \\| 'right'`",
        'Region it sits in, within an array layout or a left / right split.',
      ],
    ],
  },
  'pagination-config': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      ['`current`', '`number`', '-', 'Controlled page.'],
      ['`defaultCurrent`', '`number`', '`1`', 'Initial page.'],
      ['`pageSize`', '`number`', '-', 'Controlled page size.'],
      ['`defaultPageSize`', '`number`', '`10`', 'Initial page size.'],
      [
        '`total`',
        '`number`',
        '-',
        'Record count; when omitted or not a positive integer, the processed root record count is used.',
      ],
      [
        '`disabled`',
        '`boolean`',
        '`false`',
        'Disable pagination interaction; slicing still applies.',
      ],
      [
        '`hideOnSinglePage`',
        '`boolean`',
        '`false`',
        'Hide the pager when there is one page; a total of 0 always hides it.',
      ],
      [
        '`showSizeChanger`',
        '`boolean`',
        '-',
        'Show the page-size changer; when unset it appears once the total exceeds the threshold in the next row.',
      ],
      [
        '`totalBoundaryShowSizeChanger`',
        '`number`',
        '`50`',
        'Total above which the page-size changer appears automatically.',
      ],
      [
        '`pageSizeOptions`',
        '`(string \\| number)[]`',
        '10, 20, 50, 100',
        'Page-size options; the current size is still shown when it is not listed.',
      ],
      [
        '`buildOptionText`',
        '`(option: { value: string \\| number }) => VNodeChild`',
        '-',
        'Custom content for page-size options.',
      ],
      [
        '`showQuickJumper`',
        '`boolean \\| { goButton?: VNodeChild }`',
        '`false`',
        'Quick jumper. Submits on Enter or blur; with `goButton`, blur does not submit.',
      ],
      [
        '`showTotal`',
        '`(total: number, range: [number, number]) => VNodeChild`',
        '-',
        'Show the total; the range is one-based and `[0, 0]` for empty data.',
      ],
      ['`size`', "`'default' \\| 'small'`", 'follows table size', 'Pager size.'],
      ['`simple`', '`boolean`', '`false`', 'Simple mode with an input instead of the page list.'],
      ['`showLessItems`', '`boolean`', '`false`', 'Use a smaller page window.'],
      [
        '`pagerCount`',
        '`number`',
        '-',
        'Number of page buttons, an odd integer from 5 to 21; takes precedence over `showLessItems`. See [page window](/en/guide/pagination#page-button-count).',
      ],
      [
        '`responsive`',
        '`boolean`',
        '`false`',
        'When `size` is not set, use the compact size on viewports narrower than 576px.',
      ],
      [
        '`itemRender`',
        '`(item: { page: number; type: PaginationItemType; originalElement: VNodeChild }) => VNodeChild`',
        '-',
        'Custom page and navigation buttons; `type` is `page`, `prev`, `next`, `jump-prev` or `jump-next`.',
      ],
      [
        '`position`',
        '`TablePaginationPosition[]`',
        'bottom right',
        "Pager positions, `['bottomRight']` by default; top and bottom can both be used. `['none']` hides the pager but keeps pagination.",
      ],
      [
        '`layout`',
        '`TablePaginationLayout`',
        'preset layout',
        'Ordered array or `{ left, right }`; see [composable layouts](/en/guide/pagination#composable-layouts-and-content-slots).',
      ],
      [
        '`locale`',
        '`object`',
        '-',
        'Pagination text overrides; fields are listed in the [type declarations](/en/guide/pagination#type-declarations).',
      ],
      ['`class`', '`string`', '-', 'Class for the pagination area.'],
      ['`style`', '`CSSProperties`', '-', 'Inline style for the pagination area.'],
      [
        '`onChange`',
        '`(page: number, pageSize: number) => void`',
        '-',
        'Called on page changes, page-size changes and page resets caused by filtering.',
      ],
      [
        '`onShowSizeChange`',
        '`(current: number, size: number) => void`',
        '-',
        'Called when the page size changes.',
      ],
      [
        '`onUpdate:current`',
        '`(current: number) => void`',
        '-',
        'Update notification for the controlled page.',
      ],
      [
        '`onUpdate:pageSize`',
        '`(pageSize: number) => void`',
        '-',
        'Update notification for the controlled page size.',
      ],
    ],
  },
  'selection-alert-props': {
    headers: ['Prop', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`selectedRowKeys`',
        '`readonly Key[]`',
        'Required',
        'Controlled selected keys; the count is computed from them alone. Use with `v-model:selected-row-keys`.',
      ],
      [
        '`selectedRows`',
        '`readonly TRecord[]`',
        '`[]`',
        'Selected records the application currently holds; may be fewer than the keys.',
      ],
      ['`alwaysShow`', '`boolean`', '`false`', 'Keep the alert visible when nothing is selected.'],
      ['`showClear`', '`boolean`', '`true`', 'Whether to show the default clear action.'],
      [
        '`disabled`',
        '`boolean`',
        '`false`',
        'Disable built-in actions and pass the disabled state to application slots.',
      ],
      [
        '`loading`',
        '`boolean`',
        '`false`',
        'Loading state of the batch action; also disables clearing.',
      ],
      [
        '`locale`',
        '`object`',
        '-',
        'Per-instance text overrides; fields are listed in [Themes and locales](/en/guide/selection-alert#themes-and-locales).',
      ],
      [
        '`ui`',
        '`object`',
        '-',
        'Per-instance slot class overrides; available slots are listed in [ui slots](/en/guide/selection-alert#ui-slots).',
      ],
      ['`class`', '`string`', '-', 'Class for the root element.'],
    ],
  },
  'selection-alert-events': {
    headers: ['Event', 'Payload', 'Description'],
    rows: [
      [
        '`update:selectedRowKeys`',
        '`(keys: Key[]) => void`',
        'Requests an update of the selected keys; the payload is `[]` when clearing.',
      ],
      [
        '`clear`',
        '`(selectedRowKeys: readonly Key[], selectedRows: readonly TRecord[]) => void`',
        'Emitted after clear is clicked; the payload holds the keys and available records from before clearing.',
      ],
    ],
  },
  'selection-alert-slots': {
    headers: ['Slot', 'Payload type', 'Description'],
    rows: [
      [
        '`info`',
        '[`TableSelectionAlertSlotProps<TRecord>`](/en/guide/selection-alert#slot-props)',
        'Replaces the count text on the left.',
      ],
      [
        '`actions`',
        '[`TableSelectionAlertSlotProps<TRecord>`](/en/guide/selection-alert#slot-props)',
        'Application actions on the right, next to the default clear action.',
      ],
    ],
  },
  'selection-alert-slot-props': {
    headers: ['Field', 'Type', 'Description'],
    rows: [
      ['`selectedRowKeys`', '`readonly Key[]`', 'Snapshot of the selected keys.'],
      ['`selectedRows`', '`readonly TRecord[]`', 'Snapshot of the available records.'],
      ['`count`', '`number`', 'Number of keys.'],
      ['`disabled`', '`boolean`', '`disabled \\|\\| loading`.'],
      ['`loading`', '`boolean`', 'Current loading state.'],
      [
        '`clear`',
        '`() => void`',
        'The same controlled update request as the default clear action.',
      ],
    ],
  },
  'toolbar-props': {
    headers: ['Prop', 'Type', 'Default', 'Description'],
    rows: [
      ['`title`', '`VNodeChild`', '-', 'Title; the `#title` slot can be used instead.'],
      [
        '`columns`',
        '[`TableColumnsType<TRecord>`](/en/guide/type-reference#columnstype)',
        '-',
        'Controlled column config shared with the table; use with `v-model:columns`. Column settings are hidden when omitted.',
      ],
      [
        '`size`',
        "`'large' \\| 'middle' \\| 'small'`",
        'follows table theme',
        'Density shared with the table; use with `v-model:size`.',
      ],
      [
        '`options`',
        '`false \\| TableToolbarOptions`',
        '-',
        'Built-in tool switches; see the [options](/en/guide/toolbar#options). `false` turns off all built-in tools.',
      ],
      [
        '`loading`',
        '`boolean`',
        '`false`',
        'Loading state of the reload button; reload, search submission and clearing are disabled meanwhile.',
      ],
      [
        '`search`',
        '`boolean \\| TableToolbarSearchConfig`',
        '`false`',
        'Enable the built-in search; see the [options](/en/guide/toolbar#search).',
      ],
      [
        '`searchValue`',
        '`string`',
        '-',
        'Search input draft. Controlled when passed, use with `v-model:search-value`; held by the component when omitted.',
      ],
      ['`multipleLine`', '`boolean`', '`false`', 'Move the `filter` slot to its own row.'],
      [
        '`disabled`',
        '`boolean`',
        '`false`',
        'Disable built-in actions and pass the disabled state to slots.',
      ],
      [
        '`fullscreenTarget`',
        '`() => HTMLElement \\| null \\| undefined`',
        'enclosing table',
        "Element that enters full screen; defaults to the root element of the enclosing table. Pass it when the toolbar is outside the table's `title` / `footer` slots, or when content outside the table should be included.",
      ],
      [
        '`columnSettings`',
        '`object`',
        '-',
        'Config for the embedded column settings panel; see the [options](/en/guide/toolbar#columnsettings).',
      ],
      [
        '`locale`',
        '`object`',
        '-',
        'Per-instance text overrides; fields are listed in [Themes and locales](/en/guide/toolbar#themes-and-locales).',
      ],
      [
        '`ui`',
        '`object`',
        '-',
        'Per-instance slot class overrides; available slots are listed in [ui slots](/en/guide/toolbar#ui-slots).',
      ],
      ['`class`', '`string`', '-', 'Class for the root element.'],
    ],
  },
  'toolbar-options': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      ['`reload`', '`boolean`', '`true`', 'Show the reload button.'],
      ['`density`', '`boolean`', '`true`', 'Show the density switch.'],
      [
        '`setting`',
        '`boolean`',
        '`true`',
        'Show the column settings entry; hidden when `columns` is not passed.',
      ],
      ['`fixed`', '`boolean`', '`true`', 'Pin buttons in the column settings panel.'],
      ['`draggable`', '`boolean`', '`true`', 'Drag reordering in the column settings panel.'],
      [
        '`fullScreen`',
        '`boolean`',
        '`false`',
        'Show the full screen button. For the full screen target, see [`fullscreenTarget`](/en/guide/toolbar#fullscreen).',
      ],
    ],
  },
  'toolbar-search-config': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`placeholder`',
        '`string`',
        'follows locale',
        'Placeholder and accessible name of the input; defaults to `searchPlaceholder` from the locale.',
      ],
      ['`clearable`', '`boolean`', '`true`', 'Show the clear icon when the input has content.'],
    ],
  },
  'toolbar-column-settings': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      ['`locale`', '`object`', '-', 'Text overrides for the column settings panel.'],
      [
        '`ui`',
        '`object`',
        '-',
        'Slot class overrides for the column settings panel; available slots are listed in [ui slots](/en/guide/toolbar#ui-slots).',
      ],
      ['`class`', '`string`', '-', 'Class for the container of the column settings triggers.'],
      [
        '`getPopupContainer`',
        '`(trigger: HTMLElement) => HTMLElement`',
        '-',
        'Mount container for the density menu and the column settings panel, `document.body` by default. In browser full screen they mount inside the full screen element by default; a custom function should return one of its descendants.',
      ],
    ],
  },
  'toolbar-events': {
    headers: ['Event', 'Payload', 'Description'],
    rows: [
      [
        '`update:columns`',
        '`(columns: TableColumnsType<TRecord>) => void`',
        'Column visibility, pinning or order changed.',
      ],
      ['`update:size`', "`(size: 'large' \\| 'middle' \\| 'small') => void`", 'Density changed.'],
      [
        '`reset`',
        '`() => void`',
        '"Reset" was clicked in the column settings panel; only the initial column visibility is restored.',
      ],
      ['`reload`', '`() => void`', 'Reload was clicked. The component does not issue a request.'],
      [
        '`update:searchValue`',
        '`(value: string) => void`',
        'The search input draft changed; this is not a submission.',
      ],
      [
        '`search`',
        '`(value: string) => void`',
        'Search submitted by pressing Enter or clicking the search button or the clear icon. `value` is an empty string when clearing.',
      ],
      [
        '`clearSearch`',
        '`() => void`',
        'The clear icon was clicked; `search` is emitted next with an empty string.',
      ],
      [
        '`fullscreenChange`',
        '`(active: boolean) => void`',
        'Emitted after the browser confirms entering or leaving full screen, including leaving with Escape.',
      ],
      [
        '`fullscreenError`',
        '`(error: unknown) => void`',
        'The browser rejected the full screen request.',
      ],
    ],
  },
  'toolbar-slots': {
    headers: ['Slot', 'Payload type', 'Description'],
    rows: [
      [
        '`title`',
        '[`TableToolbarSlotProps<TRecord>`](/en/guide/toolbar#slot-props)',
        'Custom title area.',
      ],
      [
        '`actions`',
        '[`TableToolbarSlotProps<TRecord>`](/en/guide/toolbar#slot-props)',
        'Application action buttons, next to the built-in tools.',
      ],
      [
        '`settings`',
        '[`TableToolbarSlotProps<TRecord>`](/en/guide/toolbar#slot-props)',
        'Replaces the built-in tools area entirely.',
      ],
      [
        '`search`',
        '[`TableToolbarSlotProps<TRecord>`](/en/guide/toolbar#slot-props)',
        'Replaces the built-in search control.',
      ],
      [
        '`filter`',
        '[`TableToolbarSlotProps<TRecord>`](/en/guide/toolbar#slot-props)',
        'Filter controls; on the same row as the actions by default, on their own row with `multipleLine`.',
      ],
      [
        '`extra`',
        '[`TableToolbarSlotProps<TRecord>`](/en/guide/toolbar#slot-props)',
        'Extra content on a full row of its own.',
      ],
      [
        '`columnLabel`',
        '`{ column: ColumnType<TRecord> \\| ColumnGroupType<TRecord> }`',
        'Custom column labels in the column settings panel.',
      ],
    ],
  },
  'toolbar-slot-props': {
    headers: ['Field', 'Type', 'Description'],
    rows: [
      [
        '`columns`',
        '`TableColumnsType<TRecord>`',
        'Current column config; an empty array when `columns` is not passed.',
      ],
      ['`size`', "`'large' \\| 'middle' \\| 'small'`", 'Current density.'],
      ['`loading`', '`boolean`', 'Current loading state.'],
      ['`disabled`', '`boolean`', 'Current disabled state.'],
      ['`fullscreen`', '`boolean`', 'Whether the full screen target is in full screen.'],
      [
        '`fullscreenAvailable`',
        '`boolean`',
        'A full screen target exists and the browser supports full screen.',
      ],
      [
        '`reload`',
        '`() => void`',
        'Emits the `reload` event; does nothing while `disabled` or `loading`.',
      ],
      ['`toggleFullscreen`', '`() => Promise<void>`', 'Enter or leave full screen.'],
      ['`searchValue`', '`string`', 'Current search draft.'],
      ['`updateSearchValue`', '`(value: string) => void`', 'Update the search draft.'],
      [
        '`submitSearch`',
        '`(value?: string) => void`',
        'Submit the search; uses the current draft when no argument is passed.',
      ],
      ['`clearSearch`', '`() => void`', 'Clear the draft and submit an empty keyword.'],
    ],
  },
  'column-settings-props': {
    headers: ['Prop', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`columns`',
        '[`TableColumnsType<TRecord>`](/en/guide/type-reference#columnstype)',
        'Required',
        'Controlled column config; use with `v-model:columns` and pass the same columns to the table.',
      ],
      [
        '`size`',
        "`'large' \\| 'middle' \\| 'small'`",
        'follows table theme',
        'Density shared with the table; use with `v-model:size`.',
      ],
      ['`disabled`', '`boolean`', '`false`', 'Disable the entries and close any open panel.'],
      [
        '`options`',
        '`TableColumnSettingsOptions`',
        '-',
        'Entry and action switches; see the [options](/en/guide/column-display#column-settings-options).',
      ],
      [
        '`getPopupContainer`',
        '`(trigger: HTMLElement) => HTMLElement`',
        '-',
        'Mount container for the density menu and the column settings panel, `document.body` by default; in browser full screen they mount inside the full screen element by default.',
      ],
      [
        '`locale`',
        '`object`',
        '-',
        'Per-instance text overrides; follows the [global locale](/en/guide/presets-and-locales) by default.',
      ],
      [
        '`ui`',
        '`object`',
        '-',
        'Per-instance slot class overrides; available slots are listed in [Theming](/en/guide/column-display#ui-slots).',
      ],
      ['`class`', '`string`', '-', 'Class for the root element.'],
    ],
  },
  'column-settings-options': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      ['`density`', '`boolean`', '`true`', 'Show the density entry.'],
      ['`setting`', '`boolean`', '`true`', 'Show the column settings entry.'],
      ['`fixed`', '`boolean`', '`true`', 'Pin buttons in the panel.'],
      ['`draggable`', '`boolean`', '`true`', 'Drag reordering in the panel.'],
    ],
  },
  'column-settings-events': {
    headers: ['Event', 'Payload', 'Description'],
    rows: [
      [
        '`update:columns`',
        '`(columns: TableColumnsType<TRecord>) => void`',
        'Column visibility, pinning or order changed.',
      ],
      ['`update:size`', "`(size: 'large' \\| 'middle' \\| 'small') => void`", 'Density changed.'],
      [
        '`reset`',
        '`() => void`',
        '"Reset" was clicked; the initial column visibility is restored through `update:columns`.',
      ],
    ],
  },
  'column-settings-slots': {
    headers: ['Slot', 'Payload type', 'Description'],
    rows: [
      [
        '`columnLabel`',
        '`{ column: ColumnType<TRecord> \\| ColumnGroupType<TRecord> }`',
        'Custom column labels in the panel; columns with a function `title` show `key` / `dataIndex` by default.',
      ],
    ],
  },
  'query-reset': {
    headers: ['Action', 'Draft', 'Submitted params', 'Request and table state'],
    rows: [
      ['`resetFields()`', 'Restored to the initial defaults', 'Kept', 'No request'],
      [
        '`submit()`',
        'Kept',
        'Transformed from the current draft',
        'Calls `onSubmit`; when wired to `table.submit`, returns to page 1 and keeps sorting and filters',
      ],
      [
        '`reset()`',
        'Restored to the initial defaults',
        'Transformed from the defaults',
        'Calls `onReset`, or `onSubmit` when it is not provided; when wired to `table.reset(params)`, returns to page 1 and clears sorting and filters',
      ],
    ],
  },
  'query-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`defaultValues`',
        '`TValues`',
        'Required',
        'Form defaults and the reset baseline; a snapshot is taken on creation.',
      ],
      [
        '`fieldTransforms`',
        '`TableQueryFieldTransforms<TValues, TParams>`',
        '-',
        'Per-field transforms, each returning a fragment of the request params.',
      ],
      [
        '`transform`',
        '`(params: Partial<TParams>, values: Readonly<TValues>) => Partial<TParams>`',
        '-',
        'Transform of the whole params after the field transforms; runs once per submit or reset.',
      ],
      [
        '`onSubmit`',
        '`(params: Partial<TParams>, values: Readonly<TValues>) => void \\| Promise<void>`',
        '-',
        'Called on submit with the transformed params and the form snapshot of that submission.',
      ],
      [
        '`onReset`',
        '`(params: Partial<TParams>, values: Readonly<TValues>) => void \\| Promise<void>`',
        '`onSubmit`',
        'Called on reset; `onSubmit` is called when it is not provided.',
      ],
      [
        '`collapsed`',
        '`Ref<boolean>`',
        '-',
        'Shared collapsed state; takes precedence over `defaultCollapsed` when passed.',
      ],
      ['`defaultCollapsed`', '`boolean`', '`true`', 'Initial collapsed state.'],
      [
        '`onCollapse`',
        '`(collapsed: boolean) => void`',
        '-',
        'Called when the collapsed state changes.',
      ],
    ],
  },
  'query-return': {
    headers: ['Property or method', 'Type', 'Description'],
    rows: [
      ['`draft`', '`Ref<TValues>`', 'Form draft; bind it to the host controls.'],
      [
        '`submitted`',
        '`ComputedRef<Readonly<TValues> \\| undefined>`',
        'Form values of the last successful transform.',
      ],
      [
        '`params`',
        '`ComputedRef<Readonly<Partial<TParams>> \\| undefined>`',
        'Request params of the last submission.',
      ],
      ['`collapsed`', '`Ref<boolean>`', 'Collapsed state.'],
      ['`submitting`', '`ComputedRef<boolean>`', 'A submit or reset callback is running.'],
      ['`error`', '`ShallowRef<Error \\| null>`', 'Error from the last transform or callback.'],
      [
        '`submit`',
        '`(options?: TableQuerySubmitOptions<TValues>) => Promise<boolean>`',
        'Transforms the draft and calls `onSubmit`. Returns `false` when the transform or callback fails, or when a newer submission supersedes it. `options.omitFields` omits fields from the request params.',
      ],
      [
        '`reset`',
        '`(options?: TableQuerySubmitOptions<TValues>) => Promise<boolean>`',
        'Restores the defaults and submits once, calling `onReset`.',
      ],
      [
        '`resetFields`',
        '`() => void`',
        'Restores the draft only; the submitted state is unchanged and no request is made.',
      ],
      [
        '`toggleCollapsed`',
        '`() => void`',
        'Toggles the collapsed state without triggering a query.',
      ],
    ],
  },
  'editing-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`rowKey`',
        '`keyof TRecord \\| ((record: TRecord) => Key)`',
        'Required',
        'Stable row key: a field name or a function returning `string / number`; the row index is not used.',
      ],
      [
        '`mode`',
        "`'single' \\| 'multiple'`",
        "`'single'`",
        'In single mode, `start` and `add` return `false` while a draft exists.',
      ],
      [
        '`clone`',
        '`(record: TRecord) => TRecord`',
        'built-in clone',
        'Clone function for the whole record. The default clones plain objects, arrays and Date; provide your own when records hold mutable class instances.',
      ],
      [
        '`toDraft`',
        '`(record: TRecord, context: TableEditDraftContext<TRecord>) => TRecord`',
        '-',
        'Converts the source record into a draft when editing starts; runs once per edit.',
      ],
      [
        '`toValue`',
        '`(draft: TRecord, context: TableEditContext<TRecord>) => TRecord`',
        '-',
        'Converts the draft back into a record when saving or reading the submit values.',
      ],
      [
        '`validate`',
        "`UseTableEditOptions<TRecord>['validate']`",
        '-',
        '`(draft, context)` returns `{ message?, fields? }` synchronously or asynchronously; returning `void` or an empty object continues saving.',
      ],
      [
        '`onSave`',
        "`UseTableEditOptions<TRecord>['onSave']`",
        '-',
        '`(draft, context)` is called after validation passes. It may return the record normalized by the server, or `void`; the application updates `dataSource`. Returning `false` keeps the draft.',
      ],
      [
        '`onCancel`',
        "`UseTableEditOptions<TRecord>['onCancel']`",
        '-',
        "`(draft, context)` cancel handler, synchronous or asynchronous. Returning `false` keeps the draft; a rejection records a `'cancel'` error.",
      ],
      [
        '`onError`',
        '`(error: TableEditError, key: Key) => void`',
        '-',
        'Called when validation, saving or cancelling fails; the error is also available from `errors`.',
      ],
    ],
  },
  'editing-state': {
    headers: ['Property or method', 'Type', 'Description'],
    rows: [
      [
        '`editableKeys`',
        '`ComputedRef<readonly Key[]>`',
        'Keys of the rows being edited; changed through `start`, `add`, `cancel` and `save`.',
      ],
      [
        '`savingKeys`',
        '`ComputedRef<ReadonlySet<Key>>`',
        'Keys of the rows being saved (validation included); use them to disable editors or show a loading state.',
      ],
      ['`cancellingKeys`', '`ComputedRef<ReadonlySet<Key>>`', 'Keys of the rows being cancelled.'],
      [
        '`errors`',
        '`ComputedRef<ReadonlyMap<Key, TableEditError>>`',
        'Map from row key to `{ type, message, fields?, cause? }`.',
      ],
      [
        '`newRecords`',
        '`ComputedRef<TRecord[]>`',
        'Draft copies of unsaved new rows; the application adds them to the start or end of `dataSource`.',
      ],
      ['`isEditing`', '`(key: Key) => boolean`', 'Whether the row is being edited.'],
      [
        '`getDraft`',
        '`(key: Key) => TRecord \\| undefined`',
        'Reads an isolated copy of the draft; apply changes through `setDraft`.',
      ],
      [
        '`start`',
        '`(record: TRecord) => boolean`',
        'Creates a draft for an existing record; returns `false` when the row key is a duplicate.',
      ],
      [
        '`add`',
        '`(record?: TRecord, config?: TableEditAddConfig) => boolean`',
        'Creates a draft for a new record; returns `false` when the row key is a duplicate. For position and caching, see [Detail forms](/en/guide/detail-form).',
      ],
      [
        '`setDraft`',
        '`(key: Key, patch: Partial<TRecord> \\| ((draft: TRecord) => TRecord)) => boolean`',
        'Merges a partial record, or updates nested fields through a function; also clears the previous error of the row.',
      ],
      [
        '`save`',
        '`(key: Key) => Promise<TRecord \\| undefined>`',
        'Validates and saves. Returns the record and ends editing on success; returns `undefined` on failure or when the edit is no longer valid.',
      ],
      [
        '`cancel`',
        '`(key: Key) => Promise<boolean>`',
        'Cancels the row; the draft and error are cleared on success.',
      ],
      ['`cancelAll`', '`() => Promise<boolean[]>`', 'Cancels all rows being edited.'],
    ],
  },
  'request-methods': {
    headers: ['Method', 'Type', 'Description'],
    rows: [
      [
        '`reload`',
        '`(resetPageIndex?: boolean) => Promise<void>`',
        'Reloads immediately without waiting for the debounce. Reuses a running request with the same params, otherwise sends a new one. Pass `true` to return to page 1 first.',
      ],
      [
        '`submit`',
        '`(params?: Partial<TParams>) => Promise<void>`',
        'Replaces the submitted query, returns to page 1 and forces a request, even with identical params; fields not passed fall back to `defaultParams`.',
      ],
      [
        '`reset`',
        '`(params?: Partial<TParams>) => Promise<void>`',
        'Restores `defaultParams` when called without arguments, or replaces the submitted query with the given params. Clears the sort and filters of the request, returns to page 1 and forces a request; the extra `params` still apply.',
      ],
      [
        '`cancel`',
        '`() => void`',
        'Cancels pending and in-flight requests and pauses automatic refresh; existing data, page and error are kept.',
      ],
      [
        '`pause`',
        '`() => void`',
        'Pauses automatic refresh and cancels in-flight automatic requests; manual requests can still complete.',
      ],
      [
        '`resume`',
        '`(immediate?: boolean) => Promise<void>`',
        'Resumes automatic refresh; pass `true` to refresh in the background immediately. No request is sent before the first manual load.',
      ],
    ],
  },
  'request-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`request`',
        '`TableRequest<TRecord, TParams>`',
        'Required',
        'Async request function; its arguments are, in order, the paged query, sort, filters and `{ signal }`.',
      ],
      [
        '`params`',
        '`Partial<TParams>`',
        '-',
        'Extra params; accepts a ref or getter. They take precedence over the submitted query; a change returns to page 1 and sends a request.',
      ],
      [
        '`defaultParams`',
        '`Partial<TParams>`',
        '-',
        'Initial submitted query, also the value `reset()` restores when called without arguments.',
      ],
      [
        '`initialPagination`',
        '`Partial<TablePaginationState>`',
        '`{ current: 1, pageSize: 10, total: 0 }`',
        'Initial page, page size and total.',
      ],
      [
        '`pagination`',
        '`object`',
        '-',
        'Display options for the pager; fields are listed in the [pagination configuration](/en/guide/pagination#configuration-reference). The page, total and events are managed by the composable.',
      ],
      [
        '`manualRequest`',
        '`boolean`',
        '`false`',
        "Skip only the first automatic request; later table events, submissions, param changes and reloads send requests as usual. Independent of the component's `manual` switch for local computation.",
      ],
      [
        '`debounceTime`',
        '`number`',
        '`0`',
        'Debounce in milliseconds for query changes and table events; `reload` is not debounced.',
      ],
      [
        '`polling`',
        '`TableRequestPolling<TRecord>`',
        '`false`',
        'Polling interval in milliseconds, or `(rows) => number \\| false`; accepts a ref. Positive values are at least 2000.',
      ],
      [
        '`revalidateOnFocus`',
        '`boolean`',
        '`false`',
        'Refresh when the page becomes visible again; accepts a ref or getter.',
      ],
      ['`pollingWhenHidden`', '`boolean`', '`false`', 'Keep polling while the page is hidden.'],
      ['`pollingOnError`', '`boolean`', '`false`', 'Keep polling after a request fails.'],
      [
        '`resetOnPageSizeChange`',
        '`boolean`',
        '`true`',
        'Return to page 1 when the page size changes.',
      ],
      [
        '`beforeSearchSubmit`',
        '`(params: Partial<TParams>) => Partial<TParams>`',
        '-',
        'Transforms the merged query params.',
      ],
      [
        '`postData`',
        '`(data: TRecord[]) => TRecord[]`',
        '-',
        'Transforms the returned rows; the total is unchanged.',
      ],
      [
        '`onLoad`',
        '`(data: TRecord[], response: TableRequestResult<TRecord>) => void`',
        '-',
        'Called after data is received successfully, with the processed data and the raw response.',
      ],
      ['`onError`', '`(error: Error) => void`', '-', 'Called after the latest request fails.'],
    ],
  },
  'request-return': {
    headers: ['Property', 'Type', 'Description'],
    rows: [
      [
        '`dataSource`',
        '`ShallowRef<TRecord[]>`',
        "Records returned by `request`, after `postData` when provided. May contain one page or the complete result set; the Hook does not slice them. Bind to the table's `dataSource`.",
      ],
      [
        '`loading`',
        '`Readonly<Ref<boolean>>`',
        "Loading state of the first request and manual requests; bind it to the table's `loading`.",
      ],
      [
        '`refreshing`',
        '`Readonly<Ref<boolean>>`',
        'Automatic refresh state after a successful load; no full-table mask is shown.',
      ],
      [
        '`paused`',
        '`Readonly<Ref<boolean>>`',
        'Whether automatic refresh has been paused explicitly.',
      ],
      ['`error`', '`ShallowRef<Error \\| null>`', 'Error from the last request.'],
      [
        '`pagination`',
        '`ComputedRef<TablePaginationConfig>`',
        "Controlled pagination config for the fully remote setup, used with the table's `change` → `onChange` binding. Do not also bind requests to `pagination.onChange`. Use a separate config for local pagination.",
      ],
      ['`query`', '`ComputedRef<Partial<TParams>>`', 'Submitted query.'],
      ['`sort`', '`ComputedRef<TableRequestSort>`', 'Sort used by the request.'],
      ['`filters`', '`ComputedRef<TableFiltersInfo>`', 'Filters used by the request.'],
      [
        '`manual`',
        '`Readonly<Required<TableManualConfig>>`',
        'A fixed, frozen plain object `{ sort: true, filter: true, pagination: true }`, not a ref. An optional preset for a fully remote table, equivalent to `:manual="true"`; it does not control requests.',
      ],
      [
        '`onChange`',
        "`VTableEventProps<TRecord>['onChange']`",
        "Turns paging, sorting and filtering events into requests, ignoring selection events. Changing the component's `manual` does not change this behavior; mixed modes need application event routing. See [Choosing a processing mode](/en/guide/remote-data#processing-modes).",
      ],
    ],
  },
  'dictionary-create-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`key`',
        '`string`',
        'Required',
        'Stable application identifier. Two instances with the same key are still isolated from each other.',
      ],
      [
        '`request`',
        '`TableDictionaryRequest<TParams>`',
        'Required',
        '`(params, { signal, keyword }) => Promise<{ options, complete }>`; the result must state whether it is the complete dictionary.',
      ],
      [
        '`cacheTime`',
        '`number`',
        '`300000`',
        'Cache time in milliseconds for successful results; `0` turns off result caching.',
      ],
      [
        '`maxEntries`',
        '`number`',
        '`50`',
        'Maximum number of cache entries kept, at least 1; entries with subscribers are never evicted.',
      ],
    ],
  },
  'dictionary-instance': {
    headers: ['Property or method', 'Type', 'Description'],
    rows: [
      ['`key`', '`string`', 'Application identifier passed on creation.'],
      [
        '`load`',
        '`(params: Partial<TParams>, context: TableDictionaryContext & { force?: boolean }) => Promise<TableDictionaryResult>`',
        'For code outside components. Returns an independent snapshot of the result and rejects on failure or cancellation; `force` skips the completed cache.',
      ],
      [
        '`invalidate`',
        '`() => void`',
        'Clears the instance cache without refreshing existing subscriptions.',
      ],
    ],
  },
  'dictionary-use-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      ['`dictionary`', '`TableDictionary<TParams>`', 'Required', 'Shared dictionary instance.'],
      [
        '`params`',
        '`MaybeRefOrGetter<Partial<TParams>>`',
        '-',
        "Dependency params. A change clears the keyword and options and reloads; the application's selected value is not modified.",
      ],
      ['`defaultKeyword`', '`string`', "`''`", 'Initial search keyword.'],
      [
        '`selectedOptions`',
        '`MaybeRefOrGetter<readonly TableDictionaryOption[]>`',
        '-',
        'Labels of the selected options, used to display selections missing from the latest search results.',
      ],
      [
        '`manualRequest`',
        '`boolean`',
        '`false`',
        'Skip the first request; later changes of the dependency params still load.',
      ],
      ['`debounceTime`', '`number`', '`0`', 'Debounce in milliseconds for `search`.'],
      ['`onError`', '`(error: Error) => void`', '-', 'Called when a request fails.'],
    ],
  },
  'dictionary-return': {
    headers: ['Property or method', 'Type', 'Description'],
    rows: [
      [
        '`options`',
        '`ComputedRef<readonly TableDictionaryOption[]>`',
        'Options from the current request; selected options are not mixed in.',
      ],
      [
        '`valueEnum`',
        '`ComputedRef<ReadonlyMap<ColumnValue, ColumnValueEnumItem>>`',
        "Labels known under the current dependency params, merged with `selectedOptions`; usable directly as a column's `valueEnum`.",
      ],
      [
        '`filters`',
        '`ComputedRef<ColumnFilterItem[]>`',
        'Header filter items; populated only for a complete dictionary with an empty keyword, `[]` otherwise.',
      ],
      [
        '`complete`',
        '`Readonly<Ref<boolean>>`',
        'Whether the current result is the complete dictionary.',
      ],
      ['`loading`', '`Readonly<Ref<boolean>>`', 'A request is in flight.'],
      ['`error`', '`Readonly<Ref<Error \\| null>>`', 'Error from the last request.'],
      ['`keyword`', '`Readonly<Ref<string>>`', 'Current search keyword.'],
      [
        '`search`',
        '`(keyword: string) => Promise<boolean>`',
        'Updates the keyword and sends a debounced request. Returns `true` on success, `false` on failure, cancellation or unmount.',
      ],
      [
        '`reload`',
        '`() => Promise<boolean>`',
        'Reloads the current query immediately, skipping the completed cache.',
      ],
      [
        '`cancel`',
        '`() => void`',
        'Cancels this subscription; the current options and labels are kept.',
      ],
    ],
  },
  'dictionary-option': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`value`',
        '`string \\| number \\| boolean`',
        'Required',
        'Option value; numbers must be finite.',
      ],
      ['`label`', '`string`', 'Required', 'Display text.'],
      [
        '`status`',
        "`'success' \\| 'warning' \\| 'error' \\| 'processing' \\| 'default'`",
        '-',
        'Status color, the same as `status` in `valueEnum`.',
      ],
      ['`disabled`', '`boolean`', '-', 'Whether the option is disabled.'],
    ],
  },
  'schema-query-props': {
    headers: ['Prop', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`query`',
        '`UseTableQueryReturn<TValues, TParams>`',
        'Required',
        'Connects the query draft, transforms and submission protocol.',
      ],
      [
        '`rootTag`',
        "`'form' \\| 'div'`",
        "`'form'`",
        'Use `div` when the host already has a form.',
      ],
      [
        '`fields`',
        '`readonly TableQueryField<TValues>[]`',
        'Required',
        'Configures the query fields and controls.',
      ],
      ['`controls`', '`TableControls`', 'Required', 'Provides the map of host UI controls.'],
      [
        '`layout`',
        "`'form' \\| 'light'`",
        "`'form'`",
        'Use the regular form layout or the light query layout.',
      ],
      [
        '`autoSubmit`',
        '`boolean`',
        '`false`',
        'In light mode, schedule a submission after a control updates.',
      ],
      [
        '`debounceTime`',
        '`number`',
        '`0`',
        'Debounce time of auto submit in light mode, in milliseconds.',
      ],
      [
        '`hiddenPolicy`',
        "`'preserve' \\| 'omit'`",
        "`'preserve'`",
        'Decides whether fields hidden by the schema are omitted on submit.',
      ],
      ['`collapsedCount`', '`number`', '`3`', 'Number of fields shown when collapsed, at least 1.'],
      [
        '`collapsible`',
        '`boolean`',
        '`true`',
        'Provide expand and collapse actions when the fields exceed the collapsed count.',
      ],
      ['`disabled`', '`boolean`', '`false`', 'Disable the query controls, submit and reset.'],
      [
        '`validate`',
        "`TableQueryProps<TValues, TParams>['validate']`",
        '-',
        'Calls the host validation before submit or reset. Returning `false` or throwing blocks the operation.',
      ],
      [
        '`errors`',
        '`Readonly<Partial<Record<keyof TValues & string, string>>>`',
        '-',
        'External error messages keyed by field name.',
      ],
      [
        '`locale`',
        '`Partial<TableQueryLocale>`',
        '-',
        'Overrides the button and feedback text of this instance.',
      ],
      [
        '`ui`',
        '`Partial<Record<QuerySlots, string>>`',
        '-',
        'Overrides the query theme slot classes of this instance.',
      ],
      ['`class`', '`string`', '-', 'Adds a class to the root node of the query area.'],
    ],
  },
  'schema-query-fields': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`name`',
        '`keyof TValues & string`',
        'Required',
        "Field name in the draft. May be omitted when fields are derived from column definitions; defaults to the column's `dataIndex`.",
      ],
      ['`label`', '`VNodeChild`', '-', 'Field label.'],
      [
        '`valueType`',
        '`string`',
        "`'text'`",
        'Selects the control from `controls`; unregistered types use the `text` control.',
      ],
      ['`order`', '`number`', '`0`', 'Sort order of the field; smaller values come first.'],
      [
        '`hidden`',
        '`boolean \\| ((context: TableQueryFieldContext<TValues>) => boolean)`',
        '`false`',
        'Hides the field. `hiddenPolicy` decides whether it is kept on submit.',
      ],
      [
        '`disabled`',
        '`boolean \\| ((context: TableQueryFieldContext<TValues>) => boolean)`',
        '`false`',
        'Keeps the control and disables updates.',
      ],
      [
        '`readonly`',
        '`boolean \\| ((context: TableQueryFieldContext<TValues>) => boolean)`',
        '`false`',
        'Displays the control as read-only.',
      ],
      [
        '`fieldProps`',
        "`TableQueryField<TValues>['fieldProps']`",
        '-',
        'Props passed to the host control, or a function computing them from the field context.',
      ],
      [
        '`options`',
        '`MaybeRefOrGetter<readonly TableDictionaryOption[]>`',
        '-',
        'Explicit options; take precedence over the dictionary result.',
      ],
      [
        '`dictionary`',
        '`TableDictionaryBinding`',
        '-',
        'Provides dictionary options, loading state and search.',
      ],
    ],
  },
  'schema-query-slots': {
    headers: ['Slot', 'Payload type', 'Description'],
    rows: [
      [
        '`field`',
        '`TableQueryFieldSlotProps<TValues>`',
        'Receives `field`, `values` and `control`; the same control update and dictionary search protocol is available.',
      ],
      [
        '`actions`',
        '`TableQueryActionSlotProps`',
        'Receives the search, reset and collapse actions, along with the submitting and collapsed states.',
      ],
    ],
  },
  'editable-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`columns`',
        '`MaybeRefOrGetter<ColumnsType<TRecord>>`',
        'Required',
        'Columns with an `editor` config.',
      ],
      [
        '`controls`',
        '`MaybeRefOrGetter<TableControls>`',
        'Required',
        'Map of host editing controls.',
      ],
      [
        '`ui`',
        "`Partial<Record<'editCell' \\| 'editControl' \\| 'editError', string>>`",
        '-',
        'Overrides the classes of the edit cell, control container and error message.',
      ],
    ],
  },
  'editable-editor-fields': {
    headers: ['Field', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`valueType`',
        '`string`',
        'inferred from column',
        "Selects a registered editing control. When unset, it is `'select'` if the column has `valueEnum`, otherwise the column's `valueType`, and `'text'` when neither exists.",
      ],
      [
        '`editable`',
        '`boolean \\| ((context: TableEditableFieldContext<TRecord>) => boolean)`',
        '`true`',
        'Keeps the read-only cell when it returns `false`.',
      ],
      [
        '`readonly`',
        '`boolean \\| ((context: TableEditableFieldContext<TRecord>) => boolean)`',
        '`false`',
        'Keeps the read-only cell when `true`.',
      ],
      [
        '`disabled`',
        '`boolean \\| ((context: TableEditableFieldContext<TRecord>) => boolean)`',
        '`false`',
        'Keeps the editing control and blocks updates.',
      ],
      [
        '`fieldProps`',
        "`TableColumnEditor<TRecord>['fieldProps']`",
        '`{}`',
        'Props passed to the host control, or a function computing them from the row context.',
      ],
      [
        '`options`',
        '`MaybeRefOrGetter<readonly TableDictionaryOption[]>`',
        'dictionary or column enum',
        "Explicit options. When unset, the `dictionary` options are used, then the column's `valueEnum`.",
      ],
      [
        '`dictionary`',
        '`TableDictionaryBinding`',
        '-',
        'Provides dictionary options, loading state and search.',
      ],
      [
        '`convertValue`',
        "`TableColumnEditor<TRecord>['convertValue']`",
        '-',
        'Converts the source value into the control value when editing starts.',
      ],
      [
        '`transform`',
        "`TableColumnEditor<TRecord>['transform']`",
        '-',
        'Produces the submit value from the draft snapshot; the current control value is kept.',
      ],
      [
        '`validate`',
        "`TableColumnEditor<TRecord>['validate']`",
        '-',
        'Validates the field synchronously or asynchronously. The draft is kept when an error message is returned.',
      ],
      [
        '`onValueChange`',
        "`TableColumnEditor<TRecord>['onValueChange']`",
        '-',
        'May return a patch updating other fields.',
      ],
    ],
  },
  'detail-form-options': {
    headers: ['Option', 'Type', 'Default', 'Description'],
    rows: [
      [
        '`dataSource`',
        '`MaybeRefOrGetter<readonly TRecord[]>`',
        '-',
        'Detail records held by the parent form. Updates from the parent do not overwrite open drafts.',
      ],
      [
        '`onChange`',
        '`(records: TRecord[]) => void`',
        '-',
        'Notifies the parent form after a row is saved successfully or a row is added in `source` mode; not triggered per keystroke.',
      ],
      [
        '`createRecord`',
        '`() => TRecord`',
        '-',
        'Creates a record when `add()` is called without arguments.',
      ],
      [
        '`maxRows`',
        '`number`',
        '-',
        'Maximum number of records held on the client, including cached new rows.',
      ],
    ],
  },
  'detail-form-return': {
    headers: ['Property or method', 'Type', 'Description'],
    rows: [
      [
        '`records`',
        '`ComputedRef<TRecord[]>`',
        'Source records overlaid with row drafts and cached new rows; bind it directly to the table.',
      ],
      ['`validating`', '`ComputedRef<boolean>`', 'Whether a full validation is running.'],
      [
        '`getOriginal`',
        '`(key: Key) => TRecord \\| undefined`',
        'Reads the snapshot of the source record taken when editing started; returns `undefined` for cached new rows.',
      ],
      [
        '`getDrafts`',
        '`() => ReadonlyMap<Key, TRecord>`',
        'Reads isolated draft snapshots keyed by row key.',
      ],
      [
        '`getValues`',
        '`() => TRecord[]`',
        'Source records plus the converted drafts; the editing state is kept and save is not called.',
      ],
      [
        '`validateAll`',
        '`() => Promise<TableEditValidationResult<TRecord>>`',
        'Validates all records held on the client and returns the submit snapshot of that same validation, without saving.',
      ],
      [
        '`reset`',
        '`() => void`',
        'Aborts in-flight operations and clears drafts and errors; the external source records are kept.',
      ],
      [
        '`add`',
        '`(record?: TRecord, config?: TableEditAddConfig) => boolean`',
        'Adds to the draft cache or to the controlled source records; by default inserts at the end and caches the draft.',
      ],
    ],
  },
} as const satisfies Record<string, ReferenceApiTable>
