# antdv 预设修补 + 跨预设滚动组件开发计划

> 基于 roadmap 阶段四已完成（排序/筛选/行选择），本计划处于阶段四收尾 + 阶段五前置。
> 6 项工作按依赖和影响范围排序，分为三个批次。

---

## 现状总结

### 已完成

- 阶段四核心：排序 useSorter、筛选 useFilter/FilterDropdown、行选择 useSelection 均已实现
- 主题系统：antdv + element-plus 双预设，CSS token 亮/暗模式
- 基础组件：Checkbox/Radio/Button/Input/Tooltip 已在 @vtable-guild/core 中
- 图标系统：@vtable-guild/icons 已有排序/筛选图标

### 待做项（本次 6 项工作）

1. table 数据 empty 时图标不一致
2. loading 图标不一致
3. 行选择背景 / 选中行 hover 背景未对齐
4. rowSelection.selections 自定义选择项
5. FilterDropdown 动画不够丝滑（容器显示/消失 + 树形展开/折叠）
6. 跨预设滚动组件 VScrollbar

---

## 批次一：视觉对齐快修（1-3 天）

### 任务 1：Empty 状态图标对齐 antdv

**问题**：TableEmpty.tsx 当前只显示文本「暂无数据」，没有渲染 antdv 标准的 Empty 图标（灰色空盒子 SVG）。

**方案**：

1. 在 @vtable-guild/icons 中新增 EmptyIcon.tsx（antdv Empty 组件的简化 SVG）
2. 在 @vtable-guild/icons 中新增 ElEmptyIcon.tsx（element-plus Empty 组件的简化 SVG）
3. 扩展 TablePresetConfig（packages/table/src/preset-config.ts）新增 emptyIcon: Component
4. 修改 TableEmpty.tsx 使用 presetConfig.emptyIcon 渲染，同时保留 empty slot 自定义能力
5. antdv 预设 table theme 中新增 emptyIcon / emptyText slot class

**涉及文件**：

- packages/icons/src/EmptyIcon.tsx — 新增
- packages/icons/src/ElEmptyIcon.tsx — 新增
- packages/icons/src/index.ts — 修改（导出新图标）
- packages/table/src/preset-config.ts — 修改（新增 emptyIcon）
- packages/table/src/components/TableEmpty.tsx — 修改（使用 preset 图标）
- packages/theme/src/presets/antdv/table.ts — 修改（新增 empty 相关 slot class）
- packages/theme/src/presets/element-plus/table.ts — 修改（同上）

---

### 任务 2：Loading 图标对齐 antdv

**问题**：TableLoading.tsx 当前只显示文本「加载中...」，没有渲染 antdv 标准的 Spin 动画。

**方案**：

1. 在 @vtable-guild/icons 中新增 SpinIcon.tsx（antdv Spin 的旋转圆点 SVG + CSS animation）
2. 在 @vtable-guild/icons 中新增 ElLoadingIcon.tsx（element-plus Loading 的旋转圈）
3. 扩展 TablePresetConfig 新增 loadingIcon: Component
4. 修改 TableLoading.tsx 使用 presetConfig.loadingIcon，保留 loading slot
5. antdv 预设新增 loadingSpinner slot class（含 animate-spin 等）

**涉及文件**：

- packages/icons/src/SpinIcon.tsx — 新增
- packages/icons/src/ElLoadingIcon.tsx — 新增
- packages/icons/src/index.ts — 修改
- packages/table/src/preset-config.ts — 修改
- packages/table/src/components/TableLoading.tsx — 修改
- packages/theme/src/presets/antdv/table.ts — 修改
- packages/theme/src/presets/element-plus/table.ts — 修改

---

### 任务 3：行选择背景 / 选中 hover 背景对齐

**问题**：antdv 选中行有浅蓝背景色 #e6f4ff，hover 时为 #bae0ff，当前实现未给选中行添加这些背景。

**方案**：

1. CSS token 新增（packages/theme/css/presets/antdv.css）：
   - --vtg-table-row-selected-bg: #e6f4ff（暗色 #111a2c）
   - --vtg-table-row-selected-hover-bg: #bae0ff（暗色 #112545）
     element-plus.css 类似处理。

2. 通过 TableRow 传 selected prop + theme slot trSelected：
   - TableContext 已有 isSelected + getRowKey
   - TableBody.tsx 计算每行选中状态，传 selected 给 TableRow
   - TableRow.tsx 根据 selected 应用行级背景 class
   - td 级别同步：选中行的 td 也需要覆盖背景（因为当前 td bg 会遮住 tr bg）

3. theme slot 新增：antdv/element-plus table theme 中新增 tdSelected slot

**涉及文件**：

- packages/theme/css/presets/antdv.css — 修改（新增 token）
- packages/theme/css/presets/element-plus.css — 修改（新增 token）
- packages/theme/src/presets/antdv/table.ts — 修改（新增 tdSelected slot）
- packages/theme/src/presets/element-plus/table.ts — 修改（同上）
- packages/table/src/components/Table.tsx — 修改（传递 themeSlots 新增项）
- packages/table/src/components/TableBody.tsx — 修改（传 selected 给 TableRow）
- packages/table/src/components/TableRow.tsx — 修改（接收 selected，应用 class）
- packages/table/src/components/TableCell.tsx — 修改（选中行 td 背景覆盖）
- packages/table/src/context.ts — 可能修改（subThemeSlots 扩展）

---

## 批次二：功能增强（2-3 天）

### 任务 4：rowSelection.selections 自定义选择项

**问题**：antdv 支持 rowSelection.selections 配置，在全选 checkbox 旁显示下拉菜单，包含预设操作和用户自定义操作。

**方案**：

1. 类型定义扩展（packages/table/src/types/table.ts）：
   - SelectionItem { key, text, onSelect }
   - 预定义常量 SELECTION_ALL / SELECTION_INVERT / SELECTION_NONE
   - RowSelection 新增 selections?: boolean | SelectionItem[] + hideSelectAll?: boolean

2. 新增 SelectionDropdown.tsx：
   - 点击全选 checkbox 旁的下拉箭头触发
   - Teleport to body + 锚点定位
   - 复用 filterDropdown 定位逻辑

3. 修改 TableHeaderCell.tsx 选择列表头渲染

4. 扩展 useSelection.ts：
   - invertSelection() — 反选
   - clearSelection() — 清空
   - selectByFilter(filter) — 按条件选择

5. theme 新增 slot class + icons 新增 DropdownArrowIcon

**涉及文件**：

- packages/table/src/types/table.ts — 修改
- packages/table/src/types/index.ts — 修改
- packages/table/src/composables/useSelection.ts — 修改
- packages/table/src/components/SelectionDropdown.tsx — 新增
- packages/table/src/components/TableHeaderCell.tsx — 修改
- packages/table/src/context.ts — 修改
- packages/table/src/components/Table.tsx — 修改
- packages/theme/src/presets/antdv/table.ts — 修改
- packages/theme/src/presets/element-plus/table.ts — 修改
- packages/icons/src/DropdownArrowIcon.tsx — 新增
- packages/icons/src/index.ts — 修改

---

### 任务 5：FilterDropdown 动画优化

**问题**：容器显示/消失缺少 fade+scale 过渡，树形展开/折叠无动画。

**方案**：

1. 容器动画：Vue Transition 包裹，CSS fade+scale 150ms
2. 树形展开/折叠：TransitionGroup 或 CSS height transition ~200ms
3. CSS 新增 packages/theme/css/transitions.css（不区分 preset）
4. SelectionDropdown 复用同一套过渡

**涉及文件**：

- packages/theme/css/transitions.css — 新增
- packages/theme/css/index.css — 修改（import transitions）
- packages/table/src/components/FilterDropdown.tsx — 修改
- packages/table/src/components/TableHeaderCell.tsx — 修改
- packages/table/src/components/SelectionDropdown.tsx — 合并到任务4

---

## 批次三：跨预设基础设施（3-4 天）

### 任务 6：VScrollbar 滚动组件

**问题**：需要对齐 el-scrollbar 功能的跨预设滚动组件，替代原生滚动。

**方案**：

#### 6.1 API 设计

- Props: height / maxHeight / native / always / minSize / wrapTag / viewTag / wrapClass / viewClass / wrapStyle / viewStyle / noresize / ui
- Expose: update() / scrollTo() / setScrollTop() / setScrollLeft() / wrapRef
- Events: scroll({ scrollTop, scrollLeft })

#### 6.2 实现结构（放在 @vtable-guild/core）

- packages/core/src/components/Scrollbar/Scrollbar.tsx — 主组件
- packages/core/src/components/Scrollbar/ScrollbarThumb.tsx — 滑块
- packages/core/src/components/Scrollbar/ScrollbarTrack.tsx — 轨道
- packages/core/src/components/Scrollbar/useScrollbar.ts — composable
- packages/core/src/components/Scrollbar/index.ts

#### 6.3 核心实现

- 隐藏原生滚动条（scrollbar-width: none + webkit 伪元素）
- 监听 scroll 事件 + ResizeObserver 计算滑块位置/大小
- 可拖拽 thumb，支持垂直+水平
- hover 显示，离开后延迟隐藏（或 always 常驻）

#### 6.4 主题

- packages/theme/src/scrollbar.ts — 默认主题
- packages/theme/src/presets/antdv/scrollbar.ts — antdv 预设
- packages/theme/src/presets/element-plus/scrollbar.ts — element-plus 预设
- CSS token: --vtg-scrollbar-thumb-bg / --vtg-scrollbar-thumb-hover-bg / --vtg-scrollbar-thumb-radius / --vtg-scrollbar-thumb-width / --vtg-scrollbar-track-bg

#### 6.5 集成

- FilterDropdown 列表区替换为 VScrollbar maxHeight="264px"

**涉及文件**：

- packages/core/src/components/Scrollbar/\* — 新增（5 个文件）
- packages/core/src/index.ts — 修改
- packages/theme/src/scrollbar.ts — 新增
- packages/theme/src/presets/antdv/scrollbar.ts — 新增
- packages/theme/src/presets/element-plus/scrollbar.ts — 新增
- packages/theme/src/index.ts — 修改
- packages/theme/src/presets/index.ts — 修改
- packages/theme/css/presets/antdv.css — 修改
- packages/theme/css/presets/element-plus.css — 修改
- packages/table/src/components/FilterDropdown.tsx — 修改

---

## 开发顺序与依赖

批次一（视觉对齐，可并行）
├── 任务1: Empty 图标对齐
├── 任务2: Loading 图标对齐
└── 任务3: 行选择背景对齐

批次二（功能增强，串行）
├── 任务4: rowSelection.selections（依赖任务3）
└── 任务5: FilterDropdown 动画（独立）

批次三（基础设施）
└── 任务6: VScrollbar 滚动组件 → 集成到 FilterDropdown

## 预估工时

| 批次 | 任务               | 预估      | 说明                       |
| ---- | ------------------ | --------- | -------------------------- |
| 一   | 任务1 Empty 图标   | 0.5d      | SVG 图标 + 组件修改        |
| 一   | 任务2 Loading 图标 | 0.5d      | SVG 动画 + 组件修改        |
| 一   | 任务3 行选择背景   | 1d        | 涉及 theme + 多组件穿透    |
| 二   | 任务4 selections   | 1.5d      | 新组件 + useSelection 扩展 |
| 二   | 任务5 动画优化     | 1d        | Transition + CSS           |
| 三   | 任务6 VScrollbar   | 3d        | 全新跨预设基础组件         |
|      | **合计**           | **~7.5d** |                            |

## 验收标准

### 批次一

- antdv 空表格显示标准 Empty SVG 图标 + 文字
- element-plus 空表格显示对应风格 Empty 图标
- antdv loading 显示旋转 Spin 动画
- element-plus loading 显示对应风格旋转动画
- 选中行浅蓝背景（antdv #e6f4ff / 暗色 #111a2c）
- 选中行 hover 背景变深（antdv #bae0ff / 暗色 #112545）
- playground 截图对比 antdv 原生 Table

### 批次二

- rowSelection.selections: true 显示默认选择项下拉
- 自定义 selections 数组正常渲染和触发
- hideSelectAll 隐藏全选框和下拉
- FilterDropdown 打开/关闭有 fade+scale 动画
- 树形展开/折叠有高度动画

### 批次三

- VScrollbar 独立可用，隐藏原生滚动条
- 支持 height/maxHeight/always/native 核心 props
- 滑块拖拽平滑，尺寸正确
- 两个预设视觉一致（通过 token 控制）
- FilterDropdown 列表区使用 VScrollbar
- pnpm build + pnpm type-check 全部通过
