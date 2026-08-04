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

| 面             | 位置                                                | 用途                                                                                                                 |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **内部演练台** | `playground` 的 `#/perf`（dev-only，无 build 脚本） | 只测 vtable-guild 自己，动作按钮齐全（选中首行、强制重新挂载等），用于开发期快速对照前后                             |
| **公开对照页** | 独立应用 `perf/` → `/vtable-guild/perf/`            | 三方对照（vtable-guild / antdv Table / el-table-v2）× 1k/1w/10w，production 构建，自带环境披露与结果导出，供外部复现 |

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

**公开对照页（三方对照，可复现）**

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
> 采集环境：本机开发环境（Windows 11，Node 22，Vitest 4.1.2）。采集日期：2026-06-27。

### L1 基线（hz = 每秒次数，越高越快；mean = 单次平均耗时）

| 基准                                                         | 1k                   | 10k                 |
| ------------------------------------------------------------ | -------------------- | ------------------- |
| `sortData` 单列排序                                          | 1,422 hz · 0.70 ms   | 125 hz · 7.98 ms    |
| `filterData` 单列筛选                                        | 93,963 hz · 0.011 ms | 8,733 hz · 0.114 ms |
| `getSelectionState` 全行（checkStrictly:false 逐行子树遍历） | 5,910 hz · 0.169 ms  | 475 hz · 2.10 ms    |
| `flattenData` 树展平（全展开）                               | 18,245 hz · 0.055 ms | 1,786 hz · 0.56 ms  |

观察：四项均约 10–12× 从 1k 到 10k（近似线性，排序略超线性符合 n log n）。`sortData` 是数据管道里最重的一环（10k 约 8 ms）；`getSelectionState` 的逐行子树遍历在 10k 下约 2 ms，是下一阶段记忆化的候选。

#### round-2 复测（2026-07-04，后代集合记忆化落地后）

| 基准                      | 1k                   | 10k                | vs 基线            |
| ------------------------- | -------------------- | ------------------ | ------------------ |
| `getSelectionState` 全行  | 10,943 hz · 0.091 ms | 801 hz · 1.25 ms   | **1.85× / 1.69×**  |
| `flattenData` 树展平      | 16,930 hz            | 1,935 hz · 0.52 ms | 噪声内（−7%/+8%）  |
| `filterData` 单列         | 97,535 hz            | 9,980 hz           | 噪声内（+4%/+14%） |
| `sortData` 单列（未改动） | 1,282 hz             | 111 hz · 9.02 ms   | 噪声内（−10%）     |

说明：bench 铁律 3 要求每次迭代前失效缓存，因此 `getSelectionState` 的数字**包含 descendantsMap 的整表重建**——即便如此仍有 1.7×+；真实交互中树拓扑不变时后代查表为 O(1)，逐次选择切换的收益远大于此。`sortData` 本轮未改动，波动为跨日机器噪声（符合本节开头的相对基线声明）。

### L3 基线（Chrome DevTools trace，10k 行 · 虚拟开 · CPU 1x · 无网络节流）

| 场景                                 | INP     | 拆解 input / processing / presentation | CLS  | 备注                                                                                                |
| ------------------------------------ | ------- | -------------------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| 排序 Score（切换受控 sortOrder）     | 196 ms  | 1 / 176 / 19 ms                        | 0.00 | processing 占绝大部分；纯 `sortData` 仅 ~8 ms，其余是 vdom diff + 行重渲染 → P0 `v-memo` 的主要目标 |
| 滚动到底（跳转到末尾窗口）           | 97 ms   | —                                      | 0.00 | 虚拟滚动把大跳转重渲染控制在「良好」(<200 ms) 区间内                                                |
| 首次渲染 10k（页面指示值，非 trace） | 64.8 ms | —                                      | —    | 动作 → 等一帧的粗略值，仅供即时参考                                                                 |
| 全选 10k                             | _待测_  | —                                      | —    | 可按上方步骤补采，用于验证 `getSelectionState` 全行成本                                             |

观察：交互延迟主要落在 **processing（JS 执行 + 渲染）** 阶段，而非数据计算本身——这把下一阶段优化重心明确指向**减少行/格重渲染**（`v-memo`、记忆化 cell 计算），而不是数据管道。

> 表中「全选 10k」一行未补采：公开对照页的场景集刻意不含筛选与行选择（三家 API 差异过大，
> el-table-v2 两者都没有内置，硬测只是凑数）。这一项若要补，用内部演练台单独跑。

### L3 三方对照基线（2026-08-03）

采集环境：Chrome 151 · Windows 11 · 8 逻辑核 · 16 GB · DPR 1 · **production 构建** · 窗口前台可见（未被节流）。
版本：vtable-guild `2.4.1` · ant-design-vue `4.2.6` · element-plus `2.13.3` · vue `3.5.26`。
方法：warmup 1 轮丢弃 + 正式 5 轮取中位数。单元格格式 `同步 render+patch / longtask 总时长`（ms）。

公平性契约：同一个数组引用、6 列全部定宽（合计 860px）、表体高 460px、行高 47px、
三家排序用**同一个比较函数**（`sorter: true` 在 antdv 里表示交给服务端排、本地不做事，
写 `true` 会让它因为没干活而白赢）。完整说明见对照页。

| 数据量    | 库             | 首次渲染    | 排序切换    | DOM 节点数 | 可视行数 | 内存增量   |
| --------- | -------------- | ----------- | ----------- | ---------- | -------- | ---------- |
| **1k**    | vtable-guild   | 12 / 0      | 8.4 / 0     | 251        | 12       | 2.5 MB     |
|           | el-table-v2    | **5.6 / 0** | **4.4 / 0** | **185**    | 12       | **0.8 MB** |
|           | ant-design-vue | 1126 / 1187 | 876 / 971   | 7,058      | 1,000    | 67.3 MB    |
| **1 万**  | vtable-guild   | 22 / 0      | 15 / 0      | 251        | 12       | 4.4 MB     |
|           | el-table-v2    | **5.4 / 0** | **6.7 / 0** | **185**    | 12       | **0.8 MB** |
|           | ant-design-vue | _未完成_    | _未完成_    | —          | —        | —          |
| **10 万** | vtable-guild   | 131 / 130   | 133 / 133   | 251        | 12       | 6.6 MB     |
|           | el-table-v2    | **5.0 / 0** | **48 / 0**  | **185**    | 12       | **0.8 MB** |
|           | ant-design-vue | _护栏未跑_  | —           | —          | —        | —          |

滚动场景（「滚动到底」「连续滚动」）三家 longtask 均为 0，无区分度，故未列入本表；
唯一例外是 antdv 1k 的「滚动到底」有 81 ms longtask。

#### 结论（含对我们不利的部分）

1. **antdv 无虚拟滚动的代价是数量级的，且在 1k 就已经显现**：1k 行首次渲染 1126 ms、
   DOM 7,058 个节点、内存 +67.3 MB；**1 万行单轮首次渲染 112,657 ms（约 113 秒）**，
   超过 60s 阈值，判定为该数据量下不可用（已单独复测确认：10k 确实会把全部 10,000 行、
   70,058 个 DOM 节点渲染出来）。10 万行走二次确认护栏，未跑。

   必须说清楚：对照的是**不分页直出**场景。antdv 的常规解法是分页，或改用 el-table-v2——
   否则就是稻草人。

2. **虚拟滚动确实生效**：vtable-guild 与 el-table-v2 在 1k → 10 万之间，DOM 节点数
   恒定为 251 / 185，可视行数恒定 12 行。这是整套指标里唯一零噪声、无辩驳空间的数字。

3. **el-table-v2 在挂载上明显快于 vtable-guild，且几乎与数据量无关**（5.0–5.6 ms 跨三个数量级），
   而 vtable-guild 是 12 → 22 → 131 ms，随行数增长。这说明 vtable-guild 挂载时存在
   **O(n) 预处理**——这是一个真实的、可优化的差距，应进下一轮优化清单。

4. **排序**：10 万行下 vtable-guild 133 ms、el-table-v2 48 ms，同样是我们更慢。
   注意 el-table-v2 的数字已包含应用侧 `slice().sort()`（它不内置排序），
   所以这不是口径便宜带来的差异。

5. **差异来源**：el-table-v2 是纯 div + 定高虚拟化，不支持不定行高、多级表头、单元格合并、
   内置排序与筛选面板，也没有语义化 `<table>`。vtable-guild 的额外成本换的是这些能力。
   把耗时和能力边界分开讲，任何一边都不完整。

## P0 优化进展

度量方式：`/perf` 页用 `evaluate_script` 测「切换单行选中」的**同步 render+patch** 耗时（mutate → microtask flush，排除 paint/rAF 干扰），dev 构建，取多次中位数。单行选中是「只有一行状态变、其余行应被跳过」的理想用例。

### 已落地（round-2，2026-07-03）

**响应式粒度**（`useScroll.ts` / `Table.tsx` / `context.ts`）

- `scrollState` 从单对象 computed 拆为独立 `atStart`/`atEnd` 布尔 computed。原实现每帧横向滚动都产出新对象（Object.is 判定恒为"变"），导致全表固定列单元格的 `fixedClass` 逐帧重算；布尔值只在真正跨越边界时触发下游。
- `subThemeSlots` 从 78 字段 eager computed 改为稳定引用对象 + 懒 slot 函数（复用 `useTheme` 的既有模式）。variant（size/bordered 等）变化不再使全表单元格样式 computed 级联失效，只有实际读取对应 slot 的组件重算。

**算法热点**（`useSelection.ts` / `useTreeData.ts`）

- 树扁平化 `walk` 传递父节点引用直接追加 `childrenKeys`，消除每个父节点 O(n) 的 `findIndex` 回查（树重建从 O(n²) 降为 O(n)）。
- 新增 `selectableDescendantsMap`（自底向上单遍构建），`getSelectionState` 的逐行子树 DFS 改为查表——整表半选计算从 O(n²) 降为拓扑变化时 O(n)、读取 O(1)。
- 新增 `rowMetaMap`（record → FlattenRow），`TableCell.treeRow` / `VirtualTableBody` / `getRowIndent` 三处每行 O(n) 的 `treeFlattenData.find()` 全部改为 O(1) 查表。树形+虚拟场景下原来是每次滚动 range 更新 20 可见行 × O(n) 比较。

**P0-3 · 消除虚拟路径的 indexOf 扫描**（`VirtualTableBody.tsx`，上一轮）

- 渲染槽用 VirtualList 提供的绝对下标替代 `dataSource.indexOf(item)`（每可见行 O(总行) → O(1)）。
- `itemKey` 在提供 `rowKey` 时直接取记录 key，不再 `indexOf`——VirtualList 的 range 计算会对每个 item 调 `getKey`，原实现是 **O(n²)**。
- 正确性/扩展性修复，零风险（type-check + 61 测试通过，虚拟渲染视觉无回归）。单次 sort/scroll 的 INP 在噪声内（172 vs 176 ms），收益主要体现在**持续滚动**（range 计算每帧跑、且高度已测量时才走该循环）。

### 已评估，明确不做（round-2）

- **useHeights ResizeObserver 节流**：现有 `promiseIdRef` 微任务护栏已把同帧多次 resize 回调合并为一次 `doCollect`；改 rAF 会给滚动关键路径的行高测量增加一帧延迟，得不偿失。
- **sortData 脏检查**：它在 computed 链内，Vue 已提供记忆化；依赖变化时重排是语义要求。
- **useSorter 列 watch 的 `deep: true`**：浅 watch 会丢"原地修改列数组"场景的 `defaultSortOrder` 初始化，语义风险大于收益。

### 已调研，暂不落地（P0-1）

把 selected/hovered 从 cell 解耦的目标成立，但**比预期复杂**，需要多处协同改造，不宜在本轮快速提交：

| 场景 · 切换单行选中 | 原始    | 仅 props 解耦 | 仅值稳定 computed |
| ------------------- | ------- | ------------- | ----------------- |
| 非虚拟 1000 行      | 1423 ms | **821 ms**    | 1420 ms（无效）   |
| 虚拟 10k 行         | 23.5 ms | 24 ms         | 28.8 ms           |

实测结论与根因：

1. **cell 只要订阅 `selectedKeySet`，选择变化就会重渲染**——即便把派生值改成「值稳定」的布尔 computed 也没用（1420 ms，几乎无改善）。唯有让 cell **完全不订阅**（改为父级行级算好后传 props）才跳过，非虚拟 1423 → 821 ms。
2. 选择列 cell 还读了**受控 `rowSelection` 配置对象**，它在受控选择下每次变更都会被重建 → 选择列整列重渲染。
3. props 解耦后仍剩 821 ms，来自父组件**重建全部行 vnode**；要消除需在行级加 `withMemo` 或把行抽成子组件靠 props bailout 跳过未变行（依赖项多、易遗漏 → 回归风险高）。

因此 P0-1 的完整方案 = **props 解耦 + 行级 memo/子组件 bailout + 稳定 rowSelection 配置**，应作为独立、可评审的改动推进，并补 hover/选择的 INP trace 量化。

> 注：虚拟模式（推荐用法）下单行选中仅 ~24 ms（dev，prod 约 1/3–1/5），已受 viewport 约束；上面的大数字集中在**非虚拟大表**（不推荐用法）与 dev 构建放大。真正影响推荐路径的是排序时**新可见行的整表 `<table>` 挂载成本** → 见 P0-2。

## 性能预算（L4，待定）

待 L1/L2 基线稳定 2–3 个版本后，为关键指标设阈值（例如「`sortData` 10k < 12 ms」「滚动 INP < 200 ms」），并在 CI 中断言、超标拦截。当前阶段**不入 CI**（timing 在不同 runner 上噪声大）。

## PR 检查项

改动**渲染路径**（`components/*.tsx`）或**数据管道**（`composables/useSorter|useFilter|useSelection|useTreeData`）时：

- [ ] 跑 `pnpm bench`，对比改动前后 L1 数字，附在 PR 描述里。
- [ ] 若涉及大数据渲染/滚动，用 `/perf` + DevTools 抓一次 trace 对比。
- [ ] 无明显回归（或回归有合理解释与收益权衡）。

## 下一阶段优化点

已定位的热点（用本套基准/演练台量化前后）：

**P0**

- 虚拟列表每可见行渲染整张 `<table>` + `<colgroup>` — `VirtualTableBody.tsx`。round-2 已做立即项（`scrollWidth` 提为 computed、树行查找 O(1) 化）；结构性改造（vendored VirtualList 的 Filler 支持自定义容器标签，行渲染 `<tr>` 共享单表）需配合视觉回归验证，作为独立 spike 推进，失败则回退并在此记录结论。
- 行 / 单元格无 `v-memo`，局部状态变更（选择 / hover）触发全表 cell 的 computed 重算（见上方 P0-1 调研）。

**P1**

- 合并单元格 O(n×m) 预计算无条件执行，即使未配置 rowSpan/colSpan — `TableBody.tsx`。

**新增（来自 2026-08-03 三方对照）**

- **挂载期的 O(n) 预处理** — 虚拟模式下首次渲染仍随总行数增长（1k 12 ms → 10 万 131 ms），
  而同为虚拟化的 el-table-v2 恒定在约 5 ms。可视行数恒定 12 行，说明成本不在渲染，
  而在挂载时对**全量数据**做的一次性工作（候选：`rowMetaMap` / `selectableDescendantsMap`
  之类的整表预建，以及数据管道 computed 的首次求值）。
  下一步：用 `/perf` 页 + DevTools trace 定位这 131 ms 的具体归属，再决定是否值得改为惰性/分片构建。
- **10 万行排序 133 ms vs el-table-v2 48 ms** — 后者含应用侧 `slice().sort()`，
  说明差距不在排序算法本身，而在排序后的下游重算。与上面的 P0「行/单元格无 `v-memo`」同源。
