---
title: Server-side request management
description: Use useTableRequest to combine server-side sorting, filtering, pagination and refresh, and to handle loading state, request races and falling back from an out-of-range remote last page.
---

# Server-side request management

`useTableRequest` is an optional composable that takes care of the request, the data, the loading state and controlled pagination. `VTable` displays the data and owns the interaction entry points,
and the refresh event of `VTableToolbar` calls the same `reload`. If your project already has a request management solution, you can keep passing the data and pagination state in directly.

## Sorting, filtering, pagination and refresh

Bind the `manual`, `dataSource`, `pagination` and `loading` returned by the composable to the table, and bind `@change="onChange"` only once.
`manual` skips local sorting, filtering and pagination slicing, and keeps the record order returned by the server.

The server in the example simulates requests with in-memory data and a 250ms delay; the request counter lets you check that searching, paging and refreshing do not fire duplicate requests.
The sort and filter state is also bound to the column config, so the header is restored as well after the query is reset.

<Demo src="pagination/request">

<<< @/demos/pagination/request.vue

</Demo>

Do not also bind a request function to `pagination.onChange`. The table's `change` already includes pagination events; `action: 'select'` is ignored, so selecting records does not query again.

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
