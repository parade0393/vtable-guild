import type { ThemeConfig, ThemePresetName } from '@vtable-guild/core'

/** ProTable QueryFilter layout; host controls retain their own UI library styling. */
export const queryTheme = {
  slots: {
    root: 'flex min-w-0 flex-wrap items-start gap-x-[var(--vtg-query-column-gap,24px)] gap-y-[var(--vtg-query-row-gap,16px)] rounded-[var(--vtg-query-radius,6px)] bg-[color:var(--color-surface)] p-[var(--vtg-query-padding,24px)] font-[family-name:var(--font-family-base)] text-[length:var(--vtg-table-font-size)] text-[color:var(--color-on-surface)]',
    fields:
      'grid min-w-[min(100%,calc(var(--vtg-query-field-min-width,240px)*2_+_var(--vtg-query-column-gap,24px)))] flex-1 gap-x-[var(--vtg-query-column-gap,24px)] gap-y-[var(--vtg-query-row-gap,16px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--vtg-query-field-min-width,240px)),1fr))]',
    field: 'flex min-w-0 items-start gap-[var(--vtg-query-label-gap,12px)]',
    label:
      'flex h-[var(--vtg-query-control-height,32px)] w-[var(--vtg-query-label-width,80px)] shrink-0 items-center justify-end',
    control: 'min-w-0 flex-1 [&>*]:w-full',
    error:
      'mt-1 text-[color:var(--vtg-cell-error)] text-[length:var(--vtg-query-error-font-size,12px)]',
    actions:
      'ml-auto flex min-h-[var(--vtg-query-control-height,32px)] max-w-full flex-wrap items-center justify-end gap-[var(--vtg-query-action-gap,8px)]',
    feedback: 'w-full text-[color:var(--vtg-cell-error)]',
    collapse: 'inline-flex items-center gap-1',
  },
  variants: {
    layout: {
      form: {},
      light: {
        root: 'p-[var(--vtg-query-light-padding,16px)]',
        fields:
          'flex flex-wrap items-start gap-x-[var(--vtg-query-column-gap,24px)] gap-y-[var(--vtg-query-row-gap,16px)]',
        field: 'w-[var(--vtg-query-light-field-width,240px)] max-w-full',
        label: 'w-auto justify-start',
      },
    },
  },
  defaultVariants: { layout: 'form' },
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
  validationFailed: '请检查查询条件',
} as const
export const queryEnUS = {
  label: 'Table query',
  submit: 'Search',
  reset: 'Reset',
  expand: 'Expand',
  collapse: 'Collapse',
  validationFailed: 'Check query conditions',
} as const
