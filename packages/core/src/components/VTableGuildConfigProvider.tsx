import { computed, defineComponent, inject, provide, reactive } from 'vue'
import type { PropType } from 'vue'
import type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  ThemeConfig,
  VTableGuildContext,
  VTableGuildLocale,
  VTableGuildThemeOverrides,
} from '../utils/types'
import { mergeDeep } from '../utils/mergeDeep'
import { mergeThemeConfigs } from '../composables/useTheme'
import { VTABLE_GUILD_INJECTION_KEY } from '../plugin/index'

export default defineComponent({
  name: 'VTableGuildConfigProvider',
  props: {
    theme: {
      type: Object as PropType<VTableGuildThemeOverrides>,
      default: undefined,
    },
    locale: {
      type: String as PropType<LocaleName>,
      default: undefined,
    },
    locales: {
      type: Object as PropType<LocaleRegistry>,
      default: undefined,
    },
    localeOverrides: {
      type: Object as PropType<DeepPartial<VTableGuildLocale>>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const parentContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

    const mergedTheme = computed<VTableGuildThemeOverrides>(() => {
      const parent = parentContext?.theme ?? {}
      const child = props.theme ?? {}
      if (!Object.keys(child).length) return parent
      const keys = new Set([...Object.keys(parent), ...Object.keys(child)])
      const result: VTableGuildThemeOverrides = {}
      for (const key of keys) {
        const b = parent[key]
        const o = child[key]
        result[key] = b && o ? mergeThemeConfigs(b as ThemeConfig, o) : (o ?? b!)
      }
      return result
    })

    const mergedLocales = computed(() => ({
      ...(parentContext?.locales ?? {}),
      ...(props.locales ?? {}),
    }))

    const mergedLocaleOverrides = computed(
      () =>
        mergeDeep(
          (parentContext?.localeOverrides ?? {}) as Record<string, unknown>,
          props.localeOverrides as DeepPartial<Record<string, unknown>>,
        ) as DeepPartial<VTableGuildLocale>,
    )

    const context = reactive({
      get themePreset() {
        return parentContext?.themePreset ?? 'antdv'
      },
      get theme() {
        return mergedTheme.value
      },
      get locale() {
        return props.locale ?? parentContext?.locale ?? 'zh-CN'
      },
      get locales() {
        return mergedLocales.value
      },
      get localeOverrides() {
        return mergedLocaleOverrides.value
      },
    }) as VTableGuildContext

    provide(VTABLE_GUILD_INJECTION_KEY, context)

    return () => slots.default?.()
  },
})
