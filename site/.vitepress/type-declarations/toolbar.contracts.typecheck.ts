import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from './toolbar'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T
interface Member {
  id: number
  name: string
}
export type ToolbarContracts = [
  Assert<Equal<Docs.TableToolbarOptions, Public.TableToolbarOptions>>,
  Assert<Equal<Docs.TableToolbarSearchConfig, Public.TableToolbarSearchConfig>>,
  Assert<Equal<Docs.TableToolbarProps<Member>, Public.TableToolbarProps<Member>>>,
  Assert<Equal<Docs.TableToolbarSlots<Member>, Public.TableToolbarSlots<Member>>>,
  Assert<Equal<Docs.TableToolbarSlotProps<Member>, Public.TableToolbarSlotProps<Member>>>,
]
