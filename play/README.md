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

## 编辑器类型服务

Playground 固定使用 TypeScript `5.9.3`，编译器与 `lib.*.d.ts` 使用同一版本。
当前 `@vue/repl` 浏览器 worker 不支持 TypeScript 7 及以上的原生编译器布局，不能使用
`typescript@latest`。旧分享链接里的 `_tsVersion` 也会在挂载编辑器前恢复为固定版本。
升级此版本时需同时检查严格模式诊断、回调泛型推导和 `align` 字面量补全。

运行时 import map 与编辑器声明解析是独立的：`dependencyVersion` 将组件库及 Vue 各子包的
声明绑定到页面选择的有效版本；切换 CDN 会请求重载语言服务。编译器 JS 与声明文件跟随 CDN，
公共包的目录元数据仍使用 unpkg 的 `?meta` 格式。本地源的组件目录元数据和声明都由
`localPackagePlugin` 提供，不会混入线上版本的组件声明。

如果首次 worker 初始化就因网络失败而挂起，当前 REPL 会合并掉切源时的重载请求；
此时切换到可用 CDN 后需刷新页面。公共目录元数据仍需能够访问 unpkg。

真实项目的 TypeScript 与 Vue 类型检查工具要求见站点的「快速开始 → 安装」。

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

### 默认是「最新」

两个版本下拉的默认值都是 `latest` 哨兵（见 `src/constants.ts` 的 `LATEST`），不是某个写死的
版本号。真正的版本号要等 npm 版本列表回来才能定，所以：

- 选择持久化存的是 `latest` / 具体版本号，不是解析后的版本号；老数据里的 `null` 按 `latest` 读
- 版本列表落地前**不挂载 `<Repl>`**，只显示 Loading。否则预览 iframe 会先把兜底版本的产物拉一遍、
  等列表回来再换一次，表现出来就是「打开时选中的是旧版本，然后跳成新版」
- 列表请求最多等 3 秒（`useVtgRepl.ts` 的 `VERSION_LOAD_TIMEOUT`），到点先用兜底版本把编辑器开起来，
  列表真回来后再切，避免一次慢请求把整个 Playground 挂住
- 「最新」这一项只写哨兵、不解析具体版本号（参考 Element Plus Playground）：列表没回来时也成立，
  具体指向哪一版看下拉里的第一条

Vue 那一侧额外一点：跟随最新时不给 `@vue/repl` 具体版本号，它会直接用打包进来的 `compiler-sfc`，
不会为了一个版本号再去 CDN 拉一份；只有用户主动钉了具体版本，才按那个版本去拉编译器。
运行时版本始终跟着最新走（见 `builtinImportMap` 里的 `effectiveVueVersion`）。

## 两种链接

| 场景                                 | 形式              | 归属                                          |
| ------------------------------------ | ----------------- | --------------------------------------------- |
| 文档 demo 的「在 Playground 中编辑」 | `?demo=<demo ID>` | Playground 构建时从 `site/demos` 打包对应源码 |
| Playground 内的「分享链接」          | `#<repl 序列化>`  | `@vue/repl` 的 `store.serialize()`            |

两者互不冲突：`?demo=` 只负责载入初始源码，读到后会立刻从地址栏抹掉；用户后续修改的完整状态仍由 repl 序列化进 hash，可以照常分享。
