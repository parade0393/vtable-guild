import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { ThemePresetName } from '@vtable-guild/vtable-guild'
import type { BuiltInLocaleName } from '@vtable-guild/vtable-guild'

export interface PlaygroundContextValue {
  preset: Ref<ThemePresetName>
  locale: Ref<BuiltInLocaleName>
  antLocale: ComputedRef<Record<string, unknown>>
}

export const PLAYGROUND_CONTEXT_KEY: InjectionKey<PlaygroundContextValue> =
  Symbol('playground-context')
