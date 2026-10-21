// @vtable-guild/vtable-guild — 单一公开入口

export * from '@vtable-guild/core'
export * from '@vtable-guild/theme'
export * from '@vtable-guild/table'
// 主题增强必须走 re-export 而不是 `import './augment'`：vite-plugin-dts 默认开启
// clearPureImport，纯副作用 import 会在产出的 d.ts 里被剥掉，外部消费者就拿不到增强了。
export * from './augment'
