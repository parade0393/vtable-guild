# site/demos

文档站里所有可交互示例的**唯一事实源**。VitePress 页面和独立 Playground 都读这里的文件。

## 约定

1. **一个文件 = 一个自包含 SFC**，可以整段复制到 Playground 直接跑。
2. **只允许从 `vue` 和 `@vtable-guild/vtable-guild` 导入。** Playground 的 import map 只映射这两个，多引一个包就跑不起来。
3. **不要用 Tailwind utility class。** 文档站走 prebuilt 模式，`css/style.css` 里只有从库自身源码里扫出来的 `vtg-*` class；demo 模板写 `class="mt-4"` 不会有任何效果。需要排版就用内联 `style`。
4. **不要写 `app.use(createVTableGuild())`。** 文档站在 theme 里装好了，Playground 通过 `previewOptions.customCode` 注入。
5. **大数据量必须运行时生成**，不要把数据字面量写进模块（见 `virtualization/large.vue`）。

## 挂到文档页

```md
<Demo src="sorting/basic">

<<< @/demos/sorting/basic.vue

</Demo>
```

组件标签和内容之间的**空行是必须的**——没有空行 markdown-it 会把中间内容当成 HTML block 整块吞掉，代码高亮不会生效。

`src` 是相对本目录的路径、不带扩展名。写错时 `Demo.vue` 会在 dev 控制台告警并渲染一个红色提示块，不会静默变空白。

## 本地预览 Playground 链接

`Demo.vue` 的「在 Playground 中编辑」默认指向站点 base 下的 `/play/`。本地把两个站分开跑时：

```bash
VITE_PLAYGROUND_URL=http://127.0.0.1:5174/ pnpm site:dev
```
