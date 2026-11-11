# Installation and usage

This page answers three questions only:

- what to install
- where the styles come from
- how to write the most common global configuration after initialization

## Install

```bash
pnpm add @vtable-guild/vtable-guild vue
```

Tailwind CSS is not a required dependency. Install the matching version of Tailwind CSS only when you use the `tailwind3` or `tailwind4` mode.

Tailwind CSS 4:

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Tailwind CSS 3:

```bash
pnpm add -D tailwindcss@^3.4.19 postcss autoprefixer
```

## Runtime entry

In application code, the runtime API and the components are imported from the same entry:

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
```

## Style entry

::: code-group

```css [With Tailwind CSS 3]
@import '@vtable-guild/vtable-guild/css/tailwind3';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css [With Tailwind CSS 4]
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

```css [Without Tailwind CSS]
@import 'ant-design-vue/dist/reset.css';
@import '@vtable-guild/vtable-guild/css/style';
```

:::

`@vtable-guild/vtable-guild/css/style`, `@vtable-guild/vtable-guild/css/tailwind3` and `@vtable-guild/vtable-guild/css/tailwind4` all include:

- the default `antdv` preset styles
- the `element-plus` preset styles
- theme tokens
- the base CSS the components need at runtime

Switching presets does not require importing any other CSS.

`@vtable-guild/vtable-guild/css/style` corresponds to the `prebuilt` mode. The host project does not need to install Tailwind CSS, configure a Tailwind plugin or scan this library's sources.

`@vtable-guild/vtable-guild/css/tailwind3` corresponds to the `tailwind3` mode. The Tailwind config needs to add `@vtable-guild/vtable-guild/tailwind3-preset`, scan `node_modules/@vtable-guild`, and enable `cssMode: 'tailwind3'` at the plugin level.

`@vtable-guild/vtable-guild/css/tailwind4` corresponds to the `tailwind4` mode. When you use it, enable `cssMode: 'tailwind4'` at the plugin level; internal utilities stay unprefixed, so the host project can override them with ordinary Tailwind classes.

## Coexisting with an unlayered CSS reset

::: warning Must read: coexisting with resets such as ant-design-vue / normalize.css (Tailwind CSS 4)
This library is built on Tailwind v4, and every utility is generated inside `@layer utilities`. Per the [CSS Cascade Layers specification](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), **unlayered plain CSS rules (rules that are not in any layer) win over any rule inside a layer**, regardless of specificity.
:::

::: tip prebuilt users
If you use `@vtable-guild/vtable-guild/css/style`, you do not need to configure Tailwind CSS cascade layers. Just import the styles in the order shown in the style entry above.
:::

If the project also imports an unlayered global reset, for example:

- `ant-design-vue/dist/reset.css`
- `normalize.css`
- any hand-written global reset

then rules in them such as `button { color: inherit }` or `input { ... }` will **override** the Tailwind utilities that this library's Button, Input and other components depend on. A typical symptom: the text color of the "Reset / OK" buttons in the filter popup looks like ant-design-vue's global `rgba(0,0,0,0.88)` instead of the expected primary color / white.

### The correct setup

Use the `layer()` modifier of `@import` to explicitly put the reset into a layer that comes earlier than `utilities`, and **declare the layer order first**, at the very top:

```css
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

Key points:

- The `@layer name1, name2, ...;` declaration must appear before every `@import`, otherwise the order has no effect.
- Placing `antd-reset` before `utilities` means utilities have higher priority and can override the element-level rules in the reset.
- **Also remove JS-side side-effect imports such as `import 'ant-design-vue/dist/reset.css'` from `main.ts`**, and leave everything to the CSS-side `@import ... layer(...)`. CSS imported from JS bypasses `layer()` and becomes unlayered again, so the problem comes back.
- The same approach applies to `normalize.css`, the unlayered parts of `element-plus/dist/index.css` and so on: put them all into a custom layer using the same pattern.

## Plugin initialization

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import './main.css'

const app = createApp(App)

app.use(
  createVTableGuild({
    themePreset: 'antdv',
    // If you use @vtable-guild/vtable-guild/css/tailwind3, set cssMode: 'tailwind3'
    // If you use @vtable-guild/vtable-guild/css/tailwind4, set cssMode: 'tailwind4'
  }),
)

app.mount('#app')
```

## Common global configuration

`createVTableGuild(options?: VTableGuildOptions): Plugin` takes an optional configuration and returns a Vue plugin for `app.use()`. Every field in the table below is optional, and the full declaration is at the end of the page; for the types it depends on, see the [type reference](/en/guide/type-reference#theme-and-plugin-types).

| Field             | Type                             | Default      | Description                                                                                                                                                          |
| ----------------- | -------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `themePreset`     | `ThemePresetName`                | `'antdv'`    | Selects the `'antdv'` or `'element-plus'` preset                                                                                                                     |
| `cssMode`         | `VTableGuildCssMode`             | `'prebuilt'` | Selects the style entry mode                                                                                                                                         |
| `classPrefix`     | `string`                         | `'vtg'`      | Prefix for internal utilities in prebuilt mode                                                                                                                       |
| `theme`           | `VTableGuildThemeOverrides`      | `{}`         | Global theme overrides                                                                                                                                               |
| `locale`          | `LocaleName` (`string`)          | `'zh-CN'`    | Current locale identifier                                                                                                                                            |
| `locales`         | `LocaleRegistry`                 | `{}`         | Registry of custom locale packs                                                                                                                                      |
| `localeOverrides` | `DeepPartial<VTableGuildLocale>` | `{}`         | Partial overrides for the current locale pack                                                                                                                        |
| `compatClass`     | `boolean`                        | `false`      | Also emits compatibility class names; read at install time, see the [migration notes](./migration-from-antd#keeping-existing-override-css-compatibility-class-names) |

Example:

```ts
app.use(
  createVTableGuild({
    themePreset: 'antdv',
    cssMode: 'prebuilt',
    locale: 'zh-CN',
    theme: {
      table: {
        slots: {
          th: 'bg-slate-50 font-medium',
        },
        defaultVariants: {
          size: 'small',
        },
      },
    },
  }),
)
```

## Choosing how to adjust visuals

- To switch the whole visual baseline, use `themePreset`
- To unify the rules of an application project, use the global `theme`
- To change a single instance, use `ui` and `class`
- To change only tokens such as colors, sizes and spacing, prefer overriding CSS variables

## Per-instance override example

```vue
<VTable
  :ui="{
    root: 'shadow-sm',
    th: 'text-fuchsia-700',
    td: 'align-top',
  }"
  class="rounded-xl"
/>
```

## Further reading

- [Getting started](/en/guide/getting-started)
- [Three-layer theme overrides](/en/guide/theme-overrides)
- [ui slot reference](/en/guide/ui-slots-reference)
- [Table CSS variables](/en/guide/theme-tokens)
- [Presets and locales](/en/guide/presets-and-locales)

## Type Declarations

The plugin and style mode declarations for this page. For the complete theme and locale types they depend on, see the [type reference](/en/guide/type-reference#theme-and-plugin-types).

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

<<< @/.vitepress/type-declarations/config.ts#VTableGuildCssMode

<<< @/.vitepress/type-declarations/config.ts#SlotProps

:::
