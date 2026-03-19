import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ExpandIcon',
  props: {
    expanded: { type: Boolean, required: true },
    expandable: { type: Boolean, default: true },
    iconClass: { type: String, default: '' },
  },
  emits: {
    click: (_e: Event) => true,
  },
  setup(props, { emit }) {
    function handleClick(e: Event) {
      e.stopPropagation()
      emit('click', e)
    }

    return () => {
      if (!props.expandable) {
        return <span class="inline-block w-[17px] h-[17px]" />
      }

      return (
        <button
          type="button"
          class={[
            'inline-flex items-center justify-center',
            'w-[17px] h-[17px] p-0',
            'border border-[var(--vtg-table-border-color,#d9d9d9)]',
            'rounded-[2px] bg-[var(--vtg-table-bg,#fff)]',
            'cursor-pointer select-none leading-[17px]',
            'text-[10px] text-[color:var(--vtg-table-text-color)]',
            'transition-transform duration-200',
            props.iconClass,
          ].join(' ')}
          onClick={handleClick}
          aria-expanded={props.expanded}
          aria-label={props.expanded ? 'Collapse row' : 'Expand row'}
        >
          <svg
            viewBox="0 0 10 10"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class={[
              'transition-transform duration-200',
              props.expanded ? 'rotate-90' : 'rotate-0',
            ].join(' ')}
          >
            <path d="M3 1.5L7 5L3 8.5" />
          </svg>
        </button>
      )
    }
  },
})
