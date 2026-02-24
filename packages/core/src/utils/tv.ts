import { createTV, cn as cnBase, type TV } from 'tailwind-variants'

/**
 * 项目统一的 tv() 实例。
 *
 * 通过 createTV 预配置 tailwind-merge，所有组件共用一份 merge 规则。
 * 所有组件的主题定义都应通过此函数创建，而非直接使用 tailwind-variants 的 tv()。
 *
 * @example
 * ```ts
 * const table = tv({
 *   slots: {
 *     root: 'w-full',
 *     cell: 'px-4 py-3',
 *   },
 *   variants: {
 *     size: {
 *       sm: { cell: 'px-2 py-1.5 text-xs' },
 *       md: { cell: 'px-4 py-3 text-sm' },
 *     },
 *   },
 * })
 * ```
 */
export const tv: TV = createTV({
  twMerge: true,
  twMergeConfig: {
    // 在此扩展 tailwind-merge 的 class 分组。
    // 如果项目中定义了自定义的 Tailwind 工具类且需要正确的冲突合并，
    // 可以在这里注册。
    //
    // 示例：如果有自定义的 shadow 工具类
    // classGroups: {
    //   shadow: [{ shadow: ['surface', 'elevated'] }],
    // },
  },
})

/**
 * class 拼接 + tailwind-merge 智能合并。
 *
 * 用于 useTheme 中的三层配置合并——合并发生在 tv() 调用之前/之后，
 * 需要手动处理 class 冲突。cn() 是 tailwind-variants 提供的工具函数，
 * 底层调用 tailwind-merge 实现冲突合并。
 *
 * @example
 * ```ts
 * cn('px-4 text-left', 'px-6')  // => 'text-left px-6'
 * cn('text-muted', 'text-primary')  // => 'text-primary'
 * cn('w-full', undefined, 'shadow-md')  // => 'w-full shadow-md'
 * ```
 */
export { cnBase as cn }
