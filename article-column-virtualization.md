# Vue 表格 200 列卡顿：vxe-table 做对了什么，我又输在哪

> 发布渠道：掘金。这是 [vtable-guild](https://github.com/parade0393/vtable-guild) 的第二篇技术文，
> 上一篇讲主题系统，这篇讲横向虚拟化。所有数字来自公开可跑的[对照页](https://parade0393.github.io/vtable-guild/perf/)，
> 包括我们输的那几项。

---

先说结论，省得你读完才发现不对症：

**如果你的表格行很多、列不多（几十列以内），这篇文章对你没用。** 行虚拟化已经是解决过的问题，
主流库都有，随便挑一个都行。

**但如果你的列数上百**——ERP 的物料明细、BI 的宽表、埋点看板——你大概率遇到过这样一件怪事：
同一张表，50 列的时候丝滑，200 列的时候滚起来像在拖一块砖。而你明明已经开了虚拟滚动。

这篇文章讲的就是这个断崖：它为什么是断崖而不是斜坡，横向虚拟化的难点到底在哪（不在你以为的地方），
以及为什么在我实测的 5 个库里，这一档只有 vxe-table 一家原本就扛得住。

## 一、先看那个断崖

同一个组件、同一批数据（1 万行）、只改列数：

| 列数 | 首次渲染  | 排序切换  | **连续滚动 longtask** | DOM 节点数 |
| ---- | --------- | --------- | --------------------- | ---------- |
| 6    | 14 / 0    | 15 / 0    | **0**                 | 167        |
| 50   | 60 / 60   | 34 / 0    | **0**                 | 959        |
| 200  | 232 / 342 | 126 / 219 | **4,391 ms**          | 3,659      |

单元格格式是 `同步 render+patch / longtask`，单位 ms。longtask 指超过 50ms 的长任务总时长，
它直接对应用户感知到的掉帧。

注意中间那列：**6 列和 50 列都是 0，到 200 列突然变成 4,391 ms**。

这不是线性劣化。列数从 6 涨到 50（8 倍），滚动开销纹丝不动；从 50 涨到 200（4 倍），
开销从 0 跳到 4.4 秒。挂载耗时倒是老老实实地涨（14 → 232 ms，列数 33 倍、耗时 17 倍），
但那是一次性成本，用户忍一下就过去了。**滚动是持续成本，每一帧都要还。**

断崖的位置大致就在浏览器一帧的预算被单帧工作量顶穿的那个点上。低于它，
每帧的重排重绘都能在 16.7ms 内做完，你完全感觉不到；越过它，每帧都超支，
超支的部分累积成 longtask，表现就是"拖砖"。

所以**列数不到 50 的话，横向虚拟化对你没有任何意义**——这句话我会在文章里说三遍，
因为它决定了你要不要继续往下读。

## 二、行虚拟化只解决了一半

先说清楚为什么开了虚拟滚动还是卡。

行虚拟化做的事是：1 万行里只把可视区的十几行放进 DOM，滚动时换掉这十几行的内容。
它把「行」这个维度上的 DOM 数量从 O(n) 压到 O(视口高度)。

但**列这个维度它一个字都没管**。可见单元格数是「可视行数 × 总列数」。
行虚拟化把前一项从 10,000 压到 12，后一项还是 200。12 × 200 = 2,400 个单元格，
一个不少地留在文档里。

2,400 个单元格意味着什么？在我们的实现里，每个 `<td>` 背后是一个 `TableCell` 组件实例，
每个实例带十来个 `computed`（对齐、固定列偏移、省略、合并、样式槽……）。横向滚动时，
浏览器要为这 2,400 个元素重新计算布局与绘制；框架层面，任何触发重渲染的状态变化
都要走一遍这 2,400 个实例。

所以优化的靶子非常明确：**把可见单元格数从「行 × 总列数」降到「行 × 可视列数」**。
200 → 13，DOM 和实例数一起掉一个量级。这就是横向虚拟化（我们叫 `virtualColumn`）。

## 三、这一档，5 个库里只有 vxe-table 扛得住

1 万行 × 200 列，5 个库同场（准确说是 4 个库 + 我们开关两态）：

| 库                                 | 首次渲染     | 排序切换   | 滚动到底  | **连续滚动 longtask** | DOM 节点数 | **可视列数** |
| ---------------------------------- | ------------ | ---------- | --------- | --------------------- | ---------- | ------------ |
| vtable-guild（`virtualColumn` 关） | 232 / 342    | 126 / 219  | 0.0 / 164 | 4,391                 | 3,659      | **200**      |
| vtable-guild（`virtualColumn` 开） | 187 / 187    | 75 / 75    | 0.0 / 0   | **0**                 | **1,415**  | **13**       |
| vxe-table 4.20.10                  | **51 / 267** | **21 / 0** | 0.0 / 0   | **0**                 | 2,089      | 11           |
| el-table-v2 2.13.3                 | 131 / 131    | 84 / 164   | 0.0 / 213 | 6,302                 | 5,229      | **200**      |
| antdv-next 1.4.6（开 `virtual`）   | 266 / 954    | 258 / 258  | 0.1 / 217 | 5,726                 | 2,640      | **200**      |

采集环境：Chrome 151 · Windows 11 · 8 逻辑核 · 16 GB · DPR 1 · **production 构建** · 未被节流。
方法：warmup 1 轮丢弃 + 正式 5 轮取中位数，全部数据采自**同一次会话**。
版本：vtable-guild 2.4.1 · antdv-next 1.4.6 · element-plus 2.13.3 · vxe-table 4.20.10 · vue 3.5.26。

**「可视列数」这一列是全表最该看的。** 它的口径是「首个可见行的直接子元素数」——
这是唯一在 5 个库上都成立的统计方式（有的用 `<td>`，有的用 `div`）。它把问题说得很直白：

- el-table-v2 和 antdv-next 的可视列数都是 **200**。它们在这个配置下只虚拟化行，横向照单全收。
- vxe-table 是 **11**，我们开启后是 **13**。这两家做了列窗口化。

顺便交代两处口径上对我们不利的地方，免得被当成藏拙：

1. 我们那个 13 里含最多 2 个用于补齐总宽的**占位单元格**，真实渲染的列是 11–12 个，
   和 vxe-table 实际持平。但占位单元格确实是 DOM 里的直接子元素，按统一口径就该算进去，
   所以不做特例处理。
2. 内存增量这一列我直接删了。两个开启横向虚拟化的条目读数为负（−32.9 MB / −4.6 MB），
   是 GC 时机导致的已知不可靠读数，列出来只会误导人。

还有一个范围声明：**本文只测了这 5 个。** 社区里还有别的实现（比如
[aimerthyr/virtual-table](https://github.com/aimerthyr/virtual-table) 就自称行列均支持虚拟滚动），
不在本次对照范围内，我没测过就不下结论。

## 四、难点不在窗口算法，在固定列

好了，到了动手的部分。

如果你没做过，第一直觉大概是：横向虚拟化不就是把行虚拟化的那套算法换个轴再来一遍吗？
列宽前缀和、二分查找可视区间、两侧撑开占位——听起来一个下午能写完。

**如果你的表没有固定列，那确实一个下午能写完。** 麻烦全在固定列上。

### 4.1 冲突是什么

窗口化的前提是：**渲染出来的东西是一段连续的下标区间** `[start, end]`。
你才能用「左占位 + 窗口 + 右占位」把总宽撑回去，滚动位置才对得上。

而 `position: sticky` 的固定列要求：**它必须始终在 DOM 里**。它一旦被窗口跳过、从 DOM 里消失，
"固定"这个效果就没了。

于是这两个要求直接打架：固定列可能在下标 0、1，也可能在 198、199，
而窗口此刻在 [80, 92]。你不可能用一段连续区间同时包含它们。

### 4.2 解法：把一行拆成五段

放弃"一行 = 一段连续区间"，改成五段：

```
[...左固定列] [左占位] [...窗口列] [右占位] [...右固定列]
```

固定列恒渲染、完全不参与窗口计算；中间的可滚动部分才做窗口化；两个占位单元格负责
把被跳过的宽度补回来，保证行的总宽不变。

代码大概长这样（`useColumnWindow.ts` / `VirtualTableBody.tsx`）：

```ts
/**
 * 一行的 DOM 结构计划：
 * `[...左固定] [占位] [...窗口列] [占位] [...右固定]`
 *
 * 所有可见行共用同一份计划，每帧只算一次。
 */
const cellPlan = computed<CellSlot[]>(() => {
  const count = props.columns.length
  if (!columnWindowActive.value) {
    // 回落：渲染全部列
    return Array.from({ length: count }, (_, index) => ({ index }))
  }

  const { leftFixedCount, rightFixedStart } = fixedRanges.value
  const plan: CellSlot[] = []
  for (let i = 0; i < leftFixedCount; i += 1) plan.push({ index: i })
  if (leftSpacer.value > 0) plan.push({ spacer: leftSpacer.value })
  for (let i = windowStart.value; i <= windowEnd.value; i += 1) plan.push({ index: i })
  if (rightSpacer.value > 0) plan.push({ spacer: rightSpacer.value })
  for (let i = rightFixedStart; i < count; i += 1) plan.push({ index: i })
  return plan
})
```

这个结构带来一条**硬约束**：左固定列必须连成前缀、右固定列必须连成后缀。
如果有人把 `fixed: 'left'` 放在第 100 列上，中间那段就不再是"纯可滚动列"，
它会被窗口整段跳过。所以要显式校验连续性：

```ts
let contiguous = true
for (let i = leftFixedCount; i < rightFixedStart; i += 1) {
  if (columns[i].fixed === 'left' || columns[i].fixed === 'right') {
    contiguous = false
    break
  }
}
```

不满足就整体回落到渲染全部列，并在 dev 构建里告诉用户原因。宁可不优化，也不能错位。

### 4.3 窗口区间要扣掉被 sticky 盖住的两端

第二个容易写错的地方：可视区间不是 `[scrollLeft, scrollLeft + clientWidth)`。

左右固定列是 `sticky`，它们**盖在**视口两端。可滚动内容真正露出来的区间是：

```ts
const visibleLeft = offsetX + leftFixedWidth
const visibleRight = offsetX + viewportWidth - rightFixedWidth

let start = prefix.findIndex(visibleLeft) - overscan
let end = prefix.findIndex(visibleRight) + overscan
```

漏掉这一步，窗口会比实际需要多渲染两端各若干列——不至于出错，但白干活。

`prefix` 是一个列宽前缀和结构（`PrefixSums`，同一个类也服务于行高那条轴），
`findIndex` 是二分。所以每次滚动是 O(log n)，只有列宽变化时才付一次 O(n) 重建。

写完之后我去翻了 vxe-table 的实现（`packages/table/src/table.ts` 的 `handleVirtualXVisible`）：

```ts
const startLeft = scrollLeft + leftFixedWidth
const endLeft = scrollLeft + clientWidth - rightFixedWidth
```

**同一个式子。** 两个独立实现收敛到同一处，基本可以确认这条路是对的。

### 4.4 只改表体，完全不动表头

这是整个方案里我最满意的一个决定，也是最反直觉的一个。

直觉上，表头和表体的列必须"结构相同"才能对齐，所以表头也得跟着窗口化。
**但它们本来就不是一张表。** 表头和表体是两张独立的 `<table>`，各自独立偏移
（表头用真实 `scrollLeft`，表体靠外层容器的 `marginLeft: -offsetX`）。
对齐靠的是**绝对像素位置**，不是列结构相同。

只要表体用占位单元格把跳过的宽度补齐，第 j 列在两边就落在同一个 x 上。表头爱渲染多少渲染多少。

代价是表头仍然要付 200 个 `TableHeaderCell`。但那是**一次性**成本，
相对表体那两千多个单元格只占约 8%——而表体是每帧都要还的。这笔账很好算。

**而不动表头反过来送了我们一份大礼：列宽不用用户声明。**

vxe-table 因为表头表体都窗口化，没有一份完整布局可以参照，所以它必须自己实现
`width / minWidth / auto / 百分比 → renderWidth` 的那一整套解析。
而我们的表头**始终渲染全部 N 列**，它本身就是浏览器已经算好的、精确的列宽参照——
直接读 `<th>` 的 rect 就行：

```ts
// useColumnMetrics.ts —— 量表头，得到每个叶子列的实测宽度
export interface ColumnMetrics {
  /** 各叶子列的实测宽度（px），下标即 displayColumns 下标。 */
  widths: number[]
  total: number
}
```

于是 `auto`、百分比、`table-layout: fixed` 下的余量分配，全都天然支持，一行适配代码都不用写。

**关键在于这不构成反馈环**：表头的布局不依赖表体（它是独立的一张表），
所以"量表头 → 改表体"是单向的。如果表头表体是同一张表，这么干会立刻死循环。

### 4.5 首帧刻意"不优化"

还有一个取舍值得说，因为它直接导致我在首帧这项上输给 vxe-table。

首帧的时候，表头还没渲染完，没有宽度可量。这时候有两条路：

1. 按声明宽度估算一个位置，先窗口化，量到真实宽度后再修正
2. 老老实实渲染全部列，等量到宽度再收窄

我选了 2。理由很简单：**估算错了会表现为表头表体错位**，这是用户一眼能看见、
且会立刻判定"这个库有 bug"的那种错误；而首帧多花几十毫秒，用户感知不到。

```ts
/**
 * 参与窗口计算的列宽。返回 null 即「这一帧不虚拟化列，渲染全部」。
 *
 * 首帧尚无测量结果、或可视区宽度还没量到时都会落到这里——宁可第一帧多渲染，
 * 也不要按错误宽度定位，那会直接表现为表头表体错位。
 */
const windowWidths = computed(() => {
  if (!props.virtualColumn) return null
  if (viewportWidth.value <= 0) return null
  const metrics = props.columnMetrics
  if (!metrics || metrics.widths.length !== props.columns.length) return null
  return metrics.widths
})
```

所以 `virtualColumn` 优化的是**滚动与更新**，不是首次渲染。这一点在文档里也写着，
免得有人开了之后发现首帧没变快来提 issue。

### 4.6 顺手省下的 2,400 个 `<col>`

一个额外收获。我们的虚拟模式下每个可见行是一张独立的 `<table>`
（为了保住语义化 `<tbody><tr><td>`）。如果每张表都带一份 `<colgroup>`，
200 列 × 12 行就是 **2,400 个纯布局用的 `<col>` 元素**。

现在虚拟行不渲染 `<colgroup>`，依据是 CSS 2.1 §17.5.2.1：
行表是 `table-layout: fixed` 且只有一个数据行，没有 `<col>` 时列宽由**首行单元格**决定，
而我们本来就把宽度写在每个 `<td>` 上了。

配套约束得记住：**`ColGroup` 必须和 `TableCell` 读同一个宽度来源**。
fixed 布局下 `<col>` 的宽度优先级高于单元格宽度，如果表头的 colgroup 只读 `column.width`，
去掉表体 colgroup 之后，拖拽列宽时表头会被钉死、表体跟着走，直接错位。

这一项单独贡献了宽表约 40% 的 DOM 节点削减。

## 五、我输在哪

到这里为止听起来都挺好。但同一张对照表里，vxe-table 有两项明显赢我：

|          | vxe-table       | vtable-guild（开 `virtualColumn`） | 差距        |
| -------- | --------------- | ---------------------------------- | ----------- |
| 排序切换 | **21 / 0 ms**   | 75 / 75 ms                         | **约 3.5×** |
| 首次渲染 | **51 / 267 ms** | 187 / 187 ms                       | **约 3.7×** |

- **首帧慢是我自己选的**，就是 4.5 节那个取舍：先全量渲染、量到表头真实宽度再收窄。
  这项我认，而且短期不打算改——用一次性的几十毫秒换掉一整类错位 bug，我觉得划算。
- **排序慢我还没定位。** 宽表下开了窗口化之后排序仍要 75ms，而 vxe 是 21ms。
  按理说窗口化之后参与更新的单元格已经少一个量级了，说明瓶颈在别处（可能是排序后
  `processedData` 引用变化触发的下游 computed 链）。这条在我的性能文档里挂着，
  标注是"尚未定位"，没想明白之前不编理由。

能力上还差这些，一并列出来：

- **表头不虚拟化**（4.4 节说的那个取舍的另一面）。列数极端多时表头仍是全量的。
- **合计行不虚拟化。**
- **没有调优旋钮。** vxe 的 `virtual-x-config` 给了 `gt` / `oSize` / `preSize` /
  `immediate` / `threshold` 一整套，还能按 `gt` 阈值**自动**启用；我们只有一个布尔开关
  和写死的 overscan = 2。
- **不处理浏览器最大滚动宽度上限。** 列宽总和超过浏览器允许的最大滚动宽度时，
  vxe 有 `isScrollXBig` 分支做比例映射（`scrollLeft = ceil((scrollXWidth - clientWidth) * min(1, scrollLeft / (maxXWidth - clientWidth)))`），
  我们没有。列数再往上堆会撞到这个天花板。

另外，为了避免有人误会"这几个库不如我们"，两条必须说清的事实：

- **el-table-v2 在 10 万行 × 6 列那一档挂载比我们快**（6.5 ms vs 13 ms）。
  它是纯 div + 定高，没有位置表要维护；我们那 13ms 里含不定行高支持的初始化开销。
- **vxe-table 的能力面比我们宽得多**（单元格编辑、Excel 导出、键盘导航、右键菜单），
  表体也同样是语义化的 `<tbody><tr><td>`。它初始化更重是有来由的。

顺带纠正一个我自己以前说错的判断：我一度以为"语义化 `<table>`"是我们相对 vxe 的差异点，
实测发现它的 `.vxe-body--row` 是真 `<tr>`。**对 vxe 的差异化理由不是语义化**，
而是另外两点：10 万行档挂载/排序快一个数量级，以及虚拟滚动下仍支持不定行高——
后者是查它的类型声明才确认的，`VirtualYConfig.gt` 的注释写着
「注：启用纵向虚拟滚动之后将不能支持动态行高」，这句话官网上找不到。

（这也是一条经验：**核实竞品能力要查你实测用的那个版本的 `.d.ts`，不要查官网。**
官网写的是最新版，而很多关键约束只写在类型注释里。）

## 六、什么时候不该开

说第三遍：**列数不到 50，开了没有意义。**

6 列基准档开与不开完全持平——它既没有收益，也没有代价（只多一次表头测量）。
所以我把它做成了严格 opt-in、默认 `false`，而不是像 vxe 那样按 `gt` 阈值自动启用。

还有四条硬前提，不满足会**静默回落**到渲染全部列（dev 构建会在控制台说明原因）：

```ts
const virtualColumnBlockedReason = computed<string | null>(() => {
  if (!props.virtualColumn) return null
  if (!virtualEnabled.value) return '它只作用于虚拟表体，需要同时开启 virtual 与 scroll.y'
  if (hasPotentialBodySpan.value)
    return (
      '列上有 customCell / customRender，可能返回 colSpan / rowSpan；' +
      '单元格合并会让某个 td 缺席，进而破坏列宽不变量'
    )
  if (!displayFixedRanges.value.contiguous)
    return '固定列必须分列两端：左固定连成前缀、右固定连成后缀'
  return null
})
```

第二条要单独强调，因为它在真实业务里最常踩：**列上只要有 `customCell` / `customRender`，
就会回落。** 原因是它们可能返回 `colSpan` / `rowSpan`，单元格合并会让某个 `<td>` 缺席，
而整个五段式结构的正确性依赖"每行的单元格宽度总和恒等于总宽"这个不变量。

也就是说，你那个 operation 列如果挂了自定义渲染的按钮，这张表就享受不到横向虚拟化。
这是当前的真实限制，不是我藏着的。

用法本身很朴素：

```vue
<VTable
  row-key="key"
  :columns="columns"
  :data-source="dataSource"
  :scroll="{ x: 20000, y: 400 }"
  :virtual="true"
  :virtual-column="true"
/>
```

## 七、别信我，自己量一遍

这篇文章里的每个数字都可以在你自己的机器上重跑：

**<https://parade0393.github.io/vtable-guild/perf/>**

对照页把 vtable-guild、ant-design-vue、antdv-next、el-table-v2、vxe-table 放在
**同一批数据、同一套列配置**下跑（1k / 1 万 / 10 万行 × 6 / 50 / 200 列），
给出渲染耗时、DOM 节点数、内存，可一键导出结果。页面上写明了采集方法和已知的不对等之处。

关于口径，几条我给自己定的规矩，供你在读任何一篇性能对比文章（包括这篇）时当检查表用：

1. **同一次会话。** 跨会话的绝对值不可比，机器状态差异能到一个数量级。
   所以本文所有数字采自同一次采集，不存在"改前用旧机器、改后用新机器"。
2. **production 构建。** dev 构建下 Vue 的开销能到 3–5 倍，用 dev 数据做对比没有意义。
3. **warmup 1 轮丢弃 + 正式 5 轮取中位数。** 首轮包含 JIT 预热和资源加载。
4. **公开不利数据。** 上面第五节那两项我输的，和 el-table-v2 挂载更快，都在正文里。
   一篇只有好消息的性能文章，默认就该被怀疑。
5. **DOM 节点数是这套指标里唯一零噪声的。** 耗时有波动、内存无法强制 GC，
   只有 DOM 节点数是确定的、可复算的。所以我把它放在每张表里。

---

## 结尾

横向虚拟化不是什么高深技术，窗口算法本身十几行。真正的成本在于：
它和固定列、单元格合并、列宽自适应、拖拽改宽这几条链路全都有耦合，
每一处都要想清楚不变量是什么、破了之后会以什么形式暴露出来。

如果你也在做类似的东西，上面那套五段式结构和窗口公式可以直接拿去，
我的实现是 MIT 的：<https://github.com/parade0393/vtable-guild>

如果你只是想用，那记住三句话就够了：列少于 50 别开；有 `customRender` 的列开了也会回落；
先自己去对照页跑一遍再决定要不要换。

- 仓库：<https://github.com/parade0393/vtable-guild>
- 文档：<https://parade0393.github.io/vtable-guild/>
- 虚拟滚动文档（含全部边界）：<https://parade0393.github.io/vtable-guild/guide/virtualization>
- 性能对照页：<https://parade0393.github.io/vtable-guild/perf/>
