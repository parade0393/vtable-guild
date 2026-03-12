// packages/core/src/plugin/index.ts

import { reactive, type InjectionKey, type Plugin } from 'vue'
import type { VTableGuildOptions, VTableGuildContext } from '../utils/types'

/**
 * 全局配置的 injection key。
 *
 * 使用 Symbol 确保唯一性，避免多实例冲突。
 * 导出供 useTheme 中 inject 使用。
 */
export const VTABLE_GUILD_INJECTION_KEY: InjectionKey<VTableGuildContext> = Symbol('vtable-guild')

export function syncDocumentPresetAttr(themePreset: VTableGuildContext['themePreset']) {
  if (typeof document === 'undefined') return

  if (themePreset === 'antdv') {
    document.documentElement.removeAttribute('data-vtg-preset')
    return
  }

  document.documentElement.setAttribute('data-vtg-preset', themePreset)
}

/**
 * 创建 vtable-guild 的 Vue 插件。
 *
 * @example
 * ```ts
 * // main.ts
 * import { createApp } from 'vue'
 * import { createVTableGuild } from '@vtable-guild/core'
 *
 * const app = createApp(App)
 *
 * const vtg = createVTableGuild({
 *   theme: {
 *     table: {
 *       slots: { th: 'bg-blue-50 font-bold' },
 *       defaultVariants: { size: 'sm' },
 *     },
 *   },
 * })
 *
 * app.use(vtg)
 * ```
 */
export function createVTableGuild(options: VTableGuildOptions = {}): Plugin {
  return {
    install(app) {
      const context = reactive({
        themePreset: options.themePreset ?? 'antdv',
        theme: options.theme ?? {},
        locale: options.locale ?? 'zh-CN',
        locales: options.locales ?? {},
        localeOverrides: options.localeOverrides ?? {},
      }) as VTableGuildContext

      app.provide(VTABLE_GUILD_INJECTION_KEY, context)

      syncDocumentPresetAttr(context.themePreset)
    },
  }
}
