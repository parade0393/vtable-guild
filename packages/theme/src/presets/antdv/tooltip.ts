import type { ThemeConfig } from '@vtable-guild/core'

/**
 * Ant Design Vue Tooltip 主题。
 *
 * 精确对齐 antdv Tooltip 组件样式：
 * - bg: rgba(0,0,0,0.85)
 * - border-radius: 6px
 * - padding: 6px 8px
 * - font-size: 14px
 * - 三层阴影
 *
 * 注意：定位相关的 inline style（position、top、left、z-index）保留在组件内，
 * 仅视觉样式（bg、padding、shadow、border-radius、color）迁入 theme slots。
 */
export const antdvTooltipTheme = {
  slots: {
    content: [
      'text-white max-w-[250px] break-words relative',
      'text-[length:var(--vtg-tooltip-font-size)]',
      'leading-[1.5715]',
      'bg-[color:var(--vtg-tooltip-bg)]',
      'rounded-[var(--vtg-tooltip-border-radius)]',
      'p-[var(--vtg-tooltip-padding)]',
      'shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]',
    ].join(' '),
    arrow: 'absolute block overflow-visible pointer-events-none',
    arrowOuter: 'absolute inset-0 w-0 h-0',
    arrowInner: 'absolute inset-0 w-0 h-0',
  },
  defaultVariants: {},
} as const satisfies ThemeConfig

export type AntdvTooltipSlots = keyof typeof antdvTooltipTheme.slots
export type AntdvTooltipThemeConfig = typeof antdvTooltipTheme
