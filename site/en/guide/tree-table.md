# Tree table

When your data naturally has a parent-child hierarchy, use a tree table rather than expandable rows. A tree table manages how multi-level nodes are displayed based on `childrenColumnName`, the indent width and the expand state.

## Live demo

A three-level organization tree with controlled expansion (`expandedRowKeys` + `onExpandedRowsChange`); checking a parent node also checks its child nodes.

<Demo src="tree-table/basic">

<<< @/demos/tree-table/basic.vue

</Demo>

## Basic example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VTable,
  type Key,
  type TableColumnsType,
  type TableProps,
} from '@vtable-guild/vtable-guild'

interface OrgNode {
  key: string
  name: string
  children?: OrgNode[]
}

const columns: TableColumnsType<OrgNode> = [{ title: 'Department', key: 'name', dataIndex: 'name' }]
const treeData: OrgNode[] = [
  { key: 'team', name: 'Product team', children: [{ key: 'design', name: 'Design group' }] },
]
const expandedRowKeys = ref<Key[]>(['team'])
const handleExpandedRowsChange: NonNullable<TableProps<OrgNode>['onExpandedRowsChange']> = (
  keys,
) => {
  expandedRowKeys.value = keys
}
</script>

<template>
  <VTable
    row-key="key"
    :columns="columns"
    :data-source="treeData"
    children-column-name="children"
    :indent-size="20"
    :expanded-row-keys="expandedRowKeys"
    @expanded-rows-change="handleExpandedRowsChange"
  />
</template>
```

In `TableProps<OrgNode>`, `onExpand` has the signature `(expanded: boolean, record: OrgNode) => void`, and `onExpandedRowsChange` receives `Key[]`. When you declare a callback separately, use `NonNullable<TableProps<OrgNode>['onExpandedRowsChange']>` to keep the interface type and drop the `undefined` of the optional property.

## Common controls

- `childrenColumnName`
  Sets the field name of the child nodes
- `indentSize`
  Controls the indent width of each level
- `defaultExpandedRowKeys`
  Sets the nodes expanded by default
- `expandedRowKeys`
  Switches to a fully controlled expand state
- `rowSelection.checkStrictly`
  Controls whether parent and child selection are linked
- `virtual`
  Tree data can use virtual scrolling, with the expand state maintained by the component; see [Virtual scrolling](/en/guide/virtualization)

## When to use

- The data itself has a parent-child hierarchy, rather than attached details
- You need to handle node expansion, indentation and parent-child selection in one place
- The page has a tree structure and you still want to keep the column definitions and interactions of a regular table

## Lazy loading, failure and retry

Configure `loadData(record, { signal }) => Promise<TRecord[]>` and `isLeaf(record)`. The interaction keeps the expand pattern of the Ant Design tree table: after you click to expand, an inline loading state is shown; on failure the error icon stays, and clicking again retries. `onTreeLoadError(error, record)` can be wired to your application's message notifications.

<Demo src="tree-table/lazy">

<<< @/demos/tree-table/lazy.vue

</Demo>

- Concurrent loads of the same node are merged into one request; successful results are cached by the stable key and the identity of the original record.
- Collapsing does not cancel the request; the response is cached but the node is not expanded again. Controlled `expandedRowKeys` are still updated by the application; nodes expanded by default are loaded too.
- A node becomes a leaf after an empty array is returned. Existing children are used directly; the component does not modify the input dataSource.
- When a node is removed, a record with the same key is replaced, the loader or the children field changes, or the component unmounts, the old request is invalidated and its signal is aborted. After a record is replaced, it is loaded again when needed.
- When the application adds a children array to the same record, the application data wins and the node's old request, cache and error are cleared; removing that array does not restore the old cache. Deep children replacements in reactive data follow the same rule.
- Invalidation and unmounting immediately make pending loads / retries return `false`, even if the underlying client ignores the signal. If the error notification callback itself throws or rejects asynchronously, it does not overwrite the original load error, nor does it turn the retry Promise into a rejection.
- Loaded child nodes take part in parent-child selection and virtualization just like regular children; a parent node's selection state is recalculated from the child nodes loaded so far and does not mean that all descendants not yet loaded from the server are selected.
- Filtering and sorting still handle only the top level. Pagination paginates root nodes only; child nodes follow their parent.
- The instance method `retryTreeLoad(key)` retries programmatically; `getTreeLoadError(key)` reads the error.

## Known limitations

- **Lazy loading needs stable keys**: do not use the row index. A record that declares `children: []` is treated as a leaf; a record without children is decided by `isLeaf(record)` and can still be loaded when it is not declared a leaf.
- **Filtering and sorting apply only to top-level records**: the data pipeline is `dataSource → filter → sort → expand`, and `onFilter` does not recurse into `children`. When a parent node matches, all of its child nodes are kept (even if the child nodes themselves do not match); when a parent node does not match, its whole subtree is removed with it (even if some child nodes match). Sorting works the same way: only root nodes are reordered, and the order among child nodes stays unchanged. To filter or sort by level, process the data in your application first and then pass it in.

## API

`TRecord` is the application row type. See the [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props tree-table -->

### RowSelection

<!-- @api: row-selection tree-table -->

## Theming

The expand, loading and retry styles of tree nodes can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui tree-table -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how to override utilities in the default precompiled mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme tree-table -->

### CSS variables

The table lists the defaults in light mode. Dark mode can be overridden separately under `.dark`.

<!-- @api: css-vars tree-table -->

## Type Declarations

The tree configuration belongs directly to `TableProps<TRecord>`, and parent-child selection belongs to `RowSelection<TRecord>`. The children field in a record is declared by the application type; the default field name is `children`. The props are an excerpt of the relevant fields; `TreeFields` is a documentation helper interface, not a package export. See the [Type reference](/en/guide/type-reference) for the full declarations.

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/features.ts#TreeFields

<<< @/.vitepress/type-declarations/table.ts#RowSelection

:::

## Related pages

- [Row selection](/en/guide/selection)
- [Expandable rows](/en/guide/expandable-rows)
- [Table instance](/en/guide/table-instance)
