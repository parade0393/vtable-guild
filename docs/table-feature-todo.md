# 表格能力 TODO：现状、React ProTable 对齐与后续排期

> 更新日期：2026-10-25。P2 实施基线：最新主线 `048af05`。
>
> 本文整合原《表格能力 TODO 清单》及本轮 React ProTable 调查，作为维护者的功能待办入口。
> P0 / P1 / P2 已完成实现，公开 API 以组件源码和使用指南为准。P3 保留最低优先级。
> 已补齐实现、双预设主题、文档、示例和回归测试；验证结果见 §9。
>
> 排期约定：**键盘可达性按维护者要求放在最低优先级 P3，暂不进入近期迭代。**

## 1. 产品边界与优先级

目标仍是为已经集成 ant-design-vue 或 Element Plus 的 Vue 项目提供可替换、可配置、支持虚拟化的表格。
React ProTable 用于参考成熟的交互和状态协议，接口应结合现有 Vue props、emits、slots 与组合式函数设计。

| 优先级 | 含义                                               |
| ------ | -------------------------------------------------- |
| P0     | 当前实现与使用说明冲突，可能让已有业务得到错误结果 |
| P1     | 高频业务能力，有现成基础，适合近期迭代             |
| P2     | 依赖较多、成本较高或需要明确使用场景后再做         |
| P3     | 最低优先级；本轮明确将键盘可达性放在此处           |

新增 UI 以 Ant Design / React ProTable 的布局、间距、图标与反馈为参照，antdv 预设保持风格一致；playground 提供原生 Ant Design 对照。

所有功能都应兼容 `antdv` 与 `element-plus`。视觉变更进入 `packages/theme` 的 token、slot 和预设层。
工具栏、列设置、请求管理等扩展尽量保持可组合，避免让基础表格承担完整 CRUD 页面框架的职责。

## 2. 调查基线：本轮实施前已经具备的能力

本节保留调查时的历史状态；交付后的实际状态以 §4、§5 与 §7 为准。

| 原清单条目             | 当前状态                              | 证据与边界                                                                                                                                                                                  |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PG / AL-7 分页         | 已完成                                | 默认关闭；本地与远程分页、受控与非受控状态、上下位置、布局与内容插槽均已有实现。见[分页指南](../site/guide/pagination.md)、[分页状态](../packages/table/src/composables/usePagination.ts)。 |
| AL-1 变化后滚回顶部    | 已完成                                | `scroll.scrollToFirstRowOnChange` 控制排序、筛选、分页后的纵向复位；开启分页时默认启用。见[表格实现](../packages/table/src/components/Table.tsx)。                                          |
| ENT-1 列设置           | 基础版完成                            | 已有分组显隐、全选与半选、重置、受控更新。固定位置、拖拽换序、逐列锁定仍待补。见[列设置指南](../site/guide/column-display.md)。                                                             |
| ENT-2 密度入口         | 已完成                                | 三档密度，支持受控 `size` 和主题默认值。见[列设置组件](../packages/table/src/components/TableColumnSettings.tsx)。                                                                          |
| ENT-3 工具栏           | 工具栏完成，批量提示条未内置          | `VTableToolbar` 已有标题、业务操作、刷新、密度、列设置、可选全屏及替换插槽。见[工具栏指南](../site/guide/toolbar.md)。                                                                      |
| ENT-4 服务端数据       | 远程分页已支持，请求编排未实现        | 业务传入当前页数据与 `total`，自行管理请求和加载状态；纯服务端排序仍有 §3.1 的契约缺口。见[远程分页示例](../site/demos/pagination/remote.vue)。                                             |
| ENT-8 CSV / Excel 导出 | CSV 业务示例已有，库级导出 API 未实现 | 工具栏示例可生成 CSV；组件不自动生成导出文件。见[工具栏示例](../site/demos/toolbar/basic.vue)。                                                                                             |
| ENT-9 键盘可达         | 局部支持                              | 分页、列设置等已有键盘交互；排序表头和筛选入口仍有缺口。后续统一放到 P3。                                                                                                                   |
| ENT-5 编辑             | 组合示例已有，编辑引擎未实现          | 单元格与整行编辑可通过 `bodyCell` 实现，草稿、校验与提交仍由业务管理。见[编辑指南](../site/guide/editing.md)。                                                                              |

已有排序、筛选、选择、展开、树形、固定列、列宽调整、列顺序、行拖拽、摘要行及行列虚拟化，仍以
[API Reference](../site/guide/api-reference.md) 和[类型声明](../packages/table/src/types/index.ts)为准。

## 3. 原清单需要纠正的结论

### 3.1 `sorter: true` 的服务端语义存在真实冲突

当前代码中，`sorter: true` 会使用默认比较器，在本地重新排列数据。
没有 `compare` 的 sorter 对象也会进入默认比较分支；表格数据流随后调用 `sortData`。
这一行为已有本地排序测试，不能直接改掉而忽略兼容性。

调查时远程分页指南写的是“服务端排序使用 `sorter: true`”。业务按此接入时，服务器返回的结果可能在当前页被再次排序。
本轮早期分析沿用了该文档说法，进一步核对源码后予以纠正。

- 代码：[useSorter.ts](../packages/table/src/composables/useSorter.ts) 中的 `resolveCompareFn`、`sortData`。
- 调用：[Table.tsx](../packages/table/src/components/Table.tsx) 中的 `getProcessedData`。
- 既有契约：[useSorter.test.ts](../packages/table/src/composables/useSorter.test.ts)。
- 冲突说明：[分页指南](../site/guide/pagination.md)的“远程分页”一节。

**已解决：** `manual: true` 跳过本地排序、筛选与分页；对象形式可分别控制 `sort / filter / pagination`。`sorter: true` 保持原有本地比较行为。远程分页指南与请求组合式函数已使用新协议。

### 3.2 分页已发布的行为不应按旧建议重写

| 原清单建议或描述                               | 当前应采用的基线                                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 修改 `pageSize` 一律回第一页                   | 现有分页会保留页码，必要时收敛到末页；已有测试。请求扩展若选择回首页，应单独声明策略。                                                       |
| `position` 只能用 `'top' / 'bottom' / 'both'`  | 本库使用六方位数组并支持 `'none'`。本地安装的 ant-design-vue 4.2.6 **Table** 类型也使用六方位数组；不要混淆独立 Pagination 和 Table 的配置。 |
| 虚拟化与分页组合必须告警                       | 当前支持组合，`scroll.y: 'auto'` 会为分页区域留出空间；仅在确有非法配置时告警。                                                              |
| 远程删除最后一页后自动重新请求                 | 当前只收敛有效页码，不替业务请求。回退重取属于未来请求管理的工作。                                                                           |
| 必须新增 `extra.pagedDataSource`               | 当前没有该字段；先验证真实需求，不把旧建议当作已承诺 API。                                                                                   |
| `extra.currentDataSource` 对所有 action 都同义 | 排序、筛选、分页事件取分页前处理后的已加载数据；选择事件保留当前展示数据语义。                                                               |

继续保留 `change(filters, sorter, extra)`，分页状态从 `extra.pagination` 读取。
`title` / `footer` 接收当页展示数据。详见[分页事件契约](../site/guide/pagination.md#事件与其他功能)。

### 3.3 不把跨框架命名差异误记成兼容缺口

- `customHeaderCell` 本身就是 ant-design-vue 的列级 API；原 AL-6 的“应改名为 `onHeaderCell`”依据不成立。
  是否调整签名单独评估，不为名称重复增加别名。
- React ProTable 的 `manualRequest` 只控制首次请求，不等于跳过本地排序、筛选、分页计算。
- `hideInTable`、`renderText`、`toolBarRender` 的部分用途，当前已有 `visible`、`transformCellText` / `customRender`
  和工具栏插槽承接；优先补能力缺口，避免同义 API 并存。

## 4. 待办总表

P0 / P1 / P2 已交付；P3 保留排期。S / M / L 表达原评估规模。

| ID             | 优先级 | 待办                                         | 规模 | 依赖 / 说明                                        | 状态       |
| -------------- | ------ | -------------------------------------------- | ---- | -------------------------------------------------- | ---------- |
| BASE-1         | P0     | 明确纯服务端排序协议，修正文档与实现契约冲突 | M    | 请求管理前置；保留现有本地排序兼容性               | 已完成     |
| SEL-1          | P1     | 已选数量、清空与批量操作提示条               | S–M  | 复用现有受控选择状态                               | 已完成     |
| CELL-1         | P1     | 列级复制内容                                 | S–M  | 明确原值、展示值和自定义复制文本的关系             | 已完成     |
| CELL-2         | P1     | 表头说明 tooltip 与统一空值显示              | S    | 两项可独立交付                                     | 已完成     |
| DATA-1         | P1     | 可选请求管理组合式函数                       | M–L  | 依赖 BASE-1；已有分页与工具栏入口                  | 已完成     |
| COL-1          | P1     | 列设置增加逐列锁定、隐藏设置项、固定左右     | M    | 复用现有面板                                       | 已完成     |
| COL-2          | P1     | 列状态抽取与可选持久化                       | M    | 可与 COL-1 联动设计；保留现有受控 API              | 已完成     |
| COL-3          | P1     | 列设置面板内拖拽换序                         | M–L  | 先明确分组与固定区域约束；对应原 ENT-7             | 已完成     |
| CELL-3         | P1     | 枚举映射及从枚举生成筛选项                   | M    | 先做只读展示，后续按需接查询与编辑                 | 已完成     |
| VIEW-1         | P1     | 工具栏搜索、筛选区与多行扩展                 | M    | 优先插槽组合；Tabs 可先给业务示例                  | 已完成     |
| AL-2..5 / AL-8 | P1     | antdv 小缺口与筛选说明                       | S–M  | 分别见 §6，避免与主功能捆成一个大任务              | 已完成     |
| QUERY-1        | P2     | 查询提交、重置与参数转换协议                 | M–L  | useTableQuery，复用 DATA-1；完整自动表单另行评估   | 已完成     |
| EDIT-1         | P2     | 最小编辑状态与校验协议                       | L    | useTableEdit；编辑器交给现有 UI 库                 | 已完成     |
| TREE-1         | P2     | 懒加载树                                     | M–L  | loadData / isLeaf；加载、错误、重试与竞态协议      | 已完成     |
| FIELD-1        | P2     | 可插拔渲染器注册表                           | M–L  | valueType / fieldProps / renderers，共享 valueEnum | 已完成     |
| REF-1          | P2     | 对外提供定位行、滚动等实例方法               | M    | TableInstance.scrollTo；当前页可见已加载行         | 已完成     |
| A11Y-1         | P3     | 表头排序与筛选的键盘可达                     | M    | **最低优先级，暂不进入近期排期**                   | 最低优先级 |

## 5. P0 / P1 已交付范围与验收记录

### BASE-1：服务端排序协议

- [x] 使用 `manual: true` 或 `manual: { sort, filter, pagination }` 显式跳过本地计算。
- [x] 保留 `sorter: true` 的既有本地比较行为；任何破坏性变化按版本策略处理。
- [x] 远程模式仅更新排序状态与发出事件，保留服务器返回的记录顺序。
- [x] 单列、多列、受控状态、取消排序和分页组合均有明确行为。
- [x] 同步修正远程分页指南，并给出可运行的服务端排序示例。

### SEL-1：批量操作提示条

参考 React ProTable 的 `tableAlertRender` / `tableAlertOptionRender`。已提供独立组件 `VTableSelectionAlert`，通过 props 和 slots 接入业务已有的选择状态。

- [x] 展示已选数量，支持清空选择与自定义操作区。
- [x] 受控模式下只请求更新选择，不偷偷维护另一份生效 keys。
- [x] 跨页选中数量以 keys 为准；已选 keys 不代表客户端拥有全部对应 records。
- [x] 批量操作允许直接使用 keys，明确“当前页 / 已加载记录 / 远程全部结果”的区别。
- [x] 清空不触发数据查询；隐藏、零选中、禁用和加载期间的行为可配置或有明确默认值。
- [x] 提供两套预设、中英文文案，以及与 Toolbar / 分页内容插槽组合的示例。
- [x] 视觉对齐 React ProTable 现行提示条（2.8.x 与 3.x 样式一致）：中性 2% 底、无边框、三级灰文字、数量不加强调，清空与批量操作同列右侧。

### CELL-1 / CELL-2：减少重复的列展示代码

已提供列 `copyable`、`tooltip`、`valueEnum` 与表格 `columnEmptyText`，并明确自定义渲染优先级；
与现有 `customRender`、`bodyCell`、`transformCellText`、ellipsis 的组合应可预测。

- [x] 复制支持显式文本或回调；格式化值、对象、自定义 VNode 不应被随意转成 `[object Object]`。
- [x] 复制成功、失败和浏览器能力不可用时有明确反馈，交互不误触行选择、展开或拖拽。
- [x] 表头说明与排序提示互不干扰；位置和样式经过双预设检查。
- [x] 空值规则显式定义，`0` 和 `false` 保留为有效值；空字符串是否占位可按设计约定。
- [x] 自定义渲染结果具有清晰优先级，不能用统一空值处理覆盖业务主动返回的内容。
- [x] 默认关闭的展示能力不为每个虚拟单元格增加持续监听或不必要的组件层级。

### DATA-1：可选请求管理

已提供 `useTableRequest`。优先提供可组合的数据管理能力，连接现有 `VTable` 的事件和
`VTableToolbar` 的 `reload`。首版不要求把请求状态塞进基础表格，也不绑定 HTTP 库。

- [x] 输入请求函数、查询参数与初始分页；输出数据、loading、error、受控分页、事件处理与 reload / reset。
- [x] 明确查询草稿、已提交参数、额外 params 的权属、合并顺序与变化触发条件。
- [x] 查询、筛选、排序、页大小变化分别采用明确的页码策略，避免暗改现有分页契约。
- [x] 只使用一个事件入口触发请求；分页回调与表格 `change` 不得导致同一操作请求两次。
- [x] `action: 'select'` 不触发查询，工具栏刷新复用同一请求入口。
- [x] 旧响应失效、组件卸载、失败状态和加载期间保留总数均有覆盖。
- [x] 删除远程末页后支持有限次数的页码回退重取，不能形成请求循环。
- [x] 明确首次自动请求开关、防抖、参数转换、结果转换和成功 / 失败回调的最小范围。
- [x] 给出排序、筛选、翻页与刷新组合示例，验证请求次数和响应顺序。

轮询、聚焦刷新、缓存、自动重试作为后续按需能力。`manualRequest` 类选项只负责首次请求，
与 BASE-1 的“是否本地计算”分别定义。

### COL-1 / COL-2 / COL-3：在现有列设置上增量扩展

React ProTable 的列状态包含 `show`、`fixed`、`order`、`disable`；另有 `hideInSetting`。
本库已有 `column.visible`、`fixed`、`columnOrder` 与受控面板，应先决定如何复用这些状态，
避免新增状态对象与原 props 争夺控制权。

- [x] 逐列锁定与“不出现在面板中”分别定义；批量全选、重置也遵守锁定约束。
- [x] 面板支持固定左 / 右与取消固定，处理分组列和选择 / 展开哨兵列。
- [x] 持久化只保存稳定标识和状态，不序列化带 renderer、sorter 等函数的完整 columns。
- [x] 明确存储 key、版本、默认值、动态新增 / 删除列、重置与存储失败的行为。
- [x] SSR 中不在服务端读取浏览器存储；保存与恢复可以由业务接管。
- [x] 先支持顶层分组整组换序，是否允许跨组移动、跨固定区域移动单独决定。
- [x] `virtualColumn` 依赖的固定列两端约束不能因面板操作被意外破坏。
- [x] 拖拽结束发出受控更新，稳定列 key、原列对象和与显隐无关的配置按约定保留。

### CELL-3：枚举映射与筛选联动

- [x] 一份枚举定义可提供显示文本和可选状态样式；样式通过 token / 预设或业务 renderer 实现。
- [x] 允许从同一枚举生成筛选项，保留数字、字符串、布尔值的区别，明确定义未知值回退。
- [x] 显示值与原始值分离，排序、筛选、复制和导出各使用约定的数据。
- [x] 先做只读展示与本地筛选；远程枚举加载、依赖联动、查询表单和编辑器接入另行设计。

### VIEW-1：工具栏查询入口

React `ListToolBar` 有搜索框、轻量筛选、菜单、Tabs 和多行布局。本库先从现有插槽补足常见布局。

- [x] 搜索提交、清空和自定义筛选区可接 DATA-1，也能由业务自行处理。
- [x] 新增布局在窄容器下可换行，两套预设的标题、业务按钮与工具入口仍可正常使用。
- [x] “全部 / 待处理 / 已完成”等视图切换先给组合示例，不自动在表格中实现业务状态机。
- [x] 切换视图时是否重置页码、选择、展开和列偏好，由明确协议或业务决定。

## 6. antdv 小缺口完成记录

P2 完成记录见 §7；所有新增协议以 Ant Design ProTable / EditableProTable / ProField 为参照，保留 Vue props、slots 与组合式函数接口。

| 原 ID                                   | 当前状态 | 实现与边界                                                                                  |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| AL-1 `scrollToFirstRowOnChange`         | 原已完成 | 维护现有契约。                                                                              |
| AL-2 `expandIconColumnIndex`            | 已完成   | 支持展开列位置与树形缩进图标的业务列位置；显式 `EXPAND_COLUMN` 占位优先。                   |
| AL-3 `expandColumnTitle`                | 已完成   | 提供slot；简单标题使用 `expandable.columnTitle`，复杂内容使用slot。                         |
| AL-4 `showSorterTooltip` 配置对象       | 已完成   | 表级与列级均支持独立 `TableTooltipConfig`，配置类型不依赖宿主UI库。                         |
| AL-5 `loading.delay / wrapperClassName` | 已完成   | 支持延迟防闪烁和根wrapper class；关闭或卸载清理计时器。                                     |
| AL-6 `onHeaderCell` 改名                | 移除误报 | `customHeaderCell` 本身为Vue API，不增加同义别名。                                          |
| AL-7 分页                               | 原已完成 | 保持现有分页契约。                                                                          |
| AL-8 筛选清除语义                       | 已完成   | 文档明确null / [] / undefined；自定义清空支持只改草稿，确认只提交一次，受控面板可保持开启。 |

## 7. P2 交付与后续观察项

### P2 验收记录

- [x] **QUERY-1**：`useTableQuery` 区分草稿、提交快照和转换参数，支持逐字段转换、整体转换、提交、重置、仅还原草稿与受控展开收起。`useTableRequest.submit/reset` 每次显式操作发起一次查询；额外参数、分页与 beforeSearchSubmit 保留原协议。见[查询指南](../site/guide/query.md)及相邻单测。
- [x] **EDIT-1**：`useTableEdit` 管理 `editableKeys`、单/多行草稿、异步校验、保存、取消、错误及新增缓存行。失败或 boolean veto 保持草稿；取消、修改与卸载使旧异步操作失效。数据提交与编辑器由业务负责。见[编辑指南](../site/guide/editing.md)及 `useTableEdit.test.ts`。
- [x] **TREE-1**：`loadData / isLeaf / onTreeLoadError` 支持加载态、失败重试、并发去重、折叠后缓存、受控与默认展开、空子节点、来源替换及卸载竞态。加载结果接入父子选择、根节点分页和虚拟化，输入数据不变。见[树形指南](../site/guide/tree-table.md)、`useLazyTreeData.test.ts` 与 `TableLazyTree.test.ts`。
- [x] **FIELD-1**：`createTableRenderers` 创建隔离不可变注册表，列 `valueType / fieldProps` 支持 text / digit / money / date / tag，与 `valueEnum` 共享展示状态。自定义渲染保持优先级，复制使用原转换值，双预设标签样式进入主题 token 和 slot。见[字段渲染指南](../site/guide/cell-render.md)与 `renderers.test.ts`。
- [x] **REF-1**：`TableInstance.scrollTo({ key, index, top, left, align, offset })` 在普通、虚拟与不定行高模式共用协议；只定位当前页可见的已加载行，不匹配返回 false。提供树加载错误查询与重试，泛型 SFC 完整转发实例方法。见[实例指南](../site/guide/table-instance.md)与 `TableInstance.test.ts`。
- [x] 公开入口、聚合包声明、文档类型契约、双预设与中英文加载反馈同步；playground `/#/pro-table` 使用 Ant Design / Element Plus 控件验证查询区、工具栏、编辑与树定位。

完整自动查询表单、完整 ProField 字段库、事务与电子表格导航不属于本轮最小协议；P3 键盘可达性继续保留最低优先级。

### 后续观察项

| 项目                              | 建议与边界                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CSV / Excel                       | 先维护已有 CSV 示例。列选择、字段转换、原始值 / 展示值与数据范围由业务明确；Excel 等可通过可选依赖或业务服务接入。   |
| SSR / Nuxt                        | 作为待验证兼容项，先覆盖导入、服务端渲染与客户端测量，不把“未验证”写成“明确不支持”。                                 |
| 横向虚拟化浮层                    | 表头离开列窗口后筛选面板 / tooltip 会卸载，是现有已知限制；有复现场景后独立评估浮层与锚点策略。                      |
| 游标分页                          | 官方当前开发分支出现 `pagination.type: 'cursor'` 与 `nextToken`。可观察无 total 的接口需求，暂不改现有页码分页模型。 |
| 自动合并同值单元格                | 官方当前开发分支出现 `autoMerge / mergeFields`。本库虚拟模式的单元格合并限制仍在，需先明确兼容边界。                 |
| 分组 / 聚合 / 透视、右键菜单、RTL | 暂无本轮排期；单独论证需求、主题与性能成本。                                                                         |

上表的 React 开发分支能力不等同于所有已发布版本都支持，具体实现前应锁定参考版本。

### A11Y-1：最低优先级保留项

按本轮维护者要求，排序与筛选的键盘可达性排在上述功能之后，不列入近期验收门槛。
当前“部分组件支持键盘”也不代表整个表格已具备完整无障碍能力。

- [ ] 排序入口可获得焦点，Enter / Space 切换排序。
- [ ] 筛选入口、选项、确认与重置可用键盘操作；Escape 关闭并恢复焦点。
- [ ] 自定义筛选内容的焦点约定、事件传播和双预设焦点样式明确。
- [ ] 更新 README 与架构文档中的能力描述，避免仅补 `aria-sort` 就宣称全部完成。

## 8. 交付顺序与剩余排期

1. **契约修正**：BASE-1，确定远程排序协议并同步冲突说明。
2. **常用交互增强**：SEL-1、CELL-1、CELL-2；有效的 AL 小项按需要独立穿插。
3. **服务端与列管理**：DATA-1、COL-1、COL-2，再进入 COL-3 拖拽换序。
4. **减少业务重复配置**：CELL-3、VIEW-1。
5. **ProTable 协议扩展**：QUERY-1、EDIT-1、TREE-1、FIELD-1、REF-1 已交付，范围和边界见 §7。
6. **最低优先级**：A11Y-1，键盘可达性。

前五阶段已完成。键盘可达性继续保持最低优先级。

## 9. 验证与后续维护

- 公开入口：类型、聚合包导出、泛型 SFC 桥接与文档类型声明保持一致。
- 主题与语言：两套预设使用一致的 slot key，补齐需要的中英文文案，避免组件内硬编码视觉样式。
- 文档：按功能同步 `site/guide`、示例与 `docs/AGENT_API.md`；定位或能力边界变化时更新 README、架构与对比页。
- 验证：状态与数据逻辑用相邻 `*.test.ts`，公开类型使用 `*.typecheck.ts`；UI 在 playground 核对两套预设、窄容器及相关虚拟化组合。
- 构建：主题 CSS 变化时更新生成流程；提交 PR 前按仓库要求执行 lint、type-check、build，并运行相关测试。
- 回写本清单：完成项更新状态与证据，未实现的设计名称不应出现在“已支持 API”说明中。

### P0 / P1 验证（历史记录）

- `pnpm lint`、`pnpm lint:style`、`pnpm type-check`、`pnpm test`、`pnpm build` 全部通过。
- 全工作区共 694 项测试通过，其中 table 581、core 40、theme 5、site 44、play 24；聚合包公开声明检查与文档站构建通过。
- 新增远程请求、列状态、批量提示条、搜索、复制、枚举、loading延迟、展开列及筛选提交回归用例。
- playground `/#/enterprise` 提供Ant Design原生组合对照，覆盖双预设、窄容器、搜索、列设置及批量操作。
- 独立浏览器验证复制、搜索、清空、列设置、窄布局、双预设与英文文案，未发现页面运行错误。
- 视觉截图位于本地 `output/p1-*.png`（工作产物，不纳入发布包）。

### P2 验证（2026-10-25）

- `pnpm lint`、`pnpm lint:style`、`pnpm type-check`、`pnpm test`、`pnpm build` 通过，发布入口声明和文档类型契约同步。
- 全工作区 766 项测试通过：table 651、core 40、theme 5、site 46、play 24。新增查询、编辑、懒加载、字段与实例回归，覆盖双预设及普通/虚拟表体。
- 最后修复的实例桥接和懒加载监听额外通过 19 项针对测试；未启用懒加载时不会因新增监听提前扁平化全量数据。
- playground `/#/pro-table` 浏览器验证查询提交、编辑校验、新增取消、双预设、520px 窄容器、失败重试与虚拟 key 定位；窄容器未产生页面横向溢出，运行日志无警告或错误。
- 首轮内置浏览器截图失败；2026-10-25 已直接连接维护者 Chrome 的 `localhost:5173/#/pro-table`，补齐真实截图与视觉验收。覆盖双预设宽布局与 520px 窄容器、查询/状态筛选/重置、编辑校验/保存/取消、新增行、密度、懒加载失败/重试/缓存、父子选择、虚拟定位与英文反馈。
- UI 实测修正：展开区增加可用状态筛选；编辑操作改为链接样式并补红色输入错误态；工具栏密度与表格联动；窄容器将订单、操作列固定两侧；Element Plus 的空字符串“全部状态”正确显示。日期默认格式对齐 ProField 的 `YYYY-MM-DD`，显式 Intl 配置保留。
- 修正后 651 项 table 回归、table/playground 类型检查、局部 ESLint/Stylelint、聚合包构建和发布声明检查通过；最终 Chrome 控制台无警告或错误。
- 评审复核修正：懒加载重试复用已知 key；查询、编辑和请求共用带循环引用保护的快照工具，请求去重比较同步防循环；money 固定货币格式与显式 currency 优先级。补齐远程请求、查询回调快照语义、Agent API 选项与树形指南章节顺序。
- 复核新增 10 项回归用例；table 与 site 合计 707 项测试通过，table 类型检查与构建、修改文件的 ESLint / Prettier 和 `git diff --check` 通过。
- 截图与结构化验收记录保存在本地 `output/p2-ui-*.jpg`、`output/p2-ui-checks.json`；完整自动化日志保存在 `output/p2-*.log`。这是 Chrome 桌面宽/窄容器验收，未将其扩写为所有浏览器、移动设备或完整 ProTable 字段库的验收。

## 10. 调研来源与复核方式

### 本仓库

- [表格实现](../packages/table/src/components/Table.tsx)、[公开类型](../packages/table/src/types/table.ts)。
- [分页状态及测试](../packages/table/src/composables/usePagination.ts)、[分页类型](../packages/table/src/types/pagination.ts)、[分页指南](../site/guide/pagination.md)。
- [排序实现](../packages/table/src/composables/useSorter.ts)、[排序测试](../packages/table/src/composables/useSorter.test.ts)、[排序指南](../site/guide/sorting.md)。
- [列设置类型](../packages/table/src/types/column-settings.ts)、[列设置指南](../site/guide/column-display.md)。
- [工具栏类型](../packages/table/src/types/toolbar.ts)、[工具栏指南](../site/guide/toolbar.md)、[CSV 示例](../site/demos/toolbar/basic.vue)。
- [单元格解析](../packages/table/src/utils/cell.ts)、[表头交互](../packages/table/src/components/TableHeaderCell.tsx)。
- [编辑指南](../site/guide/editing.md)、[树形表格](../site/guide/tree-table.md)、[虚拟化边界](../site/guide/virtualization.md)。
- ant-design-vue 本地安装版本 4.2.6：`es/table/interface.d.ts`、`es/table/Table.d.ts`、`es/vc-table/interface.d.ts`。

### React ProTable 官方来源

本轮读取官方仓库 `ant-design/pro-components`，固定源码快照为
`060dad9df59816b9dce9c3b4cd985de5339e5267`；该快照根 package 版本为 `3.1.15-8`。
另外核对了 `@ant-design/pro-components@2.8.6` tag 的 ProTable 类型，区分既有能力与当前开发分支新增能力。

- [ProTable 文档与 API](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/site/zh-CN/components/table/index.mdx)。
- [ProTable 类型：列配置、请求、游标分页、自动合并与实例方法](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/typing.ts)。
- [列状态与持久化](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/Store/Provide.tsx)。
- [列设置：固定、锁定与拖拽](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/components/ColumnSetting/index.tsx)。
- [批量提示条](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/components/Alert/index.tsx)。
- [ListToolBar：搜索、筛选、Tabs 与多行布局](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/components/ListToolBar/index.tsx)。
- [请求管理](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/useFetchData.tsx)。
- [单元格渲染](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/utils/columnRender.tsx)、[复制行为](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/utils/genCopyable/index.tsx)。
- [查询表单](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/components/Form/FormRender.tsx)、[Schema 与枚举](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/site/zh-CN/components/schema-form.mdx)。
- [EditableProTable](https://github.com/ant-design/pro-components/blob/060dad9df59816b9dce9c3b4cd985de5339e5267/src/table/components/EditableTable/index.tsx)。
- [2.8.6 tag 的 ProTable 类型](https://github.com/ant-design/pro-components/blob/%40ant-design/pro-components%402.8.6/packages/table/src/typing.ts)。

原清单中的 Vue Pro 端口与 awesome-vue 竞品调查保留为历史背景；本轮未重新核对全部竞品与收录数量，
不据此更新数量、排名、性能结论或版本能力承诺。
