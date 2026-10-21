# 预设与语言

这部分配置解决的是两个更上层的问题：

- 整体外观要贴近哪套 UI 体系。
- 表格内部文案要用哪种语言，以及如何局部覆盖。

## 在线示例

同一套列定义与数据，切换预设与语言看效果。这是本库最独特的一点：换皮肤不用换表格、不用换 API。

<Demo src="presets-and-locales/preset-switch">

<<< @/demos/presets-and-locales/preset-switch.vue

</Demo>

> 应用里一般直接 `createVTableGuild({ themePreset })` 配一次即可。上面的示例为了在同一页对比两套皮肤，才就地 provide 了一个作用域 context。

## 主题预设

当前内置两套主题预设：

- antdv，默认预设，适合已经接入 ant-design-vue 的项目。
- element-plus，适合已经使用 element-plus 视觉体系的项目。

初始化时选择预设：

```ts
app.use(
  createVTableGuild({
    themePreset: 'antdv',
  }),
)
```

如果你改成 element-plus，直接在 JS 侧切换即可，无需追加 CSS（`@vtable-guild/vtable-guild/css/style`、`@vtable-guild/vtable-guild/css/tailwind3` 和 `@vtable-guild/vtable-guild/css/tailwind4` 均已内含所有预设样式）：

```ts
app.use(
  createVTableGuild({
    themePreset: 'element-plus',
  }),
)
```

你不需要手动在 HTML 上添加 `data-vtg-preset` 属性，插件会自动处理。更多接入方式见 [安装与使用](/guide/installation)。

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

当你需要在某个子树里覆盖语言或主题样式时，可以使用 `VTableGuildConfigProvider`：

```vue
<VTableGuildConfigProvider locale="en-US">
  <VTable :columns="columns" :data-source="dataSource" />
</VTableGuildConfigProvider>
```

这类方式适合局部对照页、多语言后台或嵌入式业务模块。

Provider 支持 `theme`、`cssMode`、`classPrefix`、`locale`、`locales` 和 `localeOverrides`，完整类型见页末声明。`themePreset` 与 `compatClass` 继承插件上下文；预设通过 `createVTableGuild({ themePreset })` 配置，Provider 没有这两个 props。

## 相关页面

- [三层主题覆盖](/guide/theme-overrides)
- [安装与使用](/guide/installation)

## 分页语言

语言包提供可选 `pagination` 分组，旧语言包无需修改。内置中英文；可用 `localeOverrides.pagination` 全局覆盖，或 `pagination.locale` 实例覆盖（最高优先级）。完整字段见 `VTableGuildPaginationLocale`；`prev_pages` / `next_pages` 是可选的跳转文案模板，`{count}` 会替换为跳转页数。

当前 `DeepPartial` 对可选的 `pagination` 分组保留完整语言包类型。全局只改部分分页文案时，展开内置语言包后覆盖即可通过类型检查；实例 `pagination.locale` 使用 `Partial<VTableGuildPaginationLocale>`，可以直接传少量字段。

```ts
import { createVTableGuild, paginationZhCN } from '@vtable-guild/vtable-guild'

app.use(
  createVTableGuild({
    localeOverrides: {
      pagination: { ...paginationZhCN, items_per_page: '条记录 / 页' },
    },
  }),
)
```

## Type Declarations

下列为本页使用的完整配置与语言声明。主题覆盖的依赖类型见 [类型参考](/guide/type-reference#vtableguildthemeoverrides)。Provider props 接口是文档辅助类型，不是包导出。

::: details Type Declarations

<<< @/.vitepress/type-declarations/config.ts#ThemePresetName

<<< @/.vitepress/type-declarations/config.ts#VTableGuildOptions

<<< @/.vitepress/type-declarations/config.ts#createVTableGuild

<<< @/.vitepress/type-declarations/config.ts#VTableGuildConfigProviderProps

<<< @/.vitepress/type-declarations/config.ts#VTableGuildContext

<<< @/.vitepress/type-declarations/config.ts#VTABLE_GUILD_INJECTION_KEY

<<< @/.vitepress/type-declarations/config.ts#LocaleName

<<< @/.vitepress/type-declarations/config.ts#BuiltInLocaleName

<<< @/.vitepress/type-declarations/config.ts#LocaleRegistry

<<< @/.vitepress/type-declarations/config.ts#DeepPartial

<<< @/.vitepress/type-declarations/config.ts#VTableGuildLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableHeaderLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableFilterDropdownLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableEmptyLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableLoadingLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildTableSelectionLocale

<<< @/.vitepress/type-declarations/config.ts#VTableGuildPaginationLocale

<<< @/.vitepress/type-declarations/config.ts#PaginationLocaleConstants

:::
