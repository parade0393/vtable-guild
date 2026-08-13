// packages/core/src/composables/useTheme.ts

import { computed, inject, unref, type MaybeRef } from 'vue'
import { cn } from '../utils/tv'
import { tv } from '../utils/tv'
import { VTABLE_GUILD_INJECTION_KEY } from '../plugin/index'
import type { ThemeConfig, VTableGuildContext } from '../index'
import { cnByCssMode, prefixThemeConfig } from '../utils/classPrefix'

export interface CompatClassConfig {
  slots?: Record<string, string>
  variants?: Record<string, Record<string, Record<string, string>>>
}

export interface UseThemeOptions {
  /** 兼容类名映射表；仅当全局 compatClass 开启时生效（安装时读取一次，非响应式） */
  compatClasses?: CompatClassConfig
}

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
 *   size?: 'small' | 'middle' | 'large'
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
  options?: UseThemeOptions,
) {
  // ========== Layer 2: 通过 inject 获取全局配置 ==========
  const globalContext = inject<VTableGuildContext | null>(VTABLE_GUILD_INJECTION_KEY, null)
  const cssMode = computed(() => globalContext?.cssMode ?? 'prebuilt')
  const classPrefix = computed(() => globalContext?.classPrefix ?? 'vtg')

  // 兼容类名开关：安装时读取一次（只读，不支持运行时切换）
  const compatConfig = globalContext?.compatClass ? options?.compatClasses : undefined

  // 兼容类名与 variant props 同源，用独立 computed 缓存（未开启时为 null，零开销）
  const _compatSlotClasses = compatConfig
    ? computed(() => {
        const globalTheme = (
          globalContext?.theme as Record<string, Partial<ThemeConfig>> | undefined
        )?.[componentName]
        const defaultVariants = {
          ...unref(defaultTheme).defaultVariants,
          ...globalTheme?.defaultVariants,
        }
        return resolveCompatClasses(compatConfig, props, defaultVariants)
      })
    : null

  // 内部 computed：缓存 merge + tv() 的计算结果
  // 仅在 variant props 变化时重算，ui/class 变化不触发
  const _slotFns = computed(() => {
    const resolvedDefaultTheme = prefixThemeConfig(
      unref(defaultTheme),
      cssMode.value,
      classPrefix.value,
    )
    const globalTheme = (
      globalContext?.theme as Record<string, Partial<ThemeConfig>> | undefined
    )?.[componentName]
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
      const merged = cnByCssMode(cssMode.value, classPrefix.value, base, uiClass, extraClass) ?? ''

      // 兼容类名不是 Tailwind utility，绝不能进入 tailwind-merge 管道
      //（classPrefix: 'ant' 时会被反前缀成真实工具类），故在管道之外前置拼接
      const compatClass = _compatSlotClasses?.value[slotName]
      if (!compatClass) return merged
      return merged ? `${compatClass} ${merged}` : compatClass
    }
  }

  return {
    slots: slots as Record<keyof T['slots'] & string, () => string>,
  }
}

// ---------- 内部辅助函数 ----------

/**
 * 解析兼容类名映射表 → 每 slot 的最终 class 字符串。
 *
 * variant 值优先读 props，缺省回落 defaultVariants；命中的 class 与 slots 基础 class
 * 拼接后做 Set 去重（同一 slot 可能被 slots 与多个 variant 同时命中同名类）。
 */
function resolveCompatClasses(
  config: CompatClassConfig,
  props: Record<string, unknown>,
  defaultVariants: Record<string, unknown>,
): Record<string, string> {
  const perSlot: Record<string, string[]> = {}

  for (const [slot, className] of Object.entries(config.slots ?? {})) {
    ;(perSlot[slot] ??= []).push(className)
  }

  for (const [variantName, values] of Object.entries(config.variants ?? {})) {
    const raw =
      variantName in props && props[variantName] !== undefined
        ? props[variantName]
        : defaultVariants[variantName]
    if (raw === undefined || raw === null) continue
    const hit = values[String(raw)]
    if (!hit) continue
    for (const [slot, className] of Object.entries(hit)) {
      ;(perSlot[slot] ??= []).push(className)
    }
  }

  const result: Record<string, string> = {}
  for (const [slot, classNames] of Object.entries(perSlot)) {
    result[slot] = [...new Set(classNames.join(' ').split(/\s+/).filter(Boolean))].join(' ')
  }
  return result
}

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
    // 示例：base.variants.size.small = { th: 'px-2' },
    //       override.variants.size.small = { th: 'px-3' }
    //     → { th: cn('px-2', 'px-3') } → { th: 'px-3' }
    variants: mergeVariants(base.variants, override.variants),

    // ---- defaultVariants: 浅合并 ----
    // 示例：base = { size: 'large', bordered: false },
    //       override = { size: 'small' }
    //     → { size: 'small', bordered: false }
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
