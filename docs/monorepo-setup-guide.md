# 从零搭建 pnpm + Turborepo + Vite Library Mode Monorepo — 保姆级教程

> 技术栈：pnpm workspace + TypeScript project references + Turborepo + Vite library mode + ESLint + Prettier + Stylelint + husky + commitlint + lint-staged
> 适用场景：Vue/React 组件库、工具库、任何需要多包管理的 JS/TS 项目
> 前置要求：Node.js >= 20, pnpm >= 9

---

## 目录

1. [初始化项目](#1-初始化项目)
2. [配置 pnpm workspace](#2-配置-pnpm-workspace)
3. [代码规范与 Git 工作流](#3-代码规范与-git-工作流)
4. [TypeScript 基础配置](#4-typescript-基础配置)
5. [安装并配置 Turborepo](#5-安装并配置-turborepo)
6. [创建第一个子包](#6-创建第一个子包)
7. [创建第二个子包（有依赖关系）](#7-创建第二个子包有依赖关系)
8. [创建聚合入口包](#8-创建聚合入口包)
9. [验证构建](#9-验证构建)
10. [常见问题](#10-常见问题)

---

## 1. 初始化项目

```bash
mkdir my-lib && cd my-lib
pnpm init
```

编辑 `package.json`，设置基础字段：

```jsonc
{
  "name": "my-lib",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {}
}
```

**关键说明**：
- `"private": true` — monorepo 根不发布到 npm
- `"type": "module"` — 全局启用 ESM
- `"packageManager"` — 锁定 pnpm 版本，配合 corepack 使用

---
## 2. 配置 pnpm workspace

创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - 'packages/*'
```

这告诉 pnpm：`packages/` 下的每个子目录都是一个独立的包。pnpm 会自动为它们建立软链接，使包之间可以互相引用。

> 如果后续有文档站（如 VitePress）或 playground 应用，可以追加：
> ```yaml
> packages:
>   - 'packages/*'
>   - site
>   - playground
> ```

---

## 3. 代码规范与 Git 工作流

构建能跑通只是第一步。一个成熟的 monorepo 还需要统一的代码规范和 Git 提交流程，确保多人协作时代码质量一致。

本节搭建完整的 lint 体系：

```
代码质量：ESLint（JS/TS 逻辑）+ Stylelint（CSS 样式）+ Prettier（格式化）
Git 守卫：husky（Git hooks）+ lint-staged（只检查暂存文件）
提交规范：commitlint（校验 commit message）+ commitizen（交互式提交）
```

### 3.1 安装所有依赖

一次性安装到 workspace 根：

```bash
pnpm add -Dw \
  eslint \
  prettier \
  stylelint \
  husky \
  lint-staged \
  commitizen \
  cz-conventional-changelog \
  @commitlint/cli \
  @commitlint/config-conventional
```

> 根据你的技术栈，还需要对应的 ESLint/Stylelint 插件。以 Vue + TypeScript 为例：
> ```bash
> pnpm add -Dw \
>   eslint-plugin-vue \
>   @vue/eslint-config-typescript \
>   @vue/eslint-config-prettier \
>   stylelint-config-standard \
>   stylelint-config-recommended-vue \
>   postcss-html
> ```

### 3.2 ESLint — 代码质量检查

ESLint 9 使用 flat config 格式（单文件，无 `.eslintrc`）。

创建 `eslint.config.ts`（需要 ESLint >= 9）：

<!-- PLACEHOLDER_ESLINT_CONT -->

**Vue + TypeScript 示例**：
```typescript
// eslint.config.ts
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  // 忽略构建产物
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  // Vue 基础规则
  ...pluginVue.configs['flat/essential'],

  // TypeScript 推荐规则
  vueTsConfigs.recommended,

  // 自定义规则
  {
    name: 'app/rules',
    rules: {
      // 允许以 _ 开头的未使用变量（常见于解构和回调）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // 关闭所有与 Prettier 冲突的格式化规则
  skipFormatting,
)
```

**React + TypeScript 示例**：

```typescript
// eslint.config.ts
import { globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { files: ['**/*.{ts,tsx}'] },
  globalIgnores(['**/dist/**', '**/coverage/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  { plugins: { 'react-hooks': reactHooksPlugin }, rules: reactHooksPlugin.configs.recommended.rules },
  prettierConfig,
)
```

<!-- PLACEHOLDER_ESLINT_KEY -->

**关键设计决策**：
- **flat config** — ESLint 9 的新格式，一个文件搞定，不再需要 `.eslintrc` + `.eslintignore`
- **skipFormatting / eslint-config-prettier** — 关闭所有与 Prettier 冲突的规则，让 ESLint 只管逻辑，Prettier 只管格式
- **files 范围** — 明确声明 lint 哪些文件类型，避免误检查 `.json`、`.md` 等
### 3.3 Prettier — 代码格式化

Prettier 负责统一代码风格（缩进、引号、分号等），与 ESLint 分工明确：ESLint 管逻辑，Prettier 管格式。

创建 `.prettierrc.json`：

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

常用选项说明：

| 选项 | 值 | 说明 |
|------|-----|------|
| `semi` | `false` | 不加分号 |
| `singleQuote` | `true` | 使用单引号 |
| `printWidth` | `100` | 每行最大 100 字符 |
| `trailingComma` | `"all"` | 尾随逗号（默认值，利于 git diff） |
| `tabWidth` | `2` | 缩进 2 空格（默认值） |

> 团队统一即可，没有绝对的对错。重要的是**所有人用同一份配置**。

### 3.4 Stylelint — CSS 样式检查

Stylelint 检查 CSS/SCSS/Vue `<style>` 中的样式问题。

创建 `stylelint.config.mjs`：

```javascript
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-hex-length': 'long',
    'block-no-empty': true,
    'no-duplicate-selectors': true,
  },
}
```

**Vue 项目额外配置**：

```javascript
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  overrides: [
    {
      files: ['**/*.vue', '**/*.html'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // BEM 命名规范（可选）
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Expected class name to match BEM pattern' },
    ],
    // 允许 Vue 特有的伪类和函数
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['deep', 'global'] }],
    'function-no-unknown': [true, { ignoreFunctions: ['v-bind'] }],
    'color-hex-length': 'long',
    'block-no-empty': true,
    'no-duplicate-selectors': true,
  },
}
```

**为什么 Stylelint 不走 turbo？**

ESLint 可以通过 `turbo run lint` 分发到各子包执行（利用拓扑排序和缓存），但 Stylelint 不需要：
- CSS 没有跨包构建依赖，不需要 turbo 的拓扑排序
- Stylelint 配置只有根目录一份，从根扫描即可覆盖所有子包
- 不需要先 `^build` 上游依赖

因此 `lint:style` 作为**根级命令**直接运行，不经过 turbo。实际触发点有三个：

| 场景 | 命令 | 说明 |
|------|------|------|
| 手动全量检查 | `pnpm lint:style` | 根 scripts，扫描所有样式文件 |
| 提交时增量检查 | lint-staged → `stylelint --fix` | 只检查暂存的样式文件 |
| CI 流水线 | `pnpm lint:style` | 直接调用，不需要 turbo 编排 |

<!-- PLACEHOLDER_HUSKY -->

### 3.5 Husky — Git Hooks 管理

Husky 让你在 `git commit`、`git push` 等操作前自动执行脚本（如 lint 检查）。

**初始化**：

```bash
# 在根 package.json 中添加 prepare 脚本（安装时自动初始化 husky）
# package.json → scripts → "prepare": "husky"

# 手动初始化（首次）
pnpm exec husky init
```

这会创建 `.husky/` 目录。

**创建 pre-commit hook**（提交前执行 lint-staged）：

```bash
echo "pnpm exec lint-staged" > .husky/pre-commit
```

**创建 commit-msg hook**（校验 commit message 格式）：

```bash
echo "pnpm exec commitlint --edit \$1" > .husky/commit-msg
```

> `.husky/` 目录应提交到 Git，这样所有协作者 `pnpm install` 后自动生效。
### 3.6 lint-staged — 只检查暂存文件

lint-staged 只对 `git add` 过的文件执行检查，避免全量 lint 的性能问题。

创建 `.lintstagedrc.json`：

```json
{
  "*.{js,jsx,ts,tsx,vue}": ["eslint --fix --cache"],
  "*.{css,scss,sass,less,vue,html}": ["stylelint --fix"],
  "*.{js,jsx,ts,tsx,vue,css,scss,sass,less,json,md,html}": ["prettier --write"]
}
```

**执行流程**：

```
git commit
  → husky 触发 pre-commit hook
    → lint-staged 找出暂存文件
      → .ts/.vue 文件 → eslint --fix
      → .css/.vue 文件 → stylelint --fix
      → 所有匹配文件 → prettier --write
    → 自动将修复后的文件重新暂存
  → husky 触发 commit-msg hook
    → commitlint 校验 commit message
  → 通过 → 提交成功
```

**关键说明**：
- `--fix` / `--write` — 自动修复可修复的问题，减少手动操作
- `--cache` — ESLint 缓存，加速重复检查
- `.vue` 文件同时匹配 ESLint 和 Stylelint 规则——ESLint 检查 `<script>`，Stylelint 检查 `<style>`

<!-- PLACEHOLDER_COMMITLINT -->

### 3.7 Commitlint — 提交信息规范

Commitlint 校验 commit message 是否符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

创建 `commitlint.config.ts`（或 `.commitlintrc.json`）：

```typescript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'build'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 95],
  },
}
```
**规则说明**：

| 规则 | 含义 |
|------|------|
| `type-enum` | 只允许指定的 type（feat/fix/docs 等） |
| `type-case` | type 必须小写 |
| `type-empty` | type 不能为空 |
| `subject-empty` | subject 不能为空 |
| `subject-full-stop` | subject 末尾不加句号 |
| `header-max-length` | 标题行最长 95 字符 |

**合法的 commit message 示例**：

```
feat: add user authentication module
fix: resolve memory leak in virtual scroll
docs: update API reference for Table component
refactor: extract theme merge logic into composable
```

### 3.8 Commitizen — 交互式提交

Commitizen 提供交互式命令行界面，引导你填写规范的 commit message，避免手写出错。

在根 `package.json` 中添加配置：

```jsonc
{
  "scripts": {
    "commit": "git-cz"
  },
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

使用方式：

```bash
git add .
pnpm commit    # 替代 git commit，启动交互式界面
```

交互流程：

```
? Select the type of change:     feat
? Scope (optional):              table
? Short description:             add sorting support
? Longer description (optional):
? Breaking changes (optional):
? Issues closed (optional):      #12

→ 生成: feat(table): add sorting support

Closes #12
```

> 也可以直接 `git commit -m "feat: ..."` 手写——commitlint 会在 commit-msg hook 中校验格式。commitizen 只是辅助工具，不是强制的。
### 3.9 根 `package.json` scripts 汇总

将 lint 相关脚本整合到根 `package.json`：

```jsonc
{
  "scripts": {
    // 构建（turbo 编排）
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "type-check": "turbo run type-check",

    // 代码规范
    "lint": "eslint . --fix --cache",
    "lint:style": "stylelint \"**/*.{css,scss,sass,less,vue,html}\" --fix",  // 根级命令，不走 turbo
    "format": "prettier --write \"packages/*/src/**/*.{ts,tsx,vue,css,json,md}\"",

    // Git 工作流
    "prepare": "husky",
    "preinstall": "npx only-allow pnpm",
    "commit": "git-cz",
    "commitlint": "commitlint --edit"
  }
}
```

### 3.10 工具协作关系总览

```
┌─────────────────────────────────────────────────────┐
│                    开发阶段                          │
│                                                     │
│  编辑器保存 → Prettier 自动格式化（IDE 插件）         │
│  手动执行  → pnpm lint / pnpm lint:style / pnpm format │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    提交阶段                          │
│                                                     │
│  git commit                                         │
│    ↓ husky pre-commit                               │
│    ↓ lint-staged                                    │
│      → ESLint --fix（暂存的 .ts/.vue）               │
│      → Stylelint --fix（暂存的 .css/.vue）           │
│      → Prettier --write（暂存的所有匹配文件）         │
│    ↓ husky commit-msg                               │
│    ↓ commitlint（校验 commit message 格式）          │
│    ↓ 通过 → 提交成功                                │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    CI 阶段（可选）                    │
│                                                     │
│  turbo run lint → 全量 ESLint 检查                   │
│  pnpm lint:style → 全量 Stylelint 检查（根级命令）    │
│  turbo run type-check → TypeScript 类型检查          │
│  turbo run test → 单元测试                           │
│  turbo run build → 构建                              │
└─────────────────────────────────────────────────────┘
```

---

## 4. TypeScript 基础配置

### 4.1 创建 `tsconfig.base.json`

所有子包的 `tsconfig.json` 都会继承这个文件，提取公共编译选项：
```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
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
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist"]
}
```

**关键说明**：
- `"moduleResolution": "Bundler"` — 适用于 Vite/webpack 等打包器环境，支持 `exports` 字段解析
- `"declaration": true` + `"declarationMap": true` — 生成 `.d.ts` 类型文件和 source map
- `"isolatedModules": true` — 确保每个文件可独立编译，兼容 esbuild/swc 等工具

> 如果你的项目使用 Vue JSX，可以额外添加：
> ```jsonc
> "jsx": "preserve",
> "jsxImportSource": "vue"
> ```

### 4.2 创建根 `tsconfig.json`

根 tsconfig 改为纯 references 文件，不直接编译代码：

```jsonc
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" }
    // 后续每新增一个子包，在这里加一行
  ]
}
```

`"files": []` 表示根 tsconfig 本身不编译任何文件，仅作为项目引用的入口。

---
## 5. 安装并配置 Turborepo

### 5.1 安装

```bash
pnpm add -Dw turbo
```

`-Dw` = devDependency + workspace root。

### 5.2 创建 `turbo.json`

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

**`dependsOn` 的两种写法**：

| 写法 | 含义 | 示例 |
|------|------|------|
| `"^build"` | 先构建**上游依赖包**的 build | B 依赖 A，B 的 build 会等 A 的 build 完成 |
| `"build"` | 先执行**同一个包**的 build | 包 A 的 test 会等包 A 自己的 build 完成 |

**其他字段**：
- `"outputs": ["dist/**"]` — 告诉 turbo 缓存哪些构建产物，cache hit 时直接恢复
- `"cache": false` — dev 是 watch 模式，不应缓存
- `"persistent": true` — dev 是长驻进程，turbo 不会等它结束

### 5.3 修改根 `package.json` scripts

```jsonc
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

新增任意数量的子包都不需要改这里——turbo 自动发现所有 workspace 包。

### 5.4 更新 `.gitignore`

追加：

```
.turbo
```

---
## 6. 创建第一个子包

以一个无上游依赖的基础包 `@my-lib/core` 为例。

### 6.1 创建目录

```bash
mkdir -p packages/core/src
```

### 6.2 `packages/core/package.json`

```jsonc
{
  "name": "@my-lib/core",
  "version": "0.0.1",
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
    "dev": "vite build --watch"
  },
  "license": "MIT"
}
```

**关键说明**：
- `"type": "module"` — ESM 优先，与根保持一致
- `"files": ["dist"]` — npm publish 时只包含 dist 目录
- `"exports"` 中 `types` 必须在 `import` 前面——TypeScript 按顺序匹配条件导出，`types` 放后面会导致类型找不到

> 如果包有运行时依赖（如 `lodash-es`），放在 `dependencies`。
> 如果包依赖宿主环境提供的库（如 `vue`、`react`），放在 `peerDependencies`。

### 6.3 `packages/core/tsconfig.json`

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

- `"composite": true` — 启用 TypeScript 项目引用（project references），`tsc --build` 需要
- `"extends"` — 继承 `tsconfig.base.json` 的公共配置
### 6.4 `packages/core/vite.config.ts`

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
      // 不打包进产物的依赖——由使用方提供
      external: [],
    },
  },
})
```

**Vite library mode 关键配置**：
- `formats: ['es']` — 只输出 ESM（现代项目通常不需要 CJS）
- `external` — 列出所有不应打包的依赖（peerDependencies、dependencies 中的包）
- 后续需要自动生成 `.d.ts` 时，可安装 `vite-plugin-dts`

### 6.5 `packages/core/src/index.ts`

```typescript
export function add(a: number, b: number): number {
  return a + b
}
```

先写一个简单的导出，用于验证构建流程。

---

## 7. 创建第二个子包（有依赖关系）

创建 `@my-lib/utils`，它依赖 `@my-lib/core`。

### 7.1 创建目录

```bash
mkdir -p packages/utils/src
```

### 7.2 `packages/utils/package.json`

```jsonc
{
  "name": "@my-lib/utils",
  "version": "0.0.1",
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
    "dev": "vite build --watch"
  },
  "peerDependencies": {
    "@my-lib/core": "workspace:*"
  },
  "license": "MIT"
}
```
**`workspace:*`** 是 pnpm 的 workspace 协议。开发时它创建软链接指向本地包，`pnpm publish` 时自动替换为真实版本号（如 `^0.0.1`）。

### 7.3 `packages/utils/tsconfig.json`

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

`references` 声明了 TypeScript 层面的包依赖——`tsc --build` 会先编译 core，再编译 utils。

### 7.4 `packages/utils/vite.config.ts`

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
      external: ['@my-lib/core'],
    },
  },
})
```

`external` 中列出 `@my-lib/core`——组件库不应把上游依赖打包进产物。

### 7.5 `packages/utils/src/index.ts`

```typescript
import { add } from '@my-lib/core'

export function addOne(n: number): number {
  return add(n, 1)
}
```

### 7.6 更新根 `tsconfig.json`

```jsonc
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" }
  ]
}
```

<!-- PLACEHOLDER_SECTION_7 -->

---
## 8. 创建聚合入口包

如果你希望用户只安装一个包就能使用所有功能，可以创建一个聚合入口包。

### 8.1 `packages/my-lib/package.json`

```jsonc
{
  "name": "my-lib",
  "version": "0.0.1",
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
    "dev": "vite build --watch"
  },
  "dependencies": {
    "@my-lib/core": "workspace:*",
    "@my-lib/utils": "workspace:*"
  },
  "license": "MIT"
}
```

聚合包用 `dependencies`（不是 peer），这样用户安装一个包就自动拉取所有子包。

### 8.2 `packages/my-lib/src/index.ts`

```typescript
export * from '@my-lib/core'
export * from '@my-lib/utils'
```

### 8.3 其余文件

`tsconfig.json` 和 `vite.config.ts` 结构与 utils 包类似，`references` 和 `external` 列出所有子包即可。

<!-- PLACEHOLDER_SECTION_8 -->

---

## 9. 验证构建

### 9.1 安装依赖

```bash
pnpm install
```

预期结果：
- 无报错
- 各子包之间通过 workspace 软链接互相引用
- `node_modules/.pnpm` 中可以看到 workspace 包的链接

### 9.2 执行构建

```bash
pnpm build
```

Turborepo 会输出类似：

```
 Tasks:    3 successful, 3 total
 Cached:    0 cached, 3 total
   Time:    2.1s
```

构建顺序应为：`core` → `utils`（等 core 完成）→ `my-lib`（等所有子包完成）。
### 9.3 验证产物

```bash
ls packages/core/dist/       # 应有 index.mjs
ls packages/utils/dist/      # 应有 index.mjs
ls packages/my-lib/dist/     # 应有 index.mjs
```

### 9.4 验证缓存

再次执行 `pnpm build`，不改任何文件：

```
 Tasks:    3 successful, 3 total
 Cached:    3 cached, 3 total
   Time:    0.2s
```

全部 cache hit，构建瞬间完成。

### 9.5 验证增量构建

修改 `packages/core/src/index.ts`，再执行 `pnpm build`：

- `core` — cache miss，重新构建
- `utils` — cache miss，重新构建（因为依赖 core 变了）
- `my-lib` — cache miss，重新构建

只有受影响的包会重新构建。

<!-- PLACEHOLDER_SECTION_9 -->

---

## 10. 常见问题

### Q: 为什么 `exports` 里 `types` 要放在 `import` 前面？

TypeScript 的模块解析会按顺序匹配 `exports` 中的条件。`types` 必须在 `import` 前面，否则 TS 会先匹配到 `.mjs` 文件而找不到类型。

### Q: 为什么用 `workspace:*` 而不是具体版本号？

`workspace:*` 是 pnpm 的 workspace 协议。开发时它创建软链接指向本地包，`pnpm publish` 时自动替换为真实版本号（如 `^0.0.1`）。这样你不需要每次改版本号后手动更新所有引用。

### Q: 为什么子包的 vite.config.ts 要 external 掉依赖？

组件库/工具库不应把 `vue`、`react`、`lodash` 等打包进产物。原因：
- 重复打包（用户项目已经有一份 vue）
- 版本冲突（产物里的 vue 和用户的 vue 版本不同）
- 产物体积膨胀

**规则**：`peerDependencies` 和 `dependencies` 中的包都应该 external。
<!-- PLACEHOLDER_FAQ_CONT -->

### Q: `peerDependencies` 和 `dependencies` 怎么选？

| 场景 | 用哪个 | 示例 |
|------|--------|------|
| 宿主环境必须提供的框架 | `peerDependencies` | vue, react |
| 运行时需要但用户不直接使用的 | `dependencies` | lodash-es, date-fns |
| 聚合包引用子包 | `dependencies` | @my-lib/core |
| 子包引用同 monorepo 的其他子包 | `peerDependencies` | @my-lib/core |

### Q: turbo 的 `^build` 是什么意思？

`^` 前缀表示"先构建上游依赖"。例如 `@my-lib/utils` 的 build 任务声明了 `dependsOn: ["^build"]`，turbo 会先构建它依赖的 `@my-lib/core`，再构建 utils。

没有 `^` 的 `"build"` 表示"先执行同一个包的 build"。例如 test 任务的 `dependsOn: ["build"]` 表示先 build 自己，再跑测试。

### Q: 如何添加 Vue/React SFC 支持？

在需要处理 `.vue` 或 `.jsx/.tsx` 文件的子包的 `vite.config.ts` 中添加对应插件：

```typescript
// Vue
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  // ...
})
```

```typescript
// React
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ...
})
```

同时在子包的 `tsconfig.json` 的 `include` 中添加对应文件类型：

```jsonc
"include": ["src/**/*.ts", "src/**/*.vue"]  // Vue
"include": ["src/**/*.ts", "src/**/*.tsx"]  // React
```

<!-- PLACEHOLDER_FAQ_END -->

### Q: 如何生成 `.d.ts` 类型声明文件？

安装 `vite-plugin-dts`：

```bash
pnpm add -Dw vite-plugin-dts
```

在子包的 `vite.config.ts` 中使用：

```typescript
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.json' })],
  // ...
})
```
### Q: 新增一个子包需要改哪些地方？

1. 创建 `packages/new-pkg/` 目录，包含 `package.json`、`tsconfig.json`、`vite.config.ts`、`src/index.ts`
2. 在根 `tsconfig.json` 的 `references` 中添加 `{ "path": "./packages/new-pkg" }`
3. 如果有其他包依赖它，在那些包的 `package.json` 和 `tsconfig.json` 中声明依赖

**不需要改** `turbo.json` 和根 `package.json` 的 scripts——turbo 自动发现新包。

---

## 最终目录结构

```
my-lib/
├── package.json                  # private: true, scripts 用 turbo
├── pnpm-workspace.yaml           # 声明 packages/*
├── tsconfig.base.json            # 公共 TS 编译选项
├── tsconfig.json                 # 纯 references 入口
├── turbo.json                    # 任务编排配置
├── eslint.config.ts              # ESLint 9 flat config
├── .prettierrc.json              # Prettier 配置
├── stylelint.config.mjs          # Stylelint 配置
├── commitlint.config.ts          # Commitlint 配置
├── .lintstagedrc.json            # lint-staged 配置
├── .gitignore                    # 含 .turbo
│
├── .husky/
│   ├── pre-commit                # pnpm exec lint-staged
│   └── commit-msg                # pnpm exec commitlint --edit $1
│
└── packages/
    ├── core/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.ts
    │   └── src/
    │       └── index.ts
    │
    ├── utils/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.ts
    │   └── src/
    │       └── index.ts
    │
    └── my-lib/                   # 聚合入口（可选）
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        └── src/
            └── index.ts
```

---

## 后续扩展方向

完成以上基础搭建后，可以按需添加：

| 扩展 | 工具 | 说明 |
|------|------|------|
| 测试 | Vitest | 支持 workspace 模式，各子包独立测试 |
| 文档站 | VitePress / Storybook | 组件文档 + 在线 demo |
| 版本管理 | Changesets | 多包独立版本管理与发布 |
| CI/CD | GitHub Actions | PR 触发 lint+test+build，合并后自动发布 |
