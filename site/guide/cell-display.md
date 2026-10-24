---
title: 单元格展示
description: 配置单元格复制、表头说明、空值占位，以及枚举文本、状态样式和筛选联动。
---

# 单元格展示

常用展示需求可以直接写在列配置中：`copyable` 复制内容，`tooltip` 提供表头说明，`valueEnum` 映射文本与状态。
表级 `columnEmptyText` 统一配置空值占位。自定义 `customRender` 与 `bodyCell` 继续接收原有上下文，可以组合业务自己的组件。

<Demo src="column-display/presentation">

<<< @/demos/column-display/presentation.vue

</Demo>

## 复制内容

`copyable: true` 使用经过 `transformCellText` 处理、枚举映射之前的文本。自定义渲染 VNode 不会被读取 DOM 文本后复制，
对象也不会自动变成 `[object Object]`。需要复制指定值时，使用 `copyable.text`：

```ts
import type { TableColumnsType } from '@vtable-guild/vtable-guild'

interface Order {
  key: number
  number: string
}

const columns: TableColumnsType<Order> = [
  {
    key: 'number',
    dataIndex: 'number',
    title: '订单号',
    copyable: {
      text: ({ record }) => record.number,
      onCopy: (text, record) => console.log('Copied', text, record.key),
      onError: (error) => console.error(error),
    },
  },
]
```

`text` 支持字符串，或返回字符串 / Promise 的回调，回调参数与 `customRender` 的上下文一致。
成功、失败通过组件文案及 `onCopy` / `onError` 回调反馈。实际剪贴板能力由浏览器环境决定；
复制按钮阻止事件继续触发行选择、行展开等操作。

## 表头说明与排序提示

列级 `tooltip` 与排序 tooltip 相互独立：前者解释字段含义，后者说明排序操作。
`tooltip` 可传字符串，也可传 `TableTooltipConfig`；表级和列级 `showSorterTooltip` 也支持该配置对象。

| 配置                                  | 说明                                             |
| ------------------------------------- | ------------------------------------------------ |
| `title`                               | 提示内容；排序提示未指定时使用当前排序操作文案。 |
| `placement`                           | top、bottom、left、right。                       |
| `mouseEnterDelay` / `mouseLeaveDelay` | 显示与隐藏延迟，单位秒。                         |
| `color` / `arrow` / `class`           | 背景色、箭头和额外 class。                       |

列级配置优先于表级；列传 `showSorterTooltip: false` 关闭当前列的排序提示。
需要调整全局视觉时，使用现有 Tooltip 主题与 token，保持两套表格预设一致。

## 空值占位与渲染优先级

`columnEmptyText` 默认为 `false`，继续显示空白。传 `column-empty-text="—"` 后，仅 `null`、`undefined` 使用占位，
数字 `0`、布尔值 `false` 与空字符串仍是有效值；默认渲染会将布尔值显示为文本。

处理顺序为：读取值 → `transformCellText` → 枚举映射与空值默认展示 → 自定义 renderer 或插槽。
`customRender` 接收转换后、枚举前的 `text`，优先于 `bodyCell`；自定义渲染明确返回的内容不会被统一占位或枚举样式替换。

## 枚举映射与筛选

`valueEnum` 支持普通对象或 Map，枚举项可以是字符串，也可以是 `{ text, status }`。
状态支持 `success`、`warning`、`error`、`processing`、`default`，通过两套预设的主题 slot 和 token 呈现。

对象枚举以字符串键匹配；需要区分 `0`、`'0'`、`false` 等原始类型时使用 Map。
没有匹配的值回退到默认值展示，枚举不会修改输入记录。

- `filters: true` 根据枚举生成筛选项，保留原始值类型，并默认进行等值比较。
- `filters: false` 关闭枚举筛选入口；也可显式传入筛选项数组。
- `onFilter: true` 使用等值比较，`onFilter: false` 跳过本地过滤，自定义函数优先采用业务规则。
- `manual.filter: true` 跳过所有本地过滤，保留筛选状态与事件，适合服务端处理。

排序仍使用原始记录值，自定义比较函数可以选择自己的规则。默认复制使用转换后的原值；如要复制枚举显示文本，显式指定 `copyable.text`。
导出由业务决定使用原值或展示文本，表格不会自动替换导出字段。

相关类型 `ColumnCopyable`、`ColumnValueEnum`、`ColumnValueEnumItem`、`ColumnValueStatus`、`TableTooltipConfig`
均从 `@vtable-guild/vtable-guild` 导入。
