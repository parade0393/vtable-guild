import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { Locale } from 'ant-design-vue/es/locale'
import type { ThemePresetName } from '@vtable-guild/vtable-guild'
import type { BuiltInLocaleName } from '@vtable-guild/vtable-guild'

export interface PlaygroundContextValue {
  preset: Ref<ThemePresetName>
  locale: Ref<BuiltInLocaleName>
  // 用 antdv 自己的 Locale 而不是 Record<string, unknown>：
  // AConfigProvider 的 locale prop 要求完整 Locale，宽类型反而处处报 TS2322。
  antLocale: ComputedRef<Locale>
}

export const PLAYGROUND_CONTEXT_KEY: InjectionKey<PlaygroundContextValue> =
  Symbol('playground-context')
