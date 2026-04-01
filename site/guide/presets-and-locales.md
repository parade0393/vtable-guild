# 预设与语言

这部分配置解决的是两个更上层的问题：

- 整体外观要贴近哪套 UI 体系。
- 表格内部文案要用哪种语言，以及如何局部覆盖。

## 主题预设

当前内置两套主题预设：

- antdv，默认预设，适合已经接入 ant-design-vue 的项目。
- element-plus，适合已经使用 element-plus 视觉体系的项目。

运行时切换方式很直接：

```ts
app.use(
  createVTableGuild({
    themePreset: 'antdv',
  }),
)
```

如果你改成 element-plus，也要记得在样式入口里补上对应 preset 文件，详见 [包导入与样式](/guide/package-consumption)。

## 内置语言

当前内置的 preset locale 至少覆盖了 zh-CN 和 en-US 两种常见语言场景，主要包括：

- 排序提示文案
- 筛选面板文案
- 空态文案
- 加载态文案
- 行选择菜单文案

## 注册和覆盖语言包

如果你要切成英文或自定义文案，可以在插件层传 locale、locales 和 localeOverrides：

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

如果你只想覆盖少量字段，优先使用 localeOverrides，不必重写整套 locale。

## 局部作用域切换

当你需要在某个子树里单独切换预设或语言时，可以使用 VTableGuildConfigProvider：

```vue
<VTableGuildConfigProvider locale="en-US">
  <VTable :columns="columns" :data-source="dataSource" />
</VTableGuildConfigProvider>
```

这类方式适合局部对照页、多语言后台或嵌入式业务模块。

## 相关页面

- [三层主题覆盖](/guide/theme-overrides)
- [包导入与样式](/guide/package-consumption)
