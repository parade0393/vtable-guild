# @vtable-guild/play

独立的在线 Playground（`@vue/repl` + Monaco），部署在文档站 base 下的 `/play/`。

```bash
pnpm play:dev      # 开发
pnpm play:build    # 构建到 play/dist
```

## 运行时是怎么装配的

预览 iframe 里不跑打包器，全部靠 import map + CDN：

- `@vtable-guild/vtable-guild` → `<cdn>/@vtable-guild/vtable-guild@<版本>/dist/index.full.mjs`
  （浏览器单文件产物，只 external `vue`，`tailwind-variants` 已内联）
- 样式 → `previewOptions.headHTML` 里 `<link>` 引 `css/style.css`（prebuilt 模式，浏览器侧不需要 Tailwind）
- 插件安装 → `previewOptions.customCode` 注入 `app.use(createVTableGuild({ themePreset }))`，
  所以示例代码里直接写 `<VTable>` 就行

`vue` / `@vue/server-renderer` / `@vue/compiler-sfc` / `es-module-shims` 的地址也跟着「CDN 源」下拉走，
否则切到 npmmirror 仍然会卡在 jsDelivr，对国内用户等于没切。

## 发版之前怎么验证

CDN 上只有已发布的版本。要验证还没发布的改动：

```bash
pnpm --filter @vtable-guild/vtable-guild build   # 产出 dist/index.full.mjs + css/
pnpm play:dev                                     # 在「CDN」下拉里选「本地构建产物」
```

`local` 这个源只在 dev 出现（见 `src/utils/cdn.ts`），由 `vite.config.ts` 里的
`localPackagePlugin` 把 `packages/vtable-guild/` 挂到 `/local-pkg/` 提供。

## 版本下拉的边界

只列出 `>= MIN_SUPPORTED_VTG_VERSION`（见 `src/constants.ts`）的版本——更早的版本没有
`dist/index.full.mjs`，选了必然白屏。顶栏会把这个限制写出来，不假装能选全部历史版本。

## 两种链接

| 场景                                 | 形式              | 归属                                          |
| ------------------------------------ | ----------------- | --------------------------------------------- |
| 文档 demo 的「在 Playground 中编辑」 | `?demo=<demo ID>` | Playground 构建时从 `site/demos` 打包对应源码 |
| Playground 内的「分享链接」          | `#<repl 序列化>`  | `@vue/repl` 的 `store.serialize()`            |

两者互不冲突：`?demo=` 只负责载入初始源码，读到后会立刻从地址栏抹掉；用户后续修改的完整状态仍由 repl 序列化进 hash，可以照常分享。
