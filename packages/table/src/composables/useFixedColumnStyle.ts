import { computed, inject, type ComputedRef } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getFixedCellCompatClass } from '../utils/compat'
import type { FixedOffset } from './useScroll'

export interface UseFixedColumnStyleReturn {
  /** sticky 定位样式，非固定列返回 undefined */
  fixedStyle: ComputedRef<Record<string, string> | undefined>
  /** 固定列阴影 class（滚动到边界时隐藏对应侧阴影） */
  fixedClass: ComputedRef<string>
}

/**
 * 固定列 sticky 样式与阴影 class 的共享实现。
 *
 * fixedInfo 的取得方式因场景而异（单列 / 分组表头叶子列 / summary 按 index），
 * 由调用方以 getter 传入；fixedStyle/fixedClass 的推导三处完全一致，收敛于此。
 */
export function useFixedColumnStyle(options: {
  fixedInfo: () => FixedOffset | null
}): UseFixedColumnStyleReturn {
  const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

  const fixedStyle = computed(() => {
    const info = options.fixedInfo()
    if (!info) return undefined
    const style: Record<string, string> = { position: 'sticky', zIndex: '2' }
    if (info.left !== undefined) style.left = `${info.left}px`
    if (info.right !== undefined) style.right = `${info.right}px`
    return style
  })

  const fixedClass = computed(() => {
    const info = options.fixedInfo()
    if (!info) return ''
    const compatClass = getFixedCellCompatClass(tableContext, info)
    const sub = tableContext.subThemeSlots
    if (!sub) return compatClass
    const classes: string[] = []
    const atStart = tableContext.scrollState?.atStart.value ?? true
    const atEnd = tableContext.scrollState?.atEnd.value ?? true
    if (info.isLastLeft && !atStart) {
      classes.push(sub.fixedShadowLeft())
    }
    if (info.isFirstRight && !atEnd) {
      classes.push(sub.fixedShadowRight())
    }
    if (compatClass) classes.push(compatClass)
    return classes.join(' ')
  })

  return { fixedStyle, fixedClass }
}
