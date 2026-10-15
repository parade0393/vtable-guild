# 安装与使用

这一页只回答三件事：

- 安装什么
- 样式从哪里引入
- 初始化后最常见的全局配置怎么写

## 安装

```bash
pnpm add @vtable-guild/vtable-guild vue
```

Tailwind CSS 不是必需依赖。使用 `tailwind3` 或 `tailwind4` 模式时，再安装对应版本的 Tailwind CSS。

Tailwind CSS 4：

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Tailwind CSS 3：

```bash
pnpm add -D tailwindcss@^3.4.19 postcss autoprefixer
```

## 运行时入口

在业务代码里，运行时 API 和组件都从同一个入口导入：

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
```

## 样式入口

::: code-group

```css [使用 Tailwind CSS 3]
@import '@vtable-guild/vtable-guild/css/tailwind3';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css [使用 Tailwind CSS 4]
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

```css [不使用 Tailwind CSS]
@import 'ant-design-vue/dist/reset.css';
@import '@vtable-guild/vtable-guild/css/style';
```

:::

`@vtable-guild/vtable-guild/css/style`、`@vtable-guild/vtable-guild/css/tailwind3` 和 `@vtable-guild/vtable-guild/css/tailwind4` 均已包含：

- 默认 `antdv` 预设样式
- `element-plus` 预设样式
- 主题 token
- 组件运行所需的基础 CSS

切换预设时不需要额外再导入其他 CSS。

`@vtable-guild/vtable-guild/css/style` 对应 `prebuilt` 模式。宿主项目不需要安装 Tailwind CSS，不需要配置 Tailwind 插件，也不需要扫描本库源码。

`@vtable-guild/vtable-guild/css/tailwind3` 对应 `tailwind3` 模式。Tailwind 配置需要加入 `@vtable-guild/vtable-guild/tailwind3-preset`，扫描 `node_modules/@vtable-guild`，并在插件层启用 `cssMode: 'tailwind3'`。

`@vtable-guild/vtable-guild/css/tailwind4` 对应 `tailwind4` 模式。使用它时，需要在插件层启用 `cssMode: 'tailwind4'`，内部 utility 会保持无前缀，方便宿主项目用普通 Tailwind class 覆盖。

## 与 unlayered CSS reset 共存

::: warning 必读：与 ant-design-vue / normalize.css 等 reset 共存（Tailwind CSS 4）
本库基于 Tailwind v4，所有 utility 都生成在 `@layer utilities` 内。按 [CSS Cascade Layers 规范](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)，**unlayered（未进任何层）的普通 CSS 规则会胜过任何 layer 内的规则**，与特异性无关。
:::

::: tip prebuilt 用户
如果使用 `@vtable-guild/vtable-guild/css/style`，无需配置 Tailwind CSS 的 cascade layer。直接按上方的样式入口顺序引入即可。
:::

如果项目里同时引入了未分层的全局 reset，例如：

- `ant-design-vue/dist/reset.css`
- `normalize.css`
- 任何手写的全局 reset

它们里面诸如 `button { color: inherit }`、`input { ... }` 之类的规则会**压住**本库 Button、Input 等组件依赖的 Tailwind utility。典型症状：筛选弹窗里「重置 / 确定」按钮的文字颜色看上去是 ant-design-vue 的全局 `rgba(0,0,0,0.88)`，而不是预期的主色 / 白色。

### 正确接法

用 `@import` 的 `layer()` 修饰符把 reset 显式收进一个比 `utilities` 更早的 layer，并在最前面**先声明 layer 顺序**：

```css
@layer antd-reset, theme, base, components, utilities;

@import 'ant-design-vue/dist/reset.css' layer(antd-reset);
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css/tailwind4';
```

要点：

- `@layer name1, name2, ...;` 声明必须出现在所有 `@import` 之前，否则顺序无效。
- `antd-reset` 写在 `utilities` 之前，意味着 utilities 优先级更高，能盖掉 reset 里的元素级规则。
- **同时把 `main.ts` 里类似 `import 'ant-design-vue/dist/reset.css'` 的 JS 侧副作用 import 删掉**，统一交给 CSS 侧的 `@import ... layer(...)` 管理。JS 侧 import 的 CSS 会绕过 `layer()`，再次回到 unlayered，问题就会复现。
- 同样的写法适用于 `normalize.css`、`element-plus/dist/index.css` 中未分层的部分等：把它们都按相同模式收进自定义 layer。

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
    // 如果使用 @vtable-guild/vtable-guild/css/tailwind3，请设置 cssMode: 'tailwind3'
    // 如果使用 @vtable-guild/vtable-guild/css/tailwind4，请设置 cssMode: 'tailwind4'
  }),
)

app.mount('#app')
```

## 常用全局配置

`createVTableGuild(options?: VTableGuildOptions): Plugin` 接收可选配置，返回用于 `app.use()` 的 Vue 插件。下表所有配置字段均可选，完整声明见页末；依赖类型见 [类型参考](/guide/type-reference#主题与插件类型)。

| 字段              | 类型                             | 默认值       | 说明                                                                                         |
| ----------------- | -------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `themePreset`     | `ThemePresetName`                | `'antdv'`    | 选择 `'antdv'` 或 `'element-plus'` 预设                                                      |
| `cssMode`         | `VTableGuildCssMode`             | `'prebuilt'` | 选择样式入口模式                                                                             |
| `classPrefix`     | `string`                         | `'vtg'`      | 预编译模式下内部 utility 前缀                                                                |
| `theme`           | `VTableGuildThemeOverrides`      | `{}`         | 全局主题覆盖                                                                                 |
| `locale`          | `LocaleName`（`string`）         | `'zh-CN'`    | 当前语言标识                                                                                 |
| `locales`         | `LocaleRegistry`                 | `{}`         | 自定义语言包注册表                                                                           |
| `localeOverrides` | `DeepPartial<VTableGuildLocale>` | `{}`         | 当前语言包局部覆盖                                                                           |
| `compatClass`     | `boolean`                        | `false`      | 额外输出兼容类名；安装时读取，见 [迁移说明](./migration-from-antd#保留旧的覆盖-css-兼容类名) |

示例：

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

## Type Declarations

本页的插件与样式模式声明。主题和语言的完整依赖类型见 [类型参考](/guide/type-reference#主题与插件类型)。

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

<<< @/.vitepress/type-declarations/config.ts#VTableGuildCssMode

<<< @/.vitepress/type-declarations/config.ts#SlotProps

:::
