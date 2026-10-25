---
title: 服务端请求管理
description: 使用 useTableRequest 组合服务端排序、筛选、分页和刷新，处理加载状态、请求竞态与远程末页回退。
---

# 服务端请求管理

`useTableRequest` 是可选的组合式函数，负责请求、数据、加载状态和受控分页。`VTable` 展示数据、维护交互入口，
`VTableToolbar` 的刷新事件调用同一个 `reload`。如果项目已有请求管理方案，可以继续直接传入数据与分页状态。

## 排序、筛选、分页与刷新

将组合式函数返回的 `manual`、`dataSource`、`pagination`、`loading` 绑定到表格，并只绑定一次 `@change="onChange"`。
`manual` 会跳过本地排序、筛选和分页切片，保留服务器返回的记录顺序。

示例中的服务端使用内存数据模拟请求，延迟 250ms；通过请求计数可以检查搜索、翻页和刷新没有重复触发。
排序和筛选状态同时绑定到列配置，使重置查询后表头也能恢复。

<Demo src="pagination/request">

<<< @/demos/pagination/request.vue

</Demo>

不要同时给 `pagination.onChange` 再绑定请求函数。表格 `change` 已包含分页事件；`action: 'select'` 会被忽略，选择记录不会重新查询。

## 参数与状态

`request(params, sort, filters, { signal })` 返回 `{ data, total, success? }`。
`data` 必须是记录数组，`total` 必须是非负安全整数；显式返回 `success: false` 会进入错误状态。
把 `signal` 传给 `fetch` 或支持 AbortSignal 的 HTTP 客户端，可取消底层请求；即使客户端不响应取消，旧响应也不会覆盖新结果。

```ts
import { ref } from 'vue'
import { useTableRequest } from '@vtable-guild/vtable-guild'

interface Order {
  key: string
  amount: number
}
interface Query {
  keyword: string
  tenant: string
}

const tenant = ref('default')
const orders = useTableRequest<Order, Query>({
  defaultParams: { keyword: '' },
  params: () => ({ tenant: tenant.value }),
  async request(params, sort, filters, { signal }) {
    const response = await fetch('/api/orders/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, sort, filters }),
      signal,
    })
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    return response.json() as Promise<{ data: Order[]; total: number }>
  },
})

// 查询草稿由业务持有，只在提交后进入请求。
await orders.submit({ keyword: 'invoice' })
```

参数按 `defaultParams → 已提交查询 → params` 合并，后者覆盖前者。`params` 支持普通对象、ref 或 getter，
发生实际变化时回到第 1 页并请求；结构相同的替换不重置页码。提交值会被快照保存，之后修改业务草稿不会直接改变请求。

`beforeSearchSubmit` 接收合并后的查询参数，可转换字段或日期范围。最后由组合式函数写入受控的 `current`、`pageSize`，
查询参数无法覆盖这两个分页字段。`postData` 可转换返回的行数据，但不改变服务端总数。

排序参数优先使用 `sorter.field`，嵌套路径用点号连接，例如 `['address', 'city'] → 'address.city'`；没有 field 时使用 columnKey。
多列排序按表格提供的顺序构建映射。筛选保留字符串、数字、布尔值与 `null`，不会统一转换为字符串。

## 刷新、提交、重置与取消

| 方法                      | 行为                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `reload(resetPageIndex?)` | 强制重新请求；传 `true` 先回第 1 页。立即执行，不等待防抖时间。                                               |
| `submit(params?)`         | 替换已提交查询，回第 1 页并强制请求；相同参数重复提交也请求，未传字段回退到 defaultParams。                   |
| `reset(params?)`          | 无参恢复 defaultParams；传参替换已提交查询。均清空请求排序与筛选，回第 1 页并强制请求；额外 params 继续生效。 |
| `cancel()`                | 取消待执行和进行中的请求，结束 loading；保留现有数据、页码与错误。                                            |

异步方法在本次请求结束、被新请求替代或取消后完成。请求失败通过 `error` 与 `onError` 暴露，方法不会因为 HTTP 失败而拒绝，
适合直接连接刷新事件。`reset(params)` 中未传入的字段仍按参数合并顺序回退到 `defaultParams`。`reset()` / `reset(params)` 改变请求状态；若需要表头图标同步复位，将返回的 `sort`、`filters` 绑定到受控列配置，如上方示例。

默认首次自动请求；`manualRequest: true` 只跳过首次请求，之后提交、参数变化或刷新仍会请求。它与表格的 `manual` 本地计算开关是两个概念。

## 页码与异常恢复

- 翻页保留请求的页码；搜索、额外 params、排序或筛选变化会回到第 1 页。
- 修改每页条数默认回到第 1 页；`resetOnPageSizeChange: false` 保留请求页码。这是请求组合式函数的策略，基础分页自身的行为保持原有约定。
- 加载和失败期间保留上一次成功的数据与 total，避免分页器因为临时空数组跳回首页。
- 成功结果显示当前页已越界时，最多向新的末页补发一次请求；total 为 0 时直接回第 1 页。补发同样受取消和竞态保护，不循环重试。
- 组件作用域销毁后取消请求，后续响应不更新状态，也不会触发成功或失败回调。
- 相同查询的重复表格事件会被合并；显式 `reload()`、`submit()` 和 `reset()` 始终强制请求。

## API

| 选项                    | 说明                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `request`               | 必传的异步函数，参数为分页查询、排序、筛选及 `{ signal }`。                         |
| `defaultParams`         | 初始已提交查询，也是无参 reset 的恢复值与参数合并的默认值。                         |
| `params`                | 普通对象、ref 或 getter；优先于已提交查询，变化后自动请求。                         |
| `initialPagination`     | 初始 current、pageSize、total；默认 1、10、0。                                      |
| `pagination`            | 分页器的展示选项，例如 showSizeChanger、showTotal；请求状态与事件由组合式函数管理。 |
| `manualRequest`         | 跳过首次请求，默认 false。                                                          |
| `debounceTime`          | 查询和表格事件的请求防抖毫秒数，默认 0；reload 不防抖。                             |
| `resetOnPageSizeChange` | 修改页大小时回首页，默认 true。                                                     |
| `beforeSearchSubmit`    | 转换合并后的查询参数。                                                              |
| `postData`              | 转换返回的行数组。                                                                  |
| `onLoad`                | 成功接收数据后回调，参数为处理后的 data 和原 response。                             |
| `onError`               | 最新请求失败后回调，参数为 Error。                                                  |

返回 `dataSource`、`loading`、`error`、`pagination`、`query`、`sort`、`filters`、`manual` 以及上方四个方法和 `onChange`。
在模板里先解构需要的 ref；嵌套在普通对象中的 ref 不会在所有模板表达式里自动解包。
配置与返回类型均从 `@vtable-guild/vtable-guild` 导入：`UseTableRequestOptions`、`UseTableRequestReturn`、
`TableRequest`、`TableRequestParams`、`TableRequestSort`、`TableRequestContext`、`TableRequestResult`。

轮询、聚焦刷新、缓存和自动重试由业务请求方案按需组合，本接口首版没有这些状态。
