import type { CssVarEntry, DocFeature } from './types'

function token(
  name: CssVarEntry['name'],
  description: string,
  features: readonly DocFeature[],
  options: Omit<CssVarEntry, 'name' | 'description' | 'features'> = {},
): CssVarEntry {
  return { name, description, features, ...options }
}

const antdvOnly = { presets: ['antdv'] } as const
const elementPlusOnly = { presets: ['element-plus'] } as const
const cellTagFeatures = ['cell-display', 'cell-render'] as const
const cellStatusFeatures = ['cell-display', 'cell-render', 'dictionary'] as const
const popupFeatures = ['filtering', 'selection', 'pagination', 'column-display', 'toolbar'] as const
const emptyFeatures = ['remote-data', 'api-wiring-and-slots'] as const
const spacingFeatures = ['virtualization', 'title-footer-summary'] as const
const settingsFeatures = ['column-display', 'toolbar'] as const
const editorFeatures = ['editing', 'editable-columns'] as const

export const themeCssVarGroups: Readonly<Record<string, readonly CssVarEntry[]>> = {
  'tokens-core': [
    token('--vtg-table-bg', '表格主体背景，对应 `table`、`td` 等区域', [
      'api-wiring-and-slots',
      'fixed-columns',
      'expandable-rows',
      'tree-table',
    ]),
    token('--vtg-table-header-bg', '表头、标题、页脚、摘要行背景', [
      'grouped-and-merged-cells',
      'title-footer-summary',
      'fixed-columns',
    ]),
    token('--vtg-table-header-color', '表头文字颜色', ['grouped-and-merged-cells']),
    token('--vtg-table-text-color', '正文文字颜色', [
      'api-wiring-and-slots',
      'expandable-rows',
      'tree-table',
      'title-footer-summary',
    ]),
    token('--vtg-table-border-color', '表格边框和单元格分隔线', [
      'fixed-columns',
      'grouped-and-merged-cells',
      'expandable-rows',
      'tree-table',
      'title-footer-summary',
    ]),
    token(
      '--vtg-table-header-split-color',
      'antdv 风格表头分割线',
      ['fixed-columns', 'grouped-and-merged-cells'],
      antdvOnly,
    ),
    token('--vtg-table-header-sort-hover-bg', '可排序表头 hover 背景', ['sorting'], antdvOnly),
    token('--vtg-table-header-sort-bg', '已激活排序的列表头背景', ['sorting'], antdvOnly),
    token('--vtg-table-body-sort-bg', '已激活排序的列单元格背景', ['sorting'], antdvOnly),
    token('--color-sorter-icon', '排序图标的未激活颜色', ['sorting']),
    token('--color-primary', '主题主色，用于拖拽手柄悬停、按钮高亮和字段状态等', [
      'column-resize',
      'expandable-rows',
      'tree-table',
      'cell-display',
      'cell-render',
      'selection-alert',
    ]),
  ],
  'tokens-tags': [
    token('--vtg-cell-tag-radius', '标签圆角', cellTagFeatures),
    token('--vtg-cell-tag-padding-inline', '标签横向内边距', cellTagFeatures),
    token('--vtg-cell-tag-font-size', '标签字号', cellTagFeatures),
    token('--vtg-cell-tag-line-height', '标签行高', cellTagFeatures),
    token('--vtg-cell-tag-bg', '标签背景，默认从当前状态色混合', cellTagFeatures),
    token('--vtg-cell-tag-border', '标签边框色', cellTagFeatures),
    token('--vtg-cell-success', '字段成功状态色', cellStatusFeatures),
    token('--vtg-cell-warning', '字段警告状态色', cellStatusFeatures),
    token('--vtg-cell-error', '字段错误状态色，也用于查询和编辑校验文字', [
      ...cellStatusFeatures,
      ...editorFeatures,
      'schema-query',
    ]),
  ],
  'tokens-row-states': [
    token('--vtg-table-row-hover-bg', '`hoverable` 行 hover 背景', []),
    token('--vtg-table-row-striped-bg', '`striped` 斑马纹背景', [], elementPlusOnly),
    token('--vtg-table-row-selected-bg', '选中行背景', ['selection'], antdvOnly),
    token('--vtg-table-row-selected-hover-bg', '选中行 hover 背景', ['selection'], antdvOnly),
    token('--vtg-table-row-drop-indicator-color', '拖拽排序的放置指示线颜色', [
      'row-drag-sort',
      'column-display',
    ]),
    token('--vtg-table-expanded-row-bg', '展开行内容背景', ['expandable-rows'], {
      fallback: '#fafafa',
    }),
  ],
  'tokens-spacing': [
    token('--vtg-table-font-family', '表格字体族', []),
    token('--vtg-table-font-size', '表格字号', ['virtualization']),
    token('--vtg-table-line-height', '表格行高', ['virtualization']),
    token('--vtg-table-cell-padding-inline-lg', '`large` 尺寸的横向内边距', spacingFeatures),
    token('--vtg-table-cell-padding-block-lg', '`large` 尺寸的纵向内边距', spacingFeatures),
    token('--vtg-table-cell-padding-inline-md', '`middle` 尺寸的横向内边距', spacingFeatures),
    token('--vtg-table-cell-padding-block-md', '`middle` 尺寸的纵向内边距', spacingFeatures),
    token('--vtg-table-cell-padding-inline-sm', '`small` 尺寸的横向内边距', spacingFeatures),
    token('--vtg-table-cell-padding-block-sm', '`small` 尺寸的纵向内边距', spacingFeatures),
  ],
  'tokens-filter': [
    token('--color-filter-icon', '筛选图标的未激活颜色', ['filtering']),
    token(
      '--vtg-table-filter-dropdown-max-height',
      '筛选面板选项区的最大高度，超出后内部滚动',
      ['filtering'],
      { fallback: '264px' },
    ),
  ],
  'tokens-empty-loading': [
    token('--vtg-table-loading-overlay-bg', '加载遮罩层背景', emptyFeatures),
    token('--vtg-table-empty-margin-block', '空态上下外边距', emptyFeatures, antdvOnly),
    token('--vtg-table-empty-image-height', '空态图形高度', emptyFeatures, antdvOnly),
    token('--vtg-table-empty-image-margin-bottom', '空态图形与文字间距', emptyFeatures, antdvOnly),
    token('--vtg-table-empty-image-opacity', '空态图形透明度', emptyFeatures, antdvOnly),
    token('--vtg-table-empty-border-color', 'antdv 空态插画边框色', emptyFeatures, antdvOnly),
    token('--vtg-table-empty-shadow-color', 'antdv 空态插画阴影色', emptyFeatures, antdvOnly),
    token('--vtg-table-empty-content-color', 'antdv 空态插画填充色', emptyFeatures, antdvOnly),
  ],
  'tokens-pagination': [
    token('--vtg-pagination-size', '默认尺寸的按钮高度和最小宽度', ['pagination']),
    token('--vtg-pagination-size-sm', '小尺寸按钮高度和最小宽度', ['pagination']),
    token('--vtg-pagination-gap', '导航、控件、自定义布局区的间距', ['pagination']),
    token('--vtg-pagination-margin', '分页容器的纵向内边距', ['pagination']),
    token('--vtg-pagination-radius', '按钮与输入框圆角', ['pagination']),
    token('--vtg-pagination-input-width', '快速跳转输入框宽度', ['pagination']),
    token('--vtg-pagination-border', '页码按钮默认边框颜色', ['pagination']),
    token('--vtg-pagination-bg', '页码按钮默认背景', ['pagination']),
    token('--vtg-pagination-active-bg', '当前页码背景', ['pagination']),
    token('--vtg-pagination-active-color', '当前页码文字颜色', ['pagination']),
    token('--vtg-pagination-active-border', '当前页码按钮边框颜色', ['pagination']),
    token('--vtg-pagination-popup-z', '每页条数下拉面板层级', ['pagination']),
    token('--vtg-pagination-popup-radius', '每页条数下拉面板圆角', ['pagination']),
    token('--vtg-pagination-popup-shadow', '每页条数下拉面板阴影', ['pagination']),
    token('--vtg-pagination-font-size', '分页默认字号', ['pagination'], elementPlusOnly),
    token('--vtg-pagination-font-size-sm', '分页小尺寸字号', ['pagination'], elementPlusOnly),
    token('--vtg-pagination-page-gap', '相邻页码之间的间距', ['pagination'], elementPlusOnly),
    token('--vtg-pagination-control-gap', '跳页等控件之间的间距', ['pagination'], elementPlusOnly),
    token('--vtg-pagination-select-width', '每页条数选择器宽度', ['pagination'], elementPlusOnly),
    token(
      '--vtg-pagination-select-width-sm',
      '小尺寸每页条数选择器宽度',
      ['pagination'],
      elementPlusOnly,
    ),
  ],
  'tokens-popup': [
    token('--vtg-table-popup-radius', '筛选、批量选择等表格弹层的圆角', popupFeatures),
    token('--vtg-table-popup-border', '表格弹层边框', popupFeatures),
    token('--vtg-table-popup-padding-block', '表格弹层垂直内边距', popupFeatures),
    token('--vtg-table-popup-padding-inline', '表格弹层水平内边距', popupFeatures),
    token('--vtg-table-popup-shadow', '表格弹层阴影', popupFeatures),
    token('--vtg-table-popup-motion-duration', '表格弹层动画时长', [], { fallback: '0.15s' }),
    token('--vtg-table-popup-motion-easing', '表格弹层动画缓动曲线', [], {
      fallback: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    }),
  ],
  'tokens-toolbar': [
    token('--vtg-toolbar-title-font-size', '工具栏标题字号', ['toolbar']),
    token('--vtg-toolbar-title-font-weight', '工具栏标题字重', ['toolbar']),
    token('--vtg-toolbar-search-width', '工具栏轻搜索宽度', ['toolbar']),
    token('--vtg-toolbar-search-height', '工具栏轻搜索高度', ['toolbar']),
    token('--vtg-toolbar-search-font-size', '工具栏轻搜索字号', ['toolbar']),
    token('--vtg-column-settings-width', '列设置面板宽度', settingsFeatures),
    token('--vtg-column-settings-radius', '列设置与密度浮层圆角', settingsFeatures),
    token('--vtg-column-settings-icon-size', '工具栏与列设置图标大小', settingsFeatures),
    token('--vtg-column-settings-z', '列设置与密度浮层层级', settingsFeatures),
    token('--vtg-column-settings-shadow', '浮层阴影', settingsFeatures),
    token('--vtg-column-settings-pin-icon-size', '固定位置按钮图标大小', settingsFeatures, {
      fallback: '14px',
    }),
  ],
  'tokens-selection-alert': [
    token('--vtg-selection-alert-radius', '批量操作提示条圆角', ['selection-alert']),
    token('--vtg-selection-alert-bg', '批量操作提示条背景', ['selection-alert']),
    token('--vtg-selection-alert-padding-inline', '批量操作提示条横向内边距', ['selection-alert']),
    token('--vtg-selection-alert-padding-block', '批量操作提示条纵向内边距', ['selection-alert']),
  ],
  'tokens-editor': [
    token('--vtg-editor-error-gap', '控件与错误文字间距', editorFeatures),
    token('--vtg-editor-error-font-size', '错误字号', editorFeatures),
    token('--vtg-editor-radius', '编辑控件轮廓圆角', editorFeatures, elementPlusOnly),
  ],
  'tokens-query': [
    token('--vtg-query-padding', '普通查询区内边距', ['schema-query'], { fallback: '24px' }),
    token('--vtg-query-light-padding', '轻量查询区内边距', ['schema-query'], { fallback: '16px' }),
    token('--vtg-query-column-gap', '字段之间的横向间距', ['schema-query'], { fallback: '24px' }),
    token('--vtg-query-row-gap', '字段之间的纵向间距', ['schema-query'], { fallback: '16px' }),
    token('--vtg-query-field-min-width', '普通字段最小布局宽度，窄容器自动收缩', ['schema-query'], {
      fallback: '240px',
    }),
    token('--vtg-query-label-width', '字段标签宽度', ['schema-query'], { fallback: '80px' }),
    token('--vtg-query-label-gap', '字段标签和控件的间距', ['schema-query'], { fallback: '12px' }),
    token('--vtg-query-control-height', '标签和操作区对齐高度', ['schema-query'], {
      fallback: '32px',
    }),
    token('--vtg-query-light-field-width', '轻量字段宽度', ['schema-query'], {
      fallback: '240px',
    }),
    token('--vtg-query-action-gap', '操作按钮间距', ['schema-query'], { fallback: '8px' }),
    token('--vtg-query-radius', '查询区容器圆角', ['schema-query'], {
      presetFallbacks: { antdv: '6px', 'element-plus': '4px' },
    }),
    token('--vtg-query-error-font-size', '查询区错误文字字号', ['schema-query'], {
      fallback: '12px',
    }),
  ],
  'tokens-progress': [
    token('--vtg-cell-progress-min-width', '进度组件最小宽度', ['cell-render']),
    token('--vtg-cell-progress-max-width', '进度组件最大宽度', ['cell-render']),
    token('--vtg-cell-progress-height', '轨道高度', ['cell-render']),
    token('--vtg-cell-progress-radius', '轨道圆角', ['cell-render']),
    token('--vtg-cell-progress-gap', '轨道与文本间距', ['cell-render']),
    token('--vtg-cell-progress-font-size', '进度文本字号', ['cell-render']),
    token('--vtg-cell-progress-trail', '轨道背景', ['cell-render']),
  ],
}

export const tableCssVars = Object.values(themeCssVarGroups).flat()
