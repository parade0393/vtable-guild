import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from '../type-declarations/features'
import type { referenceApiTables } from './reference-api'
import type { columnFields, rowSelectionFields } from './table'
import type { TableApiKind } from './types'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

type EntryNames<E, F> = E extends { name: infer N; features: readonly (infer Fs)[] }
  ? F extends Fs
    ? N
    : never
  : never
type NamesFor<TList extends readonly unknown[], F> = EntryNames<TList[number], F>

/**
 * 功能页的 API 表必须覆盖该功能的全部字段：与页面类型声明里的节选接口逐项对应，
 * 漏写或多写任一字段都会让 site type-check 失败。`key` 属于基础字段，不在功能表里重复。
 */
export type ApiMetaContracts = [
  Assert<
    Equal<NamesFor<typeof columnFields, 'sorting'>, Exclude<keyof Docs.SortingColumnFields, 'key'>>
  >,
  Assert<
    Equal<
      NamesFor<typeof columnFields, 'filtering'>,
      Exclude<keyof Docs.FilteringColumnFields, 'key'>
    >
  >,
  Assert<Equal<NamesFor<typeof rowSelectionFields, 'selection'>, keyof Public.RowSelection>>,
]

type ReferenceTables = typeof referenceApiTables
type NameFromCell<T> = T extends `\`${infer Name}\`` ? Name : never
type TableNames<T extends { rows: readonly (readonly string[])[] }> = NameFromCell<
  T['rows'][number][0]
>
type NamesForKind<Kind extends TableApiKind> = TableNames<
  Extract<ReferenceTables[keyof ReferenceTables], { kind: Kind }>
>
type EventName<K> = K extends `on${infer Name}` ? Uncapitalize<Name> : never
/** 泛型组件的事件名：从 props 的 `onXxx` 监听器还原，排除 VNode 生命周期钩子。 */
type ComponentEventName<C> = C extends (props: infer P, ...args: never[]) => unknown
  ? Exclude<EventName<keyof P>, `vnode${string}`>
  : never

/** 独立参考页的条目名称与公开类型同步。 */
export type ReferenceApiContracts = [
  Assert<Equal<NamesForKind<'props'>, keyof Public.TableProps>>,
  Assert<Equal<NamesForKind<'columns'>, keyof Public.ColumnType | 'children'>>,
  Assert<Equal<NamesForKind<'row-selection'>, keyof Public.RowSelection>>,
  Assert<Equal<TableNames<ReferenceTables['expandable']>, keyof Public.Expandable>>,
  Assert<Equal<NamesForKind<'events'>, EventName<keyof Public.VTableEventProps>>>,
  Assert<Equal<NamesForKind<'slots'>, keyof Public.TableSlotsDecl>>,
  Assert<Equal<TableNames<ReferenceTables['schema-query-props']>, keyof Public.TableQueryProps>>,
  Assert<Equal<TableNames<ReferenceTables['schema-query-fields']>, keyof Public.TableQueryField>>,
  Assert<Equal<TableNames<ReferenceTables['schema-query-slots']>, keyof Public.TableQuerySlots>>,
  Assert<
    Equal<
      TableNames<ReferenceTables['editable-options']>,
      Exclude<
        keyof Public.UseTableEditableOptions<object>,
        keyof Public.UseTableEditOptions<object>
      >
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['editable-editor-fields']>,
      keyof Public.TableColumnEditor<object>
    >
  >,
]

/** 独立组件页的属性、配置项、事件、插槽表与公开类型逐项对应。 */
export type ComponentApiContracts = [
  Assert<Equal<TableNames<ReferenceTables['toolbar-props']>, keyof Public.TableToolbarProps>>,
  Assert<Equal<TableNames<ReferenceTables['toolbar-options']>, keyof Public.TableToolbarOptions>>,
  Assert<
    Equal<
      TableNames<ReferenceTables['toolbar-search-config']>,
      keyof Public.TableToolbarSearchConfig
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['toolbar-column-settings']>,
      keyof NonNullable<Public.TableToolbarProps['columnSettings']>
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['toolbar-events']>,
      ComponentEventName<typeof Public.VTableToolbar>
    >
  >,
  Assert<Equal<TableNames<ReferenceTables['toolbar-slots']>, keyof Public.TableToolbarSlots>>,
  Assert<
    Equal<TableNames<ReferenceTables['toolbar-slot-props']>, keyof Public.TableToolbarSlotProps>
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['column-settings-props']>,
      keyof Public.TableColumnSettingsProps
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['column-settings-options']>,
      keyof Public.TableColumnSettingsOptions
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['column-settings-events']>,
      ComponentEventName<typeof Public.VTableColumnSettings>
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['column-settings-slots']>,
      keyof Public.TableColumnSettingsSlots
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['selection-alert-props']>,
      keyof Public.TableSelectionAlertProps
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['selection-alert-events']>,
      ComponentEventName<typeof Public.VTableSelectionAlert>
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['selection-alert-slots']>,
      keyof Public.TableSelectionAlertSlots
    >
  >,
  Assert<
    Equal<
      TableNames<ReferenceTables['selection-alert-slot-props']>,
      keyof Public.TableSelectionAlertSlotProps
    >
  >,
]
