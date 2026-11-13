---
title: Server-side request management
description: Choose local, server-side or mixed processing and use useTableRequest to manage loading, refresh, request races and remote pagination.
---

# Server-side request management

`useTableRequest` is an optional composable that takes care of the request, the data, the loading state and controlled pagination. `VTable` displays the data and owns the interaction entry points,
and the refresh event of `VTableToolbar` calls the same `reload`. If your project already has a request management solution, you can keep passing the data and pagination state in directly.

## Choose where data is processed {#processing-modes}

Loading data from an API does not mean every table interaction needs a request. Decide who handles sorting, filtering and pagination before connecting the request entry point:

| Scenario                                                              | Table configuration                               | Request connection                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| The API sorts, filters and paginates                                  | Bind the Hook's `manual` and `pagination`         | Bind `@change="onChange"` to send all three actions through the Hook                    |
| The API returns all records; the browser sorts, filters and paginates | `manual: false` with independent local pagination | Use only the Hook's data, loading and refresh capabilities; do not bind its `onChange`  |
| Some actions are local and others use the API                         | Configure each field of the `manual` object       | Route events by `extra.action` and manage local state separately from remote conditions |

| Setting                     | Meaning                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component `manual`          | `true` skips all local computation; the object controls `sort`, `filter` and `pagination` separately, with omitted fields treated as `false`. Interactions and `change` events remain available; it does not send requests |
| Hook return value `manual`  | The fixed, read-only plain object `{ sort: true, filter: true, pagination: true }` for the fully remote setup. It is not a ref, needs no `.value`, and is optional to use                                                  |
| Hook option `manualRequest` | Skips only the initial automatic request; it does not decide whether later sorting, filtering or page changes send requests                                                                                                |

The Hook freezes its `manual` object with `Object.freeze`. In the fully remote setup it is equivalent to the component's `:manual="true"`, avoiding another round of local processing on API results. The current Hook has no options to enable or disable requests for each of the three actions independently.

::: warning Computation and request switches are separate
Changing only the component to `:manual="{ ...manual, pagination: false }"` while keeping the Hook's `@change="onChange"` still sends page changes through the request flow. A mixed setup must also adapt event connections, state management and request parameters.
:::

## Fully remote sorting, filtering, pagination and refresh

Bind the `manual`, `dataSource`, `pagination` and `loading` returned by the composable to the table, and bind `@change="onChange"` only once.
`manual` skips local sorting, filtering and pagination slicing, and keeps the record order returned by the server.

The server in the example simulates requests with in-memory data and a 250ms delay; the request counter lets you check that searching, paging and refreshing do not fire duplicate requests.
The sort and filter state is also bound to the column config, so the header is restored as well after the query is reset.

<Demo src="pagination/request">

<<< @/demos/pagination/request.vue

</Demo>

Do not also bind a request function to `pagination.onChange`. The table's `change` already includes pagination events; `action: 'select'` is ignored, so selecting records does not query again.

## Load all records, then process locally {#local-data}

When an API returns 20 records and each page shows 10, VTable can automatically split them into two local pages. This example uses only the Hook's data, loading state and refresh capability; the table filters and sorts before paginating. Changing pages or page size, sorting and filtering do not increase the request count. Refresh explicitly loads the records again.

<Demo src="pagination/local-request">

<<< @/demos/pagination/local-request.vue

</Demo>

- The full-data API ignores the Hook's `current` and `pageSize` and returns `{ data: rows, total: rows.length }`; the Hook does not slice the returned array into one page.
- The table uses `manual: false` and its own `{ defaultPageSize: 10 }`, without binding the Hook's `pagination`, `manual` or `onChange`.
- Omit the local pagination `total` so the component uses the filtered record count. Without `current` and `pageSize`, the component maintains those values internally.
- Columns do not bind the Hook's `sort` or `filters`; the table owns their state. `sorter: true` provides the default comparator, while a `filters` array works with `onFilter` to match records locally.

With this setup, `reload(true)` and `submit()` set the Hook's page to 1, and `reset()` also clears the Hook's sort and filters. These methods do not directly control the table's internal page or headers. A shorter result can still clamp the table's effective page; to explicitly reset them together, manage controlled local pagination and column state separately.

Changes to `params`, polling and explicit `reload()` calls remain independent request entry points. Omitting the table's `onChange` connection only means local interactions do not request through that entry point.

## Mixed processing: remote filtering, local sorting and pagination {#mixed-data}

The next example sets `manual` to `{ filter: true }`: the table skips local filtering while still sorting and paginating the complete API result. Application code forwards only filter events into the Hook's reactive `params`, whose changes trigger requests. Sorting and pagination update local state without calling the Hook's `onChange`.

<Demo src="pagination/mixed-request">

<<< @/demos/pagination/mixed-request.vue

</Demo>

Change pages or sort first: the request count should stay unchanged. Changing a filter loads the complete result for that condition and resets the local page to the first page. The demo's reset action restores both the application-owned conditions and the table state.

For other combinations, decide all of the following together:

- **Request triggers**: route `sort`, `filter` and `paginate` through `extra.action`; selection events do not need a query.
- **Request parameters**: send only the conditions handled remotely. Snapshots of local sort or filter state can appear in other table events too, so do not forward the entire event directly to the request layer.
- **State updates**: application code must accept updates to controlled `sortOrder`, `filteredValue` or pagination. Controlled state does not imply remote processing; local state still needs updates when no request is sent.
- **Data scope**: local pagination requires the complete result for the current query. With remote pagination, local sorting and filtering affect only the loaded page and cannot change results on other pages.
- **Totals**: use the locally processed count for local pagination and the server's `total` for remote pagination. Do not use an unfiltered server total for pagination after local filtering.

This routing is application code, not a new `manual` or `remote` option on the Hook. Switching modes at runtime also requires coordinating page and header state, and loading all records when switching from remote to local pagination.

## Params and state

`request(params, sort, filters, { signal })` returns `{ data, total, success? }`.
`data` must be an array of records and `total` must be a non-negative safe integer; explicitly returning `success: false` enters the error state.
Pass `signal` to `fetch` or to an HTTP client that supports AbortSignal to cancel the underlying request; even if the client does not honor the cancellation, a stale response never overwrites a newer result.

```ts
import { ref } from 'vue'
import { useTableRequest } from '@vtable-guild/vtable-guild'

interface Order {
  key: string
  amount: number
}
interface Query {
  keyword: string
  tenant: string
}

const tenant = ref('default')
const orders = useTableRequest<Order, Query>({
  defaultParams: { keyword: '' },
  params: () => ({ tenant: tenant.value }),
  async request(params, sort, filters, { signal }) {
    const response = await fetch('/api/orders/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, sort, filters }),
      signal,
    })
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    return response.json() as Promise<{ data: Order[]; total: number }>
  },
})

// The query draft is owned by the application and only enters the request once submitted.
await orders.submit({ keyword: 'invoice' })
```

Params are merged in the order `defaultParams → submitted query → params`, with later ones overriding earlier ones. `params` accepts a plain object, a ref or a getter;
when it actually changes, the request returns to page 1 and runs again, while replacing it with a structurally equal value does not reset the page. Submitted values are stored as a snapshot, so later changes to the application draft do not directly change the request.

`beforeSearchSubmit` receives the merged query params and can transform fields or date ranges. The composable writes the controlled `current` and `pageSize` last,
so query params cannot override these two pagination fields. `postData` can transform the returned row data, but does not change the server total.

The sort param prefers `sorter.field`, joining nested paths with dots, for example `['address', 'city'] → 'address.city'`; when there is no field, columnKey is used.
Multi-column sorting builds the map in the order provided by the table. Filters keep strings, numbers, booleans and `null`; they are not all converted to strings.

## Refresh, submit, reset and cancel

<!-- @api: reference request-methods -->

The async methods complete once the current request finishes, is superseded by a newer request or is cancelled. Request failures are exposed through `error` and `onError`; the methods do not reject because of an HTTP failure,
which makes them suitable for wiring directly to refresh events. Fields not passed to `reset(params)` still fall back to `defaultParams` following the param merge order. `reset()` / `reset(params)` change the request state; if the header icons should reset in sync, bind the returned `sort` and `filters` to the controlled column config, as in the example above.

By default the first request is sent automatically; `manualRequest: true` skips only the first request, and later submits, param changes or refreshes still send requests. It is a different concept from the table's `manual` switch for local computation.

## Page number and error recovery

- Paging keeps the requested page; changes to the search, the extra params, sorting or filtering return to page 1.
- Changing the page size returns to page 1 by default; `resetOnPageSizeChange: false` keeps the requested page. This is the policy of the request composable; the behavior of basic pagination itself keeps its existing contract.
- While loading and after a failure, the last successful data and total are kept, so the pager does not jump back to the first page because of a temporarily empty array.
- When a successful result shows that the current page is out of range, at most one follow-up request is sent for the new last page; when total is 0, it goes straight back to page 1. The follow-up request is protected against cancellation and races in the same way and is not retried in a loop.
- Requests are cancelled once the component scope is disposed; later responses do not update the state and do not trigger success or failure callbacks.
- Repeated table events for the same query are merged; `reload()` can be merged with an in-flight request that has the same params, while `submit()` and `reset()` still send a request explicitly.

## Automatic refresh

<Demo src="pagination/polling">

<<< @/demos/pagination/polling.vue

</Demo>

`polling` is off by default. Pass an interval in milliseconds or `(rows) => number | false`, or wrap it in a ref to switch it on and off dynamically.
The interval is counted from the completion of the previous request, and positive values have a minimum of 2000ms; 0, false or a non-finite value turns polling off.
The callback receives a snapshot of the most recent successful row data and can return false once all tasks are done.

The first request uses `loading`, and automatic requests after a successful load use `refreshing`; bind `loading` to the table
and `loading || refreshing` to the toolbar to keep the row data without flashing the full-table mask. A manual reload still uses the regular loading.
Automatic refresh uses the submitted params and the current page, sorting and filtering; it does not submit the application's query draft or reset selection / expansion.

By default polling is no longer scheduled while the page is hidden, and the timer restarts once the page is visible again; `pollingWhenHidden: true` keeps polling in the background.
`revalidateOnFocus: true` refreshes immediately when the page becomes visible again (it listens to visibilitychange, not to every window focus event).
When becoming visible, polling and a manual reload overlap, the requests are merged. A request already sent while hidden may complete; further scheduling is paused.

By default polling stops after a failed request and keeps the data and the error; reload or `resume(true)` retries, and `pollingOnError: true` continues at the interval.
`pause()` is suited to editing sessions; `paused` indicates an explicit pause and is not changed by the page being hidden or by a dynamically returned false.
After cancel, automatic refresh only comes back once you resume; manual submit, paging and reload remain available while paused.
Before the first request with `manualRequest: true`, neither polling, becoming visible nor resume triggers a load.
Automatic scheduling is enabled only inside a setup/effectScope in the browser, and disposal cleans up the timer, the listener and the in-flight request.

If onError itself throws, that exception is stored in error; the request Promise still settles normally and loading/refreshing are reset.

## API

### useTableRequest options

<!-- @api: reference request-options -->

### useTableRequest return value

Besides the state in the table below, it also returns the methods in [Refresh, submit, reset and cancel](#refresh-submit-reset-and-cancel).
Destructure the refs you need before using them in the template; refs nested in a plain object are not automatically unwrapped in every template expression.

<!-- @api: reference request-return -->

The option and return types are all imported from `@vtable-guild/vtable-guild`: `UseTableRequestOptions`, `UseTableRequestReturn`,
`TableRequest`, `TableRequestParams`, `TableRequestSort`, `TableRequestContext`, `TableRequestResult`, `TableRequestPolling`.

General request caching, automatic retry backoff and the like are still composed as needed by the application's request solution; `pollingOnError` only controls the next polling round and is not a general retry engine.

### VTable Props

<!-- @api: props remote-data -->

### VTable Events

<!-- @api: events remote-data -->

## Theming

`useTableRequest` manages the request state. The styles below apply to the loading and empty states of the VTable that consumes that state, and can be overridden with the per-instance `ui` or the global `theme.table.slots`.

### ui slots

<!-- @api: ui remote-data -->

### Preset defaults

<!-- @api: theme remote-data -->

### CSS variables

<!-- @api: css-vars remote-data -->
