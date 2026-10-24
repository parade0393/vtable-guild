import { computed, defineComponent, inject, onBeforeUnmount, ref, type PropType } from 'vue'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'
import type { ColumnType } from '../types'
import { getByDataIndex } from '../composables/useColumns'

export default defineComponent({
  name: 'TableCopyButton',
  props: {
    column: { type: Object as PropType<ColumnType<Record<string, unknown>>>, required: true },
    record: { type: Object as PropType<Record<string, unknown>>, required: true },
    rowIndex: { type: Number, required: true },
    defaultText: { type: String, default: undefined },
  },
  setup(props) {
    const context = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const state = ref<'idle' | 'copied' | 'failed'>('idle')
    const pending = ref(false)
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const label = computed(() => {
      const locale = context.locale?.value.cell
      return state.value === 'copied'
        ? (locale?.copied ?? '已复制')
        : state.value === 'failed'
          ? (locale?.copyFailed ?? '复制失败')
          : (locale?.copy ?? '复制')
    })
    onBeforeUnmount(() => {
      alive = false
      clearTimeout(timer)
    })
    async function copy(event: MouseEvent) {
      event.stopPropagation()
      if (pending.value) return
      pending.value = true
      const config = typeof props.column.copyable === 'object' ? props.column.copyable : {}
      let failed = false
      let error: unknown
      let text: string | undefined
      try {
        const raw = getByDataIndex(props.record, props.column.dataIndex)
        text =
          typeof config.text === 'function'
            ? await config.text({
                text: raw,
                value: raw,
                record: props.record,
                column: props.column,
                index: props.rowIndex,
                renderIndex: props.rowIndex,
              })
            : (config.text ?? props.defaultText)
        if (typeof text !== 'string')
          throw new Error('Provide copyable.text for non-scalar cell values')
        if (!globalThis.navigator?.clipboard?.writeText)
          throw new Error('Clipboard API unavailable')
        await navigator.clipboard.writeText(text)
      } catch (reason) {
        failed = true
        error = reason
      }
      if (!alive) return
      pending.value = false
      state.value = failed ? 'failed' : 'copied'
      clearTimeout(timer)
      timer = setTimeout(() => {
        state.value = 'idle'
      }, 2000)
      if (failed) config.onError?.(error, props.record)
      else config.onCopy?.(text!, props.record)
    }
    return () => (
      <button
        type="button"
        class={context.subThemeSlots?.copyButton()}
        title={label.value}
        aria-label={label.value}
        disabled={pending.value}
        onClick={copy}
        onMousedown={(event: MouseEvent) => event.stopPropagation()}
        onDragstart={(event: DragEvent) => {
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          {state.value === 'copied' ? (
            <path d="m3 8 3 3 7-7" />
          ) : (
            <>
              <rect x="5" y="5" width="8" height="9" rx="1" />
              <path d="M3 10H2V2h8v1" />
            </>
          )}
        </svg>
        <span aria-live="polite" class={context.vtgClass?.('sr-only')}>
          {state.value === 'idle' ? '' : label.value}
        </span>
      </button>
    )
  },
})
