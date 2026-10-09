import { createVTableGuild, type ThemeOverrideConfig } from '@vtable-guild/core'
import type { TableThemeConfig } from './table'
import type { PaginationThemeConfig } from './pagination'

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
      large: {
        td: 'px-8',
      },
    },
  },
  defaultVariants: {
    hoverable: false,
    size: 'middle',
  },
  compoundSlots: [
    {
      slots: ['th', 'td'],
      size: 'large',
      class: 'text-red-500',
    },
  ],
} satisfies ThemeOverrideConfig<TableThemeConfig>

createVTableGuild({
  theme: {
    table: tableOverride,
    pagination: {
      slots: {
        layout: 'gap-4',
        left: 'flex-1',
        right: 'gap-2',
        extension: 'text-sm',
      },
      variants: {
        size: {
          small: { layout: 'gap-2', extension: 'text-xs' },
        },
      },
    } satisfies ThemeOverrideConfig<PaginationThemeConfig>,
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
