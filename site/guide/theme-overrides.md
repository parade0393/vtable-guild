# 主题覆盖

`vtable-guild` 的主题覆盖分成三层：预设默认主题、插件级全局主题、实例级 `ui` / `class` 覆盖。最终类名会通过 `cn()` 合并，因此同一组 Tailwind utility 冲突时以后者为准。

## 三层优先级

1. 主题预设：来自 `@vtable-guild/theme`，例如默认的 `antdv`。
2. 插件配置：通过 `createVTableGuild({ theme })` 在应用级覆盖。
3. 实例覆盖：通过组件 `ui` 和 `class` 精调单个实例。

## 全局覆盖示例

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
      },
    },
  }),
)
```

## 单实例覆盖示例

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  class="shadow-lg"
  :ui="{
    th: 'bg-emerald-50',
    td: 'uppercase',
  }"
/>
```

## 建议做法

- 大范围风格对齐放到插件层，避免在业务页面里重复写 `ui`。
- 单个页面或单个表格的视觉例外放到实例层。
- 如果是预设级差异，优先改 `packages/theme`，不要在组件里硬编码样式。

## 当前验证

- 合并逻辑测试：packages/core/src/composables/useTheme.test.ts
- 表格组件测试：packages/table/src/components/VTable.test.ts

这一层测试会同时验证插件主题、实例 `ui` 与根节点 `class` 能正确叠加到表格 DOM。
