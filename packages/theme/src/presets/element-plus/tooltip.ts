import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Element Plus Tooltip 主题。
 *
 * 与 antdv 的主要差异：
 * - bg: #303133（opaque，antdv 是 rgba 半透明）
 * - border-radius: 4px
 * - padding: 5px 11px
 * - font-size: 12px（antdv 14px）
 * - border: 1px solid #303133
 */
export const elementPlusTooltipTheme = {
  slots: {
    content: [
      'text-white max-w-[250px] break-words relative',
      'text-[length:var(--vtg-tooltip-font-size)]',
      'leading-[20px]',
      'bg-[color:var(--vtg-tooltip-bg)]',
      'rounded-[var(--vtg-tooltip-border-radius)]',
      'p-[var(--vtg-tooltip-padding)]',
      'border border-[color:var(--vtg-tooltip-bg)]',
    ].join(' '),
    arrow: 'absolute w-2 h-2 rotate-45 bg-[color:var(--vtg-tooltip-bg)]',
  },
  defaultVariants: {},
} as const satisfies ThemeConfig
