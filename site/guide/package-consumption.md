# 包导入与样式入口

发布后的接入方式主要有两类：走聚合包，或者按需安装 `core`、`table`、`theme`。两种方式都能工作，差别在于依赖暴露面和团队维护成本。

## 方式一：聚合包接入

如果你希望把运行时入口尽量收敛到一个包，优先使用 `@vtable-guild/vtable-guild`。

```bash
pnpm add @vtable-guild/vtable-guild @vtable-guild/theme vue
```

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVTableGuild, VTable } from '@vtable-guild/vtable-guild'
import '@vtable-guild/theme/css'

const app = createApp(App)

app.use(createVTableGuild({ themePreset: 'antdv' }))
app.component('VTable', VTable)
app.mount('#app')
```

适合场景：

- 业务应用直接消费组件库。
- 希望统一从一个入口导入组件、类型和插件。

## 方式二：分包按需接入

如果你只想使用表格本体和主题能力，可以显式安装分包：

```bash
pnpm add @vtable-guild/core @vtable-guild/table @vtable-guild/theme vue
```

```ts
import { createVTableGuild } from '@vtable-guild/core'
import { VTable } from '@vtable-guild/table'
import '@vtable-guild/theme/css'
```

适合场景：

- 你希望更明确地控制依赖边界。
- 你的工程只需要 `table`，不需要聚合导出。

## 样式入口

- `@vtable-guild/theme/css`：默认主题 token、过渡和 `antdv` 预设基础样式。
- `@vtable-guild/theme/css/presets/element-plus`：在默认样式之后额外引入，用于切到 `element-plus` 视觉预设。

```ts
import '@vtable-guild/theme/css'
import '@vtable-guild/theme/css/presets/element-plus'
```

然后在运行时用 `createVTableGuild({ themePreset: 'element-plus' })` 对齐预设名。

## 导入建议

- 应用层优先聚合包，减少导入分散。
- 组件库二次封装或平台层优先分包，职责更清晰。
- 无论哪种方式，主题 CSS 都应在应用入口尽早加载。

## 参考位置

- README：README.md
- playground 接入：playground/src/main.ts
- 运行时切换：playground/src/App.vue
