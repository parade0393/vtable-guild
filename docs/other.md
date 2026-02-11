# 补充知识点

## 1. `@vtable-guild/xxx` 为什么能被识别？（不是别名）

在 `packages/vtable-guild/src/index.ts` 中：

```ts
export * from '@vtable-guild/core'
export * from '@vtable-guild/theme'
export * from '@vtable-guild/table'
export * from '@vtable-guild/pagination'
```

`@vtable-guild/xxx` **不是路径别名**，而是各子包 `package.json` 中 `name` 字段的真实包名。能被识别依赖两套机制协同工作：

### 1.1 pnpm workspace — 运行时模块解析

`pnpm-workspace.yaml` 声明了 `packages/*`，pnpm 会把 `packages/` 下每个子包的 `name` 注册为工作区包。

`packages/vtable-guild/package.json` 中通过 `workspace:*` 协议声明依赖：

```json
"dependencies": {
    "@vtable-guild/core": "workspace:*",
    "@vtable-guild/theme": "workspace:*",
    "@vtable-guild/table": "workspace:*",
    "@vtable-guild/pagination": "workspace:*"
}
```

执行 `pnpm install` 后，pnpm 会在 `node_modules/@vtable-guild/` 下创建指向各子包目录的**符号链接（symlink）**，Node.js 的模块解析就能通过常规的 `node_modules` 查找找到它们。

### 1.2 TypeScript Project References — 类型解析

`packages/vtable-guild/tsconfig.json` 中配置了 `references`：

```json
"references": [
    { "path": "../core" },
    { "path": "../theme" },
    { "path": "../table" },
    { "path": "../pagination" }
]
```

TypeScript 通过 project references 找到各子包的 `tsconfig.json`，再根据子包的 `composite: true` + `outDir` 配置定位到编译产物（`.d.ts` 类型声明），从而完成类型检查。

### 1.3 总结

pnpm workspace 的符号链接让**模块解析**生效，TypeScript project references 让**类型解析**生效。两者缺一不可。

---

## 2. tsconfig 中 `extends` 与 `references` 的区别

以 `packages/vtable-guild/tsconfig.json` 为例：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../core" },
    { "path": "../theme" },
    { "path": "../table" },
    { "path": "../pagination" }
  ]
}
```

### 2.1 `extends` — 配置继承

解决的问题：**避免每个子包重复写相同的编译选项。**

它是纯粹的配置复用机制，效果等同于把 `tsconfig.base.json` 里的内容"复制粘贴"到当前文件，再用当前文件的字段覆盖。

比如 `tsconfig.base.json` 定义了 `strict: true`、`target: ESNext` 等 20 多项通用配置，每个子包 extends 它之后只需补充自己特有的 `outDir`、`rootDir` 即可。

**一句话：继承编译选项，是配置层面的复用，不影响项目之间的关系。**

### 2.2 `references` — 项目引用

解决的问题：**告诉 TypeScript 当前项目依赖哪些其他 TypeScript 项目。**

它建立了项目之间的**依赖拓扑关系**，带来三个作用：

1. **类型解析** — 当 `vtable-guild` 中写 `import { x } from '@vtable-guild/core'` 时，TypeScript 通过 references 找到 core 的 tsconfig，再定位到 core 编译出的 `.d.ts` 文件来提供类型信息。

2. **增量构建** — 运行 `tsc --build` 时，TypeScript 会按 references 的拓扑顺序依次构建（先 core → 再 theme → 再 table/pagination → 最后 vtable-guild），且只重新编译发生变化的项目。

3. **边界隔离** — 配合 `composite: true`，每个子包只能看到自己 `include` 范围内的源码，不能随意跨包访问未声明引用的项目文件。

**一句话：声明项目间的依赖关系，影响构建顺序、类型查找和边界隔离。**

### 2.3 对比

|            | `extends`                  | `references`                                                |
| ---------- | -------------------------- | ----------------------------------------------------------- |
| 做什么     | 继承编译配置               | 声明项目依赖                                                |
| 方向       | 向上找父配置               | 向外找兄弟项目                                              |
| 类比       | CSS 公共样式文件           | package.json 的 dependencies                                |
| 去掉会怎样 | 每个包要重复写所有编译选项 | TypeScript 找不到其他包的类型，`tsc --build` 不知道构建顺序 |
