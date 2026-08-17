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

    return () => {
      const preset = tableContext.presetConfig?.value ?? tablePresetConfigs.antdv
      const iconNodes = [
        h(preset.sortAscIcon, {
          class: [
            tableContext.compatClass?.('column-sorter-up'),
            tableContext.compatClass && props.sortOrder === 'ascend' && 'active',
            props.sortOrder === 'ascend'
              ? tableContext.vtgClass?.('text-[color:var(--color-primary)]')
              : tableContext.vtgClass?.('text-[color:var(--color-sorter-icon)]'),
          ],
        }),
        h(preset.sortDescIcon, {
          class: [
            tableContext.subThemeSlots?.sortIconDown(),
            tableContext.compatClass && props.sortOrder === 'descend' && 'active',
            tableContext.vtgClass?.(
              props.sortOrder === 'descend'
                ? 'text-[color:var(--color-primary)]'
                : 'text-[color:var(--color-sorter-icon)]',
            ),
          ],
        }),
      ]

      return (
        <span
          class={[
            tableContext.subThemeSlots?.sortButton(),
            props.sortButtonClass,
            tableContext.compatClass?.('column-sorter-full'),
          ]}
          aria-hidden="true"
        >
          {tableContext.compatClass ? (
            <span class={tableContext.compatClass('column-sorter-inner')}>{iconNodes}</span>
          ) : (
            iconNodes
          )}
        </span>
      )
    }
  },
})
