# Three-layer theme overrides

vtable-guild's theme system is split into three layers so that "preset baseline", "application-wide rules" and "single-instance exceptions" can be managed separately, instead of writing every style into selectors on the page.

## Three-layer structure

Themes go from low to high in three layers:

1. Preset default theme  
   Two built-in visual baselines, `antdv` and `element-plus`, switched with `themePreset`.
2. The global `theme` of `createVTableGuild`  
   Suits application-wide rules for headers, borders, hover, the default size and so on.
3. `ui` and `class` on a `VTable` instance  
   Suits a local exception on a single table.

The three layers merge in order, so you do not need to copy a whole preset theme just to change the header color of one table.

## Build a mental model first

The most commonly used entry point of the global `theme` is:

```ts
createVTableGuild({
  theme: {
    table: {
      slots: {},
      variants: {},
      defaultVariants: {},
    },
  },
})
```

Think of it as three parts:

- `slots`
  Change the class of a theme slot directly, such as `th`, `td`, `root`, `loading`
- `variants`
  Change conditional styles, such as `hoverable.true.td`, `bordered.true.root`
- `defaultVariants`
  Change default switches, such as changing the global `size` default from `large` to `small`

If you have already read the [ui slot reference](/en/guide/ui-slots-reference), the slot keys listed on that page can basically all be mapped directly to `theme.table.slots`.

## How to write the global theme

When you want every table in your application to follow the same visual rules, override at the plugin layer first:

```ts
import { createApp } from 'vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'

const app = createApp(App)

app.use(
  createVTableGuild({
    theme: {
      table: {
        slots: {
          root: 'rounded-2xl ring-1 ring-slate-200',
          th: 'bg-slate-50 text-slate-900',
          td: 'align-top',
        },
        defaultVariants: {
          size: 'small',
        },
      },
    },
  }),
)
```

### Example 1: unify the header and body baseline

```ts
createVTableGuild({
  theme: {
    table: {
      slots: {
        th: 'bg-slate-50 text-slate-900 font-medium',
        td: 'align-top',
      },
    },
  },
})
```

### Example 2: unify the hover row background

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

Overriding CSS variables is the recommended approach: the hover highlight is driven by JS state, so it handles cells merged across rows correctly.

### Example 3: unify the default size

```ts
createVTableGuild({
  theme: {
    table: {
      defaultVariants: {
        size: 'small',
      },
    },
  },
})
```

> [!TIP]
> In a TypeScript project, `theme.table.slots`, `variants` and `defaultVariants` all have precise key completion; override values can be your own class strings.

## When to use CSS variables

If what you want to change are token values such as colors, font sizes, line heights or padding, override CSS variables instead of rewriting the class structure directly.

For example, to change only the row hover background:

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

This approach is more stable, and it is especially suited to:

- keeping the existing slot structure and changing only colors or sizes
- working across multiple instances and multiple application pages at the same time
- following future preset upgrades with less class rewriting

See [Table CSS variables](/en/guide/theme-tokens) for the full variable list.

## Per-instance overrides

When you only want to adjust a single table, prefer `ui` and `class`:

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  class="shadow-lg"
  :ui="{
    root: 'rounded-xl',
    th: 'bg-emerald-50',
    td: 'align-top',
  }"
/>
```

## Utility prefix and override rules

In the default precompiled mode, utility classes inside the library are emitted with the `vtg-` prefix. Classes you pass in through `ui`, `class`, `rowClassName` and so on are not prefixed automatically.

To override a library utility, pass the same prefix:

```vue
<VTable :columns="columns" :data-source="dataSource" :ui="{ th: 'vtg-px-2' }" />
```

Passing `px-2` directly may coexist with the internal `vtg-px-*` and does not guarantee an override.

In `tailwind3` and `tailwind4` modes, the internal classes stay unprefixed, so you can keep overriding them with ordinary Tailwind classes:

```ts
app.use(createVTableGuild({ cssMode: 'tailwind3' }))
// or
app.use(createVTableGuild({ cssMode: 'tailwind4' }))
```

```vue
<VTable :columns="columns" :data-source="dataSource" :ui="{ th: 'px-2' }" />
```

For more integration details see [Package imports and styles](/en/guide/package-consumption).

## How to choose

- To switch the whole visual baseline, use `themePreset`
- To unify rules across your application, use the global `theme`
- To change a single table, use `ui` and `class`
- To change only tokens such as colors, sizes and spacing, use CSS variables

## When not to use slots directly

If your goal is only to change the header background, cell alignment, border color, hover background or default spacing, prefer `theme`, `ui` or CSS variables. Use Vue slots only when the content structure itself has to change.

## Related pages

- [ui slot reference](/en/guide/ui-slots-reference)
- [Table CSS variables](/en/guide/theme-tokens)
- [Presets and locales](/en/guide/presets-and-locales)
- [Installation and usage](/en/guide/installation)

## Pagination theme

Override pagination slots and the `size` / `align` / `simple` / `disabled` variants through `theme.pagination`. The full slot union is `PaginationSlots` at the end of the page. Instances accept `pagination.class: string` / `style: CSSProperties`. [Pagination example](/en/guide/pagination).

## Type Declarations

Below are the complete fields and mapping rules of the override types. Theme constants come from the public package; `typeof` preserves the readonly configuration, concrete slots and variant keys. For the full list of Table slot names see the [ui slot reference](/en/guide/ui-slots-reference#type-declarations), and for locale types see the [Type reference](/en/guide/type-reference#vtableguildlocale).

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#ThemeConfig

<<< @/.vitepress/type-declarations/config.ts#ThemeOverrideConfig

<<< @/.vitepress/type-declarations/config.ts#VTableGuildThemeOverridesMap

<<< @/.vitepress/type-declarations/config.ts#VTableGuildThemeOverrides

<<< @/.vitepress/type-declarations/config.ts#SlotProps

<<< @/.vitepress/type-declarations/config.ts#TableThemeConfig

<<< @/.vitepress/type-declarations/config.ts#TableVariantProps

<<< @/.vitepress/type-declarations/config.ts#ComponentThemeTypes

<<< @/.vitepress/type-declarations/config.ts#PaginationThemeConfig

<<< @/.vitepress/type-declarations/config.ts#PaginationSlots

:::
