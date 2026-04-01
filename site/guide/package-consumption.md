# 包导入与样式

vtable-guild 是一个多包仓库。对使用者来说，通常只需要理解两件事：

- 你是用聚合入口，还是按包拆分接入。
- 你希望页面默认呈现哪套视觉预设。

## 推荐的接入方式

如果你只想尽快在业务项目里使用，优先选择聚合包：

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme vue
```

然后在入口里这样写：

```ts
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
import '@vtable-guild/theme/css'
```

这种方式最简单，适合绝大多数业务项目。

## 按包拆分接入

如果你需要更明确地控制依赖边界，也可以分开安装：

```bash
pnpm add @vtable-guild/core @vtable-guild/table @vtable-guild/theme vue
```

常见导入方式如下：

```ts
import { createVTableGuild } from '@vtable-guild/core'
import { VTable } from '@vtable-guild/table'
import '@vtable-guild/theme/css'
```

## 样式入口

### 默认样式

```ts
import '@vtable-guild/theme/css'
```

这会加载默认的 antdv 预设样式。

### element-plus 视觉预设

如果你要使用 element-plus 风格，请继续追加对应样式文件：

```ts
import '@vtable-guild/theme/css'
import '@vtable-guild/theme/css/presets/element-plus'
```

同时在插件初始化时切换预设：

```ts
app.use(
  createVTableGuild({
    themePreset: 'element-plus',
  }),
)
```

样式入口和运行时 preset 需要保持一致，否则你会得到不完整的视觉结果。

## 全局主题与语言入口

createVTableGuild 支持这些全局配置：

- themePreset: 选择 antdv 或 element-plus
- theme: 组件级主题覆盖
- locale: 当前语言标识
- locales: 自定义语言包注册表
- localeOverrides: 当前语言包的局部覆写

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

## 单实例覆盖

当你不想动全局 preset，只想调整一张表格时，优先用 ui 与 class：

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

这种方式适合局部业务定制，不会影响其他表格实例。

## 继续阅读

- [快速开始](/guide/getting-started)
- [三层主题覆盖](/guide/theme-overrides)
- [预设与语言](/guide/presets-and-locales)
