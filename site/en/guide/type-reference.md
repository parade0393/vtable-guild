# Type reference

This page provides the TypeScript declarations and import entry for the APIs covered on this site. For component behavior, defaults and event semantics, see the [API Reference](/en/guide/api-reference). The core declarations share one hand-maintained file with the feature pages and are type-checked; the composable protocols show the public exports directly, with detailed parameters in the corresponding feature guides.

We recommend importing all public types from `@vtable-guild/vtable-guild`. `CSSProperties`, `VNodeChild`, `VNode`, `Plugin` and `InjectionKey` in the declarations come from Vue; theme configs use `typeof` on the public theme constants to keep the readonly properties and literals of the source. Interfaces labelled "documentation helper" only describe component props and are not package exports.

```ts
import type {
  TableColumnsType,
  VTableEventProps,
  TablePaginationConfig,
} from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name' },
  { title: 'Age', key: 'age', dataIndex: 'age' },
]

const pagination: TablePaginationConfig = {
  onChange: (page, pageSize) => console.log(page, pageSize),
}

const handleChange: NonNullable<VTableEventProps<UserRow>['onChange']> = (
  _filters,
  _sorter,
  extra,
) => {
  if (extra.action === 'paginate' && extra.pagination) {
    console.log(extra.pagination.current, extra.pagination.pageSize)
  }
}
```

If you are aligning with ant-design-vue's column type names, prefer `TableColumnType` and `TableColumnsType`. They are equivalent to `ColumnType` and `ColumnsType` respectively. Other types referenced by the declarations can be looked up by name on this page.

## Core table types

### Key

The unique identifier used by rows, columns and internal state.

<<< @/.vitepress/type-declarations/table.ts#Key

### DataIndex

The field path a column uses to read row data.

<<< @/.vitepress/type-declarations/table.ts#DataIndex

### AlignType

Alignment of column content.

<<< @/.vitepress/type-declarations/table.ts#AlignType

### Breakpoint

The breakpoint type used by responsive columns. The public type name is `Breakpoint`; there is no plural `Breakpoints` type.

<<< @/.vitepress/type-declarations/table.ts#Breakpoint

### SortOrder

Sort direction. `null` means the unsorted state.

<<< @/.vitepress/type-declarations/table.ts#SortOrder

### ColumnSorter

The column sorter type: the compare function returns a number, and the object form supports multi-column sort priority.

<<< @/.vitepress/type-declarations/table.ts#SorterFn

<<< @/.vitepress/type-declarations/table.ts#ColumnSorterObject

<<< @/.vitepress/type-declarations/table.ts#ColumnSorter

### ColumnFilterItem

A column filter item; it supports a tree structure.

<<< @/.vitepress/type-declarations/table.ts#ColumnFilterItem

### ColumnType

Leaf column configuration. The full declaration covers rendering, sorting, filtering, fixed columns, column resizing and responsive visibility.

<<< @/.vitepress/type-declarations/table.ts#ColumnType

### ColumnGroupType

Column group configuration; `children` holds further leaf columns or column groups.

<<< @/.vitepress/type-declarations/table.ts#ColumnGroupType

### ColumnsType

The recommended type for the `columns` prop; it supports both column groups and column placeholder constants.

<<< @/.vitepress/type-declarations/table.ts#ColumnsType

### TableColumnType and TableColumnsType

Aliases compatible with ant-design-vue naming; they keep the generic defaults of the original types.

<<< @/.vitepress/type-declarations/table.ts#TableColumnType

<<< @/.vitepress/type-declarations/table.ts#TableColumnGroupType

<<< @/.vitepress/type-declarations/table.ts#TableColumnsType

### TableLayout

<<< @/.vitepress/type-declarations/table.ts#TableLayout

### TableSticky

The full declaration of the `sticky` object. `offsetScroll` and `getContainer` are declared but not wired up yet; see the [API Reference](/en/guide/api-reference) for the behavior boundaries.

<<< @/.vitepress/type-declarations/table.ts#TableSticky

### RowClassName

<<< @/.vitepress/type-declarations/table.ts#RowClassName

### TransformCellText

<<< @/.vitepress/type-declarations/table.ts#TransformCellText

## Rendering and structure types

### CellAdditionalProps

Extra DOM attributes returned by `customCell`, `customHeaderCell`, `customRow` and `customHeaderRow`. The index signature allows attributes such as `data-*` and `aria-*`.

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

### RenderedCell

The object form returned by `customRender` or by the selection column's `renderCell`.

<<< @/.vitepress/type-declarations/table.ts#RenderedCell

### CustomRenderContext

The parameter type of `column.customRender`.

<<< @/.vitepress/type-declarations/table.ts#CustomRenderContext

### GetComponentProps

The callback type for extra cell or row attributes. Note that `index` is optional.

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

### ColumnTitleProps

Parameters of a function-style column title.

<<< @/.vitepress/type-declarations/table.ts#ColumnTitleProps

### ColumnTitle

<<< @/.vitepress/type-declarations/table.ts#ColumnTitle

## Interaction types

### RowSelection

Configuration for multiple selection, single selection, controlled selection and selection-column rendering.

<<< @/.vitepress/type-declarations/table.ts#RowSelection

### RowSelectionType

<<< @/.vitepress/type-declarations/table.ts#RowSelectionType

### SelectionItem

A custom batch-selection menu item.

<<< @/.vitepress/type-declarations/table.ts#SelectionItem

### Expandable

Configuration for expandable rows and tree expansion.

<<< @/.vitepress/type-declarations/table.ts#Expandable

### TableFiltersInfo

The filters argument of the `change` event. After a filter is cleared, the corresponding value can be `null`.

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

### SorterResultLike

The sort result of a single column. With multi-column sorting, the event returns an array of this type.

<<< @/.vitepress/type-declarations/table.ts#SorterResultLike

### VTableSorterResult

The sorter argument of the `change` event.

<<< @/.vitepress/type-declarations/table.ts#VTableSorterResult

### TableChangeExtra

The extra argument of the `change` event; with pagination enabled, read the pagination state from the optional `pagination`.

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

### RowDragSortInfo

The info argument of the `rowDragEnd` event; see [Row drag sorting](/en/guide/row-drag-sort).

<<< @/.vitepress/type-declarations/table.ts#RowDragSortInfo

## Slot types

### TableBodyCellSlotProps

Parameters of the `bodyCell` slot.

<<< @/.vitepress/type-declarations/table.ts#TableBodyCellSlotProps

### TableHeaderCellSlotProps

Parameters of the `headerCell` slot.

<<< @/.vitepress/type-declarations/table.ts#TableHeaderCellSlotProps

### CustomFilterDropdownSlotProps

Parameters of the `customFilterDropdown` slot, including the filter state and the confirm, reset and close functions.

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

### TableDataSlotProps

Parameters of the `title` and `footer` slots.

<<< @/.vitepress/type-declarations/table.ts#TableDataSlotProps

### TableSlotsDecl

The complete slot declaration of `VTable`; useful when wrapping the table component.

<<< @/.vitepress/type-declarations/table.ts#TableSlotsDecl

## Constant types

### SelectionSentinel

The type of the default batch-selection constants used by `rowSelection.selections`.

<<< @/.vitepress/type-declarations/table.ts#SelectionSentinel

### ColumnSentinel

The type of the column placeholder constants available at the top level of `columns`. `ExpandColumnSentinel` corresponds to `EXPAND_COLUMN`, and `SelectionColumnSentinel` to `SELECTION_COLUMN`.

<<< @/.vitepress/type-declarations/table.ts#ExpandColumnSentinel

<<< @/.vitepress/type-declarations/table.ts#SelectionColumnSentinel

<<< @/.vitepress/type-declarations/table.ts#ColumnSentinel

## Component and event types

### TableProps

The complete type of `VTable` props; prefer it when wrapping the table in your own component.

<<< @/.vitepress/type-declarations/table.ts#TableProps

### Server-side requests and manual calculation

`TableManualConfig` defines whether local sorting, filtering and pagination are skipped. The request function, options and return value of `useTableRequest` have their own generic types;
see [Remote data and requests](/en/guide/remote-data) for full usage.

<<< @/.vitepress/type-declarations/request.ts

### VTableEventProps

The complete event props type for `change`, `resizeColumn` and `rowDragEnd`. Even if you only listen for pagination, the handler still receives three arguments; alternatively use `TablePaginationConfig['onChange']`.

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

### VTablePublicProps

The combination of `TableProps<TRecord>` and `VTableEventProps<TRecord>`.

<<< @/.vitepress/type-declarations/table.ts#VTablePublicProps

### VTableComponent

The generic `VTable` component type.

<<< @/.vitepress/type-declarations/table.ts#VTableComponent

### SummaryFixed

The `fixed` type of `VTableSummary`.

<<< @/.vitepress/type-declarations/table.ts#SummaryFixed

### Summary component props

The following interfaces are documentation helper types, not package exports. `VTableSummaryRow` has no props of its own, and all three summary components provide a default content slot with no parameters.

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryProps

<<< @/.vitepress/type-declarations/config.ts#VTableSummaryCellProps

## Toolbar and column settings types

`TableToolbarProps`, `TableToolbarOptions`, `TableToolbarSlotProps` and `TableToolbarSlots` belong to the standalone `VTableToolbar` component; they are not props or slots of `VTable`. See [Toolbar](/en/guide/toolbar) for the full behavior and an export example.

<<< @/.vitepress/type-declarations/toolbar.ts

Types for the controlled column configuration, density and custom label of `VTableColumnSettings`:

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSize

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsOptions

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsProps

<<< @/.vitepress/type-declarations/column-settings.ts#TableColumnSettingsSlots

## Query, editing and field rendering protocols

### useTableQuery

`UseTableQueryOptions<TValues, TParams>` separates the form value type from the request parameter type; `TableQueryFieldTransforms` infers the transform input from the form key. The return value includes an independent draft, the submitted snapshot, the expand/collapse state and submit / reset methods. `collapsed` accepts a shared Ref, and `onCollapse` observes expand/collapse changes. See [Query submission](/en/guide/query).

<<< @/.vitepress/type-declarations/features.ts#QueryProtocol

### useTableEdit

`UseTableEditOptions<TRecord>` defines the stable row key, single-row / multi-row mode, and the clone, validation, save and cancel callbacks. `TableEditContext` provides the original snapshot, the new-row flag and an AbortSignal; a failed validation returns `TableEditValidationErrors`, and errors are classified as `TableEditError`. The return value covers draft access, editing keys, saving state, added rows and more. See [Editing](/en/guide/editing).

<<< @/.vitepress/type-declarations/features.ts#EditingProtocol

### Field renderers

A column selects a renderer through `valueType`, and `fieldProps` supports a static config or one computed per cell; the table's `renderers` is a scoped registry. `TableFieldRenderContext` contains the raw value, the `displayValue` after enum mapping, the status, the config and the locale; a renderer returns a VNode or a `TableFieldRenderResult` carrying `tooltipText / status`. See [Field renderers](/en/guide/cell-render).

<<< @/.vitepress/type-declarations/features.ts#FieldRendererFields

<<< @/.vitepress/type-declarations/features.ts#RendererProtocol

### Lazy-loaded tree

`TableTreeLoadData<TRecord>` receives the node and a `TableTreeLoadContext`, and returns a Promise of the child record array. `isLeaf` marks terminal nodes; `onTreeLoadError` receives the error and the node. Retry is called through the table instance. See [Tree table](/en/guide/tree-table).

<<< @/.vitepress/type-declarations/features.ts#TreeFields

<<< @/.vitepress/type-declarations/features.ts#TreeLoadProtocol

### TableInstance / TableScrollToOptions

`TableInstance` is the minimal public protocol of the table instance obtained through a `ref`. It contains `scrollTo(options): Promise<boolean>`, `retryTreeLoad(key): Promise<boolean>` and `getTreeLoadError(key)`. The scroll options support `key / index / top / left / align / offset`; key takes precedence over index, and row positioning is limited to the currently loaded, visible page. See the [API Reference](/en/guide/api-reference).

<<< @/.vitepress/type-declarations/features.ts#TableInstanceProtocol

### Scope and disposal

`useTableQuery`, `useTableEdit` and `useTableRequest` should be created inside a component's `setup` or an `effectScope`; when that scope is disposed they stop watching and ignore stale async results. The editing and request protocols also abort the signal and settle pending operations; application requests made in query callbacks are cancelled by their own data layer. Unmounting the table itself invalidates lazy loading / retry, which then return `false`, and instance scrolling after unmount returns `false` as well. `createTableRenderers` creates a renderer map with no listeners, so it needs no extra disposal.

## Theme and plugin types

### ThemePresetName

Built-in theme preset names.

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

### VTableGuildOptions

The complete configuration of `createVTableGuild()`.

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

For when to use `cssMode` and `classPrefix`, see [Installation and usage](/en/guide/installation); for `compatClass`, see [Migrating from ant-design-vue](/en/guide/migration-from-antd#keeping-existing-override-css-compatibility-class-names).

### createVTableGuild

The configuration is optional; it returns a Vue `Plugin`.

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

### VTableGuildCssMode

The style mode must match the CSS entry you actually import.

<<< @/.vitepress/type-declarations/config.ts#VTableGuildCssMode

### LocaleName

Applications can register their own locale identifiers.

<<< @/.vitepress/type-declarations/config.ts#LocaleName

<<< @/.vitepress/type-declarations/config.ts#BuiltInLocaleName

### LocaleRegistry

The locale pack registry; use `locales` to register complete locale packs and `localeOverrides` for partial overrides.

<<< @/.vitepress/type-declarations/config.ts#LocaleRegistry

### VTableGuildLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableHeaderLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableFilterDropdownLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableEmptyLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLoadingLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableSelectionLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildPaginationLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildColumnSettingsLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildToolbarLocale

<<< @/.vitepress/type-declarations/config.ts#PaginationLocaleConstants

### DeepPartial

<<< @/.vitepress/type-declarations/config.ts#DeepPartial

### ThemeConfig

The raw structure passed to the theme system.

<<< @/.vitepress/type-declarations/config.ts#ThemeConfig

### SlotProps

The type of the per-instance `ui`; it keeps the slot keys of the concrete theme.

<<< @/.vitepress/type-declarations/config.ts#SlotProps

### ThemeOverrideConfig

The complete mapped type for global theme overrides. It keeps slot and variant keys and allows overriding them with any class string. The `Theme*` helper types inside the declaration block are not package exports.

<<< @/.vitepress/type-declarations/config.ts#ThemeOverrideConfig

### TableSlots and TableThemeConfig

`TableSlots` is the union of all Table theme slots; see the [ui slot reference](/en/guide/ui-slots-reference) for what each one does. Theme constants are imported from `@vtable-guild/vtable-guild`, and `typeof` keeps the preset's literals, readonly properties and variant mapping.

<<< @/.vitepress/type-declarations/config.ts#TableSlots

<<< @/.vitepress/type-declarations/config.ts#TableVariantProps

<<< @/.vitepress/type-declarations/config.ts#TableThemeConfig

Public theme types of the other components:

<<< @/.vitepress/type-declarations/config.ts#ComponentThemeTypes

<<< @/.vitepress/type-declarations/config.ts#PaginationSlots

<<< @/.vitepress/type-declarations/config.ts#PaginationThemeConfig

<<< @/.vitepress/type-declarations/config.ts#ColumnSettingsThemeTypes

<<< @/.vitepress/type-declarations/config.ts#ToolbarThemeTypes

### VTableGuildThemeOverrides

The built-in theme map as augmented by `@vtable-guild/theme`; applications can add further components through module augmentation.

<<< @/.vitepress/type-declarations/config.ts#VTableGuildThemeOverridesMap

<<< @/.vitepress/type-declarations/config.ts#VTableGuildThemeOverrides

### VTableGuildContext

The complete configuration passed through provide / inject; application code normally uses the plugin or the Provider directly.

<<< @/.vitepress/type-declarations/config.ts#VTableGuildContext

<<< @/.vitepress/type-declarations/config.ts#VTABLE_GUILD_INJECTION_KEY

### VTableGuildConfigProvider props

The following is a documentation helper interface, not a package export. The Provider only overrides these fields; `themePreset` and `compatClass` are inherited from the plugin context and cannot be switched through Provider props.

<<< @/.vitepress/type-declarations/config.ts#VTableGuildConfigProviderProps

### cn

Merges classes and resolves Tailwind conflicts; the result may be `undefined`. `CnClassValue` is a helper type that documents the parameter structure, not a package export.

<<< @/.vitepress/type-declarations/config.ts#cn

## Related pages

- [API Reference](/en/guide/api-reference)
- [ui slot reference](/en/guide/ui-slots-reference)
- [Three-layer theme overrides](/en/guide/theme-overrides)

## TablePaginationConfig / TablePaginationState

Complete declarations of the pagination config, state, position, layout and slots. `pagination.onChange` is a two-argument pagination callback; see [Pagination](/en/guide/pagination) for how it differs from the three-argument table `change`.

<<< @/.vitepress/type-declarations/table.ts#TablePaginationConfig

<<< @/.vitepress/type-declarations/table.ts#TablePaginationState

<<< @/.vitepress/type-declarations/table.ts#TablePaginationPosition

<<< @/.vitepress/type-declarations/table.ts#PaginationItemType

<<< @/.vitepress/type-declarations/table.ts#TablePaginationBuiltinLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayoutItem

<<< @/.vitepress/type-declarations/table.ts#TablePaginationLayout

<<< @/.vitepress/type-declarations/table.ts#TablePaginationSlotProps
