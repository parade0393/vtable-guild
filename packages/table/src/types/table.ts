import type { ThemePresetName, SlotProps } from '@vtable-guild/core'
import type { VNodeChild } from 'vue'
import type { ColumnsType, ColumnType, Key } from './column'
import type { TableSlots } from '@vtable-guild/theme'

/**
 * bodyCell slot 的参数类型。
 */
export interface TableBodyCellSlotProps<TRecord extends Record<string, unknown>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

/**
 * headerCell slot 的参数类型。
 */
export interface TableHeaderCellSlotProps<TRecord extends Record<string, unknown>> {
  title: string | undefined
  column: ColumnType<TRecord>
  index: number
}

/**
 * Table 组件 slots 声明。
 */
export interface TableSlotsDecl<TRecord extends Record<string, unknown>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
}

/**
 * Table 组件 Props。
 */
export interface TableProps<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  /** 数据源 */
  dataSource: TRecord[]
  /** 列配置 */
  columns: ColumnsType<TRecord>
  /** 行唯一标识 */
  rowKey?: string | ((record: TRecord) => Key)
  /** 加载状态 */
  loading?: boolean
  /** 尺寸：lg(默认) / md / sm */
  size?: 'sm' | 'md' | 'lg'
  /** 显示边框 */
  bordered?: boolean
  /** 斑马纹 */
  striped?: boolean
  /** 行 hover 高亮 */
  hoverable?: boolean
  /** slot 级别样式覆盖 */
  ui?: SlotProps<{ slots: Record<TableSlots, string> }>
  /** 根元素自定义 class */
  class?: string
  /**
   * 实例级 preset override。
   * 未传时使用 createVTableGuild 的全局 preset；再未配置则使用 'antdv'。
   */
  themePreset?: ThemePresetName
}
