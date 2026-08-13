# 从 ant-design-vue 迁移

这一页的目标不是宣称“完全兼容”，而是帮助你快速判断哪些表格页面可以低成本迁移，哪些地方需要明确调整。

## 适合迁移的场景

如果你的页面主要依赖这些能力，迁移成本通常比较可控：

- columns 列配置
- sorter 排序
- filters 筛选
- rowSelection 行选择
- expandable 展开行
- scroll 固定表头与横向滚动
- customRender、自定义行和常见插槽

## 主要收益

- 保留熟悉的列定义方式和常见交互模型。
- 把虚拟滚动收敛到同一张表格里，并继续沿用熟悉的列宽控制写法。
- 用 striped、hoverable、ui 等一等能力替代业务层样式补丁。
- 把主题切换和局部覆写收敛到统一模型中。

## 你需要注意的差异

### 1. 不是所有 API 都完全一致

vtable-guild 的设计方向是兼容高频表格使用方式，而不是逐项复制 ant-design-vue Table 的全部接口。

最重要的已知差异是：

- 当前没有内置 pagination。
- change 事件签名为 (filters, sorter, extra)，不包含 ant-design-vue 里的 pagination 参数。
- resizeColumn 事件参数顺序为 (column, width)，而 ant-design-vue 文档里的顺序是 (width, column)。

下列以前需要调整、现在已与 ant-design-vue 完全对齐，可直接迁移：

- `column.fixed: true` 等同 `'left'`
- `loading` 接受 `boolean` 或 `{ spinning?, indicator?, tip? }` 对象
- `column.ellipsis` 接受 `boolean` 或 `{ showTitle?: boolean }`
- `size` 三档命名为 `small` / `middle` / `large`

## 常见映射

| ant-design-vue                                          | vtable-guild                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| bordered                                                | bordered                                                      |
| rowSelection                                            | rowSelection                                                  |
| expandable                                              | expandable                                                    |
| scroll.x / scroll.y                                     | scroll.x / scroll.y                                           |
| sorter / sortOrder / defaultSortOrder                   | sorter / sortOrder / defaultSortOrder                         |
| filters / onFilter                                      | filters / onFilter                                            |
| pagination / change(pagination, filters, sorter, extra) | 分页自行在页面层处理；change 为 (filters, sorter, extra)      |
| rowClassName 实现斑马纹                                 | 优先改用 striped                                              |
| 自行关闭 hover 效果                                     | 优先改用 hoverable                                            |
| resizable / minWidth / maxWidth                         | 继续使用同名字段；resizeColumn 事件参数顺序为 (column, width) |

## 保留旧的覆盖 CSS（兼容类名）

如果页面里已经写了一批 `.ant-table-thead > tr > th { ... }`、`:deep(.ant-table-cell)` 这样的覆盖样式，
逐条重写成 Tailwind 或 `ui` prop 的成本很高。可以开启兼容类名，让 vtable-guild 在原有元素上
额外输出一套 `ant-table-*` 类，旧选择器继续命中：

```ts
app.use(
  createVTableGuild({
    compatClass: true, // 默认关闭
  }),
)
```

这是全局开关，只在安装时读取一次，不支持运行时切换。开启后不改变 DOM 结构，也不引入任何样式，
只是在既有元素上多加 class，所以视觉表现与关闭时完全一致。

覆盖范围包括结构类（`ant-table-wrapper`、`ant-table-thead`、`ant-table-cell` 等）、
变体类（`ant-table-small`、`ant-table-bordered`）以及状态类
（`ant-table-row-selected`、`ant-table-cell-fix-left-last`、`ant-table-row-level-{n}` 等）。

### 与 ant-design-vue 共存时会串味吗

一般不会。ant-design-vue 4.x 默认通过 cssinjs 给每条规则的选择器注入 hash 类，实际产出形如：

```css
.ant-table-wrapper.css-dev-only-do-not-override-xxxxx .ant-table-thead > tr > th { ... }
```

我们的元素不带那个 hash 类，所以 **antdv 自己的样式匹配不到我们的表格**，而你手写的
`.ant-table-thead > tr > th` 能正常命中 —— 这正是需要的效果。

我们在同时加载 antdv 的页面上实测过：页面共有 178 条 `ant-table` 规则，命中我们表格元素的是 0 条。

::: warning 例外
如果你的项目使用了 `<StyleProvider :hashed="false">`，antdv 不再生成 hash 类，选择器退化为
`[class^='ant-table']`、`.ant-table-wrapper .ant-table-cell` 这类形式，此时 antdv 的样式会真的
作用到我们的表格上 —— 同一个页面上实测有 20 条规则会命中。这种情况下不要开启兼容类名。
:::

::: warning 这不是稳定 API
兼容类名是迁移期的过渡辅助，不是我们承诺的 API 契约。后续版本可能调整 DOM 结构，
届时依赖这些类名写的覆盖 CSS 可能失效。建议把它当作「先跑起来」的手段，
长期仍应迁移到 `ui` prop 或主题覆盖。
:::

## 推荐迁移顺序

1. 先迁移一张依赖排序、筛选、选择的常规业务表格。
2. 再把页面里的视觉补丁替换为 bordered、striped、hoverable 和 ui 覆盖。
3. 最后再启用 virtual、resizable 这类增强能力。

这种顺序更稳，因为你可以先验证交互兼容性，再逐步引入新的表格能力。

## 一个简单的迁移思路

### 原页面里通常已经有这些内容

- dataSource
- columns
- rowKey
- onChange
- 若干样式补丁和 rowClassName

### 迁移时优先做这几件事

1. 保留原有数据结构和 columns 定义。
2. 把表格组件替换为 VTable。
3. 检查 change 回调是否依赖 pagination 参数，如果依赖，需要先从页面逻辑中拆掉。
4. 把样式补丁中与条纹行、hover 行、边框相关的部分改成对应 props。
5. 如果页面监听过 resizeColumn，一并确认事件参数顺序是否需要调整。
6. 确认是否需要 virtual 或 resizable，再逐步开启。

## 什么时候需要更谨慎

以下情况建议先做小范围验证：

- 页面高度依赖 ant-design-vue Table 的分页行为。
- 你有很多深度定制的表头、筛选下拉或复杂联动逻辑。
- 页面已经围绕旧表格写了大量 CSS 选择器（可先开启[兼容类名](#保留旧的覆盖-css-兼容类名)过渡）。

这类页面不是不能迁移，而是更适合先通过 [API Reference](/guide/api-reference) 和功能页确认具体边界。
