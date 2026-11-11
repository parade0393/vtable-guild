# Package imports and styles

This page covers the runtime entry, the CSS entries and the class prefix strategy. The regular component API does not need to change when the prefix strategy changes.

## Runtime entry

Both the components and the plugin are imported from the main entry:

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
```

## prebuilt mode

When the host project does not use Tailwind CSS, use the full prebuilt CSS:

```css
@import 'ant-design-vue/dist/reset.css';
@import '@vtable-guild/vtable-guild/css/style';
```

```ts
app.use(createVTableGuild())
```

This is the default mode, that is, `cssMode: 'prebuilt'`. The library's internal utility classes are emitted with the `vtg-` prefix, for example `vtg-flex` and `vtg-px-1`, to avoid polluting the class space of your project or of other UI libraries.

Classes that you pass in are not prefixed automatically, including:

- `class`
- `ui`
- `rowClassName`
- `customRow`
- `customHeaderRow`
- the class returned by `customCell` / `customHeaderCell`

## Overriding internal utilities

In prebuilt mode, if you want to override the library's internal utilities, pass classes with the same prefix:

```vue
<VTable :ui="{ th: 'vtg-px-2' }" />
```

Passing `px-2` directly may leave it alongside the internal `vtg-px-*`, and overriding the internal style is not guaranteed. This design is deliberate: a bare class stays your own class, and the component library does not rewrite its meaning.

## Custom prefix

You can change the internal utility prefix through `classPrefix`:

```ts
app.use(
  createVTableGuild({
    classPrefix: 'app',
  }),
)
```

The runtime then emits `app-*`. The prebuilt CSS must be generated with the same prefix too:

```bash
VTG_CLASS_PREFIX=app pnpm --filter @vtable-guild/vtable-guild copy-css
```

If the runtime prefix and the CSS output do not match, the styles will not apply.

## tailwind3 mode

When the host project builds utilities with Tailwind CSS 3, use the Tailwind 3 entry:

```js
import vtableGuildTailwind3Preset from '@vtable-guild/vtable-guild/tailwind3-preset'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx,js,jsx}',
    './node_modules/@vtable-guild/**/*.{js,mjs}',
  ],
  presets: [vtableGuildTailwind3Preset],
}
```

```css
@import '@vtable-guild/vtable-guild/css/tailwind3';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
app.use(createVTableGuild({ cssMode: 'tailwind3' }))
```

In Tailwind 3 mode the library's internal classes stay unprefixed, so you can pass ordinary Tailwind classes to override internal utilities, for example:

```vue
<VTable :ui="{ th: 'px-2' }" />
```

## tailwind4 mode

When the host project builds utilities with Tailwind CSS 4, use the Tailwind 4 entry:

```css
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

```ts
app.use(createVTableGuild({ cssMode: 'tailwind4' }))
```

In Tailwind 4 mode the library's internal classes stay unprefixed, so you can pass ordinary Tailwind classes to override internal utilities, for example:

```vue
<VTable :ui="{ th: 'px-2' }" />
```

## CSS entries

The currently supported CSS entries are `css/style`, `css/tailwind3` and `css/tailwind4`, corresponding to `prebuilt`, `tailwind3` and `tailwind4` respectively.

## Type Declarations

The complete types for the plugin options and the per-instance class callbacks. `ui` uses `SlotProps<TableThemeConfig>`; for every theme slot see the [ui slot reference](/en/guide/ui-slots-reference#type-declarations), and for the other dependencies see the [type reference](/en/guide/type-reference).

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#VTableGuildCssMode

<<< @/.vitepress/type-declarations/config.ts#SlotProps

<<< @/.vitepress/type-declarations/config.ts#TableThemeConfig

<<< @/.vitepress/type-declarations/table.ts#RowClassName

<<< @/.vitepress/type-declarations/table.ts#GetComponentProps

<<< @/.vitepress/type-declarations/table.ts#CellAdditionalProps

:::
