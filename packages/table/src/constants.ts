export const SELECTION_ALL = 'SELECT_ALL' as const
export const SELECTION_INVERT = 'SELECT_INVERT' as const
export const SELECTION_NONE = 'SELECT_NONE' as const

export type SelectionSentinel =
  | typeof SELECTION_ALL
  | typeof SELECTION_INVERT
  | typeof SELECTION_NONE
