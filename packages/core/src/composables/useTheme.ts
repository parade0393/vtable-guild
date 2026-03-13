// packages/core/src/composables/useTheme.ts

import { computed, inject, unref, type MaybeRef } from 'vue'
import { cn } from '../utils/tv'
import { tv } from '../utils/tv'
import { VTABLE_GUILD_INJECTION_KEY } from '../plugin/index'
import type { ThemeConfig, VTableGuildContext } from '../utils/types'

/**
 * 三层主题合并 composable。
 *
 * 将默认主题 → 全局配置 → 实例级 props 合并为最终的 slot class 函数。
 *
 * @param componentName - 组件名（如 'table'），用于查找全局配置中对应的主题
 * @param defaultTheme  - 来自 @vtable-guild/theme 的默认主题配置
 * @param props         - 组件 props，必须是响应式对象（defineComponent 的 props 参数）
 *
 * @returns `{ slots }` — slots 是普通对象（非 ComputedRef），每个 key 是 slot 名，
 *          值是返回 class 字符串的函数。函数引用在 setup 阶段创建后不变，
 *          内部通过闭包懒读取 computed，保证响应性。
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
  defaultTheme: MaybeRef<T>,
  props: Record<string, unknown>,
) {
  // ========== Layer 2: 通过 inject 获取全局配置 ==========
  const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)

  // 内部 computed：缓存 merge + tv() 的计算结果
  // 仅在 variant props 变化时重算，ui/class 变化不触发
  const _slotFns = computed(() => {
    const resolvedDefaultTheme = unref(defaultTheme)
    const globalTheme = globalContext?.theme?.[componentName] as Partial<ThemeConfig> | undefined
    const merged = mergeThemeConfigs(resolvedDefaultTheme, globalTheme)
    const tvResult = tv(merged as Parameters<typeof tv>[0])

    const variantProps: Record<string, unknown> = {}
    if (merged.variants) {
      for (const key of Object.keys(merged.variants)) {
        if (key in props && props[key] !== undefined) {
          variantProps[key] = props[key]
        }
      }
    }

    return tvResult(variantProps) as Record<string, () => string>
  })

  // 稳定函数引用：setup 阶段创建一次，identity 不变
  const slots = {} as Record<string, () => string>
  for (const slotName of Object.keys(unref(defaultTheme).slots)) {
    slots[slotName] = () => {
      const fns = _slotFns.value // render 阶段访问 → Vue 追踪依赖
      const base =
        typeof fns[slotName] === 'function' ? fns[slotName]() : ((fns[slotName] as string) ?? '')

      // ui prop 覆盖对应 slot
      const ui = (props.ui ?? {}) as Record<string, string>
      const uiClass = ui[slotName] ?? ''

      // class prop 仅作用于 root slot
      const extraClass = slotName === 'root' ? ((props.class ?? '') as string) : ''

      // 通过 cn() 合并（cn 底层调用 tailwind-merge 处理 class 冲突）
      return cn(base, uiClass, extraClass) ?? ''
    }
  }

  return {
    slots: slots as Record<keyof T['slots'] & string, () => string>,
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
export function mergeThemeConfigs(base: ThemeConfig, override?: Partial<ThemeConfig>): ThemeConfig {
  if (!override) return base

  return {
    // ---- slots: cn() 智能合并 ----
    // 示例：base.th = 'px-4 text-left', override.th = 'px-6'
    //     → cn('px-4 text-left', 'px-6') → 'text-left px-6'
    slots: mergeSlots(base.slots ?? {}, override.slots),

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
