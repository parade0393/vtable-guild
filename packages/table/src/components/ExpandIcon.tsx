import { cn } from '@vtable-guild/core'
import { defineComponent, inject, type PropType } from 'vue'
import { TABLE_CONTEXT_KEY } from '../context'
import { ReloadOutlinedIcon } from '@vtable-guild/icons'

export default defineComponent({
  name: 'ExpandIcon',
  props: {
    expanded: { type: Boolean, required: true },
    expandable: { type: Boolean, default: true },
    loading: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
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
      const subThemeSlots = tableContext.subThemeSlots
      const isTree = props.variant === 'tree'
      const buttonBaseClass = isTree ? subThemeSlots?.treeExpandIcon() : subThemeSlots?.expandIcon()
      const buttonExpandedClass = isTree
        ? subThemeSlots?.treeExpandIconExpanded()
        : subThemeSlots?.expandIconExpanded()
      const buttonCollapsedClass = isTree
        ? subThemeSlots?.treeExpandIconCollapsed()
        : subThemeSlots?.expandIconCollapsed()
      const buttonSpacedClass = isTree
        ? subThemeSlots?.treeExpandIconSpaced()
        : subThemeSlots?.expandIconSpaced()
      const buttonDisabledClass = isTree
        ? subThemeSlots?.treeExpandIconDisabled()
        : subThemeSlots?.expandIconDisabled()
      const symbolBaseClass = isTree
        ? subThemeSlots?.treeExpandIconSymbol()
        : subThemeSlots?.expandIconSymbol()
      const symbolExpandedClass = isTree
        ? subThemeSlots?.treeExpandIconSymbolExpanded()
        : subThemeSlots?.expandIconSymbolExpanded()
      const symbolCollapsedClass = isTree
        ? subThemeSlots?.treeExpandIconSymbolCollapsed()
        : subThemeSlots?.expandIconSymbolCollapsed()

      const fallbackButtonBaseClass = isTree
        ? tableContext.vtgClass?.(
            'relative inline-flex h-5 w-5 shrink-0 items-center justify-center align-middle text-[color:var(--vtg-table-text-color)] transition-[color,border-color,background-color,transform] duration-200',
          )
        : tableContext.vtgClass?.(
            'relative inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center align-middle border border-[color:var(--vtg-table-border-color,#d9d9d9)] bg-[color:var(--vtg-table-bg,#fff)] text-[color:var(--vtg-table-text-color)] transition-[color,border-color,background-color,transform] duration-200',
          )
      const fallbackSymbolBaseClass = tableContext.vtgClass?.(
        'inline-flex items-center justify-center transition-transform duration-200 [&>svg]:h-[1em] [&>svg]:w-[1em]',
      )
      const fallbackSpacedClass = tableContext.vtgClass?.(
        isTree ? 'me-2 w-5 invisible' : 'invisible',
      )

      const buttonClass = cn(
        fallbackButtonBaseClass,
        buttonBaseClass,
        !props.expandable && fallbackSpacedClass,
        !props.expandable && buttonSpacedClass,
        props.expandable && (props.expanded ? buttonExpandedClass : buttonCollapsedClass),
        props.loading && subThemeSlots?.treeExpandIconLoading(),
        props.error && subThemeSlots?.treeExpandIconError(),
        !props.expandable && buttonDisabledClass,
      )
      const symbolClass = cn(
        fallbackSymbolBaseClass,
        symbolBaseClass,
        props.expandable && (props.expanded ? symbolExpandedClass : symbolCollapsedClass),
      )

      const locale = isTree ? tableContext.locale?.value.tree : undefined
      const iconNode = props.loading ? (
        <span class={subThemeSlots?.loadingSpinner()} aria-hidden="true">
          <ReloadOutlinedIcon />
        </span>
      ) : props.error ? (
        <span aria-hidden="true">
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5v4M8 10.5v1" stroke-width="1.5" />
          </svg>
        </span>
      ) : (
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
          aria-busy={props.loading || undefined}
          data-load-error={props.error || undefined}
          title={props.error ? locale?.retry : undefined}
          aria-label={
            props.loading
              ? tableContext.locale?.value.loading.text
              : props.error
                ? locale?.retry
                : props.expanded
                  ? (locale?.collapse ?? 'Collapse row')
                  : (locale?.expand ?? 'Expand row')
          }
        >
          {iconNode}
        </button>
      )
    }
  },
})
