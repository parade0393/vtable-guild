# 安装与使用

这一页只回答三件事：

- 安装什么
- 样式从哪里引入
- 初始化后最常见的全局配置怎么写

## 安装

```bash
pnpm add @vtable-guild/vtable-guild vue
```

如果宿主项目还没有 Tailwind CSS，根据版本选择安装：

::: code-group

```bash [Tailwind CSS 4（推荐）]
pnpm add -D tailwindcss @tailwindcss/vite
```

```bash [Tailwind CSS 3]
pnpm add -D tailwindcss@^3 postcss autoprefixer
```

:::

## 运行时入口

在业务代码里，运行时 API 和组件都从同一个入口导入：

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
```

## 样式入口

::: code-group

```css [Tailwind CSS 4]
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css';
```

```css [Tailwind CSS 3]
@import 'ant-design-vue/dist/reset.css';
@import '@vtable-guild/vtable-guild/css/tailwind3';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

:::

::: warning Tailwind CSS 3 注意
`@import` 必须在 `@tailwind` 指令之前，否则 PostCSS 会报错。
:::

`@vtable-guild/vtable-guild/css` 已包含：

- 默认 `antdv` 预设样式
- `element-plus` 预设样式
- 主题 token
- 组件运行所需的基础 CSS

切换预设时不需要额外再导入其他 CSS。

## Tailwind CSS 3 配置文件

使用 Tailwind CSS 3 时，组件库内部依赖的 utilities 已由 `@vtable-guild/vtable-guild/css/tailwind3` 预生成。你的 `tailwind.config.js` 只需要扫描业务项目自己的文件。

### postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

### Vite 配置

不需要 `@tailwindcss/vite` 插件，Tailwind 通过 PostCSS 自动处理：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

## 与 unlayered CSS reset 共存

::: warning 必读：与 ant-design-vue / normalize.css 等 reset 共存（仅 Tailwind CSS 4）
本库基于 Tailwind v4，所有 utility 都生成在 `@layer utilities` 内。按 [CSS Cascade Layers 规范](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)，**unlayered（未进任何层）的普通 CSS 规则会胜过任何 layer 内的规则**，与特异性无关。
:::

::: tip Tailwind CSS 3 用户
Tailwind CSS 3 不使用 CSS Cascade Layers，utility 类直接生成为普通 CSS 规则，不存在此问题。直接按上方的样式入口顺序引入即可。
:::

如果项目里同时引入了未分层的全局 reset，例如：

- `ant-design-vue/dist/reset.css`
- `normalize.css`
- 任何手写的全局 reset

它们里面诸如 `button { color: inherit }`、`input { ... }` 之类的规则会**压住**本库 Button、Input 等组件依赖的 Tailwind utility。典型症状：筛选弹窗里「重置 / 确定」按钮的文字颜色看上去是 ant-design-vue 的全局 `rgba(0,0,0,0.88)`，而不是预期的主色 / 白色。

### 正确接法（Tailwind CSS 4）

用 `@import` 的 `layer()` 修饰符把 reset 显式收进一个比 `utilities` 更早的 layer，并在最前面**先声明 layer 顺序**：

```css
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css';
```

要点：

- `@layer name1, name2, ...;` 声明必须出现在所有 `@import` 之前，否则顺序无效。
- `antd-reset` 写在 `utilities` 之前，意味着 utilities 优先级更高，能盖掉 reset 里的元素级规则。
- **同时把 `main.ts` 里类似 `import 'ant-design-vue/dist/reset.css'` 的 JS 侧副作用 import 删掉**，统一交给 CSS 侧的 `@import ... layer(...)` 管理。JS 侧 import 的 CSS 会绕过 `layer()`，再次回到 unlayered，问题就会复现。
- 同样的写法适用于 `normalize.css`、`element-plus/dist/index.css` 中未分层的部分等：把它们都按相同模式收进自定义 layer。

### 验证

在浏览器 DevTools Elements 面板选中按钮，查看 Computed → `color`。修复前来源是 reset.css 里的 `button { color: inherit }`；修复后来源应当是 `.text-white { color: var(--color-white) }` 或对应的 `text-[color:var(--color-...)]` 规则。

## 插件初始化

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import './main.css'

const app = createApp(App)

app.use(
  createVTableGuild({
    themePreset: 'antdv',
  }),
)

app.mount('#app')
```

## 常用全局配置

`createVTableGuild` 常见配置包括：

- `themePreset`
  切换 `antdv` 或 `element-plus`
- `theme`
  全局主题覆盖
- `locale`
  当前语言标识
- `locales`
  自定义语言包注册表
- `localeOverrides`
  当前语言包的局部覆盖

示例：

```ts
app.use(
  createVTableGuild({
    themePreset: 'antdv',
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

## 视觉调整怎么选

- 想切整套视觉基线，用 `themePreset`
- 想统一业务项目规则，用全局 `theme`
- 想改单个实例，用 `ui` 和 `class`
- 只想改颜色、尺寸、间距等 token，优先覆盖 CSS 变量

## 单实例覆盖示例

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

## 继续阅读

- [快速开始](/guide/getting-started)
- [三层主题覆盖](/guide/theme-overrides)
- [ui Slot 参考](/guide/ui-slots-reference)
- [Table CSS 变量参考](/guide/theme-tokens)
- [预设与语言](/guide/presets-and-locales)
