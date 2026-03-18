import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ElLoadingIcon',
  inheritAttrs: true,
  setup(_, { attrs }) {
    return () => (
      <svg viewBox="0 0 50 50" width="1em" height="1em" fill="none" aria-hidden="true" {...attrs}>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="90 150"
        />
      </svg>
    )
  },
})
