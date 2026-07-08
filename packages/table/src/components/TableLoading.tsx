import {
  defineComponent,
  inject,
  resolveDynamicComponent,
  h,
  type Component,
  type PropType,
  type VNodeChild,
} from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

export default defineComponent({
  name: 'TableLoading',
  props: {
    loadingClass: { type: String, required: true },
    /** 自定义指示器 (与 ant-design-vue loading.indicator 对齐) */
    indicator: { type: [Object, Function, String] as PropType<VNodeChild>, default: undefined },
    /** 加载提示文本 (与 ant-design-vue loading.tip 对齐) */
    tip: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => {
      const subThemeSlots = tableContext.subThemeSlots
      const presetConfig = tableContext.presetConfig?.value

      // slot.default 优先级最高
      const defaultContent = slots.default?.()
      if (defaultContent) {
        return <div class={props.loadingClass}>{defaultContent}</div>
      }

      // indicator 优先于预设 spinner
      const indicatorNode =
        props.indicator !== undefined && props.indicator !== null ? (
          <div class={subThemeSlots?.loadingSpinner()}>{props.indicator as VNodeChild}</div>
        ) : presetConfig?.loadingIcon ? (
          <div class={subThemeSlots?.loadingSpinner()}>
            {h(resolveDynamicComponent(presetConfig.loadingIcon) as Component)}
          </div>
        ) : null

      return (
        <div class={props.loadingClass}>
          {indicatorNode}
          {props.tip && (
            <div
              class={tableContext.vtgClass?.('mt-2 text-[color:var(--color-on-surface)] text-sm')}
            >
              {props.tip}
            </div>
          )}
        </div>
      )
    }
  },
})
