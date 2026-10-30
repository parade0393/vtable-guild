import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import type {
  TableQuerySubmitOptions,
  UseTableQueryOptions,
  UseTableQueryReturn,
} from '../types/query'
import { snapshot } from '../utils/snapshot'

/** Form state and submit protocol; controls and layout remain owned by the host UI library. */
export function useTableQuery<TValues extends object, TParams extends object = TValues>(
  options: UseTableQueryOptions<TValues, TParams>,
): UseTableQueryReturn<TValues, TParams> {
  const defaults = snapshot(options.defaultValues)
  const draft = ref(snapshot(defaults)) as Ref<TValues>
  const submitted = shallowRef<TValues>()
  const params = shallowRef<Partial<TParams>>()
  const collapsed = options.collapsed ?? ref(options.defaultCollapsed ?? true)
  const submitting = ref(false)
  const error = shallowRef<Error | null>(null)
  let generation = 0
  let disposed = false
  const stopCollapse = options.onCollapse
    ? watch(collapsed, (value) => options.onCollapse?.(value), { flush: 'sync' })
    : undefined

  function toParams(
    values: TValues,
    submitOptions?: TableQuerySubmitOptions<TValues>,
  ): Partial<TParams> {
    const transforms = options.fieldTransforms
    const omitted = new Set(submitOptions?.omitFields ?? [])
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(values)) {
      const transform = Object.prototype.hasOwnProperty.call(transforms ?? {}, key)
        ? transforms?.[key as keyof TValues]
        : undefined
      if (!transform && !omitted.has(key as keyof TValues)) result[key] = value
    }
    // Merge in configuration order, after all fields that retain their original names.
    for (const key of Object.keys(transforms ?? {}) as Array<keyof TValues>) {
      const transform = transforms?.[key]
      if (transform && !omitted.has(key)) Object.assign(result, transform(values[key], values))
    }
    const mapped = result as Partial<TParams>
    return snapshot(options.transform?.(mapped, values) ?? mapped)
  }

  async function execute(
    reset: boolean,
    submitOptions?: TableQuerySubmitOptions<TValues>,
  ): Promise<boolean> {
    if (disposed) return false
    const id = ++generation
    submitting.value = true
    error.value = null
    try {
      const values = snapshot(draft.value)
      const nextParams = toParams(values, submitOptions)
      // Publish after successful transforms; callback failures do not roll back these snapshots.
      // Independent snapshots also protect state from a callback that mutates its arguments.
      submitted.value = snapshot(values)
      params.value = snapshot(nextParams)
      const callback = reset ? (options.onReset ?? options.onSubmit) : options.onSubmit
      await callback?.(snapshot(nextParams), snapshot(values))
      return !disposed && id === generation
    } catch (reason) {
      if (!disposed && id === generation) {
        error.value = reason instanceof Error ? reason : new Error(String(reason))
      }
      return false
    } finally {
      if (!disposed && id === generation) submitting.value = false
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      generation++
      submitting.value = false
      stopCollapse?.()
    })
  }

  return {
    draft,
    submitted: computed(() => submitted.value && snapshot(submitted.value)),
    params: computed(() => params.value && snapshot(params.value)),
    collapsed,
    submitting: computed(() => submitting.value),
    error,
    submit: (submitOptions) => execute(false, submitOptions),
    reset(submitOptions) {
      if (disposed) return Promise.resolve(false)
      draft.value = snapshot(defaults)
      return execute(true, submitOptions)
    },
    resetFields() {
      if (!disposed) draft.value = snapshot(defaults)
    },
    toggleCollapsed() {
      collapsed.value = !collapsed.value
    },
  }
}
