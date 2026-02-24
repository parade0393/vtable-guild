// packages/core/src/composables/useTheme.ts

import { computed, inject } from 'vue'
import { cn } from '../utils/tv'
import { tv } from '../utils/tv'
import { VTABLE_GUILD_INJECTION_KEY } from '../plugin/index'
import type { ThemeConfig, SlotProps, VTableGuildContext } from '../utils/types'
import type { ComputedRef } from 'vue'

/**
 * 三层主题合并 composable。
 *
 * 将默认主题 → 全局配置 → 实例级 props 合并为最终的 slot class 函数。
 *
 * @param componentName - 组件名（如 'table'），用于查找全局配置中对应的主题
 * @param defaultTheme  - 来自 @vtable-guild/theme 的默认主题配置
 * @param props         - 组件 props（含 variant props + ui + class）
 *
 * @returns `{ slots }` — slots 是一个对象，每个 key 是 slot 名，值是返回 class 字符串的函数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@vtable-guild/core'
 * import { tableTheme } from '@vtable-guild/theme'
 *
 * const props = defineProps<{
 *   size?: 'sm' | 'md' | 'lg'
 *   bordered?: boolean
 *   ui?: Partial<Record<string, string>>
 *   class?: string
 * }>()
 *
 * const { slots } = useTheme('table', tableTheme, props)
 * </script>
 *
 * <template>
 *   <div :class="slots.root()">
 *     <table :class="slots.table()">...</table>
 *   </div>
 * </template>
 * ```
 */
export function useTheme<T extends ThemeConfig>(
  componentName: string,
  defaultTheme: T,
  props: Record<string, unknown>,
) {
  // ========== Layer 2: 通过 inject 获取全局配置 ==========
  const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

  const slots = computed(() => {
    // 获取该组件的全局主题覆盖
    const globalTheme = globalContext?.theme?.[componentName] as Partial<ThemeConfig> | undefined

    // ========== 合并三层配置 ==========
    const merged = mergeThemeConfigs(defaultTheme, globalTheme)

    // ========== 调用 tv() 生成 slot class 函数 ==========
    const tvResult = tv(merged as Parameters<typeof tv>[0])

    // ========== 提取 variant props ==========
    const variantProps: Record<string, unknown> = {}
    if (merged.variants) {
      for (const key of Object.keys(merged.variants)) {
        if (key in props && props[key] !== undefined) {
          variantProps[key] = props[key]
        }
      }
    }

    // 调用 tv 结果获取各 slot 的 class 函数
    const slotFns = tvResult(variantProps) as Record<string, () => string>

    // ========== Layer 3: 实例级 ui prop 和 class prop 覆盖 ==========
    const ui = (props.ui ?? {}) as SlotProps<T>
    const classProp = (props.class ?? '') as string

    // 构建最终的 slots 对象
    const result: Record<string, () => string> = {}

    for (const slotName of Object.keys(defaultTheme.slots)) {
      result[slotName] = () => {
        const base =
          typeof slotFns[slotName] === 'function'
            ? slotFns[slotName]()
            : ((slotFns[slotName] as string) ?? '')

        // ui prop 覆盖对应 slot
        const uiClass = (ui as Record<string, string>)[slotName] ?? ''

        // class prop 仅作用于 root slot
        const extraClass = slotName === 'root' ? classProp : ''

        // 通过 cn() 合并（cn 底层调用 tailwind-merge 处理 class 冲突）
        return cn(base, uiClass, extraClass) ?? ''
      }
    }

    return result
  })

  return {
    slots: slots as ComputedRef<Record<keyof T['slots'] & string, () => string>>,
  }
}

// ---------- 内部辅助函数 ----------

/**
 * 合并两层主题配置（默认主题 + 全局配置）。
 *
 * 合并策略（逐字段）：
 * - slots:           tailwind-merge 智能合并（冲突后者胜，非冲突保留）
 * - variants:        深合并（同名 variant 的同名值做 tailwind-merge 合并）
 * - defaultVariants: 浅合并（Object.assign，用户覆盖默认）
 * - compoundVariants: 追加（用户规则在后，优先级更高）
 * - compoundSlots:   追加（同上）
 */
function mergeThemeConfigs(base: ThemeConfig, override?: Partial<ThemeConfig>): ThemeConfig {
  if (!override) return base

  return {
    // ---- slots: cn() 智能合并 ----
    // 示例：base.th = 'px-4 text-left', override.th = 'px-6'
    //     → cn('px-4 text-left', 'px-6') → 'text-left px-6'
    slots: mergeSlots(base.slots, override.slots),

    // ---- variants: 深合并 ----
    // 示例：base.variants.size.sm = { th: 'px-2' },
    //       override.variants.size.sm = { th: 'px-3' }
    //     → { th: cn('px-2', 'px-3') } → { th: 'px-3' }
    variants: mergeVariants(base.variants, override.variants),

    // ---- defaultVariants: 浅合并 ----
    // 示例：base = { size: 'md', bordered: false },
    //       override = { size: 'sm' }
    //     → { size: 'sm', bordered: false }
    defaultVariants: {
      ...base.defaultVariants,
      ...override.defaultVariants,
    },

    // ---- compoundVariants: 追加 ----
    // 用户的规则追加到末尾，tailwind-variants 按顺序处理，后者优先级更高
    compoundVariants: [...(base.compoundVariants ?? []), ...(override.compoundVariants ?? [])],

    // ---- compoundSlots: 追加 ----
    compoundSlots: [...(base.compoundSlots ?? []), ...(override.compoundSlots ?? [])],
  }
}

/**
 * 合并 slots：对每个同名 slot 做 cn() 合并。
 */
function mergeSlots(
  base: Record<string, string>,
  override?: Record<string, string>,
): Record<string, string> {
  if (!override) return base

  const result = { ...base }
  for (const [key, value] of Object.entries(override)) {
    result[key] = key in base ? (cn(base[key], value) ?? '') : value
  }
  return result
}

/**
 * 合并 variants：对同名 variant 的同名值做深合并。
 */
function mergeVariants(
  base?: Record<string, Record<string, Record<string, string> | string>>,
  override?: Record<string, Record<string, Record<string, string> | string>>,
): Record<string, Record<string, Record<string, string> | string>> | undefined {
  if (!base && !override) return undefined
  if (!base) return override
  if (!override) return base

  const result = { ...base }

  for (const [variantName, variantValues] of Object.entries(override)) {
    if (!(variantName in result)) {
      // 新 variant，直接加入
      result[variantName] = variantValues
    } else {
      // 同名 variant，逐值合并
      const baseValues = result[variantName]
      const merged = { ...baseValues }

      for (const [valueName, slotClasses] of Object.entries(variantValues)) {
        if (!(valueName in merged)) {
          merged[valueName] = slotClasses
        } else {
          const baseSlot = merged[valueName]
          if (typeof baseSlot === 'string' && typeof slotClasses === 'string') {
            // 都是字符串，cn() 合并
            merged[valueName] = cn(baseSlot, slotClasses) ?? ''
          } else if (typeof baseSlot === 'object' && typeof slotClasses === 'object') {
            // 都是对象（slot → class），逐 slot 合并
            const mergedSlot = { ...baseSlot }
            for (const [slot, cls] of Object.entries(slotClasses)) {
              mergedSlot[slot] = slot in mergedSlot ? (cn(mergedSlot[slot], cls) ?? '') : cls
            }
            merged[valueName] = mergedSlot
          } else {
            // 类型不同，后者覆盖
            merged[valueName] = slotClasses
          }
        }
      }

      result[variantName] = merged
    }
  }

  return result
}
