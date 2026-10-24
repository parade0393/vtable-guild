import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from './column-settings'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T
interface Member {
  id: number
  name: string
}
export type ColumnSettingsContracts = [
  Assert<Equal<Docs.TableColumnSettingsProps<Member>, Public.TableColumnSettingsProps<Member>>>,
  Assert<Equal<Docs.TableColumnSettingsSize, Public.TableColumnSettingsSize>>,
  Assert<Equal<Docs.TableColumnSettingsOptions, Public.TableColumnSettingsOptions>>,
  Assert<Equal<Docs.TableColumnSettingsSlots<Member>, Public.TableColumnSettingsSlots<Member>>>,
]
