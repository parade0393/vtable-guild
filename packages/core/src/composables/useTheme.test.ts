import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVTableGuild } from '../plugin'
import VTableGuildConfigProvider from '../components/VTableGuildConfigProvider'
import { mergeThemeConfigs, useTheme, type CompatClassConfig } from './useTheme'
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
      expect.arrayContaining(['px-4', 'bg-zinc-100', 'vtg-text-red-500', 'shadow-lg']),
    )
    expect(wrapper.get('span').classes()).toEqual(
      expect.arrayContaining(['vtg-text-sm', 'tracking-wide', 'uppercase', 'vtg-underline']),
    )
  })

  it('keeps internal classes unprefixed in tailwind4 mode', () => {
    const wrapper = mount(BadgeProbe, {
      props: {
        tone: 'danger',
        ui: {
          root: 'px-8',
        },
      },
      global: {
        plugins: [createVTableGuild({ cssMode: 'tailwind4' })],
      },
    })

    expect(wrapper.get('div').classes()).toEqual(expect.arrayContaining(['px-8', 'text-red-500']))
    expect(wrapper.get('div').classes()).not.toContain('vtg-px-8')
  })

  it('keeps internal classes unprefixed in tailwind3 mode', () => {
    const wrapper = mount(BadgeProbe, {
      props: {
        tone: 'danger',
        ui: {
          root: 'px-8',
        },
      },
      global: {
        plugins: [createVTableGuild({ cssMode: 'tailwind3' })],
      },
    })

    expect(wrapper.get('div').classes()).toEqual(expect.arrayContaining(['px-8', 'text-red-500']))
    expect(wrapper.get('div').classes()).not.toContain('vtg-px-8')
  })

  it('requires prefixed overrides to replace internal utilities in prebuilt mode', () => {
    const wrapper = mount(BadgeProbe, {
      props: {
        ui: {
          root: 'px-8 vtg-px-6',
        },
      },
      global: {
        plugins: [createVTableGuild()],
      },
    })

    expect(wrapper.get('div').classes()).toEqual(expect.arrayContaining(['vtg-px-6', 'px-8']))
    expect(wrapper.get('div').classes()).not.toContain('vtg-px-2')
  })

  it('supports a custom class prefix in prebuilt mode', () => {
    const wrapper = mount(BadgeProbe, {
      props: {
        ui: {
          root: 'px-8 app-px-6',
        },
      },
      global: {
        plugins: [createVTableGuild({ classPrefix: 'app' })],
      },
    })

    expect(wrapper.get('div').classes()).toEqual(
      expect.arrayContaining(['app-px-6', 'px-8', 'app-text-blue-500']),
    )
    expect(wrapper.get('div').classes()).not.toContain('app-px-2')
  })
})

describe('useTheme compat classes', () => {
  const compatClasses: CompatClassConfig = {
    slots: {
      root: 'ant-table-wrapper ant-table',
      body: 'ant-table-cell',
    },
    variants: {
      tone: {
        primary: { root: 'ant-table-small' },
        danger: { root: 'ant-table-bordered', body: 'ant-table-cell' },
      },
    },
  }

  const CompatProbe = defineComponent({
    name: 'CompatProbe',
    props: {
      tone: { type: String, default: undefined },
      ui: { type: Object, default: undefined },
      class: { type: String, default: undefined },
    },
    setup(props) {
      const { slots } = useTheme('badge', badgeTheme, props, { compatClasses })

      return () => h('div', { class: slots.root() }, h('span', { class: slots.body() }, 'badge'))
    },
  })

  it('produces byte-identical output when compatClass is not enabled', () => {
    const mountBoth = (plugin: ReturnType<typeof createVTableGuild>) => ({
      withOption: mount(CompatProbe, { props: { tone: 'danger' }, global: { plugins: [plugin] } }),
      without: mount(BadgeProbe, { props: { tone: 'danger' }, global: { plugins: [plugin] } }),
    })

    const { withOption, without } = mountBoth(createVTableGuild())
    expect(withOption.get('div').attributes('class')).toBe(without.get('div').attributes('class'))
    expect(withOption.get('span').attributes('class')).toBe(without.get('span').attributes('class'))
    expect(withOption.get('div').attributes('class')).not.toContain('ant-')
  })

  it.each(['prebuilt', 'tailwind3', 'tailwind4'] as const)(
    'prepends compat classes without prefix pollution in %s mode',
    (cssMode) => {
      const wrapper = mount(CompatProbe, {
        global: {
          plugins: [createVTableGuild({ cssMode, compatClass: true })],
        },
      })

      const rootClass = wrapper.get('div').attributes('class') ?? ''
      expect(rootClass.startsWith('ant-table-wrapper ant-table ')).toBe(true)
      expect(rootClass).not.toContain('vtg-ant-')
      expect(wrapper.get('span').classes()).toContain('ant-table-cell')
    },
  )

  it('resolves variant compat classes from props and defaultVariants fallback', () => {
    const plugin = createVTableGuild({ compatClass: true })

    // defaultVariants.tone = 'primary' → 回落命中 ant-table-small
    const fallback = mount(CompatProbe, { global: { plugins: [plugin] } })
    expect(fallback.get('div').classes()).toContain('ant-table-small')

    // props.tone = 'danger' → 覆盖命中 ant-table-bordered
    const explicit = mount(CompatProbe, {
      props: { tone: 'danger' },
      global: { plugins: [plugin] },
    })
    expect(explicit.get('div').classes()).toContain('ant-table-bordered')
    expect(explicit.get('div').classes()).not.toContain('ant-table-small')
  })

  it('keeps compat classes intact under classPrefix "ant"', () => {
    const wrapper = mount(CompatProbe, {
      global: {
        plugins: [createVTableGuild({ classPrefix: 'ant', compatClass: true })],
      },
    })

    // ant-table-cell 不得被反前缀成真实的 Tailwind display 工具类 table-cell
    expect(wrapper.get('span').classes()).toContain('ant-table-cell')
    expect(wrapper.get('span').classes()).not.toContain('table-cell')
  })

  it('survives a nested VTableGuildConfigProvider', () => {
    const Wrapper = defineComponent({
      name: 'NestedWrapper',
      setup() {
        return () => h(VTableGuildConfigProvider, null, { default: () => h(CompatProbe) })
      },
    })

    const wrapper = mount(Wrapper, {
      global: { plugins: [createVTableGuild({ compatClass: true })] },
    })

    // ConfigProvider 重建 context 时若漏掉 compatClass，兼容类名会静默消失
    expect(wrapper.get('div').classes()).toContain('ant-table-wrapper')
    expect(wrapper.get('span').classes()).toContain('ant-table-cell')
  })

  it('dedupes when slots and variants hit the same compat class', () => {
    const wrapper = mount(CompatProbe, {
      props: { tone: 'danger' },
      global: {
        plugins: [createVTableGuild({ compatClass: true })],
      },
    })

    // slots.body 与 variants.tone.danger.body 都是 ant-table-cell，只出现一次
    const bodyClass = wrapper.get('span').attributes('class') ?? ''
    expect(bodyClass.match(/ant-table-cell/g)).toHaveLength(1)
  })
})
