import type { DocFeature, TableApiKind } from './types'

// 每个功能页从 API 参考中选出相关字段。字段的类型、默认值和说明由参考元数据提供。
export const featureApi: Partial<
  Record<DocFeature, Partial<Record<TableApiKind, readonly string[]>>>
> = {
  pagination: {
    props: ['pagination', 'scroll', 'manual'],
    events: ['change'],
    slots: ['paginationItem'],
  },
  'remote-data': {
    props: ['dataSource', 'loading', 'pagination', 'manual'],
    events: ['change'],
  },
  'selection-alert': {
    props: ['rowSelection'],
  },
  'cell-display': {
    props: ['columnEmptyText', 'transformCellText', 'headerEllipsis', 'showSorterTooltip'],
    columns: ['copyable', 'tooltip', 'valueEnum', 'ellipsis', 'showSorterTooltip', 'customRender'],
    slots: ['bodyCell'],
  },
  dictionary: {
    columns: ['valueEnum', 'valueType', 'fieldProps'],
  },
  'cell-render': {
    props: ['renderers', 'columnEmptyText', 'transformCellText'],
    columns: ['valueType', 'fieldProps', 'valueEnum', 'customRender'],
    slots: ['bodyCell'],
  },
  'expandable-rows': {
    props: ['expandable', 'rowKey'],
    slots: ['expandColumnTitle'],
  },
  'tree-table': {
    props: [
      'rowKey',
      'childrenColumnName',
      'indentSize',
      'expandedRowKeys',
      'defaultExpandedRowKeys',
      'defaultExpandAllRows',
      'onExpand',
      'onExpandedRowsChange',
      'loadData',
      'isLeaf',
      'onTreeLoadError',
    ],
    'row-selection': ['checkStrictly'],
  },
  'fixed-columns': {
    props: ['scroll', 'sticky', 'tableLayout'],
    columns: ['fixed', 'width'],
  },
  virtualization: {
    props: ['virtual', 'virtualColumn', 'rowHeight', 'scroll', 'rowKey'],
  },
  'column-resize': {
    props: ['tableLayout', 'scroll'],
    columns: ['resizable', 'width', 'minWidth', 'maxWidth'],
    events: ['resizeColumn'],
  },
  'column-display': {
    props: ['columns', 'columnOrder'],
    columns: ['key', 'visible', 'responsive', 'hideInSetting', 'disable'],
  },
  'row-drag-sort': {
    props: ['rowDraggable', 'rowKey', 'childrenColumnName', 'customRow'],
    events: ['rowDragEnd'],
  },
  'grouped-and-merged-cells': {
    props: ['columns', 'hoverable'],
    columns: ['children', 'colSpan', 'customHeaderCell', 'customCell', 'customRender'],
  },
  'title-footer-summary': {
    props: ['title', 'footer', 'sticky'],
    slots: ['title', 'footer', 'summary'],
  },
  'api-wiring-and-slots': {
    props: ['rowClassName', 'customRow', 'customHeaderRow', 'ui'],
    columns: ['customRender', 'customCell', 'customHeaderCell'],
    slots: [
      'bodyCell',
      'headerCell',
      'summary',
      'empty',
      'loading',
      'customFilterDropdown',
      'customFilterIcon',
      'paginationItem',
    ],
  },
  editing: {
    props: ['rowKey', 'dataSource'],
  },
  'editable-columns': {
    columns: ['valueType', 'fieldProps', 'editor'],
  },
}
