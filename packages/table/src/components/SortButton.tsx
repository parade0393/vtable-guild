import { defineComponent, inject, type PropType } from 'vue'
import { CaretUpIcon, CaretDownIcon, ElCaretTopIcon, ElCaretBottomIcon } from '@vtable-guild/icons'
import type { SortOrder } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'

/**
 * 排序图标组件。
 *
 * 三态显示：
 * - null：上下箭头均为浅色（无排序）
 * - 'ascend'：上箭头高亮
 * - 'descend'：下箭头高亮
 *
 * 使用 @vtable-guild/icons 的 SVG 图标组件。
 * 不处理点击事件——由 TableHeaderCell 的 <th> 统一处理。
 */
export default defineComponent({
  name: 'SortButton',
  props: {
    sortOrder: { type: [String, null] as PropType<SortOrder>, default: null },
    sortButtonClass: { type: String, default: '' },
  },
  setup(props) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {})
    const isElementPlus = tableContext.themePreset === 'element-plus'
    const UpIcon = isElementPlus ? ElCaretTopIcon : CaretUpIcon
    const DownIcon = isElementPlus ? ElCaretBottomIcon : CaretDownIcon

    return () => (
      <span
        class={[
          tableContext.subThemeSlots?.value.sortButton ??
            'inline-flex flex-col items-center justify-center text-xs leading-none ml-1',
          props.sortButtonClass,
        ]}
        aria-hidden="true"
      >
        <UpIcon
          class={
            props.sortOrder === 'ascend'
              ? 'text-[color:var(--color-primary)]'
              : 'text-[color:var(--color-sorter-icon)]'
          }
        />
        <DownIcon
          class={[
            tableContext.subThemeSlots?.value.sortIconDown ?? '-mt-[0.225em]',
            props.sortOrder === 'descend'
              ? 'text-[color:var(--color-primary)]'
              : 'text-[color:var(--color-sorter-icon)]',
          ]}
        />
      </span>
    )
  },
})
