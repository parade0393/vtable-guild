import { shallowRef } from 'vue'
import { useColumnState } from '../composables/useColumnState'
import type { ColumnsType } from './column'

interface Row {
  key: string
  name: string
}
const definitions = shallowRef<ColumnsType<Row>>([
  { key: 'name', dataIndex: 'name', disable: { checkbox: true }, hideInSetting: false },
])
const preferences = useColumnState(definitions, { storageKey: 'rows', version: 1 })
preferences.columns.value = [{ key: 'name', customRender: ({ record }) => record.name }]
// @ts-expect-error A renderer must retain its real record type.
preferences.columns.value = [{ key: 'name', customRender: ({ record }) => record.missing }]
preferences.setState({ '/["key","name"]': { visible: false, fixed: 'left', order: 0 } })
// @ts-expect-error Arbitrary fixed positions are rejected.
preferences.setState({ '/["key","name"]': { fixed: 'center' } })
