import type { VNodeChild } from 'vue'

/** 行唯一标识 */
export type Key = string | number

/** 对齐方式 */
export type AlignType = 'left' | 'center' | 'right'

/**
 * 叶子列配置。
 */
export interface ColumnType<TRecord extends Record<string, unknown>> {
  key?: Key
  title?: string
  dataIndex?: DataIndex
  width?: number | string
  align?: AlignType
  ellipsis?: boolean
  className?: string
  customRender?: (ctx: CustomRenderContext<TRecord>) => VNodeChild
}

/**
 * 数据索引路径
 *
 * - `'name'` - 直接取record.name
 * - `['address', 'city']` — 取 record.address.city
 */
export type DataIndex = string | number | Array<string | number>

/**
 * customRender 回调参数。
 */
export interface CustomRenderContext<TRecord extends Record<string, unknown>> {
  /** 当前单元格的值（通过 dataIndex 取出） */
  text: unknown
  /** 当前行数据 */
  record: TRecord
  /** 行索引 */
  index: number
  /** 列配置 */
  column: ColumnType<TRecord>
}

/**
 * 列组配置（含 children）。
 */
export interface ColumnGroupType<TRecord extends Record<string, unknown>> extends Omit<
  ColumnType<TRecord>,
  'dataIndex' | 'customRender'
> {
  children: Array<ColumnType<TRecord> | ColumnGroupType<TRecord>>
}

/**
 * columns prop 的类型。
 */
export type ColumnsType<TRecord extends Record<string, unknown>> = Array<
  ColumnType<TRecord> | ColumnGroupType<TRecord>
>
