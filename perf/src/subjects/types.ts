import type { PerfRow } from '../data'

export type SortOrderLike = 'ascend' | 'descend' | null

/** 三个被测组件共用的 props 契约。 */
export interface SubjectProps {
  rows: PerfRow[]
}

/** 三个被测组件共用的命令式 API（defineExpose）。 */
export interface SubjectExposed {
  /** 切换 Score 列排序。三家都必须**真的排数据**，不能只换个箭头。 */
  sort(order: SortOrderLike): void
  /** 可滚动容器，供 App 统一用 `scrollTop` 驱动滚动场景。 */
  getScroller(): HTMLElement | null
  /** 用于量行高校准的行选择器。 */
  rowSelector: string
}
