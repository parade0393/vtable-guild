---
title: Remote dictionaries
description: Share remote enums, option search and dependency params, and tell complete filter sets apart from partial candidate options.
---

# Remote dictionaries

`createTableDictionary` creates an explicitly shared dictionary instance, and `useTableDictionary` connects it to Vue state.
One result can feed the cell `valueEnum`, the header `filters` and the Select controls your project already has.
Dictionary requests are independent of the row data requests of `useTableRequest`, and no request or watcher is created per cell.

<Demo src="dictionary/basic">

<<< @/demos/dictionary/basic.vue

</Demo>

## Defining and connecting

```ts
const dictionary = createTableDictionary<{ region: string }>({
  key: 'owners',
  request: async (params, { keyword, signal }) => {
    const response = await fetch(
      `/api/owners?region=${encodeURIComponent(params.region ?? '')}&q=${encodeURIComponent(keyword)}`,
      { signal },
    )
    if (!response.ok) throw new Error('Failed to load owners')
    // Returns { options: [{ value: 1, label: 'Chen Jia' }], complete: false }
    return response.json()
  },
})
const owners = useTableDictionary({
  dictionary,
  params: () => ({ region: region.value }),
  selectedOptions: () => selectedOwners.value,
  debounceTime: 200,
})
// Read them inside computed columns; options can be passed straight to a-select / el-select.
const columns = computed(() => [
  {
    dataIndex: 'ownerId',
    valueEnum: owners.valueEnum.value,
    filters: owners.filters.value,
  },
])
```

Each element of `options` is `{ value, label, status?, disabled? }`; label is a string, and value can be a string, a finite number or a boolean.
The `valueEnum` provided as a Map preserves the difference between `1`, `'1'` and `false`; unknown values still fall back to the table's raw value.
Complex custom labels are handled by the host control's slots or by a cell renderer.

## Complete dictionaries and search results

The request must return `complete`. Only a successful result with `complete: true` and an empty keyword produces `filters`; in every other case it is `[]`.
**Do not use `filters: true` with remote search results**: the known labels do not represent the complete filter set.
To show both a complete header filter and remote search, use two composables that share the same dictionary, as in the example.

`options` holds the candidate options of the current request and never mixes in selected options; `valueEnum` keeps the labels known under the current dependency params
and merges in `selectedOptions`, and a complete result replaces the labels accumulated by earlier searches. Currently loaded labels take precedence over stale labels provided from outside.
If the host Select needs the selected options to appear in the options array, the application merges the currently selected items with `options`.

A change to `params` cancels the current subscription, clears the keyword / old candidate options / known labels, and then reloads;
it does not modify the application's selected values. In cascading scenarios the application can clear the downstream selection explicitly; pass `selectedOptions` when you want the old selection to keep displaying.

## Sharing, caching and cancellation

- A single dictionary instance merges in-flight requests by dependency params and keyword; successful results are cached for 5 minutes by default, and at most 50 entries are kept.
- `key` is a stable application identifier; two independent instances with the same name are still isolated. Sharing relies on passing the instance explicitly rather than on a process-level global registry; in SSR, create the instance inside the setup/provider of each request.
- Each subscription has its own signal; one control cancelling or unmounting does not cancel other subscriptions, and the underlying request is aborted only when the last subscription leaves. A stale response is never written into newer state, even if it ignores the signal.
- `reload()` skips the completed cache immediately but still reuses an identical in-flight request; errors are not cached. `dictionary.invalidate()` forgets all caches without actively refreshing the controls; existing subscriptions may complete, but their results do not re-enter the cache.
- A refresh updates the state of the current composable; other completed subscriptions are not rewritten by a broadcast. When they need refreshing, call `reload()` on the relevant subscriptions; requests made at the same moment are merged.

## API

The value types of a host Select follow its own protocol. For example, the Ant Design Vue Select does not accept boolean values; when connecting a boolean dictionary, the application should use a reversible control value mapping and restore the original type on submit. Do not merge `false` and `'false'`, or `1` and `'1'`, into the same dictionary key.

### createTableDictionary options

`createTableDictionary(options)` creates a dictionary instance.

<!-- @api: reference dictionary-create-options -->

### Dictionary instance

<!-- @api: reference dictionary-instance -->

### useTableDictionary options

<!-- @api: reference dictionary-use-options -->

### useTableDictionary return value

<!-- @api: reference dictionary-return -->

### TableDictionaryOption

The elements of `options` and `selectedOptions`.

<!-- @api: reference dictionary-option -->

The composable's search/reload return true on success and false on failure, cancellation or unmount; a failure also updates error and calls onError. If onError itself throws, that exception is stored in error and the returned Promise still settles normally.
`manualRequest` skips only the first request; later dependency param changes still load. Create it inside setup or an effectScope so that it is cleaned up automatically.

The public types are `TableDictionaryOption`, `TableDictionaryResult`, `TableDictionaryContext`, `TableDictionaryRequest`,
`CreateTableDictionaryOptions`, `TableDictionary`, `UseTableDictionaryOptions`, `UseTableDictionaryReturn`.

### VTable Column fields

<!-- @api: columns dictionary -->

## Theming

A dictionary provides option and label data. When dictionary labels are displayed in the table as enum statuses, they use the table slots and CSS variables below; the appearance of the query area and of editing controls is determined by the corresponding components.

### ui slots

<!-- @api: ui dictionary -->

### Preset defaults

<!-- @api: theme dictionary -->

### CSS variables

<!-- @api: css-vars dictionary -->

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#DictionaryProtocol

:::
