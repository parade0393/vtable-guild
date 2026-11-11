---
title: Table virtual scrolling (100k rows)
description: vtable-guild has built-in vertical and horizontal virtual scrolling. With 100k rows it renders only the dozen or so DOM rows in the viewport and combines with variable row heights, fixed columns and sorting. Includes measured numbers and live demos.
---

# Virtual scrolling

Virtual scrolling is one of the vtable-guild enhancements most worth looking at first. For long-list pages its value is not "one more switch", but that you no longer need to maintain a separate table solution for large datasets.

## Live demo: 100k rows

The table below loads **100,000 rows** of real data by default (generated at runtime in the page, not a pagination illusion). Scroll it and notice that the DOM only ever holds the dozen or so rows in the viewport. The two left columns stay fixed, and the "Rating" column can still be sorted.

<Demo src="virtualization/large" :min-height="480">

<<< @/demos/virtualization/large.vue

</Demo>

## How to enable it

Virtual scrolling requires two conditions at the same time:

- `virtual` is `true`
- `scroll.y` provides a valid height

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ y: 400 }"
  :virtual="true"
/>
```

## Key boundaries

- Setting only `virtual` without `scroll.y` does not actually enable virtual scrolling
- `rowKey` needs to stay stable, otherwise state easily ends up on the wrong row when the scroll window is reused
- **Merging body cells is not supported**: the virtual body only renders the row nodes in the viewport, so cross-row merging gets misaligned. With `virtual` enabled, when a column has `customCell` / `customRender` (which may return `rowSpan` / `colSpan`), dev builds warn and `virtualColumn` is ignored as a result; see [Grouped headers and merged cells](/en/guide/grouped-and-merged-cells#usage-boundaries) for details
- Virtual scrolling improves rendering performance; it does not replace server-side pagination, slow query optimization or optimizing computations over large objects

## Fixed-height fast path `rowHeight`

The default path supports **variable row heights**: each row's height is measured after it mounts, and the viewport is computed from that. The cost is maintaining a position table on both mount and scroll.

If every row really has the same height, you can declare `rowHeight` explicitly and skip row height measurement entirely — the viewport computation is always O(1), and the mount and scroll cost no longer grows with the total row count.

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ y: 400 }"
  :virtual="true"
  :row-height="55"
/>
```

- Only takes effect with `virtual`, in px
- **The premise is that the actual height of every row really equals this value**. With wrapping text, long content under `ellipsis: false` or rendering with custom heights, do not pass this prop; leave it to the default measured path
- We deliberately do not auto-detect: guessing the row height from the `size` preset silently goes wrong when long text wraps, and the error shows up as misaligned rows or gaps that are hard to attribute, so you are required to declare it yourself
- Dev builds measure the height of the first row and warn in the console when it differs from the declared value by more than 1px; production builds skip this measurement

## Auto height `scroll.y: 'auto'`

A numeric `scroll.y` means a **fixed** body viewport height; `'auto'` means **adapting to the content area automatically**: the table fills its parent container, and the body height = the parent's available height − header − fixed summary, measured and subtracted inside the component. You no longer need to listen for resize yourself or read the header height to subtract it by hand — browser Ctrl+wheel zoom, window dragging and parent layout changes are all followed automatically. The demo below can switch between two parent container shapes, "block-level parent" and "flex layout + siblings".

<Demo src="virtualization/auto-height" :min-height="440">

<<< @/demos/virtualization/auto-height.vue

</Demo>

### Parent container requirements

`'auto'` relies on a **definite height chain**:

- Ordinary block-level parent: the parent needs a definite height (such as `height: 400px`), and VTable is its dedicated filling child
- Flex layout: siblings are allowed, but the height chain must be definite, and the shrinkable ancestor of VTable needs `min-height: 0` — otherwise the height chain breaks there and the available height cannot be measured
- A parent whose height is naturally stretched by its content (an indefinite height) does not qualify; in dev builds, repeatedly failing to measure an available height produces a console hint

The flex layout + siblings setup: switch the demo above to "flex layout + siblings", then uncheck `min-height: 0` and drag the height slider to reproduce the broken height chain on the spot — a flex item defaults to `min-height: auto` and refuses to shrink, so the container shrinks but the table does not follow: the body is clipped and the bottom summary bar is pushed out of the viewport.

### Behavior details

- A small amount of data shrinks naturally to its content (maxHeight semantics), and vertical scrolling only appears once the available area is exceeded
- Supported in both normal and virtual mode; in virtual mode the body stays scrollable even with `showHeader: false`
- The behavior of a numeric `scroll.y` is completely unchanged; in non-virtual mode other CSS strings (`'100%'`, `calc(...)`) still take effect as is
- **String constraints in virtual mode**: only positive px values are compatible (such as `'480px'`; dev suggests using a number instead); values that cannot be parsed reliably, such as `'100%'`, `'50vh'`, `calc(...)` and negative numbers, warn and fall back to a 400px viewport — keeping virtualization available rather than falling back to a normal body that renders everything (on a wide table with 10k rows that is a freeze measured in seconds)

## Horizontal virtualization `virtualColumn`

The switch above virtualizes **rows**. With many columns (on the order of a hundred) the bottleneck moves elsewhere: every visible cell is a component instance, so 12 rows × 200 columns is 2,400 of them, and each frame goes through all of them again while scrolling. `virtualColumn` reduces the number of visible cells from "rows × total columns" to "rows × visible columns".

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ x: 20000, y: 400 }"
  :virtual="true"
  :virtual-column="true"
/>
```

Measured with 10k rows × 200 columns: visible columns 200 → 13, long tasks during continuous scrolling 4,391ms → **0**, sort toggle 126ms → 75ms, DOM nodes 3,659 → 1,415. See the [performance document](https://github.com/parade0393/vtable-guild/blob/master/docs/performance.md) for the full numbers and method.

**It is off by default and should stay off** unless you really have many columns: with 6 columns it brings neither benefit nor cost (measured as exactly on par), but adds one header measurement.

### Live demo: 10k rows × 200 columns

The table below has 200 leaf columns with fixed columns at both ends. Watch the "rendered columns" count while scrolling left and right — turn the switch off and it immediately jumps from a dozen or so back to 200, and those 200 cells are rebuilt for every row. The `C1` column can still be sorted.

<Demo src="virtualization/wide-columns" :min-height="520">

<<< @/demos/virtualization/wide-columns.vue

</Demo>

### When it is ignored

When any of the following prerequisites is not met, `virtualColumn` is ignored and the body falls back to rendering all columns, with dev builds giving the reason in the console:

- `virtual` is not enabled
- A column has `customCell` / `customRender` — they may return `colSpan` / `rowSpan`, and cell merging leaves some `<td>` absent, which breaks column width alignment (virtual mode does not support merging in the first place)
- The fixed columns are not split to the two ends: left-fixed columns must form a prefix and right-fixed columns must form a suffix
- `showHeader: false` with non-numeric column widths — there is no header to measure, so the widths cannot be computed

### Known limitations

- You are not required to declare numeric column widths: `auto` and percentages are both supported, because the widths are **measured** from the header
- The first frame renders all columns, and the window narrows only after the widths are measured. So what it optimizes is **scrolling and updates**; the first render takes essentially the same time
- When a column scrolls out of the window, the filter panel / tooltip attached to that column's header is unmounted with it
- The header itself is not virtualized: with a very large number of columns all header cells are still rendered (a one-off cost, not per row)

## When to use

- The list has many rows and scrolling is noticeably janky
- You want to keep the column definitions, theme and interactions in the same table rather than switch to another list component
- The main bottleneck of the current page comes from the number of DOM nodes, not from the API itself

## Measure it yourself

You do not have to take any of the claims here on trust — the [performance comparison page](/perf/) lets you run vtable-guild, ant-design-vue Table, antdv-next, el-table-v2 and vxe-table on your own machine with **the same data and the same column configuration** (1k / 10k / 100k rows × 6 / 50 / 200 columns), reports render time, DOM node count and memory, and exports the results in one click. The collection method and the known asymmetries are all written on the page.

## API

`TRecord` is the application row type. See [API Reference](/en/guide/api-reference) for the full table configuration.

### Props

<!-- @api: props virtualization -->

## Theming

The classes of the virtual body and the scroll container can be overridden through the per-instance `ui` or the global `theme.table.slots`. To adjust colors or sizes, use the [CSS variables](#css-variables) below. See [Three-layer theme overrides](/en/guide/theme-overrides) for the override order.

### ui slots

<!-- @api: ui virtualization -->

### Preset defaults

Use the tabs below to switch between the default classes of the two presets. For how utilities are overridden in the default prebuilt mode, see [Prefix and override rules](/en/guide/theme-overrides#utility-prefix-and-override-rules).

<!-- @api: theme virtualization -->

### CSS variables

The table lists the default values for light mode. Dark mode can be overridden separately through `.dark`.

<!-- @api: css-vars virtualization -->

## Type Declarations

`virtual`, `virtualColumn`, `rowHeight`, `scroll` and `rowKey` all belong to `TableProps<TRecord>`. The props are an excerpt of the relevant fields; `VirtualizationFields` is a documentation helper interface, not a package export. See [Type reference](/en/guide/type-reference) for the full declarations and how to import them.

::: details View type declarations

<<< @/.vitepress/type-declarations/table.ts#Key

<<< @/.vitepress/type-declarations/features.ts#VirtualizationFields

:::

## Related pages

- [Fixed columns](/en/guide/fixed-columns)
- [Feature comparison](/en/comparison/)
