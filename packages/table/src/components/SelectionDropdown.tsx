import {
  defineComponent,
  onMounted,
  onBeforeUnmount,
  nextTick,
  Teleport,
  Transition,
  ref,
  type PropType,
  type VNodeChild,
} from 'vue'
import { inject } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import { getPopupPositionStyle } from '../utils/popupPosition'
import type { Key } from '../types'

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
    anchorRect: {
      type: Object as PropType<{ top: number; left: number; right: number; bottom: number }>,
      required: true,
    },
    popupContainer: {
      type: [String, Object] as PropType<string | HTMLElement>,
      default: 'body',
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['close', 'select', 'mouseenter', 'mouseleave'],
  setup(props, { emit }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const dropdownRef = ref<HTMLElement | null>(null)

    function handleMouseDown(e: MouseEvent) {
      if (!props.visible) return
      if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        emit('close')
      }
    }

    onMounted(() => {
      nextTick(() => {
        document.addEventListener('mousedown', handleMouseDown)
      })
    })

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleMouseDown)
    })

    function handleItemClick(item: SelectionDropdownItemDef) {
      const changeableKeys = tableContext.getChangeableRowKeys?.() ?? []
      item.onSelect?.(changeableKeys)
      emit('select', item.key)
      emit('close')
    }

    return () => {
      const { anchorRect } = props
      const dropdownMinWidth = 120
      const popupContainer = props.popupContainer

      const style = getPopupPositionStyle(anchorRect, popupContainer, dropdownMinWidth)

      return (
        <Teleport to={popupContainer}>
          <Transition name="vtg-dropdown">
            {props.visible && (
              <div
                ref={dropdownRef}
                class={tableContext.subThemeSlots?.selectionDropdown()}
                style={style}
                onMouseenter={() => emit('mouseenter')}
                onMouseleave={() => emit('mouseleave')}
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
              </div>
            )}
          </Transition>
        </Teleport>
      )
    }
  },
})
