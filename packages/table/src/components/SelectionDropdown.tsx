import { defineComponent, inject, shallowRef, type PropType, type VNodeChild } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { Key } from '../types'
import TablePopup from './TablePopup'

export interface SelectionDropdownItemDef {
  key: string
  text: string | VNodeChild
  onSelect?: (changeableRowKeys: Key[]) => void
}

export interface SelectionDropdownExposed {
  focusFirstItem: () => void
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]'

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
    label: String,
    /** 打开时把焦点移到第一项，键盘打开菜单时使用 */
    focusOnOpen: Boolean,
  },
  emits: ['close', 'select', 'mouseenter', 'mouseleave'],
  setup(props, { emit, expose }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const panel = shallowRef<HTMLElement | null>(null)

    function getMenuItems() {
      return Array.from(panel.value?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? [])
    }

    function focusTrigger() {
      props.anchorElement?.focus({ preventScroll: true })
    }

    function activateItem(item: SelectionDropdownItemDef) {
      const changeableKeys = tableContext.getChangeableRowKeys?.() ?? []
      item.onSelect?.(changeableKeys)
      emit('select', item.key)
      emit('close')
      // Return focus from the closing menu unless the item moved it elsewhere, e.g. to a dialog.
      if (panel.value?.contains(document.activeElement)) focusTrigger()
    }

    function handleItemKeydown(event: KeyboardEvent, item: SelectionDropdownItemDef) {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      activateItem(item)
    }

    function handleMenuKeydown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        // The panel is mounted outside the table; leave from the trigger to keep the tab order.
        emit('close')
        focusTrigger()
        if (event.shiftKey) event.preventDefault()
        return
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const items = getMenuItems()
      if (!items.length) return
      event.preventDefault()
      const current = items.indexOf(event.target as HTMLElement)
      const last = items.length - 1
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : event.key === 'ArrowDown'
              ? (current + 1) % items.length
              : current > 0
                ? current - 1
                : last
      items[next]?.focus()
    }

    expose({
      // initialFocus only runs when the popup opens; a hover-opened menu is already mounted.
      focusFirstItem: () => getMenuItems()[0]?.focus({ preventScroll: true }),
    } satisfies SelectionDropdownExposed)

    return () => (
      <TablePopup
        open={props.visible}
        anchor={props.anchorElement}
        getPopupContainer={tableContext.getPopupContainer}
        preset={tableContext.themePreset?.value ?? 'antdv'}
        alignmentWidth={120}
        initialFocus={props.focusOnOpen ? MENU_ITEM_SELECTOR : undefined}
        panelRef={(element) => (panel.value = element)}
        class={tableContext.subThemeSlots?.selectionDropdown()}
        panelAttrs={{
          onMouseenter: () => emit('mouseenter'),
          onMouseleave: () => emit('mouseleave'),
        }}
        onDismiss={() => emit('close')}
      >
        <ul
          role="menu"
          aria-label={props.label}
          class={tableContext.vtgClass?.('m-0 list-none p-0')}
          onKeydown={handleMenuKeydown}
        >
          {props.items.map((item) => (
            <li
              key={item.key}
              role="menuitem"
              tabindex={-1}
              class={tableContext.subThemeSlots?.selectionDropdownItem()}
              onClick={() => activateItem(item)}
              onKeydown={(event: KeyboardEvent) => handleItemKeydown(event, item)}
            >
              {item.text}
            </li>
          ))}
        </ul>
      </TablePopup>
    )
  },
})
