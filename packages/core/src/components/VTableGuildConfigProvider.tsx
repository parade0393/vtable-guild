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
  VTableGuildCssMode,
} from '../index'
import { mergeDeep } from '../utils/mergeDeep'
import { normalizeVtgClassPrefix } from '../utils/classPrefix'
import { mergeThemeConfigs } from '../composables/useTheme'
import { VTABLE_GUILD_INJECTION_KEY } from '../plugin/index'

export default defineComponent({
  name: 'VTableGuildConfigProvider',
  props: {
    theme: {
      type: Object as PropType<VTableGuildThemeOverrides>,
      default: undefined,
    },
    cssMode: {
      type: String as PropType<VTableGuildCssMode>,
      default: undefined,
    },
    classPrefix: {
      type: String,
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
      const parent = parentContext?.theme ?? ({} as Record<string, Partial<ThemeConfig>>)
      const child = props.theme ?? ({} as Record<string, Partial<ThemeConfig>>)
      if (!Object.keys(child).length) return parent as VTableGuildThemeOverrides
      const keys = new Set([...Object.keys(parent), ...Object.keys(child)])
      const result = {} as Record<string, Partial<ThemeConfig>>
      for (const key of keys) {
        const b = (parent as Record<string, Partial<ThemeConfig>>)[key]
        const o = (child as Record<string, Partial<ThemeConfig>>)[key]
        result[key] = b && o ? mergeThemeConfigs(b as ThemeConfig, o) : (o ?? b!)
      }
      return result as VTableGuildThemeOverrides
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
      get cssMode() {
        return props.cssMode ?? parentContext?.cssMode ?? 'prebuilt'
      },
      get classPrefix() {
        return normalizeVtgClassPrefix(props.classPrefix ?? parentContext?.classPrefix)
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
      // 兼容类名只在安装时配置，这里透传父级即可；漏掉会让嵌套 provider 下的表格
      // 静默丢失 ant-table-* 类名。
      get compatClass() {
        return parentContext?.compatClass
      },
    }) as VTableGuildContext

    provide(VTABLE_GUILD_INJECTION_KEY, context)

    return () => slots.default?.()
  },
})
