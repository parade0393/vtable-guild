/* eslint-disable @typescript-eslint/no-explicit-any */
import Filler from './Filler'
import useChildren from './hooks/useChildren'
import useFrameWheel from './hooks/useFrameWheel'
import { useGetSize } from './hooks/useGetSize'
import useHeights from './hooks/useHeights'
import useMobileTouchMove from './hooks/useMobileTouchMove'
import useScrollDrag from './hooks/useScrollDrag'
import useScrollTo from './hooks/useScrollTo'
import type { ScrollConfig } from './hooks/useScrollTo'
import VirtualScrollBar from './VirtualScrollBar'
import type { ScrollBarDirectionType, ScrollBarRef } from './VirtualScrollBar'
import { getSpinSize } from './utils/scrollbarUtil'
import { PrefixSums } from './utils/PrefixSums'
import type { ExtraRenderInfo, Key } from './interface'
import type { InnerProps } from './Filler'
import {
  computed,
  createVNode,
  defineComponent,
  onBeforeUnmount,
  ref,
  shallowRef,
  toRaw,
  unref,
  watch,
} from 'vue'
import type { CSSProperties, PropType, VNode } from 'vue'

const EMPTY_DATA: any[] = []
const ScrollStyle: CSSProperties = {
  overflowY: 'auto',
  overflowAnchor: 'none',
}

export interface ScrollInfo {
  x: number
  y: number
}

export type ScrollTo = (arg?: number | ScrollConfig | null) => void

export interface ListRef {
  nativeElement?: HTMLDivElement
  scrollTo: ScrollTo
  getScrollInfo: () => ScrollInfo
  getHorizontalRange: () => number
}

export interface ListProps {
  prefixCls?: string
  data?: any[]
  height?: number
  itemHeight?: number
  fullHeight?: boolean
  itemKey: Key | ((item: any) => Key)
  component?: string
  virtual?: boolean
  direction?: ScrollBarDirectionType
  scrollWidth?: number
  styles?: {
    horizontalScrollBar?: CSSProperties
    horizontalScrollBarThumb?: CSSProperties
    verticalScrollBar?: CSSProperties
    verticalScrollBarThumb?: CSSProperties
  }
  showScrollBar?: boolean | 'optional' | 'hover'
  /**
   * 定高快路径：调用方保证每一项的实际高度等于 `itemHeight`。
   * 开启后跳过全部 DOM 测量，可视区计算恒为 O(1)（见 useHeights 的 disabled 说明）。
   */
  disableHeightMeasure?: boolean
  onScroll?: (e: Event) => void
  onVirtualScroll?: (info: ScrollInfo) => void
  onVisibleChange?: (visibleList: any[], fullList: any[]) => void
  innerProps?: InnerProps
  extraRender?: (info: ExtraRenderInfo) => VNode
}

/** Extracts non-event attrs (filters out keys starting with "on") */
function pureAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith('on')) {
      result[key] = attrs[key]
    }
  }
  return result
}

/**
 * 用已同步好的位置表求可视区。纯函数，不做任何重建——重建由调用方通过
 * `PrefixSums.sync()` 控制，这样滚动路径上只剩两次二分。
 */
function readVisibleRange(
  prefix: PrefixSums,
  dataLength: number,
  offsetTop: number,
  height: number,
): { scrollHeight: number; start: number; end: number; offset: number } {
  let start = prefix.findIndex(offsetTop)
  if (start >= dataLength) start = 0

  let end = prefix.findIndex(offsetTop + height + 1)
  if (end >= dataLength) end = dataLength - 1
  end = Math.min(end + 1, dataLength - 1)

  return {
    scrollHeight: prefix.total,
    start,
    end,
    offset: prefix.offsetOf(start),
  }
}

/**
 * 一次性求可视区（自带位置表构建）。
 *
 * 组件内部**不走这个函数**——它每次调用都会重建整表，正是要避免的开销；
 * 组件持有一个长期存活的 `PrefixSums` 做增量维护。
 * 这里保留导出是为了让「给定各行高度 → 可视区」这条纯逻辑可以被单测直接钉住。
 */
export function getMeasuredVisibleRange(options: {
  dataLength: number
  offsetTop: number
  height: number
  itemHeight: number
  getItemHeight: (index: number) => number | undefined
}): { scrollHeight: number; start: number; end: number; offset: number } {
  const { dataLength, offsetTop, height, itemHeight, getItemHeight } = options
  const prefix = new PrefixSums()
  prefix.sync(dataLength, getItemHeight, itemHeight)
  return readVisibleRange(prefix, dataLength, offsetTop, height)
}

export default defineComponent({
  name: 'VirtualList',
  props: {
    prefixCls: { type: String, default: 'vtg-virtual-list' },
    data: { type: Array as PropType<any[]> },
    height: Number,
    itemHeight: Number,
    fullHeight: { type: Boolean, default: true },
    itemKey: {
      type: [String, Number, Function] as PropType<Key | ((item: any) => Key)>,
      required: true,
    },
    component: { type: String, default: 'div' },
    direction: { type: String as PropType<ScrollBarDirectionType> },
    scrollWidth: Number,
    styles: Object as PropType<ListProps['styles']>,
    showScrollBar: {
      type: [Boolean, String] as PropType<boolean | 'optional' | 'hover'>,
      default: 'optional',
    },
    virtual: { type: Boolean, default: true },
    disableHeightMeasure: { type: Boolean, default: false },
    onScroll: Function as PropType<(e: Event) => void>,
    onVirtualScroll: Function as PropType<(info: ScrollInfo) => void>,
    onVisibleChange: Function as PropType<(visibleList: any[], fullList: any[]) => void>,
    innerProps: Object as PropType<InnerProps>,
    extraRender: Function as PropType<(info: ExtraRenderInfo) => VNode>,
  },
  inheritAttrs: false,
  setup(props, { expose, attrs, slots }) {
    const itemHeight = computed(() => props.itemHeight)

    let itemKeyProp = props.itemKey
    watch(
      () => props.itemKey,
      (val) => {
        itemKeyProp = val
      },
    )

    const getKey = (item: any): Key => {
      const _itemKey = itemKeyProp
      if (typeof _itemKey === 'function') return _itemKey(item)
      return item?.[_itemKey]
    }

    const [setInstanceRef, collectHeight, heights, heightUpdatedMark] = useHeights(
      getKey,
      undefined,
      undefined,
      () => props.disableHeightMeasure,
    )

    const mergedData = shallowRef<any[]>(props?.data || EMPTY_DATA)
    watch(
      () => props.data,
      () => {
        mergedData.value = props?.data || EMPTY_DATA
      },
    )

    const useVirtual = computed(
      () => !!(props.virtual !== false && props.height && props.itemHeight),
    )
    const inVirtual = computed(() => {
      const data = mergedData.value
      return (
        useVirtual.value &&
        data &&
        (props.itemHeight! * data.length > props.height! || !!props.scrollWidth)
      )
    })

    const componentRef = ref<HTMLElement>()
    const fillerInnerRef = ref()
    const containerRef = ref<HTMLDivElement>()
    const rootHovering = ref(false)
    const verticalScrollBarRef = shallowRef<ScrollBarRef>()
    const horizontalScrollBarRef = shallowRef<ScrollBarRef>()

    const offsetTop = ref(0)
    const offsetLeft = ref(0)
    const scrollMoving = ref(false)

    const verticalScrollBarSpinSize = ref(0)
    const horizontalScrollBarSpinSize = ref(0)
    const contentScrollWidth = ref(props.scrollWidth || 0)
    const scrollHeight = ref(0)
    const start = ref(0)
    const end = ref(0)
    const fillerOffset = ref<number | undefined>(undefined)

    function syncScrollTop(newTop: number | ((prev: number) => number)) {
      let value: number
      if (typeof newTop === 'function') value = newTop(offsetTop.value)
      else value = newTop

      const maxScrollHeight = scrollHeight.value - props.height!
      const alignedTop = Math.max(0, Math.min(value, maxScrollHeight || 0))

      if (componentRef.value) componentRef.value.scrollTop = alignedTop
      offsetTop.value = alignedTop
    }

    /**
     * 长期存活的行位置表。只在数据或实测高度变化时增量重建，
     * 滚动本身只做二分——见 PrefixSums 的说明。
     */
    const prefixHeights = new PrefixSums()

    // Calculate visible range
    watch(
      [inVirtual, useVirtual, offsetTop, mergedData, heightUpdatedMark, () => props.height],
      ([, , , nextData, nextMark], prev) => {
        // 先判断这次是被什么触发的，据此决定位置表要不要失效。
        // 只有 offsetTop 变（即纯滚动）时，位置表完全复用。
        if (!prev) {
          prefixHeights.markAllDirty()
        } else {
          const [, , , prevData, prevMark] = prev
          if (nextData !== prevData) prefixHeights.markAllDirty()
          // 高度实测变化只可能发生在已渲染的行上，因此 [0, start) 的前缀仍然有效。
          else if (nextMark !== prevMark) prefixHeights.markDirtyFrom(start.value)
        }

        if (!useVirtual.value) {
          scrollHeight.value = 0
          start.value = 0
          end.value = mergedData.value.length - 1
          fillerOffset.value = undefined
          return
        }

        if (!inVirtual.value) {
          scrollHeight.value = fillerInnerRef.value?.offsetHeight || 0
          start.value = 0
          end.value = mergedData.value.length - 1
          fillerOffset.value = undefined
          return
        }

        const { itemHeight: itemH, height } = props
        const dataLen = mergedData.value.length

        if (!dataLen) {
          scrollHeight.value = 0
          start.value = 0
          end.value = -1
          fillerOffset.value = 0
          return
        }

        // No measured heights yet — use estimated
        if (unref(heights.id) === 0) {
          const safeItemHeight = itemH!
          const safeListHeight = height!
          const startIndex = Math.max(0, Math.floor(offsetTop.value / safeItemHeight))
          const startOffset = startIndex * safeItemHeight
          let endIndex = startIndex + Math.ceil(safeListHeight / safeItemHeight)
          endIndex = Math.min(endIndex + 1, dataLen - 1)

          scrollHeight.value = dataLen * safeItemHeight
          start.value = startIndex
          end.value = endIndex
          fillerOffset.value = startOffset
          return
        }

        const data = toRaw(mergedData.value)
        prefixHeights.sync(dataLen, (index) => heights.get(getKey(data[index])), itemH!)
        const range = readVisibleRange(prefixHeights, dataLen, offsetTop.value, height!)

        scrollHeight.value = range.scrollHeight
        start.value = range.start
        end.value = range.end
        fillerOffset.value = range.offset
      },
      { immediate: true },
    )

    // Correct scroll position after height measurement
    watch(scrollHeight, () => {
      const changedRecord = heights.getRecord()
      if (changedRecord.size === 1) {
        const recordKey = Array.from(changedRecord.keys())[0]
        const prevCacheHeight = changedRecord.get(recordKey)
        const startItem = mergedData.value[start.value]

        if (startItem && prevCacheHeight === undefined) {
          if (getKey(startItem) === recordKey) {
            const diffHeight = heights.get(recordKey)! - props.itemHeight!
            syncScrollTop((ori) => ori + diffHeight)
          }
        }
      }

      if (useVirtual.value && props.height) {
        const maxScrollTop = Math.max(0, scrollHeight.value - props.height)
        if (offsetTop.value > maxScrollTop) syncScrollTop(maxScrollTop)
      }

      heights.resetRecord()
    })

    // Container size tracking
    const size = ref({ width: 0, height: props.height || 0 })

    let holderResizeObserver: ResizeObserver | null = null
    let observedHolder: Element | null = null

    const onHolderResize = (el: Element | null) => {
      if (observedHolder === el) return

      if (holderResizeObserver && observedHolder) {
        holderResizeObserver.unobserve(observedHolder)
      }

      observedHolder = el

      if (el) {
        if (!holderResizeObserver) {
          holderResizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
              const target = entry.target as HTMLElement
              size.value = {
                width: target.offsetWidth,
                height: target.offsetHeight,
              }
              contentScrollWidth.value = props.scrollWidth ?? target.offsetWidth
            }
          })
        }
        holderResizeObserver.observe(el)
      }
    }

    onBeforeUnmount(() => {
      holderResizeObserver?.disconnect()
      holderResizeObserver = null
      observedHolder = null
    })

    const isRTL = computed(() => props.direction === 'rtl')

    const getVirtualScrollInfo = (): ScrollInfo => ({
      x: isRTL.value ? -offsetLeft.value : offsetLeft.value,
      y: offsetTop.value,
    })

    const lastVirtualScrollInfo = ref<ScrollInfo>(getVirtualScrollInfo())

    const triggerScroll = (params?: Partial<ScrollInfo>, force = false) => {
      if (props.onVirtualScroll) {
        const nextInfo: ScrollInfo = {
          ...getVirtualScrollInfo(),
          ...params,
        }
        if (
          force ||
          lastVirtualScrollInfo.value.x !== nextInfo.x ||
          lastVirtualScrollInfo.value.y !== nextInfo.y
        ) {
          props.onVirtualScroll(nextInfo)
          lastVirtualScrollInfo.value = nextInfo
        }
      }
    }

    const horizontalRange = computed(() =>
      Math.max(0, (contentScrollWidth.value || 0) - size.value.width),
    )

    const isScrollAtTop = computed(() => offsetTop.value === 0)
    const isScrollAtBottom = computed(() => offsetTop.value + props.height! >= scrollHeight.value)
    const isScrollAtLeft = computed(() => offsetLeft.value === 0)
    const isScrollAtRight = computed(() => offsetLeft.value >= horizontalRange.value)

    const keepInHorizontalRange = (nextOffsetLeft: number) => {
      return Math.max(0, Math.min(nextOffsetLeft, horizontalRange.value))
    }

    // 内容宽或视口宽变化时，横向上限也会变化。即使当前位置仍在范围内，
    // 消费方也必须收到通知，以便同步表头位置和 fixed column 的边缘状态。
    watch(
      horizontalRange,
      () => {
        offsetLeft.value = keepInHorizontalRange(offsetLeft.value)
        triggerScroll(undefined, true)
      },
      { flush: 'post' },
    )

    const delayHideScrollBar = () => {
      verticalScrollBarRef.value?.delayHidden()
      horizontalScrollBarRef.value?.delayHidden()
    }

    // Wheel handling
    const [onWheel] = useFrameWheel(
      inVirtual,
      isScrollAtTop,
      isScrollAtBottom,
      isScrollAtLeft,
      isScrollAtRight,
      horizontalRange.value > 0,
      (offsetY, isHorizontal) => {
        if (isHorizontal) {
          const aligned = keepInHorizontalRange(
            isRTL.value ? offsetLeft.value - offsetY : offsetLeft.value + offsetY,
          )
          offsetLeft.value = aligned
          triggerScroll({ x: isRTL.value ? -aligned : aligned })
        } else {
          syncScrollTop((top) => top + offsetY)
        }
      },
    )

    // Touch handling
    useMobileTouchMove(inVirtual, componentRef, (isHorizontal, offset) => {
      if (isHorizontal) {
        const aligned = keepInHorizontalRange(
          isRTL.value ? offsetLeft.value - offset : offsetLeft.value + offset,
        )
        offsetLeft.value = aligned
        triggerScroll({ x: isRTL.value ? -aligned : aligned })
        return true
      } else {
        syncScrollTop((top) => top + offset)
        return true
      }
    })

    // Drag scrolling
    useScrollDrag(inVirtual, componentRef, (offset) => {
      syncScrollTop((top) => top + offset)
    })

    const onScrollBar = (newScrollOffset: number, horizontal?: boolean) => {
      if (horizontal) {
        offsetLeft.value = newScrollOffset
        triggerScroll({ x: isRTL.value ? -newScrollOffset : newScrollOffset })
      } else {
        syncScrollTop(newScrollOffset)
      }
    }

    const onScrollbarStartMove = () => {
      scrollMoving.value = true
    }
    const onScrollbarStopMove = () => {
      scrollMoving.value = false
    }

    // ScrollBar spin sizes
    watch(
      [() => props.height, scrollHeight, inVirtual, () => size.value.height],
      () => {
        if (inVirtual.value && props.height && scrollHeight.value) {
          verticalScrollBarSpinSize.value = getSpinSize(size.value.height, scrollHeight.value)
        }
      },
      { immediate: true },
    )

    watch(
      [() => size.value.width, contentScrollWidth],
      () => {
        if (inVirtual.value && contentScrollWidth.value) {
          horizontalScrollBarSpinSize.value = getSpinSize(
            size.value.width,
            contentScrollWidth.value,
          )
        }
      },
      { immediate: true },
    )

    watch(
      () => props.scrollWidth,
      (val) => {
        contentScrollWidth.value = val ?? size.value.width
        offsetLeft.value = keepInHorizontalRange(offsetLeft.value)
      },
      { immediate: true },
    )

    function onFallbackScroll(e: Event) {
      const newScrollTop = (e.currentTarget as HTMLElement).scrollTop
      if (!useVirtual.value || !inVirtual.value) {
        offsetTop.value = newScrollTop
      } else if (newScrollTop !== offsetTop.value) {
        syncScrollTop(newScrollTop)
      }
      props.onScroll?.(e)
      triggerScroll()
    }

    const [scrollTo, getTotalHeight] = useScrollTo(
      componentRef,
      mergedData,
      heights,
      itemHeight,
      getKey,
      () => collectHeight(true),
      (newTop) => {
        const totalHeight = getTotalHeight()
        const maxScrollHeight = Math.max(scrollHeight.value, totalHeight) - props.height!
        const alignedTop = Math.max(0, Math.min(newTop, maxScrollHeight || 0))
        if (componentRef.value) componentRef.value.scrollTop = alignedTop
        offsetTop.value = alignedTop
      },
      delayHideScrollBar,
      () => props.disableHeightMeasure,
    )

    expose({
      nativeElement: containerRef,
      getScrollInfo: getVirtualScrollInfo,
      getHorizontalRange: () => horizontalRange.value,
      scrollTo: (config: number | ScrollConfig | null | undefined) => {
        function isPosScroll(arg: any): arg is { left?: number; top?: number } {
          return arg && typeof arg === 'object' && ('left' in arg || 'top' in arg)
        }
        if (isPosScroll(config)) {
          if (config.left !== undefined) {
            offsetLeft.value = keepInHorizontalRange(config.left)
          }
          scrollTo(config.top)
        } else {
          scrollTo(config)
        }
      },
    })

    // Visible change callback
    watch(
      [start, end, mergedData],
      () => {
        if (props.onVisibleChange) {
          const renderList = mergedData.value.slice(start.value, end.value + 1)
          props.onVisibleChange(renderList, mergedData.value)
        }
      },
      { flush: 'post' },
    )

    const getSize = useGetSize(mergedData, getKey, heights, itemHeight)

    const listChildren = useChildren(
      mergedData,
      start,
      end,
      contentScrollWidth,
      offsetLeft,
      setInstanceRef,
      (item, index, childProps) => slots.default?.({ item, index, ...childProps }),
      { getKey },
    )

    return () => {
      const componentStyle: CSSProperties = {}

      if (props.height) {
        componentStyle[props.fullHeight ? 'height' : 'maxHeight'] = `${props.height}px`
        Object.assign(componentStyle, ScrollStyle)

        if (inVirtual.value) {
          componentStyle.overflowY = 'hidden'
          if (horizontalRange.value > 0) componentStyle.overflowX = 'hidden'
          if (scrollMoving.value) componentStyle.pointerEvents = 'none'
        }
      }

      const extraContent = props.extraRender?.({
        start: start.value,
        end: end.value,
        virtual: inVirtual.value,
        offsetX: offsetLeft.value,
        offsetY: fillerOffset.value || 0,
        rtl: isRTL.value,
        getSize,
      })

      const Component = props.component

      return createVNode(
        'div',
        {
          ref: containerRef,
          ...pureAttrs(attrs),
          style: { position: 'relative', ...(attrs.style as any) },
          dir: isRTL.value ? 'rtl' : undefined,
          class: [props.prefixCls, { [`${props.prefixCls}-rtl`]: isRTL.value }, attrs.class],
          onMouseenter: () => {
            rootHovering.value = true
          },
          onMouseleave: () => {
            rootHovering.value = false
          },
        },
        [
          createVNode(
            Component,
            {
              class: `${props.prefixCls}-holder`,
              style: componentStyle,
              ref: (el: any) => {
                componentRef.value = el?.$el ?? el
                onHolderResize(el?.$el ?? el)
              },
              onScroll: onFallbackScroll,
              onWheel,
              onMouseenter: delayHideScrollBar,
            },
            {
              default: () => [
                createVNode(
                  Filler,
                  {
                    prefixCls: props.prefixCls,
                    height: scrollHeight.value,
                    offsetX: offsetLeft.value,
                    offsetY: fillerOffset.value,
                    scrollWidth: contentScrollWidth.value,
                    onInnerResize: collectHeight,
                    ref: fillerInnerRef,
                    innerProps: props.innerProps,
                    rtl: isRTL.value,
                    extra: extraContent,
                  },
                  { default: () => [listChildren.value] },
                ),
              ],
            },
          ),
          inVirtual.value &&
            scrollHeight.value > (props.height || 0) &&
            createVNode(VirtualScrollBar, {
              ref: verticalScrollBarRef as any,
              prefixCls: props.prefixCls,
              scrollOffset: offsetTop.value,
              scrollRange: scrollHeight.value,
              rtl: isRTL.value,
              onScroll: onScrollBar,
              onStartMove: onScrollbarStartMove,
              onStopMove: onScrollbarStopMove,
              spinSize: verticalScrollBarSpinSize.value,
              containerSize: size.value.height,
              active: rootHovering.value,
              showScrollBar: props.showScrollBar,
              style: props.styles?.verticalScrollBar,
              thumbStyle: props.styles?.verticalScrollBarThumb,
            }),
          inVirtual.value &&
            contentScrollWidth.value > size.value.width &&
            createVNode(VirtualScrollBar, {
              ref: horizontalScrollBarRef as any,
              prefixCls: props.prefixCls,
              scrollOffset: offsetLeft.value,
              scrollRange: contentScrollWidth.value,
              rtl: isRTL.value,
              onScroll: onScrollBar,
              onStartMove: onScrollbarStartMove,
              onStopMove: onScrollbarStopMove,
              spinSize: horizontalScrollBarSpinSize.value,
              containerSize: size.value.width,
              horizontal: true,
              active: rootHovering.value,
              showScrollBar: props.showScrollBar,
              style: props.styles?.horizontalScrollBar,
              thumbStyle: props.styles?.horizontalScrollBarThumb,
            }),
        ],
      )
    }
  },
})
