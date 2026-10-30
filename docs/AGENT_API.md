# vtable-guild Agent API Reference

> **对应版本**：当前仓库实现。本文档是给 AI 编码助手（Claude Code / Codex / Cursor 等）的单文件速查，内容来自官方 API 文档与运行时告警，无营销描述。
>
> **最重要的规则**：vtable-guild 的 API 与 **ant-design-vue Table 对齐**（props 命名、column 结构、slots、事件模型基本一致）。你可以按 antdv 的习惯生成代码，然后对照本文核对差异——尤其是「不支持的功能」一节。

## 导入入口

所有组件、常量和类型统一从 `@vtable-guild/vtable-guild` 导入：

```ts
import {
  VTable,
  VTableToolbar, // 可选工具栏，通过 actions 插槽添加导出等业务按钮
  VTableSelectionAlert, // 受控的已选数量与批量操作提示条
  useTableRequest, // 可选服务端请求管理
  createTableDictionary, // 实例隔离的远程字典缓存与并发复用
  useTableDictionary, // 选项、枚举标签、完整表头筛选与依赖参数
  useTableQuery, // 查询草稿、提交、重置、字段参数转换
  useTableEdit, // EditableProTable 风格的编辑 keys、草稿与校验
  useTableEditable, // 列级编辑控件、转换、字段校验接线
  VTableEditCell, // 模板中的稳定编辑单元格桥接
  VTableQuery, // schema 查询区与轻量布局
  deriveTableQueryFields, // 按列派生查询字段，独立于表格显隐
  createAntdvTableControls,
  createElementPlusTableControls, // 传入应用已有宿主组件，不导入 UI 库
  createTableRenderers, // ProField 风格的 valueType/fieldProps 扩展
  useColumnState, // 可选列偏好与持久化
  VTableColumnSettings, // 可单独使用的密度与列显隐面板
  VTableSummary, // 摘要行容器，子组件 VTableSummary.Row / VTableSummary.Cell
  EXPAND_COLUMN, // 展开列占位常量，放进 columns
  SELECTION_COLUMN, // 选择列占位常量，放进 columns
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE, // 批量选择菜单哨兵
  type TableColumnsType,
  type TableProps,
  type TableInstance,
  type TableColumnSettingsSize,
  type TableToolbarOptions,
  type TableToolbarSlotProps,
  type RowSelection,
  type Expandable,
  type Key, // string | number
} from '@vtable-guild/vtable-guild'
```

## ProTable 常用扩展

- `manual: true` 跳过本地排序、筛选和分页计算；对象形式可分别配置 `sort / filter / pagination`，状态与事件保留。`sorter: true` 默认仍会本地比较，不能单独作为远程排序开关。
- `useTableRequest` 连接表格 `change` 与工具栏 `reload`；返回数据、加载、错误、分页、manual、submit / reset / reload。只绑定一个请求入口，选择事件不查询。见[远程数据](../site/guide/remote-data.md)。
- `polling` 支持毫秒数、`false` 或 `(rows) => number | false`，最小间隔 2000ms，前一请求结束后计时；`revalidateOnFocus` 在页面重新可见时刷新。默认隐藏暂停、错误停止，可通过 `pollingWhenHidden / pollingOnError` 改变。成功加载后的自动请求只设置 `refreshing`，`loading` 用于首次与手动请求；`pause / resume(immediate?) / paused` 控制自动刷新，`cancel` 同时取消请求与暂停。浏览器 effect scope 内才启动自动任务，`manualRequest` 不会被自动刷新绕过。
- `createTableDictionary({ key, request, cacheTime?, maxEntries? })` 创建可共享实例；`useTableDictionary({ dictionary, params?, selectedOptions?, debounceTime?, manualRequest? })` 返回 `options / valueEnum / filters / complete / loading / error / keyword / search / reload / cancel`。request 返回 `{ options: [{ value, label, status?, disabled? }], complete }`；只有完整且无搜索词的结果生成 filters，远程搜索不要用 `filters: true`。值保留 string/number/boolean 类型，依赖变化清理候选和已知标签，但不改变业务选中值；`selectedOptions` 补齐已选标签。实例内按参数与搜索词缓存并复用在途请求，默认 5 分钟 / 50 项，不跨实例或 SSR 请求全局共享。见[远程字典](../site/guide/dictionary.md)。
- `VTableSelectionAlert` 使用受控 `selectedRowKeys` 统计跨页数量，清空只请求更新。已选 keys 不代表已获得全部 records。见[批量操作](../site/guide/selection-alert.md)。
- 列 `copyable / tooltip / valueEnum` 与表格 `columnEmptyText` 提供复制、说明、枚举和空值显示。`filters: true` 从枚举生成筛选项，`onFilter: false` 关闭本地筛选。见[单元格展示](../site/guide/cell-display.md)。
- `useColumnState` 可保存显隐、固定与顶层顺序；列的 `hideInSetting / disable` 控制设置入口。面板 reset 仍只恢复显隐，helper.reset 恢复全部偏好。见[列设置](../site/guide/column-display.md)。
- 工具栏支持 `search`、受控 `searchValue`、`search / clearSearch` 事件以及 `search / filter / extra` 插槽；业务决定视图切换时的页码与选择状态。
- `loading` 对象支持 `delay`（毫秒）和 `wrapperClassName`；`showSorterTooltip` 支持独立的 tooltip 配置对象（延迟单位秒）。

### P2：ProTable 查询、编辑与字段协议

- `VTableQuery` 接 `query / fields / controls`，query 由 `useTableQuery` 创建；字段 `name / valueType / hidden / order / fieldProps / dictionary / options / disabled / readonly` 独立配置。`deriveTableQueryFields<TValues,TRecord>(columns, overrides?)` 从 `TableQueryColumn.query` 派生，`query:false` 排除。`layout:'light'` 提供轻量横排，只有显式 `autoSubmit:true` 才在控件更新后按 `debounceTime` 提交。`validate(values,{fields,action,signal})` 在现有提交协议前运行；不要再绑定另一套请求事件。`hiddenPolicy:'omit'` 省略 schema 隐藏字段，折叠不省略；手写 `query.submit/reset({omitFields})` 也可用。见[Schema 查询区](../site/guide/schema-query.md)。
- `createAntdvTableControls(components)` / `createElementPlusTableControls(components)` 注册宿主 Input、Select、InputNumber、DatePicker、RangePicker/TimePicker；Element Plus 额外传 Option。控件事件由注册表接线，日期默认格式化字符串，fieldProps.valueFormat 可覆盖。Select 保留 string/number/boolean 值身份，labelInValue 协议需自定义控件。注册业务类型使用 `(context:TableControlContext)=>VNodeChild`，context 提供 value/onChange/onSearch/options/loading/disabled/readonly/error/fieldProps。
- `useTableEditable({columns,controls,...useTableEditOptions})` 复用同一行草稿；列 `editor` 可配置 `editable / readonly / disabled` 条件、`convertValue / transform / validate / onValueChange / dictionary / options / fieldProps`。convertValue 进入编辑时一次，transform 用于提交快照；字段规则通过后执行行 validate 一次。`getCell(cell)` 判定是否挂编辑器，模板 `<VTableEditCell v-if="edit.getCell(cell)" :edit="edit" :cell="cell"/>` 接 bodyCell，其他分支保留默认只读展示；自定义插槽仍可接管。见[列级编辑](../site/guide/editable-columns.md)。
- `useTableEdit/useTableEditable` 可配 `dataSource / onChange`：records 合成源、草稿、缓存新增；onChange 只在保存或 source 新增时通知，父回写不覆盖正在编辑的草稿。`getDrafts / getOriginal / getValues / validateAll / validating / reset` 支持明细表单；validateAll 返回 `{valid,values?,errors,obsolete?}`，校验所有客户端持有记录与离屏草稿，不调用 onSave。修改/源变化/卸载使旧校验失效；成功结果用同次 values 提交。`add(record?,{position:'top'|'bottom',mode:'cache'|'source'})` 支持 createRecord/maxRows，source 立即写入源且取消保留该记录，cache 取消移除。见[明细表单](../site/guide/detail-form.md)。

- `useTableQuery({ defaultValues, fieldTransforms, transform, onSubmit, onReset, collapsed, defaultCollapsed, onCollapse })` 返回 `draft / submitted / params / collapsed / submitting / error / submit / reset / resetFields / toggleCollapsed`。草稿不请求；字段转换替换原字段，可展开为多个参数；整体转换在提交、重置时运行。接 `onSubmit: request.submit`、`onReset: request.reset`，各点击请求一次。`resetFields` 只还原草稿；分页继续使用已经提交的参数。`collapsed` 接收共享 Ref，优先于默认 `true` 的 `defaultCollapsed`；`onCollapse` 接收展开收起状态变化。控件与布局复用宿主 UI 库。见[查询协议](../site/guide/query.md)。
- `useTableEdit({ rowKey, mode, clone, validate, onSave, onCancel, onError })` 对齐 EditableProTable 的 editableKeys 与缓存新增行。默认 single 拒绝同时开启第二行；multiple 允许独立编辑。用 `getDraft / setDraft` 管理隔离草稿，`save / cancel` 执行异步协议；`errors / savingKeys / cancellingKeys` 驱动业务反馈。记录含可变类实例时，通过 `clone(record)` 自定义快照；`onError(error, key)` 接收校验、保存或取消错误。校验失败、回调返回 false 或抛错时保持编辑；业务在 onSave 更新源数据。新增 `newRecords` 保存前由业务合并到展示数据，取消即移除。旧操作与卸载通过 context.signal 失效。见[编辑协议](../site/guide/editing.md)。
- `column.valueType` 内置 `text / digit / money / date / dateTime / time / dateRange / dateTimeRange / percent / progress / tag`，`column.fieldProps` 配置 formatter；百分数与进度默认使用 0–100，`percentScale: 'ratio'` 改为 0–1；进度限制到 0–100，日期区间接收两个端点。`createTableRenderers(overrides)` 产生表级不可变注册表，绑定 `VTable.renderers`。`valueEnum` 仍是一份文本与状态定义；customRender/bodyCell 优先，transformCellText 后进入字段展示，复制保持原转换值。见[字段渲染](../site/guide/cell-render.md)。
- 树形 `loadData(record, { signal })` 返回子节点数组，`isLeaf(record)` 标识叶子。`children: []` 表示已经加载的叶子；未声明 children 的非叶子展开时加载。并发去重、折叠缓存、失败图标重试；`onTreeLoadError` 接错误。缓存不修改输入数据，同 key 替换记录和卸载会中止旧请求。父子选择仅覆盖已加载子树。见[懒加载树](../site/guide/tree-table.md)。
- 模板 ref 使用 `TableInstance`：`await scrollTo({ key, index, top, left, align, offset })` 返回 boolean，key 优先；index 是当前页可见扁平行索引。当前页未加载、折叠或被筛选移除的行返回 false；业务先加载/展开/切页。普通和虚拟模式共用接口，不定行高沿用测量纠偏。`retryTreeLoad(key)` 不改变展开状态；`getTreeLoadError(key)` 读取错误。见[实例方法](../site/guide/table-instance.md)。

这些协议参考 Ant Design ProTable / EditableProTable / ProField，并适配 Vue props、slots 与 composables。完整 ProForm、Modal/Drawer 表单、事务和电子表格导航继续由业务或后续扩展负责。

## 初始化（一次性）

```ts
// src/main.ts
import { createApp } from 'vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'
import '@vtable-guild/vtable-guild/css/style' // prebuilt 模式，宿主无需 Tailwind

const app = createApp(App)
app.use(createVTableGuild()) // 默认 themePreset: 'antdv'
// app.use(createVTableGuild({ themePreset: 'element-plus' })) 切换视觉预设
```

## 最小示例

```vue
<script setup lang="ts">
import { VTable, type TableColumnsType } from '@vtable-guild/vtable-guild'

interface UserRow {
  key: string
  name: string
  age: number
  status: string
}

const columns: TableColumnsType<UserRow> = [
  { title: 'Name', key: 'name', dataIndex: 'name', width: 180 },
  { title: 'Age', key: 'age', dataIndex: 'age', width: 96, align: 'right', sorter: true },
  {
    title: 'Status',
    key: 'status',
    dataIndex: 'status',
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Paused', value: 'paused' },
    ],
    onFilter: (value, record) => record.status === value,
  },
]

const dataSource: UserRow[] = [
  { key: '1', name: 'Ada Lovelace', age: 28, status: 'active' },
  { key: '2', name: 'Grace Hopper', age: 32, status: 'paused' },
]
</script>

<template>
  <VTable row-key="key" :columns="columns" :data-source="dataSource" bordered hoverable />
</template>
```

## 可选工具栏与业务扩展

`VTableToolbar` 放在 `VTable` 的 `#title` 中，与表格共享受控 `columns`、`size`。以下片段中 `columns` / `size` 应声明为 `ref`；`dataSource`、`loading`、`reloadRows` 和 `exportRows` 由业务提供，UI 按钮使用项目已安装的组件库。

```vue
<VTable :columns="columns" :data-source="dataSource" :size="size" row-key="key">
  <template #title="{ data }">
    <VTableToolbar
      v-model:columns="columns"
      v-model:size="size"
      title="用户列表"
      :loading="loading"
      @reload="reloadRows"
    >
      <template #actions="{ disabled }">
        <a-button :disabled="disabled" @click="exportRows(data, columns)">导出</a-button>
      </template>
    </VTableToolbar>
  </template>
</VTable>
```

- `options` 默认开启 `reload`、`density`、`setting`；`fullScreen` 默认关闭。`options: false` 关闭内置工具，保留业务插槽；未传 `columns` 时隐藏列设置。
- `#actions` 追加业务按钮；`#settings` 完全替换内置工具。`title` / `actions` / `settings` 共享 `TableToolbarSlotProps`，包含 `columns`、`size`、`loading`、`disabled`、`fullscreen`、`fullscreenAvailable`、`reload()`、`toggleFullscreen()`；`#columnLabel` 自定义列选项标签。
- 刷新只发出 `reload`，业务管理请求与 `loading`。`disabled` 禁用内置操作，自定义按钮按插槽状态设置禁用规则。
- 全屏需开启 `options.fullScreen` 并传 `fullscreenTarget: () => HTMLElement | null | undefined`。浏览器确认后触发 `fullscreenChange`；失败触发 `fullscreenError`。列设置浮层默认挂到全屏目标内。
- `VTableColumnSettings` 可单独使用，必传受控 `v-model:columns`，可选 `v-model:size`，用 `options.density` / `options.setting` 分别控制两个入口。两者的 `reset` 只恢复初始列显隐；重置不改变列宽、密度、固定、顺序、排序或筛选。面板现支持固定位置与顶层分组拖拽，配置见列设置指南。
- 全局样式使用 `theme.toolbar.slots` / `theme.columnSettings.slots`，实例使用各自 `ui`。语言使用 `localeOverrides.toolbar` / `localeOverrides.columnSettings`，支持仅覆盖少量字段。

完整用法和类型见[工具栏与业务扩展](../site/guide/toolbar.md)、[列显示与列顺序](../site/guide/column-display.md)。

## 不支持的功能 / 常见幻觉点（生成代码前必读）

| 幻觉                                                            | 事实                                                                                                                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 直接给 `VTable` 传 `toolbar`、`export` 或 `toolBarRender`       | 工具栏是独立的 `VTableToolbar`，使用 `#actions` 扩展导出等业务功能；不自动请求数据或生成导出文件。                                                                              |
| 认为分页默认开启，或只能外接 `<a-pagination>`                   | 内置分页默认关闭，传 `pagination` 配置对象启用；支持本地与远程分页，保持三参数 change，状态从 extra.pagination 读取。                                                           |
| `change` 事件带 `pagination` 参数                               | `change(filters, sorter, extra)` 只有三个参数，`extra.action` 支持 `'sort' \| 'filter' \| 'select' \| 'paginate'`；启用分页时提供 extra.pagination。                            |
| `scroll.y` 传 `'50%'` / `'30vh'`                                | `virtual` 模式支持正数、`'auto'` 或正数 px 字符串；相对单位会告警并回退到 400px。非虚拟模式可按 CSS `max-height` 传入其他字符串。                                               |
| 虚拟模式下用 `customCell` / `customRender` 返回 colSpan/rowSpan | **虚拟滚动不支持单元格合并**。开启 `virtual` 后列上存在 `customCell`/`customRender` 会被告警并禁用。                                                                            |
| 树形选择按 antdv 习惯写（不传 `checkStrictly`）                 | **本库与 ant-design-vue 4.x 都默认 `checkStrictly: true`（父子独立选择）**。两个库默认行为一致，无需显式传 `true`。如需父子联动（勾父带子），显式传 `checkStrictly: false`。    |
| 树形数据 + 筛选 = 递归过滤                                      | **`onFilter` 只过滤顶层记录**：不递归 `children`，匹配子节点也不会保留其父节点。树形数据慎用筛选，或在外层自行实现递归过滤。                                                    |
| `virtual` 模式下 `summary` 会静默丢失                           | 已支持 summary：非 fixed summary 渲染在虚拟表体后，fixed summary 保持 sticky 底部块。                                                                                           |
| 所有 antdv Table props 都存在                                   | 只实现了本文列出的 props。`sticky.offsetScroll`/`getContainer` 等尚未实现，不要使用。                                                                                           |
| 树形数据的展开 props 写在 `expandable` 里                       | 树形数据的 `expandedRowKeys` / `defaultExpandAllRows` / `onExpand` / `onExpandedRowsChange` 在 **VTable 顶层 props**；`expandable` 对象只管展开行渲染（见下文 Expandable 表）。 |
| `column.ellipsis` 支持多行 `{ rows }`                           | 只支持 `boolean \| { showTitle?: boolean }`（单行省略）。                                                                                                                       |
| 树形 + 虚拟滚动不兼容                                           | **支持组合**：树形数据可以开 `virtual`（展开状态由组件维护）。                                                                                                                  |

分页传配置对象启用（不支持 `true`）；`current` / `pageSize` 分别受控，默认 1 / 10。远程分页传当页数据和 `total`，请求由业务管理。表头全选限定当前页；`selections: true` 的“全选所有”选择筛选后全部已加载可选记录，不请求其他页。远程跨页选择需设置 `preserveSelectedRowKeys: true`。

## VTable Props

### 数据与结构

| Prop                 | 类型                             | 默认值       | 说明                                                                |
| -------------------- | -------------------------------- | ------------ | ------------------------------------------------------------------- |
| `dataSource`         | `TRecord[]`                      | `[]`         | 表格数据源。                                                        |
| `pagination`         | `false \| TablePaginationConfig` | `false`      | 传 `{}` 启用本地或远程分页，见[分页](../site/guide/pagination.md)。 |
| `columns`            | `TableColumnsType<TRecord>`      | `[]`         | 列配置，支持叶子列、列组、`SELECTION_COLUMN`/`EXPAND_COLUMN` 占位。 |
| `columnOrder`        | `Key[]`                          | -            | 列显示顺序（按 key）；未出现的列保持原相对顺序排后。                |
| `rowKey`             | `string \| (record) => Key`      | -            | 行唯一标识。**建议总是显式传入**，否则回退行索引并告警。            |
| `childrenColumnName` | `string`                         | `'children'` | 树形数据的子节点字段名。                                            |
| `indentSize`         | `number`                         | `15`         | 树形数据缩进宽度（px）。                                            |

### 视觉与布局

| Prop                   | 类型                                         | 默认值    | 说明                                   |
| ---------------------- | -------------------------------------------- | --------- | -------------------------------------- |
| `size`                 | `'small' \| 'middle' \| 'large'`             | `'large'` | 与 antdv 命名一致。                    |
| `loading`              | `boolean \| { spinning?, indicator?, tip? }` | `false`   | 加载态。                               |
| `bordered` / `striped` | `boolean`                                    | `false`   | 边框 / 斑马纹。                        |
| `hoverable`            | `boolean`                                    | `true`    | 行 hover 高亮。                        |
| `tableLayout`          | `'auto' \| 'fixed'`                          | -         | 表格布局模式。                         |
| `showHeader`           | `boolean`                                    | `true`    | 是否显示表头。                         |
| `headerEllipsis`       | `boolean`                                    | `false`   | 让开启 `ellipsis` 的列表头也单行省略。 |
| `class`                | `string`                                     | -         | 根节点额外 class。                     |

### 滚动与虚拟

| Prop                | 类型                                                                                 | 默认值  | 说明                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scroll`            | `{ x?: number \| string; y?: number \| string; scrollToFirstRowOnChange?: boolean }` | -       | 提供 `y` 时形成固定表头滚动区；`virtual` 下 `y` 必须 px。 `scrollToFirstRowOnChange` 控制排序、筛选、分页后的纵向复位，开启分页时默认 true，否则默认 false。 |
| `sticky`            | `boolean \| TableSticky`                                                             | `false` | 粘性表头 / 摘要行 / 横向滚动条。                                                                                                                             |
| `virtual`           | `boolean`                                                                            | `false` | 纵向虚拟滚动，需同时设置 `scroll.y`。支持不定行高（默认实测行高）。                                                                                          |
| `rowHeight`         | `number`                                                                             | -       | 固定行高（px），仅 `virtual` 下生效；声明后 O(1) 视口计算。**仅当每行实际高度确实恒定才传**（有换行文本就不要传）。                                          |
| `virtualColumn`     | `boolean`                                                                            | `false` | 横向虚拟化，需 `virtual`。列上有 `customCell`/`customRender`、固定列不连续、`showHeader:false` 且有非数字列宽时自动降级并告警。                              |
| `getPopupContainer` | `(triggerNode) => HTMLElement`                                                       | -       | 筛选/选择/页大小菜单挂载容器。                                                                                                                               |

### 主题与语言

| Prop                          | 类型                                                     | 默认值           | 说明                                 |
| ----------------------------- | -------------------------------------------------------- | ---------------- | ------------------------------------ |
| `ui`                          | `SlotProps`                                              | -                | 当前表实例的 theme slot class 覆盖。 |
| `locale`                      | `LocaleName`                                             | 全局或 `'zh-CN'` | 实例语言。                           |
| `locales` / `localeOverrides` | `LocaleRegistry` / `DeepPartial<VTableGuildTableLocale>` | `{}`             | 额外语言包 / 局部覆写。              |

### 交互能力

| Prop                                         | 类型                                       | 默认值  | 说明                                |
| -------------------------------------------- | ------------------------------------------ | ------- | ----------------------------------- |
| `rowSelection`                               | `RowSelection<TRecord>`                    | -       | 开启选择列，见下文。                |
| `expandable`                                 | `Expandable<TRecord>`                      | -       | 开启展开行，见下文。                |
| `rowDraggable`                               | `boolean`                                  | `false` | 行拖拽排序；结束触发 `rowDragEnd`。 |
| `expandedRowKeys` / `defaultExpandedRowKeys` | `Key[]`                                    | -       | 树形展开（受控/默认）。             |
| `defaultExpandAllRows`                       | `boolean`                                  | `false` | 树形默认全展开。                    |
| `onExpand`                                   | `(expanded, record) => void`               | -       | 树形展开回调。                      |
| `onExpandedRowsChange`                       | `(expandedKeys) => void`                   | -       | 树形展开 keys 变化。                |
| `transformCellText`                          | `(opt) => unknown`                         | -       | 统一转换单元格文本。                |
| `showSorterTooltip`                          | `boolean`                                  | `true`  | 表级排序 tooltip，列级可覆盖。      |
| `sortDirections`                             | `SortOrder[]`                              | -       | 表级排序方向（列级默认值）。        |
| `rowClassName`                               | `string \| RowClassName<TRecord>`          | -       | body row class。                    |
| `customRow`                                  | `GetComponentProps<TRecord>`               | -       | body row 属性/事件注入。            |
| `customHeaderRow`                            | `(columns, index?) => CellAdditionalProps` | -       | header row 属性/事件注入。          |
| `title` / `footer`                           | `(data: TRecord[]) => VNodeChild`          | -       | 标题 / 页脚。                       |

## Column 字段

| 字段                                                        | 类型                                                              | 默认值                  | 说明                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `key`                                                       | `Key`                                                             | -                       | 列唯一标识，建议显式传入。                                                                         |
| `title`                                                     | `VNodeChild \| () => VNodeChild`                                  | -                       | 列标题。                                                                                           |
| `dataIndex`                                                 | `string \| (string \| number)[]`                                  | -                       | 数据字段路径，支持 `['address', 'city']`。                                                         |
| `width`                                                     | `number \| string`                                                | -                       | 列宽，数字按 px。                                                                                  |
| `align`                                                     | `'left' \| 'right' \| 'center'`                                   | -                       | 对齐。                                                                                             |
| `ellipsis`                                                  | `boolean \| { showTitle?: boolean }`                              | `false`                 | 单行省略。                                                                                         |
| `className`                                                 | `string`                                                          | -                       | 单元格额外 class。                                                                                 |
| `colSpan`                                                   | `number`                                                          | -                       | 表头单元格跨列数。                                                                                 |
| `visible`                                                   | `boolean`                                                         | `true`                  | 列显示开关。                                                                                       |
| `responsive`                                                | `Breakpoint[]`                                                    | -                       | 命中断点时显示（'xxxl'~'xs'）。                                                                    |
| `customRender`                                              | `({ text, record, index, column }) => VNodeChild \| RenderedCell` | -                       | 自定义单元格；返回 `RenderedCell` 时可带 `{ children, props: { colSpan, rowSpan, ... } }` 做合并。 |
| `customCell`                                                | `(record, index, column?) => CellAdditionalProps`                 | -                       | body cell 属性/事件注入。                                                                          |
| `customHeaderCell`                                          | `(column, index) => CellAdditionalProps`                          | -                       | header cell 注入。                                                                                 |
| `fixed`                                                     | `'left' \| 'right' \| true`                                       | -                       | 固定列；`true` = `'left'`。                                                                        |
| `resizable` / `minWidth` / `maxWidth`                       | `boolean` / `number` / `number`                                   | `false` / `50` / -      | 列宽拖拽（拖完触发 `resizeColumn`）。                                                              |
| `sorter`                                                    | `boolean \| ((a, b) => number) \| { compare, multiple }`          | -                       | 排序；对象形式做多列排序。                                                                         |
| `sortOrder` / `defaultSortOrder`                            | `'ascend' \| 'descend' \| null`                                   | -                       | 受控 / 默认排序。                                                                                  |
| `sortDirections`                                            | `SortOrder[]`                                                     | `['ascend', 'descend']` | 可用排序方向。                                                                                     |
| `filters`                                                   | `{ text, value, children? }[]`                                    | -                       | 筛选项，传入后显示筛选图标。                                                                       |
| `onFilter`                                                  | `(value, record) => boolean`                                      | -                       | 筛选函数。                                                                                         |
| `filterMultiple` / `filteredValue` / `defaultFilteredValue` | `boolean` / `Array<string\|number\|boolean> \| null` / 同左       | `true` / - / -          | 筛选受控组。                                                                                       |
| `customFilterDropdown`                                      | `boolean`                                                         | `false`                 | 使用表级 `customFilterDropdown` slot。                                                             |
| `filterSearch` / `filterMode`                               | `boolean \| fn` / `'menu' \| 'tree'`                              | `false` / `'menu'`      | 筛选搜索 / 展示模式。                                                                              |
| `filterDropdown` / `filterIcon`                             | `VNodeChild \| fn` / `({ filtered }) => VNodeChild`               | -                       | 列级自定义面板 / 图标。                                                                            |
| `filterDropdownOpen` / `onFilterDropdownOpenChange`         | `boolean` / `(visible) => void`                                   | -                       | 受控下拉可见性。                                                                                   |
| `children`                                                  | `ColumnType[] \| ColumnGroupType[]`                               | -                       | 子列；存在时该列为列组（不接收 sorter/filter 等）。                                                |

## RowSelection

```ts
const rowSelection: RowSelection<UserRow> = {
  type: 'checkbox', // 或 'radio'
  selectedRowKeys: selectedKeys.value, // 受控
  onChange: (keys, rows) => {
    selectedKeys.value = keys
  },
  getCheckboxProps: (record) => ({ disabled: record.age < 18 }),
}
```

常用字段：`type`（默认 `'checkbox'`）、`selectedRowKeys`/`defaultSelectedRowKeys`、`onChange(keys, rows)`、`onSelect(record, selected, rows)`、`onSelectAll(selected, rows, changeRows)`、`onSelectInvert(keys)`、`onSelectNone()`、`getCheckboxProps`、`columnWidth`、`fixed: boolean \| 'left' \| 'right'`、`columnTitle`、`renderCell`、`checkStrictly`（**本库与 antdv 4.x 都默认 `true` 父子独立选择；如需联动显式传 `false`**）、`selections`（批量菜单，`true` 给默认项）、`hideSelectAll`、`preserveSelectedRowKeys`。

## Expandable

```ts
const expandable: Expandable<UserRow> = {
  expandedRowRender: (record, index, indent, expanded) => h('div', record.note),
  expandRowByClick: true,
}
```

常用字段：`expandedRowRender`、`expandedRowKeys`/`defaultExpandedRowKeys`、`expandRowByClick`、`expandIcon`、`onExpand`、`onExpandedRowsChange`、`columnWidth`、`fixed`、`defaultExpandAllRows`、`rowExpandable`、`showExpandColumn`（默认 `true`）、`expandedRowClassName`。

## Events（v-on / onXxx）

| 事件           | 参数                                                                 | 说明                                                                                                                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `change`       | `(filters, sorter, extra)`                                           | 排序/筛选/选择/分页的统一出口；`extra.action: 'sort' \| 'filter' \| 'select' \| 'paginate'`，`extra.currentDataSource` 在排序、筛选、分页时为分页前处理后的数据，在选择时为当前页展示数据；远程场景仅包含已加载记录。启用分页时附带 `extra.pagination`。                                                            |
| `resizeColumn` | `(column, width)`                                                    | 列宽拖拽结束。**组件不会自动记住新宽度**——必须把 `width` 回写到你自己的列配置响应式状态，否则下次渲染恢复原宽。注意 `column` 的类型是 `ColumnSentinel \| ColumnType<T> \| ColumnGroupType<T>` 联合（含 `SELECTION_COLUMN` 等哨兵），访问 `width` 前需收窄（如 `typeof column === 'object' && 'width' in column`）。 |
| `rowDragEnd`   | `(newData: TRecord[], info: { draggedKey, targetKey, orderedKeys })` | 行拖拽结束且顺序变化。                                                                                                                                                                                                                                                                                              |

## Slots

| Slot                   | 参数                                     | 说明                                                        |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `bodyCell`             | `{ text, value, record, index, column }` | 自定义单元格（最常用）。                                    |
| `headerCell`           | `{ title, column }`                      | 自定义表头单元格。                                          |
| `empty` / `loading`    | `()`                                     | 自定义空态 / 加载态。                                       |
| `customFilterDropdown` | `{ column, ... }`                        | 表级自定义筛选面板（需列上 `customFilterDropdown: true`）。 |
| `customFilterIcon`     | `{ column, filtered }`                   | 表级自定义筛选图标。                                        |
| `title` / `footer`     | `{ data }`（函数式 props 亦可）          | 标题 / 页脚。                                               |
| `summary`              | `()`                                     | 摘要行，配合 `VTableSummary`。                              |

## Summary 示例

```vue
<template>
  <VTable :data-source="rows" :columns="columns" row-key="key">
    <template #summary>
      <VTableSummary fixed>
        <VTableSummary.Row>
          <VTableSummary.Cell :index="0">Total</VTableSummary.Cell>
          <VTableSummary.Cell :index="1" align="right">{{ total }}</VTableSummary.Cell>
        </VTableSummary.Row>
      </VTableSummary>
    </template>
  </VTable>
</template>
```

`VTableSummary` 的 `fixed` 支持 `true` / `'top'` / `'bottom'`；`VTableSummary.Cell` 常用 `index` / `colSpan` / `rowSpan` / `align`。

**Cell `index` 的语义**：`index` 对应**最终展示列数组**的下标——包括开启 `rowSelection` / `expandable` 时自动插入的选择列 / 展开列（它们占最前面的下标）。例如同时开启选择列时，第 1 个数据列的 index 是 1。列宽对齐与 fixed 定位都按这个数组解析。

## 虚拟滚动示例（注意事项集中在这）

```vue
<template>
  <!-- scroll.y 传正数或 'auto'；不要用 '%'。不要在列上放 customCell/customRender。 -->
  <VTable
    :data-source="bigData"
    :columns="plainColumns"
    :scroll="{ y: 400 }"
    :virtual="true"
    row-key="key"
  />
</template>
```

- 固定列（`fixed: 'left' | 'right'`）与虚拟滚动可组合。
- `rowHeight` 仅在确认每行等高时传入（纯单行文本 + 无 ellipsis 换行）。
- 展开行在虚拟模式下可用；列窗口化（`virtualColumn`）下展开行 colspan 会跟随实际渲染列数。

## 运行时 dev 告警对照表

dev 构建下组件通过 `console.warn` 输出一次性告警，格式为 `[VTable] ...`。每条告警对应一个稳定 id（下表），Agent 可根据 id 直接定位修法。

| id                                | 触发原因                                                                  | 修法                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `vtable-rowkey-fallback-index`    | 未配置 `rowKey` 或记录上取不到该字段，回退到行索引                        | 给 `rowKey` 传记录的唯一字段名或函数；选择/展开/树形场景下不配会状态错乱 |
| `vtable-row-height-mismatch`      | 声明了 `rowHeight`，但实测首行高度与之不符                                | 去掉 `rowHeight`，交给默认实测路径                                       |
| `vtable-virtual-body-span`        | `virtual` 开启且列上存在 `customCell`/`customRender`（可能返回合并 span） | 虚拟模式移除单元格合并，或关闭 `virtual`                                 |
| `vtable-virtual-column-disabled`  | `virtualColumn` 开启但前置条件不满足（如固定列不连续、存在 customCell）   | 按告警说明调整列定义，或放弃横向虚拟化                                   |
| `vtable-virtual-column-no-header` | `virtualColumn` + `showHeader: false` 且有非数字列宽                      | 提供全数字列宽或保留表头                                                 |
| `vtable-scroll-y-compat-px`       | `virtual` 下 `scroll.y` 使用了兼容的正数 px 字符串                        | 改用正数数字或 `'auto'`                                                  |
| `vtable-scroll-y-invalid-string`  | `virtual` 下 `scroll.y` 为 `%`/`vh`/`calc` 等无法可靠解析的值             | 改用正数、`'auto'` 或正数 px 字符串                                      |
| `vtable-scroll-y-invalid-number`  | `virtual` 下 `scroll.y` 为负数或非有限数                                  | 改用有限正数或 `'auto'`                                                  |
| `vtable-auto-height-unavailable`  | `scroll.y: 'auto'` 但父容器无确定高度或 wrapper 不可见                    | 确保表格父容器有明确高度（px / vh / flex 等）                            |
| `vtable-table-context`            | Table 子组件在 VTable 外部使用，缺失 context                              | 只在 VTable 内部使用 TableCell 等子组件                                  |

## 相关完整文档

- 完整文档单文件：<https://parade0393.github.io/vtable-guild/llms-full.txt>
- 文档索引：<https://parade0393.github.io/vtable-guild/llms.txt>
- 仓库：<https://github.com/parade0393/vtable-guild>
