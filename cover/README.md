# cover/

README 首屏用的动图。都由文档站的真实 demo 页面录制，不是设计稿。

| 文件                      | 来源页面                                                                                            | 内容                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `hero-virtual-scroll.gif` | [`/guide/virtualization`](https://parade0393.github.io/vtable-guild/guide/virtualization)           | 10 万行虚拟滚动，DOM 里始终只有可视区的十几行         |
| `hero-preset-switch.gif`  | [`/guide/presets-and-locales`](https://parade0393.github.io/vtable-guild/guide/presets-and-locales) | 同一套 columns 在 antdv / element-plus 两套预设间切换 |
| `hero-virtual-column.gif` | [`/guide/virtualization`](https://parade0393.github.io/vtable-guild/guide/virtualization)           | 1 万行 × 200 列横向滚动，「渲染列数」始终钉在 11–14   |

## 怎么重新生成

前置：`pnpm build` 之后 `pnpm site:dev`（文档站要能起来，demo 才是真的）。

录制时把 VitePress 的导航、侧边栏、demo 工具条都隐藏掉，只留 `.vtg-demo` 本身，并把它移到视口左上角，这样截出来的每一帧尺寸一致、没有站点外壳。视口用 `980×540`（虚拟滚动）和 `980×400`（预设切换），DPR 取 2。

虚拟滚动那张是**逐帧定位**截的，不要靠 `setTimeout` 动画——截图之间的间隔不可控，等你截到的时候动画早就跑完了，16 帧会全都一样。每帧显式设置一次 `scrollTop` 再截：

```js
document.querySelector('.vtg-virtual-list-holder').scrollTop = px
```

8 帧的位置按缓入取（0 / 141 / 470 / 1034 / 1974 / 3384 / 5640 / 8695 px），合成时：

```bash
ffmpeg -y -framerate 6 -i g%02d.png \
  -vf "crop=1960:1070:0:0,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full[p];[s1][p]paletteuse=dither=none" \
  -loop 0 hero-virtual-scroll.gif
```

预设切换只有两个静止状态，用 concat demuxer 给每张图一个停留时长即可：

```bash
ffmpeg -y -f concat -safe 0 -i preset-list.txt \
  -vf "crop=1960:772:0:0,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full[p];[s1][p]paletteuse=dither=none" \
  -loop 0 hero-preset-switch.gif
```

**不要在 ffmpeg 里缩放**，保持 DPR 2 的原始像素（1960 宽），由 README 的 `width="900"` 交给浏览器缩。踩过的两个坑：

- 缩到 900 这种非整数倍，会把 Chrome 的 LCD 次像素抗锯齿放大成彩边，「杭州」这种竖笔画密的字会明显发蓝。
- 精确缩到 980（2:1）配 `flags=area` 能消掉彩边，但等于把 1x 渲染烤进图里，高分屏上字会发虚发灰。

保留 2x 原图两张合计约 320 KB，仍然远小于 GitHub 的图片体积上限。

## 横向那张（`hero-virtual-column.gif`）为什么不能照抄上面的做法

来源是 `/guide/virtualization` 里的 wide-columns demo（1 万行 × 200 列，自带「渲染列数 N / 200」实时读数，
那个读数就是这张图要讲的东西，务必框进画面）。但**逐帧定位那一套在横向上不成立**：

纵向能逐帧截，是因为它就是给原生滚动容器赋 `scrollTop`。横向不是——虚拟模式下横向偏移是组件状态
`offsetX`，只有真实滚动路径（`VirtualList` 的 `onVirtualScroll` → `VirtualTableBody.emitVirtualScroll`）
会更新它。试过三条路，都不行：

- `VirtualList` 内部 `scrollTo({ left })`：表体动了，**表头不跟**，截出来是错位帧
- 直接写表头容器的 `scrollLeft`：会被组件立刻重置回状态值
- 合成 `WheelEvent`（`deltaX` 或 `shiftKey + deltaY`）：不触发滚动

注意这**不是 bug**：真实滚动下表头表体严格对齐（实测表头 `C81` 与对应表体单元格都在 x=341），
而且那个 `scrollTo({ left })` 并没有暴露在 `VTable` 上，用户碰不到。

所以这张只能用**真实输入**录：人工横向滑（触控板左右滑，或表格上按住 Shift 滚滚轮）+ 屏录，
再用 ffmpeg 转 GIF。屏录的帧间隔本来就均匀，反而比逐帧截图自然。

**横向滚动几乎每帧整屏都在变，帧间压缩基本失效**——同样画幅下它比纵向那张大一个数量级，
所以必须控帧数。实际产出这张图的命令（原始屏录 15.5s / 258 帧 / 3.37 MB → 8.6s / 86 帧 / 1.38 MB）：

```bash
ffmpeg -y -i screen-capture.gif \
  -vf "setpts=PTS/2,fps=10,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle" \
  -loop 0 hero-virtual-column.gif
```

三个关键参数：`setpts=PTS/2` 加速保住完整的 C1 → C200 扫程（不要靠裁剪时长，那会丢掉一半列）；
`stats_mode=diff` + `diff_mode=rectangle` 针对"只有局部在变"的场景选调色板、只重画变化矩形；
`dither=none` 避免噪点，否则每帧噪点都不同，压缩率会再掉一截。

这张是 1x（980×504），不是上面两张的 2x。要更锐可以按 DPR 2 重录，但体积会再翻几倍，
当前 1.38 MB 已经是这三张里最大的一张了。

## 引用方式

README 里必须用 `raw.githubusercontent.com` 的绝对地址。`package.json` 的 `files` 只发 `dist` 和 `css`，`cover/` 不在 npm 包里，相对路径在 npm 页面上会裂图。
