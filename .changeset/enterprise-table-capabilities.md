---
'@vtable-guild/vtable-guild': minor
---

- 新增 `manual` 服务端模式与 `useTableRequest` 请求编排：显式跳过本地排序 / 筛选 / 分页，组合式函数提供竞态安全的加载、防抖、刷新与远程末页回退。
- 新增 `VTableSelectionAlert` 批量操作提示条，外观对齐 React ProTable 现行样式，支持跨页 keys 计数、受控清空与自定义操作插槽。
- 新增列展示能力：`copyable` 复制、表头 `tooltip` 说明、`valueEnum` 枚举映射（可联动生成筛选项与状态点）与表级 `columnEmptyText` 空值占位。
- 列设置面板支持逐列锁定（`disable`）、`hideInSetting`、固定左右与顶层拖拽换序；新增 `useColumnState` 列偏好持久化。
- 工具栏新增受控搜索框与 `filter` / `extra` 插槽，支持 `multipleLine` 多行布局。
- antd 对齐：`expandIconColumnIndex`、`expandColumnTitle`、`loading.delay / wrapperClassName`、`showSorterTooltip` 配置对象与 `clearFilters` 受控提交语义。
- 行为变化：布尔 `false` 单元格由空白改为渲染 `false`；列设置面板默认启用固定与拖拽入口（`options: { fixed: false, draggable: false }` 可关闭）；`clearFilters()` 无参调用默认立即提交。
