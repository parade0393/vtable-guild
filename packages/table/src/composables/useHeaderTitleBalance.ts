import { onScopeDispose, shallowRef, watch, type Ref } from 'vue'

/**
 * 在标题左侧预留与右侧控件实际占用相同的空间，使标题以整列为基准居中。
 * 只测量现有布局，不推断预设、图标数量或自定义图标的宽度；样式由主题消费。
 */
export function useHeaderTitleBalance(
  enabled: Ref<boolean>,
  innerRef: Ref<HTMLElement | null>,
  titleRef: Ref<HTMLElement | null>,
  filterRef: Ref<HTMLElement | null> = shallowRef(null),
  sortRef: Ref<HTMLElement | null> = shallowRef(null),
): Ref<number> {
  const spacerWidth = shallowRef(0)
  let observer: ResizeObserver | undefined
  let frame: number | undefined
  let disposed = false

  function measure() {
    frame = undefined
    const inner = innerRef.value
    const title = titleRef.value
    if (disposed || !enabled.value || !inner || !title) {
      spacerWidth.value = 0
      return
    }

    const innerRect = inner.getBoundingClientRect()
    if (innerRect.width <= 0 || !Number.isFinite(innerRect.width)) {
      spacerWidth.value = 0
      return
    }

    // rect 是视觉尺寸，CSS 变量需要布局尺寸。只在差异超过 offsetWidth 的
    // 整数舍入误差时归一化，从而保留普通布局的子像素精度并兼容缩放容器。
    const layoutWidth = inner.offsetWidth
    const scale =
      layoutWidth > 0 && Math.abs(innerRect.width - layoutWidth) > 1
        ? innerRect.width / layoutWidth
        : 1
    const width = innerRect.width / scale
    function marginBox(control: HTMLElement | null) {
      if (!control) return 0
      const style = getComputedStyle(control)
      return (
        control.getBoundingClientRect().width / scale +
        (Number.parseFloat(style.marginLeft) || 0) +
        (Number.parseFloat(style.marginRight) || 0)
      )
    }
    // 直接量控件的 margin box，负 margin 也算入原布局占用；不要从标题边界
    // 反推宽度，否则标题缩至 0 后旧占位可能反过来影响测量结果。
    const controlsWidth = Math.max(0, marginBox(filterRef.value) + marginBox(sortRef.value))
    // 极窄列优先保留右侧控件，不让平衡占位把它们挤出列边界。
    const next = Math.min(controlsWidth, Math.max(0, width - controlsWidth))
    if (Math.abs(spacerWidth.value - next) > 0.01) spacerWidth.value = next
  }

  function cancelFrame() {
    if (frame !== undefined && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(frame)
    }
    frame = undefined
  }

  function schedule() {
    if (disposed || frame !== undefined) return
    if (typeof requestAnimationFrame === 'undefined') {
      measure()
      return
    }
    frame = requestAnimationFrame(measure)
  }

  watch(
    [enabled, innerRef, titleRef, filterRef, sortRef],
    ([active, inner, title, filter, sort]) => {
      cancelFrame()
      observer?.disconnect()
      observer = undefined
      measure()
      if (!active || !inner || !title || typeof ResizeObserver === 'undefined') return
      observer = new ResizeObserver(schedule)
      // 标题会随自定义筛选图标宽度变化而收缩；外层负责列宽/显示状态变化。
      observer.observe(inner)
      observer.observe(title)
      // 极窄列里标题可能已缩到 0，此时图标继续变宽只改变其位置，不会
      // 触发标题或外层 resize，必须直接观察筛选控件本身。
      if (filter) observer.observe(filter)
      if (sort) observer.observe(sort)
    },
    { immediate: true, flush: 'post' },
  )

  onScopeDispose(() => {
    disposed = true
    cancelFrame()
    observer?.disconnect()
  })

  return spacerWidth
}
