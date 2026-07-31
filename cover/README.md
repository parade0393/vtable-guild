# cover/

README 首屏用的动图。两张都由文档站的真实 demo 页面录制，不是设计稿。

| 文件                      | 来源页面                                                                                            | 内容                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `hero-virtual-scroll.gif` | [`/guide/virtualization`](https://parade0393.github.io/vtable-guild/guide/virtualization)           | 10 万行虚拟滚动，DOM 里始终只有可视区的十几行         |
| `hero-preset-switch.gif`  | [`/guide/presets-and-locales`](https://parade0393.github.io/vtable-guild/guide/presets-and-locales) | 同一套 columns 在 antdv / element-plus 两套预设间切换 |

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

## 引用方式

README 里必须用 `raw.githubusercontent.com` 的绝对地址。`package.json` 的 `files` 只发 `dist` 和 `css`，`cover/` 不在 npm 包里，相对路径在 npm 页面上会裂图。
