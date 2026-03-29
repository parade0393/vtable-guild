import { defineComponent, h, inject } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { VTableGuildConfigProvider } from '../index'
import { createVTableGuild, syncDocumentPresetAttr, VTABLE_GUILD_INJECTION_KEY } from './index'

const ContextProbe = defineComponent({
  name: 'ContextProbe',
  setup() {
    const context = inject(VTABLE_GUILD_INJECTION_KEY)

    return () =>
      h('div', {
        'data-theme-preset': context?.themePreset,
        'data-locale': context?.locale,
        'data-badge-root': context?.theme.badge?.slots?.root ?? '',
      })
  },
})

describe('createVTableGuild', () => {
  it('provides theme and locale context and syncs document preset attribute', () => {
    const wrapper = mount(ContextProbe, {
      global: {
        plugins: [
          createVTableGuild({
            themePreset: 'element-plus',
            locale: 'en-US',
            theme: {
              badge: {
                slots: {
                  root: 'bg-black',
                },
              },
            },
          }),
        ],
      },
    })

    expect(wrapper.attributes('data-theme-preset')).toBe('element-plus')
    expect(wrapper.attributes('data-locale')).toBe('en-US')
    expect(wrapper.attributes('data-badge-root')).toContain('bg-black')
    expect(document.documentElement.getAttribute('data-vtg-preset')).toBe('element-plus')
  })

  it('removes the preset attribute for the default antdv preset', () => {
    syncDocumentPresetAttr('element-plus')
    syncDocumentPresetAttr('antdv')

    expect(document.documentElement.hasAttribute('data-vtg-preset')).toBe(false)
  })
})

describe('VTableGuildConfigProvider', () => {
  it('merges nested provider overrides without dropping parent context', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTableGuildConfigProvider,
              {
                theme: {
                  badge: {
                    slots: {
                      root: 'bg-slate-200',
                    },
                  },
                },
              },
              {
                default: () =>
                  h(
                    VTableGuildConfigProvider,
                    {
                      locale: 'en-US',
                      theme: {
                        badge: {
                          slots: {
                            root: 'bg-slate-900 text-white',
                          },
                        },
                      },
                    },
                    {
                      default: () => h(ContextProbe),
                    },
                  ),
              },
            )
        },
      }),
      {
        global: {
          plugins: [
            createVTableGuild({
              locale: 'zh-CN',
              theme: {
                badge: {
                  slots: {
                    body: 'tracking-wide',
                  },
                },
              },
            }),
          ],
        },
      },
    )

    expect(wrapper.get('[data-theme-preset]').attributes('data-locale')).toBe('en-US')
    expect(wrapper.get('[data-theme-preset]').attributes('data-badge-root')).toContain(
      'bg-slate-900',
    )
  })
})
