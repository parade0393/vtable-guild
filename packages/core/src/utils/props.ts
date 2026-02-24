import type { PropType } from 'vue'

/**
 * 定义一个可选的 prop，提供类型推导和默认值支持。
 *
 * @example
 * ```ts
 * export const tableProps = {
 *   size: optionalProp<'sm' | 'md' | 'lg'>('md'),
 *   bordered: optionalBoolProp(false),
 * }
 * ```
 */
export function optionalProp<T>(defaultValue?: T) {
  return {
    type: [String, Number, Boolean, Object, Array, Function] as unknown as PropType<T>,
    required: false as const,
    default: defaultValue,
  }
}

/**
 * 定义一个必选的 prop。
 */
export function requiredProp<T>() {
  return {
    type: [String, Number, Boolean, Object, Array, Function] as unknown as PropType<T>,
    required: true as const,
  }
}

/**
 * 定义一个可选的 boolean prop。
 */
export function optionalBoolProp(defaultValue = false) {
  return {
    type: Boolean,
    required: false as const,
    default: defaultValue,
  }
}

/**
 * 定义一个可选的 string prop。
 */
export function optionalStringProp(defaultValue?: string) {
  return {
    type: String,
    required: false as const,
    default: defaultValue,
  }
}
