# Table instance

Get the `TableInstance` through a template ref and call `scrollTo({ key, index, top })`. The arguments follow the positioning approach of the Table underlying ProTable, and add horizontal position, alignment and explicit result feedback.

```ts
import { ref } from 'vue'
import type { TableInstance } from '@vtable-guild/vtable-guild'

const table = ref<TableInstance>()
const found = await table.value?.scrollTo({ key: 'order-20', align: 'top' })
await table.value?.scrollTo({ top: 0, left: 0 })
```

Bind `ref="table"` to `VTable`; the normal body and the virtual body use the same interface. See [TableScrollToOptions](#tablescrolltooptions) for the arguments.

It returns `Promise<boolean>`: true when the scrollable container and the target are found; false when the table is not mounted, the arguments are invalid or the target does not exist. For variable row heights the virtual list uses its existing measurement and correction mechanism; the Promise means the positioning has been submitted, and does not guarantee the final pixel position after images load asynchronously later.

Positioning covers the records that are loaded and visible on the current page. Rows on other pages, rows removed by filtering and rows inside a collapsed tree return false; the application switches pages, expands or loads first, then positions after the next render. It does not walk remote data automatically to find a record.

## Lazy loading errors and retry

`getTreeLoadError(key)` returns the current load error or undefined; `await retryTreeLoad(key)` retries a node in an already loaded page and returns whether it succeeded, without changing the expanded keys. Clicking the error icon retries as well. Cached nodes that loaded successfully are not requested again.

<Demo src="tree-table/lazy">

<<< @/demos/tree-table/lazy.vue

</Demo>

## API

After getting the `TableInstance` through a template ref, you can call the following methods.

### Instance methods

<!-- @api: reference instance-methods -->

### TableScrollToOptions

The arguments of `scrollTo`. Provide at least one of `key`, `index`, `top` and `left`.

<!-- @api: reference scroll-to-options -->

## Type Declarations

::: details View type declarations

<<< @/.vitepress/type-declarations/features.ts#TableInstanceProtocol

:::
