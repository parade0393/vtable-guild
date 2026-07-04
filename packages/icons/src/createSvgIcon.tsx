import { defineComponent } from 'vue'

/**
 * 单 path SVG 图标工厂。
 *
 * 生成与手写形态完全一致的组件：`1em` 尺寸、`currentColor` 填充、
 * `aria-hidden`、透传 attrs。仅覆盖单 `<path>` 图标；多元素图标
 * （EmptyIcon、SpinIcon 等）保持手写组件。
 */
export function createSvgIcon(options: { name: string; viewBox: string; path: string }) {
  return defineComponent({
    name: options.name,
    inheritAttrs: true,
    setup(_, { attrs }) {
      return () => (
        <svg
          viewBox={options.viewBox}
          width="1em"
          height="1em"
          fill="currentColor"
          aria-hidden="true"
          {...attrs}
        >
          <path d={options.path} />
        </svg>
      )
    },
  })
}
