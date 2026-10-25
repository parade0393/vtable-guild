import type { ComputedRef, Ref, ShallowRef } from 'vue'

/** A transformed field replaces its original key and may expand into several request fields. */
export type TableQueryFieldTransforms<TValues extends object, TParams extends object> = {
  [K in keyof TValues]?: (
    value: TValues[K],
    values: Readonly<TValues>,
  ) => Partial<TParams> | undefined
}

export interface UseTableQueryOptions<TValues extends object, TParams extends object = TValues> {
  /** A snapshot is taken once. Use ordinary objects, arrays and Date values for form state. */
  defaultValues: TValues
  fieldTransforms?: TableQueryFieldTransforms<TValues, TParams>
  /** Runs after field transforms, once per submit/reset, never on draft edits. */
  transform?: (params: Partial<TParams>, values: Readonly<TValues>) => Partial<TParams>
  onSubmit?: (params: Partial<TParams>, values: Readonly<TValues>) => void | Promise<void>
  /** Defaults to onSubmit. Connect this to request.reset(params) to also clear table state. */
  onReset?: (params: Partial<TParams>, values: Readonly<TValues>) => void | Promise<void>
  /** Optional shared ref for a controlled collapse state. */
  collapsed?: Ref<boolean>
  defaultCollapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export interface UseTableQueryReturn<TValues extends object, TParams extends object = TValues> {
  draft: Ref<TValues>
  /** Last successfully transformed values, published before the callback and retained if it fails. */
  submitted: ComputedRef<Readonly<TValues> | undefined>
  params: ComputedRef<Readonly<Partial<TParams>> | undefined>
  collapsed: Ref<boolean>
  submitting: ComputedRef<boolean>
  error: ShallowRef<Error | null>
  /** Returns false for a transform/callback failure or an obsolete submission. */
  submit: () => Promise<boolean>
  /** Restore draft defaults and submit them through onReset (or onSubmit), once. */
  reset: () => Promise<boolean>
  /** Restore draft defaults without changing submitted state or requesting data. */
  resetFields: () => void
  toggleCollapsed: () => void
}
