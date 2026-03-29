import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVTableGuild } from '../plugin'
import { mergeThemeConfigs, useTheme } from './useTheme'
import type { ThemeConfig } from '../utils/types'

const badgeTheme = {
  slots: {
    root: 'px-2 text-slate-500',
    body: 'text-sm',
  },
  variants: {
    tone: {
      primary: {
        root: 'text-blue-500',
        body: 'font-medium',
      },
      danger: {
        root: 'text-red-500',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
  compoundVariants: [
    {
      tone: 'danger',
      class: {
        body: 'underline',
      },
    },
  ],
} as const satisfies ThemeConfig

const BadgeProbe = defineComponent({
  name: 'BadgeProbe',
  props: {
    tone: { type: String, default: undefined },
    ui: { type: Object, default: undefined },
    class: { type: String, default: undefined },
  },
  setup(props) {
    const { slots } = useTheme('badge', badgeTheme, props)

    return () => h('div', { class: slots.root() }, h('span', { class: slots.body() }, 'badge'))
  },
})

describe('mergeThemeConfigs', () => {
  it('merges slots, variants, defaults, and compound variants', () => {
    const merged = mergeThemeConfigs(badgeTheme, {
      slots: {
        root: 'px-4 bg-zinc-100',
      },
      variants: {
        tone: {
          primary: {
            root: 'text-emerald-600',
          },
        },
      },
      defaultVariants: {
        tone: 'danger',
      },
      compoundVariants: [
        {
          tone: 'primary',
          class: {
            body: 'tracking-wide',
          },
        },
      ],
    })

    expect(merged.slots.root).toContain('px-4')
    expect(merged.slots.root).toContain('bg-zinc-100')
    expect(merged.variants?.tone.primary).toEqual({
      root: expect.stringContaining('text-emerald-600'),
      body: 'font-medium',
    })
    expect(merged.defaultVariants).toEqual({ tone: 'danger' })
    expect(merged.compoundVariants).toHaveLength(2)
  })
})

describe('useTheme', () => {
  it('merges default theme, plugin theme, instance ui, and class overrides', () => {
    const wrapper = mount(BadgeProbe, {
      props: {
        tone: 'danger',
        ui: {
          body: 'uppercase',
        },
        class: 'shadow-lg',
      },
      global: {
        plugins: [
          createVTableGuild({
            theme: {
              badge: {
                slots: {
                  root: 'px-4 bg-zinc-100',
                  body: 'tracking-wide',
                },
              },
            },
          }),
        ],
      },
    })

    expect(wrapper.get('div').classes()).toEqual(
      expect.arrayContaining(['px-4', 'bg-zinc-100', 'text-red-500', 'shadow-lg']),
    )
    expect(wrapper.get('span').classes()).toEqual(
      expect.arrayContaining(['text-sm', 'tracking-wide', 'uppercase', 'underline']),
    )
  })
})
