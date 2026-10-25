import type { Key } from './column'

/** key takes precedence over index, which addresses visible rows on the current page. */
export interface TableScrollToOptions {
  key?: Key
  index?: number
  top?: number
  left?: number
  align?: 'top' | 'bottom' | 'auto'
  offset?: number
}

export interface TableInstance {
  /** False for invalid input, an unmounted table, or a row outside the visible loaded page. */
  scrollTo: (options: TableScrollToOptions) => Promise<boolean>
  /** Retry without toggling expansion. False when unavailable or unsuccessful. */
  retryTreeLoad: (key: Key) => Promise<boolean>
  getTreeLoadError: (key: Key) => Error | undefined
}
