# Phase 4 排序功能增强补充文档

> 本文档是 `phase-4-guide.md` 的补充，聚焦于排序图标不显示、交互缺失等问题的修复。

## 改动概览

| 步骤 | 文件                                                | 操作       | 说明                                    |
| ---- | --------------------------------------------------- | ---------- | --------------------------------------- |
| 1    | `packages/icons/`                                   | **新建包** | SVG 图标组件包                          |
| 2    | `packages/core/src/components/Tooltip.tsx`          | **新建**   | Tooltip 组件（Teleport + 定位）         |
| 3    | `packages/theme/css/presets/antdv.css`              | **修改**   | 排序 hover 背景 CSS 变量                |
| 4    | `packages/table/src/types/column.ts`                | **修改**   | `showSorterTooltip` 字段                |
| 4    | `packages/table/src/types/table.ts`                 | **修改**   | `showSorterTooltip` 字段                |
| 4    | `packages/table/src/context.ts`                     | **修改**   | `showSorterTooltip` 透传                |
| 5    | `packages/table/src/components/SortButton.tsx`      | **重写**   | CSS 三角 → SVG 图标                     |
| 6    | `packages/table/src/components/TableHeaderCell.tsx` | **重写**   | 全 cell 点击 + hover + Tooltip          |
| 7    | `packages/table/src/components/Table.tsx`           | **修改**   | `showSorterTooltip` prop + context      |
| 8    | `playground/src/App.vue`                            | **修改**   | 排序对照验证区域                        |
| fix  | `packages/table/src/composables/useSorter.ts`       | **修复**   | `getNextSortOrder` 从 null 到首项的 bug |

---

## 一、`@vtable-guild/icons` 包

### 文件结构

```
packages/icons/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── CaretUpIcon.tsx
    ├── CaretDownIcon.tsx
    └── index.ts
```

### 设计要点

- 每个图标是 Vue `defineComponent`，`inheritAttrs: true`
- SVG: `width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"`
- 路径来自 ant-design-icons（CaretUpFilled / CaretDownFilled）

---

## 二、Tooltip 组件（`@vtable-guild/core`）

### API

```ts
interface TooltipProps {
  title?: string | VNodeChild
  placement?: 'top' | 'bottom' | 'left' | 'right' // 默认 'top'
  open?: boolean // 受控显隐
  mouseEnterDelay?: number // 默认 0.1 秒
  mouseLeaveDelay?: number // 默认 0.1 秒
  color?: string // 自定义背景色
  arrow?: boolean // 默认 true
  destroyOnHide?: boolean // 默认 false
}
```

### 实现要点

- `<Teleport to="body">` 避免 overflow 裁剪
- `getBoundingClientRect()` 计算定位
- CSS arrow 使用 8px 正方形旋转 45°
- Transition 动画：opacity + scale
- z-index: 1070

---

## 三、CSS 变量

`packages/theme/css/presets/antdv.css` 新增：

```css
:root {
  --vtg-table-header-sort-hover-bg: rgba(0, 0, 0, 0.04);
}
.dark {
  --vtg-table-header-sort-hover-bg: rgba(255, 255, 255, 0.04);
}
```

`packages/theme/css/index.css` 新增 Tooltip 过渡动画类。

---

## 四、SortButton 重写

- 移除 CSS border 三角形，改用 `CaretUpIcon` / `CaretDownIcon`
- 移除 `emits: ['click']` 和自身 click handler
- 图标容器 `text-[0.6875rem]`（≈11px），图标通过 `1em` 继承
- 高亮色 `text-[color:var(--color-primary)]`，非激活 `text-[color:var(--color-muted)]`
- 负 margin（`-mb-[2px]` / `-mt-[2px]`）收紧间距

---

## 五、TableHeaderCell 重写

- `onClick={handleClick}` 绑定到 `<th>`（整个 cell 可点击）
- 可排序列 `<th>` 添加 `cursor-pointer select-none hover:bg-[var(--vtg-table-header-sort-hover-bg)]`
- Tooltip 包裹 headerCellInner，title 根据排序状态动态显示
- `showSorterTooltip` 三级取值：`column.showSorterTooltip ?? tableContext.showSorterTooltip ?? true`
- `aria-sort` 属性：ascending / descending / undefined

---

## 六、Bug 修复：`getNextSortOrder`

**文件**: `packages/table/src/composables/useSorter.ts`

原代码在 `currentOrder` 为 `null` 时，`directions.indexOf(null)` 返回 `-1`，
函数错误地返回 `null`（不变），导致排序永远无法从无排序状态进入升序。

```ts
// 修复前
if (index === -1 || index >= directions.length - 1) return null

// 修复后
if (index === -1) return directions[0] ?? null
if (index >= directions.length - 1) return null
```

---

## 验证结果

- 排序图标（SVG 箭头）正常显示，激活态高亮为 primary 色
- hover 可排序列表头有 cursor-pointer（背景色变化需 CSS 变量生效）
- 整个表头 cell 可点击触发排序
- hover 显示 tooltip（"点击升序" / "点击降序" / "取消排序"）
- 不同 align（left/center/right）下图标始终紧跟文字
- `showSorterTooltip: false` 的列无 tooltip
- `aria-sort` 正确反映排序状态
- 排序循环：null → ascend → descend → null
