# 三层主题覆盖

vtable-guild 的主题系统有一个很明确的目标：让你既能快速接入预设，又能在全局和单实例两层做细粒度控制，而不是把所有样式都压到业务页面里。

## 三层结构

主题从低到高分成三层：

1. 预设默认主题。当前内置 antdv 和 element-plus 两套视觉基线。
2. createVTableGuild 的全局 theme 配置。适合整个应用统一风格。
3. VTable 实例上的 ui 和 class。适合单张表格的局部例外。

这三层会按顺序合并，因此你不需要为了改一张表的表头颜色，就复制整套主题配置。

## 全局覆盖

当你希望整个应用里的表格都遵循同一套视觉规则时，优先在插件层覆盖：

```ts
import { createApp } from 'vue'
import { createVTableGuild } from '@vtable-guild/core'

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
          size: 'sm',
        },
      },
    },
  }),
)
```

## 单实例覆盖

当你只想调整某一张表格时，优先使用 ui 和 class：

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

## 推荐使用方式

- 需要统一业务线视觉时，用全局 theme。
- 需要页面级例外时，用 ui 和 class。
- 只是切换整体风格时，用 themePreset，不要从头重写 theme。

## 什么时候不该直接用 slot

如果你的目的只是改表头背景、单元格对齐或边框风格，优先走主题和 ui。只有在内容结构本身要变化时，再使用插槽。

## 相关页面

- [预设与语言](/guide/presets-and-locales)
- [包导入与样式](/guide/package-consumption)
