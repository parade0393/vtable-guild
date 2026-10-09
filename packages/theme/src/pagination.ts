import type { ThemeConfig, ThemePresetName, VTableGuildPaginationLocale } from '@vtable-guild/core'

export const paginationTheme = {
  slots: {
    root: 'flex shrink-0 flex-wrap items-center gap-[var(--vtg-pagination-gap)] py-[var(--vtg-pagination-margin)] text-[length:var(--vtg-table-font-size)] text-[color:var(--color-on-surface)]',
    layout: 'flex w-full min-w-0 flex-wrap items-center gap-[var(--vtg-pagination-gap)]',
    left: 'flex min-w-0 max-w-full flex-wrap items-center gap-[var(--vtg-pagination-gap)]',
    right:
      'ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-[var(--vtg-pagination-gap)]',
    extension: 'min-w-0 max-w-full break-words',
    pages: 'flex items-center gap-[var(--vtg-pagination-gap)]',
    item: 'inline-flex box-border shrink-0 items-center justify-center h-[var(--vtg-pagination-size)] min-w-[var(--vtg-pagination-size)] px-1 border border-[color:var(--vtg-pagination-border)] rounded-[var(--vtg-pagination-radius)] bg-[color:var(--vtg-pagination-bg)] text-inherit cursor-pointer transition-colors [&:not([aria-disabled=true]):hover]:text-[color:var(--vtg-pagination-hover-color)] [&:not([aria-disabled=true]):hover]:bg-[color:var(--vtg-pagination-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)] aria-disabled:cursor-not-allowed aria-disabled:text-[color:var(--color-text-disabled)] aria-disabled:border-[color:var(--vtg-pagination-border)] aria-disabled:bg-[color:var(--vtg-pagination-bg)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-disabled)] disabled:border-[color:var(--vtg-pagination-border)] disabled:bg-[color:var(--vtg-pagination-bg)]',
    active:
      'font-[number:var(--vtg-pagination-active-weight)] text-[color:var(--vtg-pagination-active-color)] border-[color:var(--vtg-pagination-active-border)] bg-[color:var(--vtg-pagination-active-bg)] [&:not([aria-disabled=true]):hover]:bg-[color:var(--vtg-pagination-active-bg)] [&:not([aria-disabled=true]):hover]:text-[color:var(--vtg-pagination-active-hover-color)] [&:not([aria-disabled=true]):hover]:border-[color:var(--vtg-pagination-active-hover-color)] aria-disabled:border-[color:var(--color-border)] aria-disabled:bg-[color:var(--vtg-pagination-active-disabled-bg)] disabled:border-[color:var(--color-border)] disabled:bg-[color:var(--vtg-pagination-active-disabled-bg)]',
    jump: 'group relative text-[color:var(--color-text-disabled)] [&:not([aria-disabled=true]):hover]:bg-transparent',
    jumpEllipsis:
      'transition-opacity duration-200 group-[:not([aria-disabled=true]):hover]:opacity-0 group-[:not([aria-disabled=true]):focus-visible]:opacity-0',
    jumpIcon:
      'absolute h-[var(--vtg-pagination-icon-size)] w-[var(--vtg-pagination-icon-size)] stroke-[1.5] text-[color:var(--color-primary)] opacity-0 transition-opacity duration-200 group-[:not([aria-disabled=true]):hover]:opacity-100 group-[:not([aria-disabled=true]):focus-visible]:opacity-100',
    controls: 'flex items-center gap-[var(--vtg-pagination-gap)]',
    simpleControls: 'flex items-center gap-[var(--vtg-pagination-gap)]',
    simpleInput:
      'w-[var(--vtg-pagination-simple-input-width)] enabled:hover:border-[color:var(--color-primary)] enabled:focus:border-[color:var(--color-primary-hover)]',
    slash: 'mx-[var(--vtg-pagination-slash-margin)]',
    go: 'inline-flex items-center justify-center h-[var(--vtg-pagination-size)] bg-transparent p-0 text-inherit cursor-pointer disabled:cursor-not-allowed',
    input:
      'box-border w-[var(--vtg-pagination-input-width)] h-[var(--vtg-pagination-size)] rounded-[var(--vtg-pagination-radius)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-1 text-center text-inherit outline-none transition-all duration-200 enabled:hover:border-[color:var(--color-primary-hover)] enabled:focus:border-[color:var(--color-primary)] enabled:focus:shadow-[var(--vtg-pagination-focus-shadow)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-disabled)] disabled:bg-[color:var(--color-bg-disabled)]',
    select:
      'inline-flex items-center justify-between gap-2 whitespace-nowrap px-[var(--vtg-pagination-select-padding)] border-[color:var(--color-border)] bg-[color:var(--color-surface)] [&:not([aria-disabled=true]):hover]:bg-[color:var(--color-surface)] [&:not([aria-disabled=true]):hover]:text-inherit [&:not([aria-disabled=true]):hover]:border-[color:var(--color-primary-hover)] aria-expanded:border-[color:var(--color-primary)] aria-expanded:shadow-[var(--vtg-pagination-focus-shadow)] disabled:bg-[color:var(--color-bg-disabled)] disabled:border-[color:var(--color-border)] [&_svg]:text-[color:var(--color-text-placeholder)]',
    popup:
      'box-border overflow-y-auto z-[var(--vtg-pagination-popup-z)] m-0 list-none rounded-[var(--vtg-pagination-popup-radius)] bg-[color:var(--color-surface)] p-1 text-[length:var(--vtg-table-font-size)] text-[color:var(--color-on-surface)] shadow-[var(--vtg-pagination-popup-shadow)]',
    option:
      'flex min-h-[var(--vtg-pagination-option-height)] cursor-pointer items-center rounded leading-[22px] px-3 py-[5px] outline-none hover:bg-[color:var(--vtg-pagination-option-hover-bg)] focus:bg-[color:var(--vtg-pagination-option-hover-bg)]',
    optionActive:
      'font-[number:var(--vtg-pagination-active-weight)] text-[color:var(--vtg-pagination-option-active-color)] bg-[color:var(--vtg-pagination-option-active-bg)] hover:bg-[color:var(--vtg-pagination-option-active-bg)] focus:bg-[color:var(--vtg-pagination-option-active-bg)]',
    total: 'whitespace-nowrap',
    icon: 'inline-block h-[var(--vtg-pagination-icon-size)] w-[var(--vtg-pagination-icon-size)] stroke-[1.5]',
  },
  variants: {
    size: {
      small: { root: '[--vtg-pagination-size:var(--vtg-pagination-size-sm)]' },
      default: { root: '' },
    },
    align: {
      left: { root: 'justify-start' },
      center: { root: 'justify-center' },
      right: { root: 'justify-end' },
    },
    simple: {
      true: { root: '[--vtg-pagination-size:var(--vtg-pagination-size-sm)]' },
      false: {},
    },
    disabled: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      simple: true,
      disabled: true,
      class: {
        simpleControls: 'text-[color:var(--color-text-disabled)]',
        go: 'text-[color:var(--color-text-disabled)]',
      },
    },
  ],
  defaultVariants: { size: 'default', align: 'right' },
} as const satisfies ThemeConfig

export type PaginationThemeConfig = typeof paginationTheme
export type PaginationSlots = keyof typeof paginationTheme.slots

export const elementPlusPaginationTheme = {
  ...paginationTheme,
  slots: {
    ...paginationTheme.slots,
    root: 'flex shrink-0 items-center gap-[var(--vtg-pagination-gap)] py-[var(--vtg-pagination-margin)] text-[length:var(--vtg-pagination-font-size)] text-[color:var(--color-on-surface)]',
    pages: 'flex items-center gap-[var(--vtg-pagination-page-gap)]',
    item: `${paginationTheme.slots.item} border-0 focus-visible:outline-1 focus-visible:-outline-offset-1 aria-disabled:text-[color:var(--color-text-placeholder)] disabled:text-[color:var(--color-text-placeholder)]`,
    active:
      'font-[number:var(--vtg-pagination-active-weight)] text-[color:var(--vtg-pagination-active-color)] bg-[color:var(--vtg-pagination-active-bg)] cursor-default [&:not([aria-disabled=true]):hover]:text-[color:var(--vtg-pagination-active-color)] [&:not([aria-disabled=true]):hover]:bg-[color:var(--vtg-pagination-active-bg)] aria-disabled:text-[color:var(--color-muted)] aria-disabled:bg-[color:var(--vtg-pagination-active-disabled-bg)] disabled:text-[color:var(--color-muted)] disabled:bg-[color:var(--vtg-pagination-active-disabled-bg)]',
    jump: 'group relative [&:not([aria-disabled=true]):hover]:text-[color:var(--color-primary)]',
    controls:
      'flex items-center gap-[var(--vtg-pagination-control-gap)] text-[color:var(--color-text-regular)]',
    total: 'whitespace-nowrap text-[color:var(--color-text-regular)]',
    input: `${paginationTheme.slots.input} rounded-[var(--vtg-input-border-radius)] text-[color:var(--color-text-regular)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none enabled:hover:border-[color:var(--color-border-hover)] enabled:focus:border-[color:var(--color-primary)] enabled:focus:shadow-none`,
    select: `${paginationTheme.slots.select} border w-[var(--vtg-pagination-select-width)] rounded-[var(--vtg-input-border-radius)] text-[color:var(--color-text-regular)] [&:not([aria-disabled=true]):hover]:border-[color:var(--color-border-hover)] aria-expanded:shadow-none [&_svg]:transition-transform aria-expanded:[&_svg]:rotate-180`,
    popup: `${paginationTheme.slots.popup} border border-[color:var(--vtg-border-color-lighter)] py-[var(--vtg-pagination-popup-padding)] px-0`,
    option:
      'flex min-h-[var(--vtg-pagination-option-height)] cursor-pointer items-center px-5 text-[color:var(--color-text-regular)] outline-none hover:bg-[color:var(--vtg-pagination-option-hover-bg)] focus:bg-[color:var(--vtg-pagination-option-hover-bg)]',
    optionActive:
      'font-[number:var(--vtg-pagination-active-weight)] text-[color:var(--vtg-pagination-option-active-color)] bg-transparent hover:bg-[color:var(--vtg-pagination-option-hover-bg)] focus:bg-[color:var(--vtg-pagination-option-hover-bg)]',
  },
  variants: {
    ...paginationTheme.variants,
    size: {
      default: {},
      small: {
        root: '[--vtg-pagination-size:var(--vtg-pagination-size-sm)] [--vtg-pagination-font-size:var(--vtg-pagination-font-size-sm)] [--vtg-pagination-select-width:var(--vtg-pagination-select-width-sm)]',
      },
    },
  },
  compoundVariants: [
    ...paginationTheme.compoundVariants,
    {
      disabled: true,
      class: {
        total: 'text-[color:var(--color-text-placeholder)]',
        controls: 'text-[color:var(--color-text-placeholder)]',
      },
    },
  ],
} as const satisfies ThemeConfig

export function resolvePaginationThemePreset(
  preset: ThemePresetName = 'antdv',
): PaginationThemeConfig {
  return (
    preset === 'element-plus' ? elementPlusPaginationTheme : paginationTheme
  ) as PaginationThemeConfig
}

export const paginationZhCN: VTableGuildPaginationLocale = {
  items_per_page: '条/页',
  jump_to: '跳至',
  jump_to_confirm: '确定',
  page: '页',
  prev_page: '上一页',
  next_page: '下一页',
  prev_5: '向前 5 页',
  next_5: '向后 5 页',
  prev_3: '向前 3 页',
  next_3: '向后 3 页',
  prev_pages: '向前 {count} 页',
  next_pages: '向后 {count} 页',
  navigation: '分页',
  page_size: '每页条数',
}

export const paginationEnUS: VTableGuildPaginationLocale = {
  items_per_page: '/ page',
  jump_to: 'Go to',
  jump_to_confirm: 'Go',
  page: 'Page',
  prev_page: 'Previous page',
  next_page: 'Next page',
  prev_5: 'Previous 5 pages',
  next_5: 'Next 5 pages',
  prev_3: 'Previous 3 pages',
  next_3: 'Next 3 pages',
  prev_pages: 'Previous {count} pages',
  next_pages: 'Next {count} pages',
  navigation: 'Pagination',
  page_size: 'Page size',
}

export const elementPlusPaginationZhCN: VTableGuildPaginationLocale = {
  ...paginationZhCN,
  jump_to: '前往',
}

export const elementPlusPaginationEnUS: VTableGuildPaginationLocale = {
  ...paginationEnUS,
  items_per_page: '/page',
  prev_page: 'Go to previous page',
  next_page: 'Go to next page',
}
