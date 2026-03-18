import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AntdvSpinIndicator',
  inheritAttrs: true,
  setup(_, { attrs }) {
    return () => (
      <span class="vtg-spin-dot vtg-spin-dot-spin" {...attrs}>
        <i class="vtg-spin-dot-item" />
        <i class="vtg-spin-dot-item" />
        <i class="vtg-spin-dot-item" />
        <i class="vtg-spin-dot-item" />
      </span>
    )
  },
})
