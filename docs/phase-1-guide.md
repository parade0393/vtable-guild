# 阶段一：Monorepo 基建 — 保姆级操作指南

> 本文档是 [roadmap.md](./roadmap.md) 阶段一的逐步细化，每一步给出具体的文件内容和命令。
> 按顺序执行，不要跳步。

---

## Step 1：修正根目录依赖

### 1.1 为什么先做这一步

当前根 `package.json` 混合了两类依赖：
- **monorepo 根应有的**：构建工具、lint 工具、husky 等 devDependencies
- **不应在根的**：`tailwind-variants`（应在 core 包的 dependencies）、`pinia`/`vue-router`（应在 playground）

先清理干净，避免后续子包依赖关系混乱。

### 1.2 操作

**根 `package.json` 的 dependencies 部分改为空**（pinia, vue-router, @vueuse/core, vue 后续按需放入子包或 playground）：

```jsonc
// 移除根 dependencies 中的：
// - "pinia"          → 后续放入 playground
// - "vue-router"     → 后续放入 playground
// - "@vueuse/core"   → 后续按需放入具体子包
// - "vue"            → 后续作为子包的 peerDependency

// 移除根 devDependencies 中的：
// - "tailwind-variants" → 放入 packages/core 的 dependencies
```

**执行命令**：

```bash
# 从根移除（后续会在正确位置重新安装）
pnpm remove vue vue-router pinia @vueuse/core tailwind-variants -w
```

> 注意：暂时不要 `pnpm install`，等 Step 2 和 Step 3 完成后一起装。

---

## Step 2：创建 `tsconfig.base.json`（前置条件）

### 2.1 为什么先做这一步

所有子包的 `tsconfig.json` 都需要 `extends` 这个文件。如果不先创建它，后续创建子包时 TypeScript 会报错。

### 2.2 创建 `tsconfig.base.json`

在项目根目录创建，提取所有子包共享的编译选项：

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"]
  },
  "exclude": ["node_modules", "dist"]
}
```

### 2.3 改造根 `tsconfig.json`

改为纯 references 文件，不再直接编译代码：

```jsonc
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/theme" },
    { "path": "./packages/table" },
    { "path": "./packages/pagination" },
    { "path": "./packages/vtable-guild" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

> `tsconfig.app.json` 暂时保留，后续改造 playground 时再调整。

---

## Step 3：安装并配置 Turborepo

### 3.1 为什么在创建子包之前做

Turborepo 的 `turbo.json` 定义了构建 pipeline。先配好它，后续每创建一个子包，turbo 就能自动按拓扑顺序构建。

### 3.2 安装

```bash
pnpm add -Dw turbo
```

### 3.3 创建 `turbo.json`

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

**关键说明**：
- `"dependsOn": ["^build"]` — `^` 表示先构建上游依赖包。例如 build table 之前，先 build core 和 theme
- `"outputs": ["dist/**"]` — turbo 缓存 dist 目录，未变更时跳过构建
- `"persistent": true` — dev 任务是长驻进程（watch 模式），不会被 turbo 杀掉

### 3.4 修改根 `package.json` scripts

```jsonc
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "format": "prettier --write --experimental-cli \"packages/*/src/**/*.{ts,tsx,vue}\"",
    "prepare": "husky",
    "preinstall": "npx only-allow pnpm",
    "commit": "git-cz",
    "commitlint": "commitlint --edit"
  }
}
```

### 3.5 更新 `.gitignore`

追加一行：

```
.turbo
```

---

## Step 4：创建 `packages/core`

### 4.1 创建目录结构

```bash
mkdir -p packages/core/src/composables
mkdir -p packages/core/src/utils
mkdir -p packages/core/src/plugin
```

### 4.2 `packages/core/package.json`

```jsonc
{
  "name": "@vtable-guild/core",
  "version": "0.0.1",
  "description": "Core utilities and theme system for vtable-guild",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "type-check": "vue-tsc --build"
  },
  "dependencies": {
    "tailwind-variants": "^3.2.2"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "license": "MIT"
}
```

**关键说明**：

- `"type": "module"` — 与根保持一致，ESM 优先
- `"files": ["dist"]` — npm publish 时只包含 dist 目录
- `"exports"` — Node.js 条件导出，`types` 必须放在 `import` 前面
- `tailwind-variants` 在 `dependencies`（运行时需要），`vue` 在 `peerDependencies`（由宿主项目提供）

### 4.3 `packages/core/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"]
}
```

**关键说明**：
- `"composite": true` — 启用项目引用（project references），turbo + tsc --build 需要
- `"extends": "../../tsconfig.base.json"` — 继承公共配置

### 4.4 `packages/core/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['vue', 'tailwind-variants'],
    },
  },
})
```

**关键说明**：
- `formats: ['es']` — 只输出 ESM（现代项目不需要 CJS）
- `external` — vue 和 tailwind-variants 不打包进产物，由使用方提供
- 后续需要 `.d.ts` 生成时，可加 `vite-plugin-dts`

### 4.5 `packages/core/src/index.ts`

```typescript
// @vtable-guild/core
// 占位导出，后续阶段二实现具体功能
export {}
```

---

## Step 5：创建 `packages/theme`

### 5.1 创建目录

```bash
mkdir -p packages/theme/src
```

### 5.2 `packages/theme/package.json`

```jsonc
{
  "name": "@vtable-guild/theme",
  "version": "0.0.1",
  "description": "Default theme definitions for vtable-guild",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "type-check": "vue-tsc --build"
  },
  "peerDependencies": {
    "@vtable-guild/core": "workspace:*"
  },
  "license": "MIT"
}
```

### 5.3 `packages/theme/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../core" }
  ]
}
```

### 5.4 `packages/theme/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['@vtable-guild/core', 'tailwind-variants'],
    },
  },
})
```

### 5.5 `packages/theme/src/index.ts`

```typescript
// @vtable-guild/theme
export {}
```

---

## Step 6：创建 `packages/table`

### 6.1 创建目录

```bash
mkdir -p packages/table/src/components
mkdir -p packages/table/src/composables
mkdir -p packages/table/src/types
```

### 6.2 `packages/table/package.json`

```jsonc
{
  "name": "@vtable-guild/table",
  "version": "0.0.1",
  "description": "Table component for vtable-guild",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "type-check": "vue-tsc --build"
  },
  "peerDependencies": {
    "@vtable-guild/core": "workspace:*",
    "@vtable-guild/theme": "workspace:*",
    "@vtable-guild/pagination": "workspace:*",
    "vue": "^3.5.0"
  },
  "license": "MIT"
}
```

### 6.3 `packages/table/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "references": [
    { "path": "../core" },
    { "path": "../theme" },
    { "path": "../pagination" }
  ]
}
```

### 6.4 `packages/table/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: [
        'vue',
        '@vtable-guild/core',
        '@vtable-guild/theme',
        '@vtable-guild/pagination',
        'tailwind-variants',
      ],
    },
  },
})
```

**关键说明**：
- 需要 `vue()` 和 `vueJsx()` 插件来处理 `.vue` 和 `.tsx` 文件
- 这两个插件已在根 devDependencies 中，pnpm workspace 会自动提升

### 6.5 `packages/table/src/index.ts`

```typescript
// @vtable-guild/table
export {}
```

---

## Step 7：创建 `packages/pagination`

### 7.1 创建目录

```bash
mkdir -p packages/pagination/src/components
mkdir -p packages/pagination/src/composables
mkdir -p packages/pagination/src/types
```

### 7.2 `packages/pagination/package.json`

```jsonc
{
  "name": "@vtable-guild/pagination",
  "version": "0.0.1",
  "description": "Pagination component for vtable-guild",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "type-check": "vue-tsc --build"
  },
  "peerDependencies": {
    "@vtable-guild/core": "workspace:*",
    "vue": "^3.5.0"
  },
  "license": "MIT"
}
```

### 7.3 `packages/pagination/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "references": [
    { "path": "../core" }
  ]
}
```

### 7.4 `packages/pagination/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: [
        'vue',
        '@vtable-guild/core',
        'tailwind-variants',
      ],
    },
  },
})
```

### 7.5 `packages/pagination/src/index.ts`

```typescript
// @vtable-guild/pagination
export {}
```

---

## Step 8：创建 `packages/vtable-guild`（聚合入口）

### 8.1 创建目录

```bash
mkdir -p packages/vtable-guild/src
```

### 8.2 `packages/vtable-guild/package.json`

```jsonc
{
  "name": "@vtable-guild/vtable-guild",
  "version": "0.0.1",
  "description": "A highly customizable Vue 3 Table component library powered by tailwind-variants",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "type-check": "vue-tsc --build"
  },
  "dependencies": {
    "@vtable-guild/core": "workspace:*",
    "@vtable-guild/theme": "workspace:*",
    "@vtable-guild/table": "workspace:*",
    "@vtable-guild/pagination": "workspace:*"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "license": "MIT"
}
```

**关键说明**：
- 聚合包用 `dependencies`（不是 peer），这样用户安装一个包就自动拉取所有子包
- `workspace:*` — pnpm workspace 协议，开发时链接本地包，发布时自动替换为真实版本号

### 8.3 `packages/vtable-guild/tsconfig.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../core" },
    { "path": "../theme" },
    { "path": "../table" },
    { "path": "../pagination" }
  ]
}
```

### 8.4 `packages/vtable-guild/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: [
        'vue',
        '@vtable-guild/core',
        '@vtable-guild/theme',
        '@vtable-guild/table',
        '@vtable-guild/pagination',
        'tailwind-variants',
      ],
    },
  },
})
```

### 8.5 `packages/vtable-guild/src/index.ts`

```typescript
// @vtable-guild/vtable-guild — 聚合入口
export * from '@vtable-guild/core'
export * from '@vtable-guild/theme'
export * from '@vtable-guild/table'
export * from '@vtable-guild/pagination'
```

---

## Step 9：安装依赖并验证

### 9.1 安装

```bash
pnpm install
```

预期结果：
- 无报错
- `packages/core/node_modules/tailwind-variants` 存在
- 各子包之间通过 workspace 软链接互相引用

### 9.2 验证构建

```bash
pnpm build
```

预期结果（turbo 输出）：
```
 Tasks:    5 successful, 5 total
 Cached:   0 cached, 5 total
```

构建顺序应为：`core` → `theme` + `pagination`（并行）→ `table` → `vtable-guild`

### 9.3 验证产物

检查每个子包的 `dist/` 目录：

```bash
ls packages/core/dist/        # 应有 index.mjs
ls packages/theme/dist/        # 应有 index.mjs
ls packages/table/dist/        # 应有 index.mjs
ls packages/pagination/dist/   # 应有 index.mjs
ls packages/vtable-guild/dist/ # 应有 index.mjs
```

### 9.4 验证 TypeScript

```bash
# 在任意子包中测试 import 是否有类型提示
# 例如在 packages/table/src/index.ts 中临时写：
# import {} from '@vtable-guild/core'
# 编辑器应无红色波浪线
```

---

## 最终文件清单

完成阶段一后，新增/修改的文件：

```
vtable-guild/
├── tsconfig.base.json                    [新增]
├── tsconfig.json                         [修改] → 纯 references
├── turbo.json                            [新增]
├── package.json                          [修改] → scripts 改为 turbo，清理依赖
├── .gitignore                            [修改] → 添加 .turbo
│
├── packages/
│   ├── core/
│   │   ├── package.json                  [新增]
│   │   ├── tsconfig.json                 [新增]
│   │   ├── vite.config.ts                [新增]
│   │   └── src/index.ts                  [新增]
│   │
│   ├── theme/
│   │   ├── package.json                  [新增]
│   │   ├── tsconfig.json                 [新增]
│   │   ├── vite.config.ts                [新增]
│   │   └── src/index.ts                  [新增]
│   │
│   ├── table/
│   │   ├── package.json                  [新增]
│   │   ├── tsconfig.json                 [新增]
│   │   ├── vite.config.ts                [新增]
│   │   └── src/index.ts                  [新增]
│   │
│   ├── pagination/
│   │   ├── package.json                  [新增]
│   │   ├── tsconfig.json                 [新增]
│   │   ├── vite.config.ts                [新增]
│   │   └── src/index.ts                  [新增]
│   │
│   └── vtable-guild/
│       ├── package.json                  [新增]
│       ├── tsconfig.json                 [新增]
│       ├── vite.config.ts                [新增]
│       └── src/index.ts                  [新增]
```

共 **新增 20 个文件**，**修改 4 个文件**。

---

## 常见问题

### Q: 为什么 `exports` 里 `types` 要放在 `import` 前面？

TypeScript 的模块解析会按顺序匹配 `exports` 中的条件。`types` 必须在 `import` 前面，否则 TS 会先匹配到 `.mjs` 文件而找不到类型。

### Q: 为什么用 `workspace:*` 而不是具体版本号？

`workspace:*` 是 pnpm 的 workspace 协议。开发时它创建软链接指向本地包，`pnpm publish` 时自动替换为真实版本号（如 `^0.0.1`）。

### Q: 为什么子包的 vite.config.ts 要 external 掉依赖？

组件库不应把 vue、tailwind-variants 等打包进产物。这些依赖由使用方的项目提供，避免重复打包和版本冲突。

### Q: 为什么 `@vitejs/plugin-vue` 不需要在子包中安装？

pnpm workspace 会将根 devDependencies 提升到根 node_modules。子包的 vite.config.ts 能通过 Node.js 模块解析找到它。如果遇到解析问题，可以在子包中显式安装。

### Q: turbo 的 `^build` 是什么意思？

`^` 前缀表示"先构建上游依赖"。例如 `@vtable-guild/table` 的 build 任务声明了 `dependsOn: ["^build"]`，turbo 会先构建它依赖的 core、theme、pagination，再构建 table。
