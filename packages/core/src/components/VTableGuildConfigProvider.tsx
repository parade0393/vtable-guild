import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  provide,
  reactive,
  watchEffect,
} from 'vue'
import type { PropType } from 'vue'
import type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  ThemePresetName,
  VTableGuildContext,
  VTableGuildLocale,
  VTableGuildThemeOverrides,
} from '../utils/types'
import { mergeDeep } from '../utils/mergeDeep'
import { VTABLE_GUILD_INJECTION_KEY, syncDocumentPresetAttr } from '../plugin/index'

export default defineComponent({
  name: 'VTableGuildConfigProvider',
  props: {
    themePreset: { type: String as PropType<ThemePresetName>, default: undefined },
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

    const mergedTheme = computed(() => ({
      ...(parentContext?.theme ?? {}),
      ...(props.theme ?? {}),
    }))

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
        return props.themePreset ?? parentContext?.themePreset ?? 'antdv'
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

    watchEffect(() => {
      syncDocumentPresetAttr(context.themePreset)
    })

    onBeforeUnmount(() => {
      syncDocumentPresetAttr(parentContext?.themePreset ?? 'antdv')
    })

    return () => slots.default?.()
  },
})
