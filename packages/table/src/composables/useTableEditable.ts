import { h, toValue } from 'vue'
import type { ColumnType, ColumnsType, CustomRenderContext, Key } from '../types/column'
import type {
  TableColumnEditor,
  TableEditableFieldContext,
  UseTableEditableOptions,
  UseTableEditableReturn,
} from '../types/editable'
import type { TableEditDraftContext } from '../types/editing'
import { useTableEdit } from './useTableEdit'
import { snapshot } from '../utils/snapshot'
import { getField, setField } from '../utils/fieldPath'
import TableEditableCell from '../components/TableEditableCell'
import { valueEnumEntries } from '../utils/valueEnum'

function leaves<T extends object>(columns: ColumnsType<T>): ColumnType<T>[] {
  return columns.flatMap((column) =>
    typeof column === 'symbol'
      ? []
      : 'children' in column
        ? leaves(column.children as ColumnsType<T>)
        : [column as ColumnType<T>],
  )
}

/** Optional column-to-editor wiring on top of the same useTableEdit row state. */
export function useTableEditable<T extends object>(
  options: UseTableEditableOptions<T>,
): UseTableEditableReturn<T> {
  const clone = options.clone ?? snapshot<T>
  const fields = () =>
    leaves(toValue(options.columns)).filter(
      (column) => column.editor && column.dataIndex !== undefined,
    )
  function context(
    column: ColumnType<T>,
    draft: T,
    edit: TableEditDraftContext<T>,
  ): TableEditableFieldContext<T> {
    return {
      ...edit,
      name: Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex),
      column,
      draft: clone(draft),
      original: edit.original && clone(edit.original),
      value: getField(draft, column.dataIndex!),
    }
  }
  function convert(record: T, edit: TableEditDraftContext<T>, saving: boolean) {
    const result = clone(record)
    for (const column of fields()) {
      const editor = column.editor as TableColumnEditor<T>
      const callback = saving ? editor.transform : editor.convertValue
      if (callback)
        setField(
          result,
          column.dataIndex!,
          callback(getField(result, column.dataIndex!), context(column, result, edit)),
        )
    }
    return result
  }
  const edit = useTableEdit<T>({
    ...options,
    toDraft: (record, state) => convert(record, state, false),
    toValue: (record, state) => convert(record, state, true),
    async validate(draft, state) {
      const errors: Record<string, string> = {}
      for (const column of fields()) {
        const editor = column.editor as TableColumnEditor<T>
        const field = context(column, draft, state)
        const failure = await editor.validate?.(field.value, { ...field, signal: state.signal })
        if (state.signal.aborted) return
        if (failure) errors[field.name] = failure
      }
      if (Object.keys(errors).length) return { fields: errors }
      return options.validate?.(draft, state)
    },
  })
  function keyOf(record: T): Key {
    return (
      typeof options.rowKey === 'function' ? options.rowKey(record) : record[options.rowKey]
    ) as Key
  }
  function getCell(cell: Pick<CustomRenderContext<T>, 'record' | 'column'>) {
    const key = keyOf(cell.record)
    const draft = edit.getDraft(key)
    const editor = cell.column.editor
    if (!draft || !editor || cell.column.dataIndex === undefined) return
    const field = context(cell.column, draft, {
      key,
      original: edit.getOriginal(key),
      isNew: edit.newRecords.value.some((row) => keyOf(row) === key),
    })
    const condition = (
      value: boolean | ((value: TableEditableFieldContext<T>) => boolean) | undefined,
    ) => (typeof value === 'function' ? value(field) : value)
    if (condition(editor.editable) === false || condition(editor.readonly)) return
    const candidates = [
      ...(toValue(editor.options) ??
        toValue(editor.dictionary?.options) ??
        valueEnumEntries(cell.column.valueEnum).flatMap(([value, item]) => {
          const label = typeof item === 'string' ? item : item.text
          return typeof label === 'string'
            ? [{ value, label, ...(typeof item === 'object' ? { status: item.status } : {}) }]
            : []
        })),
    ]
    for (const value of Array.isArray(field.value) ? field.value : [field.value]) {
      if (
        (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') ||
        candidates.some((item) => item.value === value)
      )
        continue
      const known = toValue(editor.dictionary?.valueEnum)?.get(value)
      const label = typeof known === 'string' ? known : known?.text
      if (typeof label === 'string') candidates.push({ value, label })
    }
    return {
      key,
      column: cell.column,
      draft,
      value: field.value,
      valueType:
        editor.valueType ?? (cell.column.valueEnum ? 'select' : (cell.column.valueType ?? 'text')),
      fieldProps:
        typeof editor.fieldProps === 'function'
          ? editor.fieldProps(field)
          : (editor.fieldProps ?? {}),
      options: candidates,
      onSearch: editor.dictionary
        ? (keyword: string) => {
            void editor.dictionary!.search(keyword)
          }
        : undefined,
      loading: toValue(editor.dictionary?.loading) ?? false,
      disabled:
        !!condition(editor.disabled) ||
        edit.savingKeys.value.has(key) ||
        edit.cancellingKeys.value.has(key),
      readonly: false,
      error: edit.errors.value.get(key)?.fields?.[field.name],
      name: field.name,
      mode: 'edit' as const,
      onChange(value: unknown) {
        const active = getCell(cell)
        if (active && !active.disabled)
          edit.setDraft(key, (current) => {
            setField(current, cell.column.dataIndex!, value)
            const linked = editor.onValueChange?.(
              value,
              context(cell.column, current, {
                key,
                original: edit.getOriginal(key),
                isNew: field.isNew,
              }),
            )
            return linked ? { ...current, ...linked } : current
          })
      },
    }
  }
  return {
    ...edit,
    getCell,
    renderEditor(cell) {
      const field = getCell(cell)
      return field
        ? h(TableEditableCell, {
            context: field,
            controls: toValue(options.controls),
            ui: options.ui,
          })
        : undefined
    },
  }
}
