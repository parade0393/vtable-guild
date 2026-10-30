---
title: ant-design-vue / element-plus 表格功能对比
description: vtable-guild 与 ant-design-vue Table、element-plus Table 的逐项功能对比：虚拟滚动、列宽拖拽、行拖拽排序、主题 token 等增强能力与迁移成本。
---

# 功能对比总览

这一页只回答一个问题：如果你已经在使用 ant-design-vue Table 或 element-plus Table，vtable-guild 多了什么，迁移成本主要落在哪里。

## 功能矩阵

| 能力                 | ant-design-vue                           | element-plus                       | vtable-guild                                       |
| -------------------- | ---------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| 常见列配置与交互写法 | 支持                                     | 主要依赖 `el-table-column`         | 支持，设计更贴近 ant-design-vue                    |
| 虚拟滚动             | 不支持                                   | 有独立 Virtualized Table 方案      | 原生支持，直接配合 `virtual` 和 `scroll.y` 使用    |
| 滚动体验优化         | 默认滚动体验                             | 体验更好，可作参考                 | 在 antdv 预设下做了额外打磨，方向参考 element-plus |
| 列宽拖拽             | 支持 `resizable`、`minWidth`、`maxWidth` | 支持，通常在 border 模式里使用     | 支持，并沿用接近 antdv 的字段心智                  |
| 条纹行               | 主要靠 `rowClassName`                    | 直接使用 `stripe`                  | 直接使用 `striped`                                 |
| hover 开关           | 没有独立开关                             | 没有独立开关                       | 直接使用 `hoverable`                               |
| 边框模式             | 支持                                     | 支持                               | 支持，直接使用 `bordered`                          |
| 主题预设切换         | 不支持                                   | 不支持                             | 支持 `antdv` / `element-plus`                      |
| slot 级样式覆盖      | 主要依赖 CSS 覆盖                        | 主要依赖 class、style 和 slot 组合 | 通过 `ui` 和全局 `theme` 精确覆盖                  |
| 尺寸命名             | `small / middle / large`                 | `large / default / small`          | `small / middle / large`，与 antdv 一致            |
| 内置 locale 预设     | 依赖组件库全局配置                       | 依赖组件库全局配置                 | 内置 locale 并支持局部覆盖                         |

## ProTable 业务增强的采用方式

vtable-guild 以 Ant Design ProTable 的查询、EditableProTable 与 ProField 协议为参照，提供以下可选能力。它们与基础表格独立组合，保持 `antdv / element-plus` 双预设，不要求引入 React 或更换项目现有表单控件。

| 能力               | 本库入口                                                                  | 采用时需要处理的部分                                                                                 |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 查询提交与参数转换 | [`useTableQuery`](/guide/query) + [`useTableRequest`](/guide/remote-data) | 将现有表单绑定草稿，提交与重置进入统一请求入口；控件和表单校验由宿主管理                             |
| 行编辑与缓存新增   | [`useTableEdit`](/guide/editing) + `bodyCell`                             | 使用独立草稿、异步校验和保存状态；由业务更新数据，提供编辑器与操作按钮                               |
| 可插拔字段展示     | [`valueType / fieldProps / createTableRenderers`](/guide/cell-render)     | 内置日期时间/区间、百分比、进度等只读类型，业务扩展映射与 `valueEnum` 共用；不生成完整查询或编辑表单 |
| 懒加载树           | [`loadData / isLeaf`](/guide/tree-table)                                  | 加载、错误、重试与竞态由表格管理；稳定 key 与叶子判断由业务提供，选择只计算已加载节点                |
| 实例定位           | [`TableInstance.scrollTo`](/guide/table-instance)                         | 按 key、可见索引或像素定位；未加载页与折叠节点先由业务准备数据                                       |

列设置还提供固定、锁定、隐藏设置项与面板拖拽，`useColumnState` 持久化用户偏好。[Schema 查询区](/guide/schema-query)与[列编辑/明细表单](/guide/editable-columns)提供可选控件接线、转换和全量草稿校验。完整范围以各指南为准；不包含完整 ProForm、CRUD 流程或服务端批量事务。

## 结论

- 如果你只需要一张基础表格，原生表格通常已经够用
- 如果你来自 ant-design-vue，vtable-guild 的主要价值是把虚拟滚动、主题系统和更直接的视觉状态开关收进同一套表格模型
- 如果你来自 element-plus，vtable-guild 的主要价值是把表格能力统一到同一套 columns + props 模型里，而不是在普通表格和独立增强方案之间切换

## 继续阅读

- [增强与独有能力](/comparison/enhancements)
- [查询提交与重置](/guide/query)
- [字段渲染器](/guide/cell-render)
- [为什么选择 vtable-guild](/guide/why)
- [从 ant-design-vue 迁移](/guide/migration-from-antd)
