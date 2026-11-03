import { defineComponent, inject, type PropType, type VNodeChild } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { Key } from '../types'
import TablePopup from './TablePopup'

export interface SelectionDropdownItemDef {
  key: string
  text: string | VNodeChild
  onSelect?: (changeableRowKeys: Key[]) => void
}

export default defineComponent({
  name: 'SelectionDropdown',
  props: {
    items: {
      type: Array as PropType<SelectionDropdownItemDef[]>,
      required: true,
    },
    anchorElement: {
      type: Object as PropType<HTMLElement | null>,
      default: null,
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['close', 'select', 'mouseenter', 'mouseleave'],
  setup(props, { emit }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)

    function handleItemClick(item: SelectionDropdownItemDef) {
      const changeableKeys = tableContext.getChangeableRowKeys?.() ?? []
      item.onSelect?.(changeableKeys)
      emit('select', item.key)
      emit('close')
    }

    return () => (
      <TablePopup
        open={props.visible}
        anchor={props.anchorElement}
        getPopupContainer={tableContext.getPopupContainer}
        preset={tableContext.themePreset?.value ?? 'antdv'}
        alignmentWidth={120}
        class={tableContext.subThemeSlots?.selectionDropdown()}
        panelAttrs={{
          onMouseenter: () => emit('mouseenter'),
          onMouseleave: () => emit('mouseleave'),
        }}
        onDismiss={() => emit('close')}
      >
        <ul class={tableContext.vtgClass?.('m-0 list-none p-0')}>
          {props.items.map((item) => (
            <li
              key={item.key}
              class={tableContext.subThemeSlots?.selectionDropdownItem()}
              onClick={() => handleItemClick(item)}
            >
              {item.text}
            </li>
          ))}
        </ul>
      </TablePopup>
    )
  },
})
