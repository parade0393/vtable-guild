import { defineComponent, h, inject } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { tablePresetConfigs } from '../preset-config'

/**
 * 筛选漏斗图标。
 *
 * - active = true 时高亮为 primary 色
 * - 点击时 stopPropagation 避免触发 th 的排序
 * - 图标由 presetConfig 提供，不再硬编码 preset 名称判断
 */
export default defineComponent({
  name: 'FilterIcon',
  props: {
    active: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    function handleClick(e: MouseEvent) {
      e.stopPropagation()
      emit('click', e)
    }

    return () => (
      <span
        class={[
          tableContext.subThemeSlots?.value.filterIcon ??
            'inline-flex items-center justify-center cursor-pointer transition-colors text-xs px-1 self-stretch rounded-md hover:bg-black/6',
          props.active
            ? 'text-[color:var(--color-primary)]'
            : 'text-[color:var(--color-filter-icon)]',
        ]}
        onClick={handleClick}
        role="button"
        aria-label={tableContext.locale?.value.header.filterTriggerAriaLabel ?? 'Filter'}
      >
        {h((tableContext.presetConfig?.value ?? tablePresetConfigs.antdv).filterIcon)}
      </span>
    )
  },
})
