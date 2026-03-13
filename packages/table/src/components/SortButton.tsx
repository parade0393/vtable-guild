import { defineComponent, h, inject, type PropType } from 'vue'
import type { SortOrder } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { tablePresetConfigs } from '../preset-config'

/**
 * 排序图标组件。
 *
 * 三态显示：
 * - null：上下箭头均为浅色（无排序）
 * - 'ascend'：上箭头高亮
 * - 'descend'：下箭头高亮
 *
 * 图标由 presetConfig 提供，不再硬编码 preset 名称判断。
 * 不处理点击事件——由 TableHeaderCell 的 <th> 统一处理。
 */
export default defineComponent({
  name: 'SortButton',
  props: {
    sortOrder: { type: [String, null] as PropType<SortOrder>, default: null },
    sortButtonClass: { type: String, default: '' },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    return () => (
      <span
        class={[tableContext.subThemeSlots?.value.sortButton, props.sortButtonClass]}
        aria-hidden="true"
      >
        {h((tableContext.presetConfig?.value ?? tablePresetConfigs.antdv).sortAscIcon, {
          class:
            props.sortOrder === 'ascend'
              ? 'text-[color:var(--color-primary)]'
              : 'text-[color:var(--color-sorter-icon)]',
        })}
        {h((tableContext.presetConfig?.value ?? tablePresetConfigs.antdv).sortDescIcon, {
          class: [
            tableContext.subThemeSlots?.value.sortIconDown,
            props.sortOrder === 'descend'
              ? 'text-[color:var(--color-primary)]'
              : 'text-[color:var(--color-sorter-icon)]',
          ],
        })}
      </span>
    )
  },
})
