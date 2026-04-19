# 安装与使用

这一页只回答三件事：

- 安装什么
- 样式从哪里引入
- 初始化后最常见的全局配置怎么写

## 安装

```bash
pnpm add @vtable-guild/vtable-guild vue
```

如果宿主项目还没有 Tailwind CSS 4 和 `@tailwindcss/vite`，再补上：

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

## 运行时入口

在业务代码里，运行时 API 和组件都从同一个入口导入：

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
```

## 样式入口

在全局样式入口文件中引入：

```css
@import 'tailwindcss';
@import '@vtable-guild/vtable-guild/css';
```

`@vtable-guild/vtable-guild/css` 已包含：

- 默认 `antdv` 预设样式
- `element-plus` 预设样式
- 主题 token
- 组件运行所需的基础 CSS

切换预设时不需要额外再导入其他 CSS。

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
          size: 'sm',
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
