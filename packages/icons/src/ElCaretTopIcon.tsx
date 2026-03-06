import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ElCaretTopIcon',
  inheritAttrs: true,
  setup(_, { attrs }) {
    return () => (
      <svg
        viewBox="0 0 1024 1024"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
        {...attrs}
      >
        <path d="M512 320L192 704h640z" />
      </svg>
    )
  },
})
