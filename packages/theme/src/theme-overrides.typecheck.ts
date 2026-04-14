import { createVTableGuild, type ThemeOverrideConfig } from '@vtable-guild/core'
import type { TableThemeConfig } from './table'

const tableOverride = {
  slots: {
    root: 'shadow-lg',
    td: 'bg-red-500',
  },
  variants: {
    hoverable: {
      true: {
        td: 'group-hover/row:bg-red-500',
      },
    },
    size: {
      lg: {
        td: 'px-8',
      },
    },
  },
  defaultVariants: {
    hoverable: false,
    size: 'md',
  },
  compoundSlots: [
    {
      slots: ['th', 'td'],
      size: 'lg',
      class: 'text-red-500',
    },
  ],
} satisfies ThemeOverrideConfig<TableThemeConfig>

createVTableGuild({
  theme: {
    table: tableOverride,
  },
})

const invalidTableOverride = {
  slots: {
    // @ts-expect-error unknown table slot
    nope: 'bg-black',
  },
  variants: {
    hoverable: {
      true: {
        // @ts-expect-error unknown table slot within variant override
        nope: 'bg-black',
      },
    },
  },
  defaultVariants: {
    // @ts-expect-error unknown table default variant key
    nope: true,
  },
  compoundSlots: [
    {
      // @ts-expect-error unknown slot in compoundSlots override
      slots: ['nope'],
      class: 'text-red-500',
    },
  ],
} satisfies ThemeOverrideConfig<TableThemeConfig>

type TableVariantKeys = keyof NonNullable<ThemeOverrideConfig<TableThemeConfig>['variants']>

// @ts-expect-error unknown table variant
const invalidVariantKey: TableVariantKeys = 'nope'

void invalidTableOverride
void invalidVariantKey
