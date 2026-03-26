import { defineComponent, ref, h, type PropType, type StyleValue } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useScrollbar } from '../composables/useScrollbar'
import type { ThemeConfig, SlotProps } from '../utils/types'
import ScrollbarBar from './ScrollbarBar'

const defaultScrollbarTheme = {
  slots: {
    root: 'group relative overflow-hidden',
    wrap: 'overflow-auto scrollbar-none h-full',
    view: 'block min-w-full w-max',
    track:
      'absolute z-[3] rounded opacity-0 transition-opacity duration-300 group-hover:opacity-100',
    trackVertical: 'right-0.5 top-0.5 bottom-0.5 w-[var(--vtg-scrollbar-thumb-width)]',
    trackHorizontal: 'bottom-0.5 left-0.5 right-0.5 h-[var(--vtg-scrollbar-thumb-width)]',
    thumb: [
      'relative w-full',
      'h-full',
      'rounded-[var(--vtg-scrollbar-thumb-radius)]',
      'bg-[color:var(--vtg-scrollbar-thumb-bg)]',
      'hover:bg-[color:var(--vtg-scrollbar-thumb-hover-bg)]',
      'transition-colors cursor-pointer',
    ].join(' '),
  },
  defaultVariants: {},
} as const satisfies ThemeConfig

type ScrollbarSlots = keyof typeof defaultScrollbarTheme.slots

function toPixel(val: string | number | undefined): string | undefined {
  if (val === undefined) return undefined
  if (typeof val === 'number') return `${val}px`
  return val
}

export default defineComponent({
  name: 'VScrollbar',
  props: {
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    maxHeight: { type: [String, Number] as PropType<string | number>, default: undefined },
    native: { type: Boolean, default: false },
    always: { type: Boolean, default: false },
    minSize: { type: Number, default: 20 },
    tag: { type: String, default: 'div' },
    wrapClass: { type: String, default: undefined },
    wrapStyle: { type: [String, Object, Array] as PropType<StyleValue>, default: undefined },
    viewClass: { type: String, default: undefined },
    viewStyle: { type: [String, Object, Array] as PropType<StyleValue>, default: undefined },
    ui: {
      type: Object as PropType<SlotProps<{ slots: Record<ScrollbarSlots, string> }>>,
      default: undefined,
    },
    class: { type: String, default: undefined },
  },
  emits: ['scroll'],
  setup(props, { emit, slots: vueSlots, expose }) {
    const { slots: themeSlots } = useTheme('scrollbar', defaultScrollbarTheme, props)

    const wrapRef = ref<HTMLElement | null>(null)
    const viewRef = ref<HTMLElement | null>(null)
    const rootHovering = ref(false)

    const {
      verticalThumbSize,
      verticalThumbOffset,
      verticalVisible,
      horizontalThumbSize,
      horizontalThumbOffset,
      horizontalVisible,
      update,
    } = useScrollbar(wrapRef, viewRef, { minSize: props.minSize })

    function handleScroll() {
      update()
      if (wrapRef.value) {
        emit('scroll', {
          scrollTop: wrapRef.value.scrollTop,
          scrollLeft: wrapRef.value.scrollLeft,
        })
      }
    }

    function handleBarScroll({ ratio, vertical }: { ratio: number; vertical: boolean }) {
      const wrap = wrapRef.value
      if (!wrap) return

      if (vertical) {
        const maxScroll = wrap.scrollHeight - wrap.clientHeight
        wrap.scrollTop = ratio * maxScroll
      } else {
        const maxScroll = wrap.scrollWidth - wrap.clientWidth
        wrap.scrollLeft = ratio * maxScroll
      }
    }

    function scrollTo(options: ScrollToOptions) {
      wrapRef.value?.scrollTo(options)
    }

    function setScrollTop(value: number) {
      if (wrapRef.value) wrapRef.value.scrollTop = value
    }

    function setScrollLeft(value: number) {
      if (wrapRef.value) wrapRef.value.scrollLeft = value
    }

    expose({
      update,
      scrollTo,
      setScrollTop,
      setScrollLeft,
      wrapRef,
    })

    return () => {
      const rootStyle: Record<string, string | undefined> = {}
      if (props.height) rootStyle.height = toPixel(props.height)
      if (props.maxHeight) rootStyle.maxHeight = toPixel(props.maxHeight)

      const wrapStyle: Record<string, string | undefined> = {}
      if (props.maxHeight) wrapStyle.maxHeight = toPixel(props.maxHeight)

      const viewNode = h(
        props.tag,
        {
          ref: viewRef,
          class: [themeSlots.view(), props.viewClass],
          style: props.viewStyle,
        },
        vueSlots.default?.(),
      )

      return (
        <div
          class={themeSlots.root()}
          style={rootStyle}
          onMouseover={() => {
            rootHovering.value = true
          }}
          onMouseleave={() => {
            rootHovering.value = false
          }}
        >
          <div
            ref={wrapRef}
            class={[themeSlots.wrap(), props.wrapClass, props.native ? '' : 'scrollbar-none']}
            style={[wrapStyle as StyleValue, props.wrapStyle ?? {}]}
            onScroll={handleScroll}
          >
            {viewNode}
          </div>
          {!props.native && verticalVisible.value && (
            <ScrollbarBar
              vertical
              thumbSize={verticalThumbSize.value}
              thumbOffset={verticalThumbOffset.value}
              visible={rootHovering.value}
              always={props.always}
              trackClass={themeSlots.track()}
              trackDirectionClass={themeSlots.trackVertical()}
              thumbClass={themeSlots.thumb()}
              onScroll={handleBarScroll}
            />
          )}
          {!props.native && horizontalVisible.value && (
            <ScrollbarBar
              vertical={false}
              thumbSize={horizontalThumbSize.value}
              thumbOffset={horizontalThumbOffset.value}
              visible={rootHovering.value}
              always={props.always}
              trackClass={themeSlots.track()}
              trackDirectionClass={themeSlots.trackHorizontal()}
              thumbClass={themeSlots.thumb()}
              onScroll={handleBarScroll}
            />
          )}
        </div>
      )
    }
  },
})
