import type {
  DeepPartial,
  LocaleName,
  LocaleRegistry,
  ThemePresetName,
  SlotProps,
  VTableGuildTableLocale,
} from '@vtable-guild/core'
import type { VNodeChild } from 'vue'
import type { ColumnsType, ColumnType, ColumnFilterItem, Key } from './column'
import type { TableSlots } from '@vtable-guild/theme'

/**
 * bodyCell slot 的参数类型。
 */
export interface TableBodyCellSlotProps<TRecord extends Record<string, unknown>> {
  text: unknown
  record: TRecord
  index: number
  column: ColumnType<TRecord>
}

/**
 * headerCell slot 的参数类型。
 */
export interface TableHeaderCellSlotProps<TRecord extends Record<string, unknown>> {
  title: string | undefined
  column: ColumnType<TRecord>
  index: number
}

/**
 * customFilterDropdown slot 的参数类型。
 */
export interface CustomFilterDropdownSlotProps<TRecord extends Record<string, unknown>> {
  column: ColumnType<TRecord>
  selectedKeys: (string | number | boolean)[]
  setSelectedKeys: (keys: (string | number | boolean)[]) => void
  confirm: (options?: { closeDropdown?: boolean }) => void
  clearFilters: (options?: { confirm?: boolean; closeDropdown?: boolean }) => void
  filters: ColumnFilterItem[]
  visible: boolean
  close: () => void
}

/**
 * Table 组件 slots 声明。
 */
export interface TableSlotsDecl<TRecord extends Record<string, unknown>> {
  bodyCell?: (props: TableBodyCellSlotProps<TRecord>) => VNodeChild
  headerCell?: (props: TableHeaderCellSlotProps<TRecord>) => VNodeChild
  empty?: () => VNodeChild
  loading?: () => VNodeChild
  customFilterDropdown?: (props: CustomFilterDropdownSlotProps<TRecord>) => VNodeChild
  customFilterIcon?: (props: { column: ColumnType<TRecord>; filtered: boolean }) => VNodeChild
}

/**
 * Table 组件 Props。
 */
export interface TableProps<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  /** 数据源 */
  dataSource: TRecord[]
  /** 列配置 */
  columns: ColumnsType<TRecord>
  /** 行唯一标识 */
  rowKey?: string | ((record: TRecord) => Key)
  /** 加载状态 */
  loading?: boolean
  /** 尺寸：lg(默认) / md / sm */
  size?: 'sm' | 'md' | 'lg'
  /** 显示边框 */
  bordered?: boolean
  /** 斑马纹 */
  striped?: boolean
  /** 行 hover 高亮 */
  hoverable?: boolean
  /** slot 级别样式覆盖 */
  ui?: SlotProps<{ slots: Record<TableSlots, string> }>
  /** 根元素自定义 class */
  class?: string
  /**
   * 实例级 preset override。
   * 未传时使用 createVTableGuild 的全局 preset；再未配置则使用 'antdv'。
   */
  themePreset?: ThemePresetName

  /**
   * 表级别控制是否显示排序 tooltip，默认 true。
   * 可被列级别 showSorterTooltip 覆盖。
   */
  showSorterTooltip?: boolean

  /** 当前激活语言标识，默认继承 provider/plugin，否则为 'zh-CN'。 */
  locale?: LocaleName

  /** 当前实例注册的语言包映射。 */
  locales?: LocaleRegistry

  /** 表级 locale 局部覆写，优先级高于全局 provider / plugin。 */
  localeOverrides?: DeepPartial<VTableGuildTableLocale>
}

// ---- change 事件参数类型 ----

/** change 事件中的 pagination 参数 */
export interface TablePaginationInfo {
  current: number
  pageSize: number
  total: number
}

/** change 事件中的 filters 参数 */
export type TableFiltersInfo = Record<string, (string | number | boolean)[] | null>

/** change 事件中的 extra 参数 */
export interface TableChangeExtra<TRecord extends Record<string, unknown>> {
  /** 触发变化的来源 */
  action: 'paginate' | 'sort' | 'filter'
  /** 当前显示的数据（经排序/筛选/分页后） */
  currentDataSource: TRecord[]
}
