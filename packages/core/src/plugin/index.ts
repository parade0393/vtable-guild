// packages/core/src/plugin/index.ts

import type { InjectionKey, Plugin } from 'vue'
import type { VTableGuildOptions, VTableGuildContext } from '../utils/types'

/**
 * 全局配置的 injection key。
 *
 * 使用 Symbol 确保唯一性，避免多实例冲突。
 * 导出供 useTheme 中 inject 使用。
 */
export const VTABLE_GUILD_INJECTION_KEY: InjectionKey<VTableGuildContext> = Symbol('vtable-guild')

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
      const context: VTableGuildContext = {
        themePreset: options.themePreset ?? 'antdv',
        theme: options.theme ?? {},
      }

      app.provide(VTABLE_GUILD_INJECTION_KEY, context)

      // Auto-set data-vtg-preset on <html> so the preset CSS variables take effect
      if (context.themePreset !== 'antdv' && typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-vtg-preset', context.themePreset)
      }
    },
  }
}
