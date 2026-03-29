# 预设与语言

`vtable-guild` 的运行时配置除了主题 slot 覆盖，还包括两条更上层的通道：`themePreset` 负责切换视觉预设，`locale`、`locales` 和 `localeOverrides` 负责切换与扩展文案。

## 预设切换

全局安装时可以通过 `createVTableGuild` 指定预设：

```ts
import { createVTableGuild } from '@vtable-guild/core'

app.use(
  createVTableGuild({
    themePreset: 'antdv',
  }),
)
```

当前内置目标预设有两套：

- `antdv`：默认预设，对齐 ant-design-vue。
- `element-plus`：预留并逐步完善的第二套视觉方向。

## 语言与文案覆盖

```ts
app.use(
  createVTableGuild({
    locale: 'en-US',
    locales: {
      'en-US': {
        table: {
          header: {
            sortTriggerAsc: 'Sort ascending',
            sortTriggerDesc: 'Sort descending',
            cancelSort: 'Cancel sorting',
            filterTriggerAriaLabel: 'Filter',
          },
          filterDropdown: {
            searchPlaceholder: 'Search filters',
            emptyText: 'No filters',
            resetText: 'Reset',
            confirmText: 'OK',
            selectAllText: 'Select all',
          },
          empty: { text: 'No data' },
          loading: { text: 'Loading...' },
          selection: {
            selectAll: 'Select all',
            selectInvert: 'Invert selection',
            selectNone: 'Clear selection',
          },
        },
      },
    },
  }),
)
```

如果你只想局部覆写少量文案，可以传 `localeOverrides`，不必完整重写整套 locale。

## 局部作用域配置

对单个页面或单个子树做定向切换时，可以使用 `VTableGuildConfigProvider`：

```vue
<VTableGuildConfigProvider locale="en-US">
  <VTable :columns="columns" :data-source="dataSource" />
</VTableGuildConfigProvider>
```

这个 provider 会在父级上下文基础上继续合并 `theme`、`locales` 和 `localeOverrides`，适合多语言或多预设对照页。

## 当前实践

- playground 顶部支持 ant-design-vue / element-plus 预设切换。
- playground 同时提供 `zh-CN` 和 `en-US` locale 切换。
- 页面级预设隔离由 `PlaygroundPresetScope` 负责，通过 provide/inject 覆盖 `themePreset`。

## 对照示例来源

- playground 入口：playground/src/App.vue
- 相关实现：packages/core/src/plugin/index.ts、packages/core/src/components/VTableGuildConfigProvider.tsx

<PlaygroundDemo
  title="预设与语言切换对照页"
  route="/basic"
  note="打开 playground 后，可直接使用顶部控制区切换 ant-design-vue / element-plus 预设，以及中文 / English locale。"
  :height="760"
/>
