---
title: Selection alert
description: Use VTableSelectionAlert to show the cross-page selected count, clear a controlled selection and compose batch actions.
---

# Selection alert

`VTableSelectionAlert` shares the controlled `selectedRowKeys` with the table. It shows the count based on the keys and provides a clear control and a slot for application actions. You can place it above the table, in the toolbar extension row or in a pagination content slot.

## Cross-page batch actions

The example below simulates remote pagination with two pages of data. Check records on both pages and you will see that the selected count includes records that are not currently loaded, while `selectedRows` in the slot contains only the loaded records passed in by the application. Batch actions use the keys and do not depend on whether the current page's data is complete.

<Demo src="selection-alert/basic">

<<< @/demos/selection-alert/basic.vue

</Demo>

The alert counts controlled `selectedRowKeys`, so it can show keys retained by application code across pages even without preserve enabled on the table. Set `preserveSelectedRowKeys: true` on the table if its selection callbacks need to return selected records from earlier pages. The alert slot's `selectedRows` comes from the alert's prop of the same name; it does not automatically read the table's record cache. Application code can pass the selected rows returned by table callbacks to the alert. If `selectedRows` is omitted, the slot receives an empty array. See [Pagination and cross-page selection](/en/guide/selection#pagination-and-cross-page-selection).

The alert never requests other pages on its own, and it does not turn "all loaded records selected" into "all results on the server". If your application needs to act on every result of a query, define a separate server-side selection protocol.

## Controlled state and clearing

```vue
<VTableSelectionAlert
  v-model:selected-row-keys="selectedRowKeys"
  :selected-rows="availableSelectedRows"
  :loading="batchLoading"
  @clear="handleClear"
>
  <template #actions="{ selectedRowKeys, disabled }">
    <a-button :disabled="disabled" @click="approve(selectedRowKeys)">Batch approve</a-button>
  </template>
</VTableSelectionAlert>
```

Clearing emits `update:selectedRowKeys([])` and then `clear(previousKeys, availableRows)`. Until the parent accepts the update, the displayed count stays at the value passed in. The component does not keep a second copy of the selection state, and it triggers neither the table's `change` event nor a refresh request.

`disabled` or `loading` disables the default clear control, and `disabled` in the slot reflects both states. Application buttons bind that value themselves. By default the whole alert is hidden when nothing is selected; `alwaysShow` displays the zero-selection state, in which the clear button is disabled.

## Visibility transitions

The alert uses a height expansion or collapse with a fade lasting about 180ms by default. Its height follows the actual content, including wrapped text and buttons; once the leave transition finishes, the alert no longer occupies space. Transitions run only when the alert changes between hidden and visible. Changes to the selected count update the content without replaying the transition.

If the alert needs spacing after toolbar buttons, place that spacing inside the alert's collapsible region so it disappears together with the alert:

```vue
<VTableSelectionAlert
  v-model:selected-row-keys="selectedRowKeys"
  style="--vtg-selection-alert-spacing-before: 16px"
/>
```

Use `--vtg-selection-alert-motion-duration` to adjust the duration; set it to `0s` to disable transitions. The component also respects the system's reduced-motion preference. `alwaysShow` keeps the alert visible, so clearing the selection does not collapse it.

## API

`TRecord` is the application row type.

### Props

<!-- @api: reference selection-alert-props -->

### Events

<!-- @api: reference selection-alert-events -->

### Slots

The default clear control governed by `showClear` sits in the action area on the right, together with `actions`.

<!-- @api: reference selection-alert-slots -->

### Slot Props

Both `info` and `actions` receive `TableSelectionAlertSlotProps<TRecord>`.

<!-- @api: reference selection-alert-slot-props -->

### VTable row selection options

<!-- @api: props selection-alert -->

## Themes and locales

Use `theme.selectionAlert.slots` globally and `ui` per instance.

The text follows the global locale and supports `localeOverrides.selectionAlert` and the per-instance `locale`. `{count}` in the `selected` text is replaced with the selected count, `label` is the name of the region and `clear` is the text of the clear button.

The classes and CSS variables below control the layout, text and clear control of the alert.

### ui slots

<!-- @api: ui selection-alert -->

### Preset defaults

<!-- @api: theme selection-alert -->

### CSS variables

<!-- @api: css-vars selection-alert -->

## Type Declarations

::: details Selection alert types

<<< @/.vitepress/type-declarations/selection-alert.ts

<<< @/.vitepress/type-declarations/config.ts#VTableGuildSelectionAlertLocale

<<< @/.vitepress/type-declarations/config.ts#SelectionAlertThemeTypes

:::
