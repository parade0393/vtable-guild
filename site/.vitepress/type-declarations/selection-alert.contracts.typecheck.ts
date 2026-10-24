import type * as Public from '@vtable-guild/vtable-guild'
import type * as Docs from './selection-alert'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T

interface Member {
  key: number
  name: string
}

export type SelectionAlertContracts = [
  Assert<Equal<Docs.TableSelectionAlertProps<Member>, Public.TableSelectionAlertProps<Member>>>,
  Assert<Equal<Docs.TableSelectionAlertSlots<Member>, Public.TableSelectionAlertSlots<Member>>>,
  Assert<
    Equal<Docs.TableSelectionAlertSlotProps<Member>, Public.TableSelectionAlertSlotProps<Member>>
  >,
]
