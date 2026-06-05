# 包导入与样式

这一页专门说明运行时入口、CSS 入口和 class 前缀策略。普通组件 API 不需要因为前缀策略变化而调整。

## 运行时入口

组件和插件都从主入口导入：

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
```

## prebuilt 模式

宿主项目不使用 Tailwind CSS 时，使用完整预编译 CSS：

```css
@import 'ant-design-vue/dist/reset.css';
@import '@vtable-guild/vtable-guild/css/style';
```

```ts
app.use(createVTableGuild())
```

这是默认模式，也就是 `cssMode: 'prebuilt'`。库内部 utility class 会输出 `vtg-` 前缀，例如 `vtg-flex`、`vtg-px-1`，避免污染使用者项目或其他 UI 库的 class 空间。

用户传入的 class 不会被自动加前缀，包括：

- `class`
- `ui`
- `rowClassName`
- `customRow`
- `customHeaderRow`
- `customCell` / `customHeaderCell` 返回的 class

## 覆盖内部 utility

预编译模式下，如果你想覆盖库内部 utility，也应传同前缀：

```vue
<VTable :ui="{ th: 'vtg-px-2' }" />
```

直接传 `px-2` 可能会和内部 `vtg-px-*` 同时存在，不保证覆盖内部样式。这个设计是刻意的：裸 class 保持为用户自己的 class，不由组件库重写语义。

## 自定义前缀

可以通过 `classPrefix` 修改内部 utility 前缀：

```ts
app.use(
  createVTableGuild({
    classPrefix: 'app',
  }),
)
```

这时运行时会输出 `app-*`。预编译 CSS 也必须使用同一个前缀生成：

```bash
VTG_CLASS_PREFIX=app pnpm --filter @vtable-guild/vtable-guild copy-css
```

如果前缀运行时和 CSS 产物不一致，样式不会命中。

## tailwind3 模式

宿主项目使用 Tailwind CSS 3 构建 utility 时，使用 Tailwind 3 入口：

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

Tailwind 3 模式下，库内部 class 保持无前缀，所以用户可以传普通 Tailwind class 覆盖内部 utility，例如：

```vue
<VTable :ui="{ th: 'px-2' }" />
```

## tailwind4 模式

宿主项目使用 Tailwind CSS 4 构建 utility 时，使用 Tailwind 4 入口：

```css
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

```ts
app.use(createVTableGuild({ cssMode: 'tailwind4' }))
```

Tailwind 4 模式下，库内部 class 保持无前缀，所以用户可以传普通 Tailwind class 覆盖内部 utility，例如：

```vue
<VTable :ui="{ th: 'px-2' }" />
```

## CSS 入口

当前支持的 CSS 入口是 `css/style`、`css/tailwind3` 和 `css/tailwind4`，分别对应 `prebuilt`、`tailwind3` 和 `tailwind4`。
