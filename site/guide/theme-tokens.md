# Table CSS 变量参考

如果你要改的是颜色、字号、间距、空态尺寸、loading 蒙层这类 token 值，优先覆盖 CSS 变量，而不是直接重写 slot class。

```css
:root {
  --vtg-table-row-hover-bg: #e6f7ff;
  --vtg-table-header-bg: #f8fafc;
}
```

这种方式适合：

- 保留预设和 slot 结构，只改视觉 token
- 在多个页面和多个表格实例之间共享同一套视觉规则
- 希望未来升级预设时，减少 class 重写带来的维护成本

## 推荐优先级

一般按这个顺序选择：

1. 只改颜色、字号、间距等值，用 CSS 变量
2. 需要改 slot 的 class 结构，用全局 `theme` 或实例级 `ui`
3. 需要改内容结构，再用 Vue slot

## 核心视觉变量

| 变量名                             | 作用                                    |
| ---------------------------------- | --------------------------------------- |
| `--vtg-table-bg`                   | 表格主体背景，对应 `table`、`td` 等区域 |
| `--vtg-table-header-bg`            | 表头、标题、页脚、摘要行背景            |
| `--vtg-table-header-color`         | 表头文字颜色                            |
| `--vtg-table-text-color`           | 正文文字颜色                            |
| `--vtg-table-border-color`         | 表格边框和单元格分隔线                  |
| `--vtg-table-header-split-color`   | antdv 风格表头分割线                    |
| `--vtg-table-header-sort-hover-bg` | 可排序表头 hover 背景                   |

## 行状态变量

| 变量名                              | 作用                                            |
| ----------------------------------- | ----------------------------------------------- |
| `--vtg-table-row-hover-bg`          | `hoverable` 行 hover 背景                       |
| `--vtg-table-row-striped-bg`        | `striped` 斑马纹背景                            |
| `--vtg-table-row-selected-bg`       | 选中行背景                                      |
| `--vtg-table-row-selected-hover-bg` | 选中行 hover 背景                               |
| `--vtg-table-expanded-row-bg`       | 展开行内容背景，当前主题实现里带有默认 fallback |

## 排版与间距变量

| 变量名                               | 作用                           |
| ------------------------------------ | ------------------------------ |
| `--vtg-table-font-family`            | 表格字体族                     |
| `--vtg-table-font-size`              | 表格字号                       |
| `--vtg-table-line-height`            | 表格行高                       |
| `--vtg-table-cell-padding-inline-lg` | `size='large'` 的横向 padding  |
| `--vtg-table-cell-padding-block-lg`  | `size='large'` 的纵向 padding  |
| `--vtg-table-cell-padding-inline-md` | `size='middle'` 的横向 padding |
| `--vtg-table-cell-padding-block-md`  | `size='middle'` 的纵向 padding |
| `--vtg-table-cell-padding-inline-sm` | `size='small'` 的横向 padding  |
| `--vtg-table-cell-padding-block-sm`  | `size='small'` 的纵向 padding  |

## 空态与加载变量

| 变量名                                  | 作用                 |
| --------------------------------------- | -------------------- |
| `--vtg-table-loading-overlay-bg`        | loading 遮罩层背景   |
| `--vtg-table-empty-margin-block`        | 空态上下外边距       |
| `--vtg-table-empty-image-height`        | 空态图形高度         |
| `--vtg-table-empty-image-margin-bottom` | 空态图形与文字间距   |
| `--vtg-table-empty-image-opacity`       | 空态图形透明度       |
| `--vtg-table-empty-border-color`        | antdv 空态插画边框色 |
| `--vtg-table-empty-shadow-color`        | antdv 空态插画阴影色 |
| `--vtg-table-empty-content-color`       | antdv 空态插画填充色 |

> [!NOTE]
> 空态插画相关变量主要用于当前内置空态视觉，尤其是 antdv 预设。若你只关心空态文案或布局，通常改 `empty`、`emptyWrapper`、`emptyText` 这些 slot 会更直接。

## 常见场景示例

### 改表头背景和边框

```css
:root {
  --vtg-table-header-bg: #f8fafc;
  --vtg-table-border-color: #e2e8f0;
}
```

### 改 hover 与选中态

```css
:root {
  --vtg-table-row-hover-bg: #eff6ff;
  --vtg-table-row-selected-bg: #dbeafe;
  --vtg-table-row-selected-hover-bg: #bfdbfe;
}
```

### 统一改紧凑型间距

```css
:root {
  --vtg-table-cell-padding-inline-sm: 10px;
  --vtg-table-cell-padding-block-sm: 6px;
}
```

## 变量、theme、ui 怎么分工

- 只改 token 值：优先 CSS 变量
- 统一改 slot class 结构：用全局 `theme`
- 只改某一张表：用 `ui`

## 相关页面

- [三层主题覆盖](/guide/theme-overrides)
- [ui Slot 参考](/guide/ui-slots-reference)
- [预设与语言](/guide/presets-and-locales)
