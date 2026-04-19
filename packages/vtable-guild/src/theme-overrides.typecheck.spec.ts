import { createVTableGuild } from '@vtable-guild/vtable-guild'

createVTableGuild({
  theme: {
    table: {
      slots: {
        wrapper: 'w-full',
      },
      variants: {
        hoverable: {
          true: {
            td: 'group-hover/row:bg-red-500',
          },
        },
      },
      defaultVariants: {
        hoverable: false,
      },
    },
    button: {
      slots: {
        root: 'rounded-md',
      },
      variants: {
        disabled: {
          true: {
            root: 'opacity-100',
          },
        },
      },
    },
    input: {
      slots: {
        root: 'w-40',
      },
      variants: {
        bare: {
          true: {
            root: 'px-0',
          },
        },
      },
    },
  },
})

createVTableGuild({
  theme: {
    table: {
      slots: {
        // @ts-expect-error unknown table slot
        nope: 'bg-black',
      },
      variants: {
        // @ts-expect-error unknown table variant
        nope: {},
      },
    },
    button: {
      slots: {
        // @ts-expect-error unknown button slot
        nope: 'rounded-none',
      },
    },
  },
})
