---
title: vtable-guild 相对原表格的增强能力
description: vtable-guild 在 ant-design-vue 与 element-plus 表格之外的独有能力：虚拟滚动、列显示与顺序、行拖拽、三层主题覆盖等，附迁移说明。
---

# 增强与独有能力

这一页只聚焦“相对原表格方案额外得到什么”，不重复完整教程。需要具体使用方式时，请跳到对应指南页。

## 更顺手的 API

### 尺寸命名与 ant-design-vue 一致

表格尺寸沿用 `small`、`middle`、`large`，和 ant-design-vue 完全相同——从 antdv 迁过来时这一项不用改。默认值是 `large`。

### TypeScript 使用链路更完整

VTable 提供明确的列类型、行数据类型、事件参数类型，以及主题 key 和 slot key 的类型边界，适合在业务代码里长期维护。

### 样式覆盖路径更清晰

除了 Vue slot，本库把样式覆盖拆成三层：

- `themePreset`
  切换整体视觉基线
- 全局 `theme`
  统一应用级规则
- 实例级 `ui`
  处理单表例外

对应说明见 [三层主题覆盖](/guide/theme-overrides)。

## 更直接的表格能力

### 虚拟滚动

通过 `virtual` 配合 `scroll.y` 直接启用，适合长列表和性能敏感页面。详见 [虚拟滚动](/guide/virtualization)。

### 列设置：列显示与列顺序

`column.visible` 控制列是否显示、`columnOrder` 按列 key 重排顶层列，都是受控属性——显示状态可以持久化成用户偏好。antdv / element-plus 的原生表格都需要自行拼装这类「列设置」面板。详见 [列显示与列顺序](/guide/column-display)。

`VTableColumnSettings` 提供分组显隐、全选、半选、固定左右、同一固定区域内的顶层拖拽换序和密度菜单。`disable` 可以逐列锁定操作，`hideInSetting` 隐藏设置项。面板通过 `update:columns` 更新受控列，面板重置仅恢复初始显隐；`useColumnState` 可持久化显隐、固定和顺序，并独立重置全部偏好。

### 可组合工具栏

`VTableToolbar` 组合标题、刷新、搜索、密度、列设置和按需开启的全屏。业务通过 `#actions` 添加导出、新增等按钮，通过筛选与多行扩展插槽组合查询区；刷新可连接 `useTableRequest.reload`，也可保留原有请求方式。详见 [工具栏与业务扩展](/guide/toolbar)。

### 对齐 ProTable 的查询、编辑与字段展示

业务增强参考 Ant Design ProTable，按现有 Vue props、slots 与组合式函数拆分，两套预设使用相同状态协议：

| 能力                           | 使用方式                                                                                              | 边界                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [查询与请求](/guide/query)     | `useTableQuery` 管理草稿、提交、重置、字段参数转换与折叠；连接 `useTableRequest`                      | 输入不自动查询；控件与表单校验复用宿主 UI，不自动生成完整表单        |
| [编辑](/guide/editing)         | `useTableEdit` 管理 `editableKeys`、独立草稿、异步校验、保存、取消和缓存新增行                        | 编辑器经 `bodyCell` 接入，业务提交数据；不提供整表事务或电子表格导航 |
| [字段渲染](/guide/cell-render) | `valueType / fieldProps / createTableRenderers` 提供 text、digit、money、date、tag 和自定义只读渲染器 | 与 `valueEnum` 共用枚举和状态；自定义渲染优先，不生成查询或编辑控件  |

这组能力可以分别采用，不要求将已有页面切换为完整 ProTable 页面框架。

### 懒加载树与实例定位

`loadData(record, { signal })` 与 `isLeaf` 为树形数据提供加载态、错误和重试；同节点并发请求去重，折叠后结果缓存，替换记录或卸载时旧任务失效。加载后代参与父子选择与虚拟化，选择只计算客户端已经加载的节点。详见[树形表格](/guide/tree-table)。

模板 ref 的 `TableInstance.scrollTo({ key, index, top, left })` 统一普通与虚拟表体定位，`retryTreeLoad / getTreeLoadError` 提供树加载重试和错误读取。定位限当前页已加载且可见的记录，跨页或折叠树节点由业务先切页、加载或展开。详见[表格实例与定位](/guide/table-instance)。

### 行拖拽排序

`rowDraggable` 开启原生 HTML5 整行拖拽，拖放结束通过 `rowDragEnd` 返回重排后的数据（受控模式），不需要再引入第三方拖拽库。详见 [行拖拽排序](/guide/row-drag-sort)。

### 更直接的视觉状态开关

- `striped`
  条纹行
- `hoverable`
  行 hover 高亮
- `bordered`
  边框模式

这些状态都可以直接通过 props 或主题配置开启，不需要再拆散到业务 CSS 里。

### 多预设支持

当前内置 `antdv` 和 `element-plus` 两套预设，可让同一套表格逻辑接入不同 Vue UI 体系。详见 [预设与语言](/guide/presets-and-locales)。

## 继续阅读

- [功能对比总览](/comparison/)
- [虚拟滚动](/guide/virtualization)
- [列宽拖拽](/guide/column-resize)
- [列显示与列顺序](/guide/column-display)
- [工具栏与业务扩展](/guide/toolbar)
- [查询提交与重置](/guide/query)
- [编辑](/guide/editing)
- [字段渲染器](/guide/cell-render)
- [树形表格](/guide/tree-table)
- [表格实例与定位](/guide/table-instance)
- [行拖拽排序](/guide/row-drag-sort)
- [三层主题覆盖](/guide/theme-overrides)
