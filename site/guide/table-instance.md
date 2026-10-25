# 表格实例与定位

通过模板 ref 获取 `TableInstance`，调用 `scrollTo({ key, index, top })`。参数沿用 ProTable 底层 Table 的定位方式，并补充横向位置、对齐和明确的结果反馈。

```ts
import { ref } from 'vue'
import type { TableInstance } from '@vtable-guild/vtable-guild'

const table = ref<TableInstance>()
const found = await table.value?.scrollTo({ key: 'order-20', align: 'top' })
await table.value?.scrollTo({ top: 0, left: 0 })
```

将 `ref="table"` 绑定到 `VTable`，普通表体与虚拟表体使用同一接口。

| 参数           | 含义                                                               |
| -------------- | ------------------------------------------------------------------ |
| `key`          | 稳定的行 key，优先于 index 和 top，支持数字 0 与空字符串           |
| `index`        | 当前页可见行的零基索引；树形数据展开后按可见扁平行计数             |
| `top` / `left` | 像素位置；浏览器与虚拟列表将其限制在可滚动范围内                   |
| `align`        | `top` / `bottom` / `auto`，默认 `top`；auto 只在目标超出视口时移动 |
| `offset`       | 行定位相对目标位置的像素偏移                                       |

返回 `Promise<boolean>`：成功找到可滚动容器和目标时为 true；未挂载、参数无效、目标不存在时为 false。虚拟列表对不定行高使用已有测量与纠偏机制；Promise 表示已提交定位，不承诺后续异步图片加载后的最终像素位置。

定位范围为当前页已经加载且可见的记录。跨页、被筛选移除、折叠树中的行返回 false；业务先切页、展开或加载，再在下一次渲染后定位。不会为了查找一条记录自动遍历远端数据。

## 懒加载错误与重试

`getTreeLoadError(key)` 返回当前加载错误或 undefined；`await retryTreeLoad(key)` 重试一个已加载页面中的节点，返回是否成功，不改变展开 keys。错误图标点击也会重试。加载成功的缓存节点不会重复请求。

<Demo src="tree-table/lazy">

<<< @/demos/tree-table/lazy.vue

</Demo>
