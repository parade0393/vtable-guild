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
| 尺寸命名             | `small / middle / large`                 | `large / default / small`          | `sm / md / lg`                                     |
| 内置 locale 预设     | 依赖组件库全局配置                       | 依赖组件库全局配置                 | 内置 locale 并支持局部覆盖                         |

## 结论

- 如果你只需要一张基础表格，原生表格通常已经够用
- 如果你来自 ant-design-vue，vtable-guild 的主要价值是把虚拟滚动、主题系统和更直接的视觉状态开关收进同一套表格模型
- 如果你来自 element-plus，vtable-guild 的主要价值是把表格能力统一到同一套 columns + props 模型里，而不是在普通表格和独立增强方案之间切换

## 继续阅读

- [增强与独有能力](/comparison/enhancements)
- [为什么选择 vtable-guild](/guide/why)
- [从 ant-design-vue 迁移](/guide/migration-from-antd)
