import type { VNodeChild } from 'vue'
import type { CustomRenderContext } from './column'

export interface TableTooltipConfig {
  title?: VNodeChild
  placement?: 'top' | 'bottom' | 'left' | 'right'
  mouseEnterDelay?: number
  mouseLeaveDelay?: number
  color?: string
  arrow?: boolean
  class?: string
}

export type ColumnValue = string | number | boolean
export type ColumnValueStatus = 'success' | 'warning' | 'error' | 'processing' | 'default'
export type ColumnValueEnumItem = string | { text: VNodeChild; status?: ColumnValueStatus }
export type ColumnValueEnum =
  | ReadonlyMap<ColumnValue, ColumnValueEnumItem>
  | Record<string, ColumnValueEnumItem>

export type ColumnCopyable<TRecord extends object = Record<string, unknown>> =
  | boolean
  | {
      text?: string | ((context: CustomRenderContext<TRecord>) => string | Promise<string>)
      onCopy?: (text: string, record: TRecord) => void
      onError?: (error: unknown, record: TRecord) => void
    }
