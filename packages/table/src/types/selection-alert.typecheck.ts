import type { TableSelectionAlertProps, TableSelectionAlertSlots } from './selection-alert'
import type { TableToolbarProps, TableToolbarSlots } from './toolbar'

interface Member {
  key: number
  name: string
}

export const alertProps: TableSelectionAlertProps<Member> = {
  selectedRowKeys: [1, 2],
  selectedRows: [{ key: 1, name: 'Ada' }],
  alwaysShow: true,
}

export const alertSlots: TableSelectionAlertSlots<Member> = {
  info(scope) {
    const _name: string | undefined = scope.selectedRows[0]?.name
    // @ts-expect-error Slot data cannot mutate the controlled selected keys.
    scope.selectedRowKeys.push(3)
    return _name
  },
}

export const toolbarProps: TableToolbarProps<Member> = {
  search: { placeholder: 'Find members', clearable: true },
  searchValue: 'Ada',
  multipleLine: true,
}

export const toolbarSlots: TableToolbarSlots<Member> = {
  search(scope) {
    scope.updateSearchValue('Ada')
    scope.submitSearch(scope.searchValue)
    return null
  },
}
