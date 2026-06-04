# 三层主题覆盖

vtable-guild 的主题系统分成三层，目的是把“预设基线”“应用级统一规范”和“单实例例外”拆开管理，而不是把所有样式都写进页面里的选择器。

## 三层结构

主题从低到高分成三层：

1. 预设默认主题  
   当前内置 `antdv` 和 `element-plus` 两套视觉基线，通过 `themePreset` 切换。
2. `createVTableGuild` 的全局 `theme`  
   适合整个应用统一表头、边框、hover、默认 size 等规则。
3. `VTable` 实例上的 `ui` 和 `class`  
   适合某一张表做局部例外。

这三层会按顺序合并，所以你不需要为了改一张表的表头颜色，复制整套预设主题。

## 先建立一个心智模型

全局 `theme` 最常用的入口是：

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

可以把它理解成三块：

- `slots`
  直接改某个主题 slot 的 class，比如 `th`、`td`、`root`、`loading`
- `variants`
  改条件样式，比如 `hoverable.true.td`、`bordered.true.root`
- `defaultVariants`
  改默认开关，比如把全局 `size` 默认值改成 `sm`

如果你已经在看 [ui Slot 参考](/guide/ui-slots-reference)，那一页列出的 slot key，基本都可以直接映射到 `theme.table.slots`。

## 全局 theme 怎么写

当你希望整个应用里的表格都遵守同一套视觉规则时，优先在插件层覆盖：

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

### 示例一：统一表头与正文基线

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

### 示例二：统一改 hover 行背景色

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

覆盖 CSS 变量是最推荐的方式，hover 高亮由 JS 状态驱动，能正确处理跨行合并单元格。

### 示例三：统一改默认 size

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
> 在 TypeScript 项目里，`theme.table.slots`、`variants` 和 `defaultVariants` 都有精确 key 补全；覆盖值可以直接写你自己的 class 字符串。

## 什么时候该用 CSS 变量

如果你要改的是颜色、字号、行高、padding 这类“token 值”，优先覆盖 CSS 变量，而不是直接重写 class 结构。

比如只想改行 hover 背景：

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
}
```

这类方式更稳定，尤其适合：

- 保留现有 slot 结构，只改颜色或尺寸
- 同时兼容多个实例和多个业务页面
- 希望未来跟随预设升级，减少 class 重写成本

具体变量清单见 [Table CSS 变量参考](/guide/theme-tokens)。

## 单实例覆盖

当你只想调整某一张表时，优先使用 `ui` 和 `class`：

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

## utility 前缀与覆盖规则

默认预编译模式下，库内部 utility class 会输出 `vtg-` 前缀。用户传入的 `ui`、`class`、`rowClassName` 等 class 不会被自动加前缀。

如果要覆盖库内部 utility，也应传同前缀：

```vue
<VTable :columns="columns" :data-source="dataSource" :ui="{ th: 'vtg-px-2' }" />
```

直接传 `px-2` 可能会和内部 `vtg-px-*` 同时存在，不保证覆盖内部样式。

如果项目使用 Tailwind CSS 4 并启用了 `cssMode: 'tailwind4'`，内部 class 保持无前缀，此时可以继续用普通 Tailwind class 覆盖：

```ts
app.use(createVTableGuild({ cssMode: 'tailwind4' }))
```

```vue
<VTable :columns="columns" :data-source="dataSource" :ui="{ th: 'px-2' }" />
```

更多接入细节见 [包导入与样式](/guide/package-consumption)。

## 怎么选

- 想切换整套视觉基线，用 `themePreset`
- 想统一业务线规则，用全局 `theme`
- 想改单张表，用 `ui` 和 `class`
- 只想改颜色、尺寸、间距等 token，用 CSS 变量

## 什么时候不该直接用 slot

如果你的目标只是改表头背景、单元格对齐、边框颜色、hover 背景或默认间距，优先走 `theme`、`ui` 或 CSS 变量。只有在内容结构本身要变化时，再使用 Vue slot。

## 相关页面

- [ui Slot 参考](/guide/ui-slots-reference)
- [Table CSS 变量参考](/guide/theme-tokens)
- [预设与语言](/guide/presets-and-locales)
- [安装与使用](/guide/installation)
