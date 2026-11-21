import type { ThemeConfig, ThemePresetName } from '@vtable-guild/core'

export const queryTheme = {
  slots: {
    root: 'min-w-0 rounded-[var(--vtg-query-radius,6px)] bg-[color:var(--color-surface)] p-[var(--vtg-query-padding,24px)] font-[family-name:var(--font-family-base)] text-[length:var(--vtg-table-font-size)] text-[color:var(--color-on-surface)]',
    fields: '',
    field: 'flex min-w-0 items-start gap-[var(--vtg-query-label-gap,12px)]',
    label: 'flex h-[var(--vtg-query-control-height,32px)] shrink-0 items-center',
    control: 'min-w-0',
    error:
      'mt-1 text-[color:var(--vtg-cell-error)] text-[length:var(--vtg-query-error-font-size,12px)]',
    actions:
      'flex min-h-[var(--vtg-query-control-height,32px)] max-w-full flex-wrap items-center gap-[var(--vtg-query-action-gap,8px)]',
    feedback: 'w-full text-[color:var(--vtg-cell-error)]',
    collapse: 'inline-flex items-center gap-1',
  },
  variants: {
    layoutType: {
      QueryFilter: {
        control: 'flex-1',
        actions: 'justify-end',
      },
      LightFilter: {
        root: 'p-[var(--vtg-query-light-padding,16px)]',
      },
    },
  },
  defaultVariants: { layoutType: 'QueryFilter' },
} as const satisfies ThemeConfig

export const elementPlusQueryTheme = {
  ...queryTheme,
  slots: {
    ...queryTheme.slots,
    root: `${queryTheme.slots.root} rounded-[var(--vtg-query-radius,4px)]`,
  },
} as const satisfies ThemeConfig

export type QueryThemeConfig = typeof queryTheme
export type QuerySlots = keyof QueryThemeConfig['slots']

export function resolveQueryThemePreset(name: ThemePresetName = 'antdv') {
  return name === 'element-plus' ? elementPlusQueryTheme : queryTheme
}

export const queryZhCN = {
  label: '表格查询',
  submit: '查询',
  reset: '重置',
  expand: '展开',
  collapse: '收起',
  more: '更多筛选',
  confirm: '确认',
  clear: '清空',
  validationFailed: '请检查查询条件',
} as const
export const queryEnUS = {
  label: 'Table query',
  submit: 'Search',
  reset: 'Reset',
  expand: 'Expand',
  collapse: 'Collapse',
  more: 'More filters',
  confirm: 'Confirm',
  clear: 'Clear',
  validationFailed: 'Check query conditions',
} as const
