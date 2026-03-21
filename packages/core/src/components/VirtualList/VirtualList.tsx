/* eslint-disable @typescript-eslint/no-explicit-any */
import Filler from './Filler'
import useChildren from './hooks/useChildren'
import useDiffItem from './hooks/useDiffItem'
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
import type { ExtraRenderInfo, Key } from './interface'
import type { InnerProps } from './Filler'
import { computed, createVNode, defineComponent, ref, shallowRef, toRaw, unref, watch } from 'vue'
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

    // Calculate visible range
    watch(
      [inVirtual, useVirtual, offsetTop, mergedData, heightUpdatedMark, () => props.height],
      () => {
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

        let itemTop = 0
        let startIndex: number | undefined
        let startOffset: number | undefined
        let endIndex: number | undefined
        const data = toRaw(mergedData.value)
        const _offsetTop = offsetTop.value

        for (let i = 0; i < dataLen; i += 1) {
          const item = data[i]
          const key = getKey(item)
          const cacheHeight = heights.get(key)
          const currentItemBottom = itemTop + (cacheHeight === undefined ? itemH! : cacheHeight)

          if (currentItemBottom >= _offsetTop && startIndex === undefined) {
            startIndex = i
            startOffset = itemTop
          }

          if (currentItemBottom > _offsetTop + height! && endIndex === undefined) {
            endIndex = i
          }

          itemTop = currentItemBottom
        }

        if (startIndex === undefined) {
          startIndex = 0
          startOffset = 0
          endIndex = Math.ceil(height! / itemH!)
        }

        if (endIndex === undefined) endIndex = data.length - 1
        endIndex = Math.min(endIndex + 1, data.length - 1)

        scrollHeight.value = itemTop
        start.value = startIndex
        end.value = endIndex
        fillerOffset.value = startOffset
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

    const isRTL = computed(() => props.direction === 'rtl')

    const getVirtualScrollInfo = (): ScrollInfo => ({
      x: isRTL.value ? -offsetLeft.value : offsetLeft.value,
      y: offsetTop.value,
    })

    const lastVirtualScrollInfo = ref<ScrollInfo>(getVirtualScrollInfo())

    const triggerScroll = (params?: Partial<ScrollInfo>) => {
      if (props.onVirtualScroll) {
        const nextInfo: ScrollInfo = {
          ...getVirtualScrollInfo(),
          ...params,
        }
        if (
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

    useDiffItem(mergedData, getKey)

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
    )

    expose({
      nativeElement: containerRef,
      getScrollInfo: getVirtualScrollInfo,
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
