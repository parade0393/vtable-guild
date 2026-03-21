import { cn } from '@vtable-guild/core'
import { defineComponent, inject, type PropType } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'

export default defineComponent({
  name: 'ExpandIcon',
  props: {
    expanded: { type: Boolean, required: true },
    expandable: { type: Boolean, default: true },
    variant: {
      type: String as PropType<'row' | 'tree'>,
      default: 'row',
    },
  },
  emits: {
    click: (_e: Event) => true,
  },
  setup(props, { emit }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {})

    function handleClick(e: Event) {
      e.stopPropagation()
      emit('click', e)
    }

    return () => {
      const subThemeSlots = tableContext.subThemeSlots?.value
      const isTree = props.variant === 'tree'
      const buttonBaseClass = isTree ? subThemeSlots?.treeExpandIcon : subThemeSlots?.expandIcon
      const buttonExpandedClass = isTree
        ? subThemeSlots?.treeExpandIconExpanded
        : subThemeSlots?.expandIconExpanded
      const buttonCollapsedClass = isTree
        ? subThemeSlots?.treeExpandIconCollapsed
        : subThemeSlots?.expandIconCollapsed
      const buttonSpacedClass = isTree
        ? subThemeSlots?.treeExpandIconSpaced
        : subThemeSlots?.expandIconSpaced
      const buttonDisabledClass = isTree
        ? subThemeSlots?.treeExpandIconDisabled
        : subThemeSlots?.expandIconDisabled
      const symbolBaseClass = isTree
        ? subThemeSlots?.treeExpandIconSymbol
        : subThemeSlots?.expandIconSymbol
      const symbolExpandedClass = isTree
        ? subThemeSlots?.treeExpandIconSymbolExpanded
        : subThemeSlots?.expandIconSymbolExpanded
      const symbolCollapsedClass = isTree
        ? subThemeSlots?.treeExpandIconSymbolCollapsed
        : subThemeSlots?.expandIconSymbolCollapsed

      const fallbackButtonBaseClass = isTree
        ? 'relative inline-flex h-5 w-5 shrink-0 items-center justify-center align-middle text-[color:var(--vtg-table-text-color)] transition-[color,border-color,background-color,transform] duration-200'
        : 'relative inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center align-middle border border-[var(--vtg-table-border-color,#d9d9d9)] bg-[var(--vtg-table-bg,#fff)] text-[color:var(--vtg-table-text-color)] transition-[color,border-color,background-color,transform] duration-200'
      const fallbackSymbolBaseClass =
        'inline-flex items-center justify-center transition-transform duration-200 [&>svg]:h-[1em] [&>svg]:w-[1em]'
      const fallbackSpacedClass = isTree ? 'me-2 w-5 invisible' : 'invisible'

      const buttonClass = cn(
        fallbackButtonBaseClass,
        buttonBaseClass,
        !props.expandable && fallbackSpacedClass,
        !props.expandable && buttonSpacedClass,
        props.expandable && (props.expanded ? buttonExpandedClass : buttonCollapsedClass),
        !props.expandable && buttonDisabledClass,
      )
      const symbolClass = cn(
        fallbackSymbolBaseClass,
        symbolBaseClass,
        props.expandable && (props.expanded ? symbolExpandedClass : symbolCollapsedClass),
      )

      const iconNode = (
        <span class={symbolClass} aria-hidden="true">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 2.5L8 6L4 9.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      )

      if (!props.expandable) {
        return (
          <span class={buttonClass} aria-hidden="true">
            {iconNode}
          </span>
        )
      }

      return (
        <button
          type="button"
          class={buttonClass}
          onClick={handleClick}
          aria-expanded={props.expanded}
          aria-label={props.expanded ? 'Collapse row' : 'Expand row'}
        >
          {iconNode}
        </button>
      )
    }
  },
})
