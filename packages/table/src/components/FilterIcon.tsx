import { defineComponent } from 'vue'
import { FilterFilledIcon } from '@vtable-guild/icons'

/**
 * 筛选漏斗图标。
 *
 * - active = true 时高亮为 primary 色
 * - 点击时 stopPropagation 避免触发 th 的排序
 */
export default defineComponent({
  name: 'FilterIcon',
  props: {
    active: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    function handleClick(e: MouseEvent) {
      e.stopPropagation()
      emit('click', e)
    }

    return () => (
      <span
        class={[
          'inline-flex items-center justify-center cursor-pointer transition-colors text-xs px-1 self-stretch rounded-md hover:bg-black/6',
          props.active
            ? 'text-[color:var(--color-primary)]'
            : 'text-[color:var(--color-sorter-icon)]',
        ]}
        onClick={handleClick}
        role="button"
        aria-label="Filter"
      >
        <FilterFilledIcon />
      </span>
    )
  },
})
