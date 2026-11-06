import type { ThemePresetName } from '@vtable-guild/vtable-guild'

/**
 * 文档 API 元数据的单一数据源。
 *
 * 功能指南与参考页通过 `@api` 指令读取同一份数据。
 */

export const docFeatures = [
  'sorting',
  'pagination',
  'remote-data',
  'query',
  'filtering',
  'selection',
  'selection-alert',
  'cell-display',
  'dictionary',
  'cell-render',
  'expandable-rows',
  'tree-table',
  'table-instance',
  'fixed-columns',
  'virtualization',
  'column-resize',
  'column-display',
  'toolbar',
  'row-drag-sort',
  'grouped-and-merged-cells',
  'title-footer-summary',
  'api-wiring-and-slots',
  'editing',
  'schema-query',
  'editable-columns',
  'detail-form',
] as const

export type DocFeature = (typeof docFeatures)[number]
export type TableApiKind = 'props' | 'columns' | 'row-selection' | 'events' | 'slots'

export interface DocTable {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
}

export interface ReferenceApiTable extends DocTable {
  kind?: TableApiKind
}

export interface ApiEntry<TName extends string = string> {
  name: TName
  /** TypeScript 类型文本，渲染时包进行内代码。 */
  type: string
  /** 设置后类型列渲染为指向类型参考的链接。 */
  typeHref?: string
  /** 默认值文本；以反引号包裹的值原样输出，其余按普通文本输出。缺省渲染为 `-`。 */
  default?: string
  /** markdown 说明文本。 */
  description: string
  features: readonly DocFeature[]
}

export interface EventEntry<TName extends string = string> {
  name: TName
  params: string
  description: string
  features: readonly DocFeature[]
}

export interface VueSlotEntry<TName extends string = string> {
  name: TName
  params: string
  paramsHref?: string
  description: string
  features: readonly DocFeature[]
}

export interface UiSlotMeta {
  description: string
  features: readonly DocFeature[]
}

export interface CssVarEntry {
  name: `--${string}`
  description: string
  features: readonly DocFeature[]
  /** 预设未声明时组件使用的回退值。 */
  fallback?: string
  presetFallbacks?: Partial<Record<ThemePresetName, string>>
  /** 只有这些预设读取该变量；缺省表示两套预设都读取。 */
  presets?: readonly ThemePresetName[]
}
