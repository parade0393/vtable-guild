# 功能对比总览

这一页聚焦使用者最关心的问题：如果你已经在用 ant-design-vue Table 或 element-plus Table，vtable-guild 到底多了什么，迁移成本主要落在哪些地方。

## 功能矩阵

| 功能                 | ant-design-vue                           | element-plus                        | vtable-guild                                       |
| -------------------- | ---------------------------------------- | ----------------------------------- | -------------------------------------------------- |
| 常见列配置与交互写法 | 支持                                     | 普通 Table 主要使用 el-table-column | 支持，设计贴近 ant-design-vue                      |
| 虚拟滚动             | 不支持                                   | 有独立的 Virtualized Table 方案     | 原生支持，配合 virtual 与 scroll.y 使用            |
| 滚动条体验           | 默认滚动体验                             | 体验更完整，可作为参考基线          | 在 antdv 预设下做了额外打磨，方向参考 element-plus |
| 列宽拖拽             | 支持，支持 resizable、minWidth、maxWidth | 支持，border 模式下可拖拽列宽       | 支持，沿用接近 antdv 的字段写法                    |
| 斑马纹               | 需要手动 rowClassName                    | 直接使用 stripe                     | 直接使用 striped                                   |
| hover 开关           | 没有独立开关                             | 没有独立 hover 开关                 | 直接使用 hoverable                                 |
| 边框样式             | 支持                                     | 支持                                | 支持，使用 bordered                                |
| 主题预设切换         | 不支持                                   | 不支持                              | 支持 antdv / element-plus                          |
| slot 级样式覆盖      | 主要依赖 CSS 覆盖                        | 主要依赖 class、style 与 slot 组合  | 通过 ui 精确覆盖 slot                              |
| 尺寸命名             | small / middle / large                   | large / default / small             | sm / md / lg                                       |
| 内置 locale 预设     | 需要额外处理                             | 跟随组件库全局配置                  | 提供内置 locale 与覆盖机制                         |

## 结论

如果你的诉求只是继续使用一套基础表格，原生表格通常已经够用。

如果你来自 ant-design-vue，vtable-guild 的替换价值主要体现在两点：一是把虚拟滚动变成同一张表格里的原生能力，二是在 antdv 预设下把滚动条体验做了更细的打磨，优化方向参考了 element-plus。高频列配置、排序筛选和列宽控制写法仍然比较熟悉，但分页、change 事件和尺寸命名等细节并不是逐项复制。

如果你来自 element-plus，vtable-guild 的变化不只是视觉预设切换，也包括从 el-table-column 组织方式切到 columns + props 的统一模型。它的优势在于把这套声明式配置、统一的主题预设切换和更直接的 slot 级覆盖收敛到同一套表格里，而不需要在普通表格和独立虚拟表格方案之间切换。

## 继续阅读

- [增强与独有功能](/comparison/enhancements)
- [为什么选择 vtable-guild](/guide/why)
- [从 ant-design-vue 迁移](/guide/migration-from-antd)
