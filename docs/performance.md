# 性能测试体系（Performance）

本文档定义 vtable-guild 表格组件的**性能度量与回归制度**：怎么量、量什么、基线是多少、改动后如何自证没退化。

> 原则：**先有标尺，再谈优化**。任何性能优化都必须用下面的基准量化前后收益，不靠手感。

## 四层体系

| 层级              | 测什么                                                          | 工具                                   | 在哪跑            | 状态                |
| ----------------- | --------------------------------------------------------------- | -------------------------------------- | ----------------- | ------------------- |
| **L1 微基准**     | 数据管道纯函数：排序 / 筛选 / 选择态 / 树展平                   | Vitest `bench()`                       | 本地 `pnpm bench` | ✅ 已落地           |
| **L2 渲染基准**   | 组件挂载 / 更新 1k–10k 行的 JS+vdom 成本                        | Vitest + `@vue/test-utils`             | 本地              | ⏳ 规划中           |
| **L3 浏览器剖析** | 真实滚动 / 排序 / 筛选 / 全选的 scripting 耗时、INP、帧率、内存 | Chrome DevTools / MCP + `/perf` 对照页 | 人工 / 发版前     | ✅ 已落地（两个面） |
| **L4 预算门禁**   | 关键指标设阈值，超标即拦截                                      | baseline + CI 断言                     | CI                | ⏳ 规划中           |

L1/L2 是**自动回归网**（快、稳、可进 CI）；L3 是**真实体感的标尺**（happy-dom 没有 layout/paint，测不出真实卡顿，必须用浏览器）；L4 让制度长出牙齿。

L3 有两个面，别混用：

| 面             | 位置                                                | 用途                                                                                                                                                           |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **内部演练台** | `playground` 的 `#/perf`（dev-only，无 build 脚本） | 只测 vtable-guild 自己，动作按钮齐全（选中首行、强制重新挂载等），用于开发期快速对照前后                                                                       |
| **公开对照页** | 独立应用 `perf/` → `/vtable-guild/perf/`            | 五方对照（vtable-guild / antdv Table / antdv-next / el-table-v2 / vxe-table）× 1k/1w/10w 行 × 6/50/200 列，production 构建，自带环境披露与结果导出，供外部复现 |

## 如何运行

### L1 微基准

```bash
pnpm bench                                   # 跑全部（经 turbo，仅 table 包定义了 bench）
pnpm --filter @vtable-guild/table bench      # 只跑 table 包
```

- 基准文件：`packages/table/src/composables/*.bench.ts`，与单测同目录。
- 共享数据生成器：`packages/table/src/composables/bench-fixtures.ts`（确定性、不用随机数，保证可复现）。
- 三条准确性铁律（新增基准时务必遵守）：
  1. 数据在 `bench()` **外**生成一次，回调内只跑被测热函数。
  2. 数据用下标 + 乘法散列伪乱序，**不用 `Math.random()`**（排序基准否则会命中“已有序”最优路径）。
  3. 被测目标是 `computed`（如 `flattenData`）时，每次迭代前需改写其依赖使缓存失效，再读 `.value`。

### L3 浏览器剖析

**内部演练台（只测自己，开发期快查）**

1. `pnpm playground`，打开 `#/perf`（导航栏「性能」）。
2. 用「配置」选定场景（行数 / 虚拟滚动 / 密度 / 选择列）。
3. Chrome DevTools 或 MCP 开始录制 performance trace。
4. 点「动作」按钮触发热路径（排序 / 筛选 / 全选 / 滚动到底 / 重新挂载）。
5. 停止录制，读取 scripting 耗时、INP、帧率、内存；填入下方 L3 基线表。

> 页面内「Last action」耗时仅为**指示值**（动作 → 等一帧 → 计时），用于即时反馈；权威数据以 DevTools trace 为准。

**公开对照页（五方对照，可复现）**

```bash
pnpm build
pnpm perf:preview        # 必须是 production 构建；dev 会放大 3–5×
```

打开后选「被测库 + 数据量」，点「批量跑分」。页面自带环境披露、公平性契约说明与结果导出
（复制为 Markdown / 导出 JSON）。线上地址：<https://parade0393.github.io/vtable-guild/perf/>。

> **必须让窗口前台可见**。窗口被最小化 / 被完全遮挡 / 处于后台标签页时，浏览器会把
> `requestAnimationFrame` 节流到约 1 次/秒，所有基于 paint 的墙钟都会退化成「约 2000ms」
> 这种与库无关的常数。页面会自检帧率并在被节流时显红条警告——**看到警告就别用那批数字**。
> 主指标「同步 render+patch」（mutate → 微任务 flush）与 longtask 不受节流影响。

## 基线

> ⚠ 数字随机器/负载波动，仅作**相对基线**用于回归对照，不是绝对承诺值。
> 本节只保留**当前实现**的实测值；被取代的数字一律删除，不留历史对照。

### L1 基线（hz = 每秒次数，越高越快；mean = 单次平均耗时）

采集环境：本机开发环境（Windows 11，Node 22，Vitest 4.1.2）。

| 基准                                            | 1k                   | 10k                |
| ----------------------------------------------- | -------------------- | ------------------ |
| `sortData` 单列排序                             | 1,282 hz             | 111 hz · 9.02 ms   |
| `filterData` 单列筛选                           | 97,535 hz            | 9,980 hz           |
| `getSelectionState` 全行（checkStrictly:false） | 10,943 hz · 0.091 ms | 801 hz · 1.25 ms   |
| `flattenData` 树展平（全展开）                  | 16,930 hz            | 1,935 hz · 0.52 ms |

`sortData` 是数据管道里最重的一环（10k 约 9 ms），且它在 computed 链内、依赖变化时重排是语义要求，
没有便宜的优化空间。`getSelectionState` 走后代集合记忆化：bench 铁律 3 要求每次迭代前失效缓存，
所以上面的数字**包含 descendantsMap 的整表重建**；真实交互中树拓扑不变时后代查表是 O(1)，
逐次选择切换的实际成本远低于此。

### L3 基线（2026-08-10）

采集环境：Chrome 151 · Windows 11 · 8 逻辑核 · 16 GB · DPR 1 · **production 构建** · 未被节流。
版本：vtable-guild `2.4.1` · ant-design-vue `4.2.6` · antdv-next `1.4.6` · element-plus `2.13.3` ·
vxe-table `4.20.10` · vue `3.5.26`。
方法：warmup 1 轮丢弃 + 正式 5 轮取中位数。单元格 `同步 render+patch / longtask`（ms）。
全部数据采自**同一次会话**，这也是 README 引用的口径。

#### 10 万行 × 6 列

| 库               | 首次渲染    | 排序切换   | 滚动到底 | 连续滚动 | DOM 节点数 | 可视行数 | 内存增量   | 实测行高 |
| ---------------- | ----------- | ---------- | -------- | -------- | ---------- | -------- | ---------- | -------- |
| vtable-guild     | 13 / 0      | 63 / 64    | 0.1 / 0  | 503 / 0  | 167        | 12       | 2.2 MB     | 46.0px   |
| el-table-v2      | **6.5 / 0** | **41 / 0** | 0.0 / 0  | 508 / 0  | 185        | 12       | **0.8 MB** | 47.0px   |
| antdv-next Table | 23 / 0      | 72 / 74    | 0.0 / 0  | 514 / 0  | **118**    | 11       | 10.3 MB    | 47.0px   |
| vxe-table        | 213 / 458   | 336 / 336  | 0.1 / 0  | 504 / 0  | 451        | 11       | 26.6 MB    | 47.0px   |

对照档 1k 行 × 6 列（vtable-guild）：11 / 0 挂载、7.4 / 0 排序、DOM 节点数 **167**、可视行数 12。
与 10 万行档 DOM 节点数完全一致 —— 虚拟化在行数维度上生效的判据。

#### 1 万行 · 列数缩放（vtable-guild 自身，`virtualColumn` 关）

| 列数 | 首次渲染  | 排序切换  | 连续滚动 longtask | DOM 节点数 |
| ---- | --------- | --------- | ----------------- | ---------- |
| 6    | 14 / 0    | 15 / 0    | **0**             | 167        |
| 50   | 60 / 60   | 34 / 0    | **0**             | 959        |
| 200  | 232 / 342 | 126 / 219 | **4,391**         | 3,659      |

挂载耗时随列数增长（6→200 列，列数 33×，耗时 17×）。**连续滚动是断崖**：6 / 50 列 longtask
恒为 0，到 200 列变成 4,391ms——这就是 antdv-next#427 描述的「卡顿掉帧」，也是 `virtualColumn`
存在的理由。列不到 50 时开它没有意义。

#### 1 万行 × 200 列

| 库                              | 首次渲染     | 排序切换   | 滚动到底  | 连续滚动 longtask | DOM 节点数 | 可视列数 | 实测行高 |
| ------------------------------- | ------------ | ---------- | --------- | ----------------- | ---------- | -------- | -------- |
| vtable-guild                    | 232 / 342    | 126 / 219  | 0.0 / 164 | 4,391             | 3,659      | 200      | 46.0px   |
| vtable-guild（`virtualColumn`） | 187 / 187    | 75 / 75    | 0.0 / 0   | **0**             | **1,415**  | **13**   | 46.0px   |
| vxe-table                       | **51 / 267** | **21 / 0** | 0.0 / 0   | **0**             | 2,089      | 11       | 47.0px   |
| el-table-v2                     | 131 / 131    | 84 / 164   | 0.0 / 213 | 6,302             | 5,229      | 200      | 47.0px   |
| antdv-next Table                | 266 / 954    | 258 / 258  | 0.1 / 217 | 5,726             | 2,640      | 200      | 47.0px   |

**本次对照的这 4 个库里只有两家做了横向虚拟化**：vxe-table，和开了 `virtualColumn` 的我们。
el-table-v2 与 antdv-next 的可视列数都是 200，它们在这个配置下只虚拟化行——el-table-v2
比我们（关窗口时）快，靠的是纯 div + 定高本来就更省，不是虚拟列。

> 限定词不能省。社区里还有别的实现做了横向虚拟化（如 `aimerthyr/virtual-table`
> 自称行列均支持），只是不在本次对照范围内。对外任何"只有 X 家"的说法都要带上
> "在本次实测的这几个库里"，否则一处未限定的宣称就足以让整份数据被否定。

内存列本档不列：两个开启横向虚拟化的条目读数为负（−32.9 MB / −4.6 MB），是 GC 时机导致的
已知不可靠读数，列出来只会误导。

> 「可视列数」按「首个可见行的直接子元素数」统计——这是唯一跨库都成立的口径，
> 因此我们的 13 里含最多 2 个补齐总宽用的占位单元格，真实渲染的列是 11–12 个。
> 这个偏差方向对我们**不利**（报得比实际多），故不做特例处理。

#### 结论（含对我们不利的部分）

1. **行数轴**：挂载不随行数增长（1k 11ms → 10 万 13ms），DOM 节点数两档恒为 167。
   el-table-v2 仍是挂载最快的（6.5ms），差距是不定行高初始化的能力成本。
   对 vxe-table 挂载快约 16×、排序快约 5×。

2. **列数轴**：`virtualColumn` 把连续滚动 longtask 从 4,391ms 打到 **0**，与 vxe-table 持平；
   DOM 节点数 3,659 → 1,415，已低于 vxe-table 的 2,089。

3. **仍落后 vxe-table 两项**：排序 75/75 对 21/0（约 3.5×）、首次渲染 187 对 51（约 3.7×）。
   首帧的差距是刻意的（先全量渲染、量到表头宽度再收窄），排序的差距尚未定位。

4. **能力边界要和数字一起读**（各项来源：横向虚拟化看实测可视列数，语义化表体看实测 DOM，
   其余查各库 npm 包内的类型声明，版本同上）：
   - el-table-v2：必须定高，不支持多级表头 / 单元格合并 / 内置排序筛选，表体纯 div
   - antdv-next：表体是 div（`div.ant-table-tbody-virtual` + `div.ant-table-row`），虚拟模式下
     `rowSpan`/`colSpan` 无效；但基于 `@v-c/virtual-list`（ResizeObserver 实测行高），不定行高成立
   - vxe-table：能力最全，表体也是语义化 `<tbody><tr><td>`（`.vxe-body--row` 是真 `<tr>`）。
     但它的 `virtual-y-config.gt` 类型注释写明「启用纵向虚拟滚动之后将不能支持动态行高」——
     **大数据档它同样要定高**
   - 所以对 vxe-table 的差异化理由**不是**语义化表格，而是两点：10 万行下挂载/排序快一个数量级，
     以及虚拟滚动下仍支持不定行高

5. 内存读数无法强制 GC，跨会话波动可达一个数量级，只作数量级参考。
   DOM 节点数是这套指标里唯一零噪声的。

## 实现要点

记录**当前实现**为什么长这样，供改动时判断哪些约束不能破。不含历史对照数字，数字一律看上面的基线。

### 虚拟化内核

- **行位置表用 `PrefixSums`**（`Float64Array` 持久化）：`update(index, height)` 只增量重算
  `[index, end)`，`findFirst(target)` 二分定位起点。滚动是 O(log n)，只有实测行高变化时付 O(n − index)。
  同一个类同时服务行高与列宽两条轴。
- **`rowHeight` 定高快路径**：传入时完全不创建 ResizeObserver、不调 `setInstanceRef` / `collectHeight`，
  永远走 O(1) 估算。dev 期会拿首行实测值校验，把「配错导致静默错位」变成显式告警。
  未传时走实测路径，支持不定行高——这正是我们比 el-table-v2 多付的挂载成本。
- **树相关的每行 O(n) 全部要有守卫**：非树数据不得触发 `flattenData`、不得走 `treeFlattenData.find()`。
  这类无条件全量预处理是挂载耗时随行数增长的主要来源，改动数据管道时优先检查这一点。
- **不要用 `dataSource.indexOf(item)` 定位渲染槽**：用 VirtualList 给的绝对下标；
  `itemKey` 在有 `rowKey` 时直接取记录 key，否则 range 计算里的每 item `getKey` 会退化成 O(n²)。

### 横向虚拟化 `virtualColumn`

严格 opt-in、默认 `false`（与 `rowHeight` 同一个先例）。它把可见单元格数从「行 × 总列数」
降到「行 × 可视列数」——200 列下瓶颈是 `TableCell` 的实例数（每个是带约 12 个 computed 的
`defineComponent`），减少实例数是唯一能拿到耗时收益的路径。

- **只改表体，完全不动表头。** 表头与表体本来就是两张独立的表、各自独立偏移（表头用真实
  `scrollLeft`，表体靠 `Filler` 的 `marginLeft: -offsetX`），对齐靠的是**绝对像素位置**而不是
  「列结构相同」。只要表体用占位单元格补齐总宽，列 j 在两边就落在同一个位置。代价是表头仍付
  N 个 `TableHeaderCell`，但那是一次性成本，相对表体的两千多个只占约 8%。
- **列宽靠量表头，不要求用户声明数字宽度。** 表头始终渲染全部 N 列，它本身就是浏览器算好的
  精确列宽参照，直接读 `<th>` 的 rect 即可，不必复刻 vxe-table 那套
  `width / minWidth / auto / 百分比 → renderWidth` 解析（它表头表体都窗口化，没有完整布局可参照）。
  因此 `auto`、百分比与 `table-layout: fixed` 下的余量分配都天然支持。
  **表头布局不依赖表体，所以「量表头 → 改表体」不构成反馈环**——这是整个方案能成立的关键。
- **首帧刻意回落到渲染全部列**，量到宽度后再收窄。宁可第一帧贵，也不要按估算宽度定位然后错位。
  这就是首次渲染慢于 vxe-table 的原因，属设计取舍。
- 相关实现：`useColumnWindow`（前缀和 + 二分求窗口）、`useColumnMetrics`（量表头）、
  `TableCell.widthOverride`、`TableHeaderCell` 给叶子 `<th>` 打 `data-vtg-leaf-col`。

与 vxe-table 仍存在的差距（已知，未做）：表头不虚拟化；合计行不虚拟化；
无调优旋钮（vxe 的 `virtual-x-config` 给了 `gt` / `oSize` / `preSize` / `immediate` / `threshold`
一整套，还能按 `gt` 阈值自动启用；我们只有一个布尔开关 + 固定 overscan 2 列）；
不处理浏览器最大滚动宽度上限（vxe 有 `isScrollXBig` 分支做比例映射）。

### 虚拟行不渲染 `<colgroup>`

虚拟模式下每个可见行是一张独立 `<table>`，若各自再带一份 `<colgroup>`，200 列 × 12 行 就是
2,400 个纯布局用的 `<col>`。现在虚拟行不渲染 `<ColGroup>`，依据是：行表为 `table-layout: fixed`
且只有一个数据行，按 CSS 2.1 §17.5.2.1，无 col 时列宽由**首行单元格**决定，而 `TableCell`
已经把同一份宽度写在每个 `<td>` 上。空态那张表（单例）仍保留 colgroup。

配套约束：**`ColGroup` 必须读 `columnWidths`**，与 `TableCell` / `TableHeaderCell` 同一个宽度来源。
fixed 布局下 `<col>` 宽度优先级高于单元格宽度，若表头只读 `column.width`，去掉表体 colgroup 后
拖拽期表头会被钉死、表体跟随，从而错位。

### 响应式粒度

- `scrollState` 拆成独立的 `atStart` / `atEnd` 布尔 computed。合成单对象会让每帧横向滚动都产出新对象
  （`Object.is` 恒判为变），导致全表固定列单元格的 `fixedClass` 逐帧重算。
- `subThemeSlots` 是稳定引用对象 + 懒 slot 函数，不是 eager computed。variant（size/bordered 等）
  变化只影响实际读取对应 slot 的组件，不级联失效全表单元格样式。
- 树形选择用 `selectableDescendantsMap`（自底向上单遍构建）+ `rowMetaMap`（record → FlattenRow），
  把整表半选计算与三处每行 `find()` 都变成查表。

### 已评估，明确不做

- **useHeights ResizeObserver 节流**：现有 `promiseIdRef` 微任务护栏已把同帧多次 resize 回调合并为一次 `doCollect`；改 rAF 会给滚动关键路径的行高测量增加一帧延迟，得不偿失。
- **sortData 脏检查**：它在 computed 链内，Vue 已提供记忆化；依赖变化时重排是语义要求。
- **useSorter 列 watch 的 `deep: true`**：浅 watch 会丢"原地修改列数组"场景的 `defaultSortOrder` 初始化，语义风险大于收益。
- **把"每可见行一张 `<table>`"拆成共享单表**：改动要触碰列宽、合并单元格、固定列三条链路，
  而语义化 `<table>` 是我们的能力底线之一。DOM 节点数已经比 el-table-v2（185）和
  vxe-table（451）都可控，这项是拿最高风险换最小收益。

## 性能预算（L4，待定）

待 L1/L2 基线稳定 2–3 个版本后，为关键指标设阈值（例如「`sortData` 10k < 12 ms」「滚动 INP < 200 ms」），并在 CI 中断言、超标拦截。当前阶段**不入 CI**（timing 在不同 runner 上噪声大）。

## PR 检查项

改动**渲染路径**（`components/*.tsx`）或**数据管道**（`composables/useSorter|useFilter|useSelection|useTreeData`）时：

- [ ] 跑 `pnpm bench`，对比改动前后 L1 数字，附在 PR 描述里。
- [ ] 若涉及大数据渲染/滚动，用 `/perf` + DevTools 抓一次 trace 对比。
- [ ] 无明显回归（或回归有合理解释与收益权衡）。

改动**对外口径**（README、对照页能力表、文档里任何"我们有 / 它们没有"的说法）时：

- [ ] 数字来自**同一次会话**。跨会话的绝对值不可比，机器状态差异能到一个数量级；
      被取代的旧数字直接删掉，不要留"改前 → 改后"。
- [ ] 竞品能力**先查已安装包的类型声明**，`node_modules/.pnpm/<pkg>@<version>/…/*.d.ts`。
      理由：版本和你实测用的完全一致，而官网写的是最新版；很多关键约束只写在类型注释里，
      官网反而找不到——vxe-table「启用纵向虚拟滚动之后将不能支持动态行高」就是在
      `VirtualYConfig.gt` 的注释里发现的，此前一直被记成"它这项不缺"。
      注意类型可能不在主包里：vxe-table 4.20.10 的 `types/` 只做转发，实际定义在
      `vxe-pc-ui/types/components/table.d.ts`。
      解析路径：`node -e "console.log(require.resolve('<pkg>/package.json'))"`。
- [ ] **"只有 X 家 / 独有 / 唯一"必须带范围限定**（"在本次实测的这几个库里"）。
      对照范围之外一定还有别的实现——`aimerthyr/virtual-table` 就自称行列均支持虚拟滚动。
      一处未限定的宣称足以让整份数据被否定。
- [ ] DOM 层面的结论（是否语义化 `<table>`、是否真的窗口化）**用对照页实测**，别靠印象：
      可视列数看结果表，表体结构直接在 DevTools 里看标签名。
- [ ] 核实不了就写"未核实"，不写 ✅ 也不写 ❌ —— 不替竞品下没根据的结论。

## 下一阶段优化点

**明确不做**

- **行 / 单元格无 `v-memo`**：局部状态变更（选择 / hover）触发全表 cell 的 computed 重算。实测收益集中在**非虚拟大表**（不推荐用法）；虚拟模式下单行选中仅 ~24 ms（dev，prod 约 1/3–1/5），已受 viewport 约束。完整方案 = props 解耦 + 行级 memo/子组件 bailout + 稳定 rowSelection 配置，协同改造多、回归风险高。除非出现真实用户报告虚拟模式下的交互卡顿，否则不动。

**候选（按需，有真实用户痛点时才做）**

- **`TableBody.tsx` 的合并单元格 O(n×m) 预计算**：无条件执行，即使未配置 rowSpan/colSpan。应加守卫：`if (!hasSpanConfig) return rows`，或改为 computed 懒求值。
- **排序后的下游重算**：10 万行排序 63ms，el-table-v2 41ms（它的数字已包含应用侧 `slice().sort()`）。差距可能来自排序后的 `processedData` 引用变化触发下游 computed 链，但收益空间有限且改动需触碰数据管道链路。
- **宽表下的排序**：1 万 × 200 列开 `virtualColumn` 后排序 75ms，vxe-table 21ms。这是当前对 vxe 差距最大的一项，尚未定位。

**虚拟化算法对照（供架构评审参考，非待办项）**

| 库                                    | 行高模型                         | scrollTop → 起始索引                                                  | 数据/尺寸变化时                                          | 每次滚动     |
| ------------------------------------- | -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- | ------------ |
| el-table-v2（定高）                   | 定高                             | `floor(scrollTop / rowHeight)`                                        | 无缓存可失效                                             | **O(1)**     |
| el-table-v2（`estimated-row-height`） | 估算 + 实测                      | 缓存 offset + 二分，`resetAfterIndex` 增量失效                        | 从变更索引往后重算                                       | O(log n + v) |
| **TanStack Virtual**                  | `estimateSize` + 可选实测        | `Float64Array` 存 `[start, size, ...]`，`findNearestBinarySearchFlat` | 只记一个 `pendingMin`（最早脏索引），重建 `[min, count)` | O(log n + v) |
| **vtable-guild**                      | 估算 + 全量实测缓存 + 定高快路径 | 定高：O(1) 估算；不定高：`PrefixSums` 增量 + 二分                     | 增量更新 `[index, end)`                                  | O(log n + v) |

vtable-guild 与 TanStack / el-table-v2 属同一算法复杂度。与 el-table-v2 剩余的 13ms vs 6.5ms 挂载差距
来自能力代价（不定行高支持的初始化开销），不是算法瓶颈。
