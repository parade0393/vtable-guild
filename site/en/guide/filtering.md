# Filtering

Filtering is made up of filters, onFilter, filteredValue and defaultFilteredValue on the column, together with the filter panel configuration.

For users, the most important thing is to tell two modes apart first: in one the component maintains the state internally, and in the other the state is fully controlled from outside the page.

## Live demo

Multi-select filtering, single-select filtering (`filterMultiple: false`), filtering with a search box (`filterSearch`) and default filter values all appear in one table.

<Demo src="filtering/basic">

<<< @/demos/filtering/basic.vue

</Demo>

## Basic example

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  status: 'active' | 'paused'
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada', status: 'active' },
  { key: '2', name: 'Grace', status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" />
</template>
```

A `filters: [...]` array provides choices; local filtering also needs `onFilter`, as in the example above. Listing choices alone does not match records automatically. You can also use `onFilter: true` for built-in matching, or `filters: true` to generate choices from `valueEnum` and match them.

## Controlled and uncontrolled

- defaultFilteredValue only takes effect on the first render and suits simple default filtering.
- filteredValue puts the column into controlled mode, where the filter state is managed entirely from outside.
- filterResetToDefaultFilteredValue controls whether "Reset" returns to the default value instead of clearing directly.

## Filter combination rules

- Multiple values selected in the same column are combined with OR.
- Different columns are combined with AND.
- The change event returns a filters snapshot of all columns, which suits syncing query conditions.
- On tree data only top-level records are evaluated: `onFilter` does not recurse into `children`, a matching parent brings all of its children along, and a parent that does not match has its whole subtree removed. See [Tree table](/en/guide/tree-table#known-limitations) for details.

When you declare the event handler separately, you can take its signature from the public event interface, and the parameters are typed automatically:

```ts
import { ref } from 'vue'
import type { TableFiltersInfo, VTableEventProps } from '@vtable-guild/vtable-guild'

// Reuse the UserRow above; bind @change="handleChange" on the table.
const activeFilters = ref<TableFiltersInfo>({})
const handleChange: NonNullable<VTableEventProps<UserRow>['onChange']> = (filters) => {
  activeFilters.value = filters
}
```

`filters` is a `TableFiltersInfo` keyed by column key; each value is `(string | number | boolean)[] | null`, where `null` means the column has no filter value. The first argument of `onFilter`, in contrast, is a single `string | number | boolean` value, and the second argument keeps the `UserRow` type.

## Custom filter panel

If the default filter panel is not enough, there are two ways to extend it:

- customFilterDropdown, which takes over through a table-level slot.
- filterDropdown, which defines a custom panel directly on a single column.

In addition, you can use:

- filterSearch, to add search to the filter items.
- filterMode: 'tree', to render the filter items as a tree.

The parameters of a custom panel use `CustomFilterDropdownSlotProps<UserRow>`: `setSelectedKeys` receives an array of filter values, and the optional arguments of `confirm` and `clearFilters` control the confirm and close behavior respectively. See the declarations at the end of the page for the full signatures.

### Selects and date pickers inside the panel

`a-select` and `a-date-picker` from ant-design-vue / antdv-next, and `el-select` and `el-date-picker` from Element Plus, mount their own dropdowns on `document.body` by default. The table treats clicks inside these dropdowns as clicks outside the panel, so the filter panel closes as soon as an option is selected. Render the nested popup inside the panel instead: set `getPopupContainer` for ant-design-vue / antdv-next, and `:teleported="false"` for Element Plus.

```vue
<script setup lang="ts">
// Reuse the UserRow and dataSource above; the status column changes to customFilterDropdown: true.
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]
// Mount the dropdown on the trigger's parent element, that is, inside the filter panel.
const insidePanel = (trigger: HTMLElement) => trigger.parentElement ?? document.body
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource">
    <template #customFilterDropdown="{ selectedKeys, setSelectedKeys, confirm, clearFilters }">
      <!-- The nested dropdown opens inside the panel; min-height reserves space for it -->
      <div style="padding: 8px; width: 200px; min-height: 160px">
        <!-- Element Plus: <el-select :teleported="false" ...> -->
        <a-select
          :value="selectedKeys[0]"
          :options="statusOptions"
          :get-popup-container="insidePanel"
          style="width: 100%"
          @update:value="(value) => setSelectedKeys(value == null ? [] : [String(value)])"
        />
        <a-button size="small" @click="clearFilters()">Reset</a-button>
        <a-button size="small" type="primary" @click="confirm()">OK</a-button>
      </div>
    </template>
  </VTable>
</template>
```

The nested dropdown is then positioned inside the panel, and the part that extends beyond the panel is clipped by the panel's scroll area, which is why the example sets `min-height` on the panel content. Adjust the height to the number of options, or reduce the dropdown height (for example with `list-height` on `a-select`).

### How outside clicks are detected

The filter panel, the row selection menu, the column settings and density menus, and the page-size dropdown share the same popup logic. Since 2.9.0-alpha.5, a popup listens for `mousedown` / `touchstart` in the capture phase on `document` to detect outside clicks; a `stopPropagation()` in an external control (such as `@mousedown.stop`) runs after the detection and cannot stop it, so the open popup closes all the same. Earlier versions listened in the bubble phase, where stopping propagation kept the popup open, so watch out for this pattern when upgrading. Put the controls that have to work together with the panel inside the panel; the filter panel can also switch to a controlled `filterDropdownOpen`: an outside click only triggers `onFilterDropdownOpenChange(false)`, and whether to close is up to you.

## When to use controlled mode

Using filteredValue directly is recommended in the following scenarios:

- The filter conditions need to be synced to the URL.
- The page query is driven by an API, and the table is only responsible for showing the current result.
- Several filter controls need to interact with each other.

## Clearing and controlled state

`filteredValue: undefined` uses the internal uncontrolled state; `null` and `[]` both mean controlled with no filter value. When controlled, confirming, resetting or clearing submits the filter values requested by this operation through the `filters` argument of `change`. The table filters the data by the new value only after the parent component updates `filteredValue`.

`filterResetToDefaultFilteredValue: true` makes reset restore `defaultFilteredValue`; otherwise it clears. When a custom panel calls `clearFilters()`, it submits the reset result once and requests the panel to close. To reset only the draft and keep the panel, pass `clearFilters({ confirm: false, closeDropdown: false })`. `confirm({ closeDropdown: false })` submits and keeps the panel.

## Remote filtering and mixed processing {#remote-filtering}

The table's `manual.filter: true` skips local filtering while keeping the controls, state and events. Application code updates remote conditions and requests when `extra.action === 'filter'`. A column's `onFilter: false` also skips its local computation. Neither setting sends a request.

`filteredValue` determines who owns the filter state; `manual.filter` determines whether local filtering runs. They are independent: controlled state does not automatically disable local filtering, and application code must still update `filteredValue` for an external reset.

See [Choose where data is processed](/en/guide/remote-data#processing-modes) and [Remote filtering with local sorting and pagination](/en/guide/remote-data#mixed-data). Local filtering with remote pagination only affects the loaded page; for the complete data set, see the [full-data example](/en/guide/remote-data#local-data). For `valueEnum` and automatic choices, see [Cell display and enums](./cell-display.md).

## API

`TRecord` is your application's row type. The tables below list only the filtering-related configuration; for all props see the [API Reference](/en/guide/api-reference).

### Props

<!-- @api: props filtering -->

### Column fields

<!-- @api: columns filtering -->

### Events

<!-- @api: events filtering -->

When filtering triggers, `extra.action` is `'filter'`, and `filters` is the filter snapshot of all columns, keyed by column key.

### Slots

<!-- @api: slots filtering -->

The column-level `filterDropdown` and `filterIcon` take precedence over the table-level slots.

## Theming

To change only colors and sizes, override the [CSS variables](#css-variables) first; to change classes, use the per-instance `ui` or the global `theme.table.slots`. For how to choose between the three, see [Three-layer theme overrides](/en/guide/theme-overrides).

### ui slots

<!-- @api: ui filtering -->

### Preset defaults

The default classes of the two presets on the slots above, given in the structure of `createVTableGuild({ theme })`; copy and modify them as needed. Override values are merged with the defaults through `cn()`. In the default precompiled mode these utilities carry the `vtg-` prefix at runtime; for the override rules see [Utility prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme filtering -->

### CSS variables

The tables show the default values in light mode; dark mode overrides them separately under `.dark`. The popup variables are shared by table popups such as the filter panel and the bulk selection menu.

<!-- @api: css-vars filtering -->

## Type Declarations

Filter values support `string | number | boolean`. The declarations below include the column configuration, the custom panel and the table events. The column configuration is an excerpt of the related fields; `FilteringColumnFields` is a documentation helper interface, not a package export. For the complete declarations see the [Type reference](/en/guide/type-reference).

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#ColumnFilterItem

<<< @/.vitepress/type-declarations/features.ts#FilteringColumnFields

<<< @/.vitepress/type-declarations/table.ts#CustomFilterDropdownSlotProps

<<< @/.vitepress/type-declarations/table.ts#TableFiltersInfo

<<< @/.vitepress/type-declarations/table.ts#TableChangeExtra

<<< @/.vitepress/type-declarations/table.ts#VTableEventProps

:::

## Related pages

- [Sorting](/en/guide/sorting)
- [API Reference](/en/guide/api-reference)
- [Type reference](/en/guide/type-reference)
- [ui slot reference](/en/guide/ui-slots-reference)
