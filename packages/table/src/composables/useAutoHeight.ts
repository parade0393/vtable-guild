import { onBeforeUnmount, onMounted, shallowRef, watch, type ShallowRef } from 'vue'
import { devWarn } from '@vtable-guild/core'

export interface UseAutoHeightOptions {
  /** 关闭时不测量、不注册 observer，bodyHeight 恒为 undefined。 */
  enabled: () => boolean
  /** 内容区 wrapper：表头 / 表体 / 固定 summary 的共同父级。 */
  wrapperEl: () => HTMLElement | null
  /** 表头块（useScroll 的 headerWrapRef）。缺失（showHeader: false）时不扣减。 */
  headerEl: () => HTMLElement | null
  /** 固定 summary 块。缺失（无 summary 或不固定）时不扣减。 */
  summaryEl?: () => HTMLElement | null
  /** 是否有数据。空数据时容器再矮也属正常，不提示配置问题。 */
  hasData: () => boolean
}

export interface UseAutoHeightReturn {
  /**
   * 实测表体最大高度 = wrapper − 表头 − 固定 summary（向下取整，钳制 ≥1px）。
   * undefined 表示尚未测得（未挂载 / ref 异常），调用方此时暂不约束高度。
   */
  bodyHeight: ShallowRef<number | undefined>
}

/** 1px 以内的差异不算变化——避免子像素抖动反复推倒表体布局。 */
const HEIGHT_EPSILON = 0.5

/**
 * 可用高度的最低值。
 *
 * 0 会触发 core `VirtualList` 的 falsy 窗口化检查导致全量渲染；隐藏容器
 * （display:none）量到 0 高时同样钳到 1px，等它显示后 ResizeObserver 会纠正。
 */
const MIN_BODY_HEIGHT = 1

/**
 * 可见状态下连续测不到可用高度达到该次数才告警。
 *
 * 单次为 0 可能只是挂载帧的瞬时布局，连两次仍为 0 基本就是高度链断了
 * （父容器没有确定高度、flex 祖先缺 min-height: 0）。
 */
const UNAVAILABLE_WARN_STREAK = 2

/**
 * `scroll.y: 'auto'` 的实测表体高度。
 *
 * 观察 wrapper + 表头 + 固定 summary 三个元素（表头高度会随分组表头、size
 * 预设独立变化），任一尺寸变化都重算。**不会震荡**：wrapper 高度由父容器
 * 的 flex 布局决定，表体 maxHeight 只封顶内容，不反过来改变 wrapper 高度。
 *
 * 挂载与 ref 换绑后**立即同步测量一次**再注册 observer：ResizeObserver 的
 * 首次回调要等下一渲染帧，不主动测的话首帧会以未约束高度绘制。
 */
export function useAutoHeight(options: UseAutoHeightOptions): UseAutoHeightReturn {
  const bodyHeight = shallowRef<number | undefined>(undefined)

  let rafId = 0
  let resizeObserver: ResizeObserver | null = null
  let observed: HTMLElement[] = []
  let unavailableStreak = 0
  /** 上一次的原始可用高度（未取整），供子像素去重。 */
  let lastRaw: number | undefined

  function warnIfUnavailable(height: number | undefined) {
    const wrapper = options.wrapperEl()
    // display:none 的容器 rects 为空（隐藏 tab、折叠面板），不视为配置问题。
    const visible = !!wrapper && wrapper.getClientRects().length > 0
    const unavailable =
      visible && options.hasData() && height !== undefined && height <= MIN_BODY_HEIGHT
    if (!unavailable) {
      unavailableStreak = 0
      return
    }
    unavailableStreak += 1
    if (unavailableStreak === UNAVAILABLE_WARN_STREAK) {
      devWarn(
        'vtable-auto-height-unavailable',
        "[VTable] scroll.y: 'auto' 需要父容器有确定高度；连续测不到可用表体高度" +
          '（父容器高度为 0 或不大于表头占用）。请检查高度链：flex 布局的收缩祖先需要 min-height: 0。',
      )
    }
  }

  function flush() {
    rafId = 0
    if (!options.enabled()) {
      bodyHeight.value = undefined
      lastRaw = undefined
      unavailableStreak = 0
      return
    }

    const wrapper = options.wrapperEl()
    if (!wrapper) {
      lastRaw = undefined
      if (bodyHeight.value !== undefined) bodyHeight.value = undefined
      warnIfUnavailable(undefined)
      return
    }

    const headerHeight = options.headerEl()?.getBoundingClientRect().height ?? 0
    const summaryHeight = options.summaryEl?.()?.getBoundingClientRect().height ?? 0
    // getBoundingClientRect 保留子像素精度。**先按原始值去重再取整**：
    // floor 之后整数差恒 ≥ 1，epsilon 去重就失效了。
    const available = wrapper.getBoundingClientRect().height - headerHeight - summaryHeight
    if (lastRaw !== undefined && Math.abs(available - lastRaw) <= HEIGHT_EPSILON) {
      warnIfUnavailable(bodyHeight.value)
      return
    }
    lastRaw = available

    // 向下取整避免表体高出可用区半像素、把 wrapper 撑出自己的滚动条；
    // 钳到 ≥1 保住虚拟路径（0 会被 core VirtualList 当 falsy 关闭窗口化）。
    const next = Math.max(MIN_BODY_HEIGHT, Math.floor(available))
    if (bodyHeight.value !== next) {
      bodyHeight.value = next
    }
    warnIfUnavailable(next)
  }

  /**
   * ResizeObserver 回调合并到下一帧执行。
   *
   * 拖拽窗口 / 浏览器缩放时 observer 会连发，逐次读 rect 会把强制布局
   * 搬进连续帧；合并后每帧至多量一次。
   */
  function schedule() {
    if (typeof requestAnimationFrame === 'undefined') {
      flush()
      return
    }
    if (rafId) return
    rafId = requestAnimationFrame(flush)
  }

  function syncObserver() {
    const next = options.enabled()
      ? [options.wrapperEl(), options.headerEl(), options.summaryEl?.() ?? null].filter(
          (el): el is HTMLElement => !!el,
        )
      : []
    if (next.length === observed.length && next.every((el, index) => el === observed[index])) {
      return
    }

    resizeObserver?.disconnect()
    observed = next

    if (next.length > 0) {
      if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(schedule)
      }
      for (const el of next) resizeObserver?.observe(el)
    }
  }

  watch(
    [
      () => options.enabled(),
      () => options.wrapperEl(),
      () => options.headerEl(),
      () => options.summaryEl?.() ?? null,
      // 数据后到时重估「测不到高度」的告警条件（空数据不算配置问题）。
      () => options.hasData(),
    ],
    () => {
      syncObserver()
      flush()
    },
    { flush: 'post' },
  )

  onMounted(() => {
    syncObserver()
    flush()
  })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    resizeObserver = null
    observed = []
  })

  return { bodyHeight }
}
