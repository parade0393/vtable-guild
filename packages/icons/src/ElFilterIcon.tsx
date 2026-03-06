import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ElFilterIcon',
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
        <path d="M384 523.392V928a32 32 0 0 0 46.336 28.608l192-96A32 32 0 0 0 640 832V523.392l280.768-343.104a32 32 0 0 0-24.768-52.288H128a32 32 0 0 0-24.768 52.288L384 523.392z" />
      </svg>
    )
  },
})
