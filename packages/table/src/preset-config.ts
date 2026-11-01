import type { Component } from 'vue'
import type { ThemePresetName } from '@vtable-guild/core'
import {
  CaretUpIcon,
  CaretDownIcon,
  FilterFilledIcon,
  ElCaretTopIcon,
  ElCaretBottomIcon,
  ElArrowDownIcon,
  AntdvEmptyIcon,
  AntdvSpinIndicator,
  ElLoadingIcon,
} from '@vtable-guild/icons'

export interface TablePresetConfig {
  sortAscIcon: Component
  sortDescIcon: Component
  filterIcon: Component
  filterSingleSelectMode: 'radio' | 'highlight'
  showSorterTooltip: boolean
  /** Whether centered titles use the full cell or travel with adjacent controls. */
  headerTitleCenter: 'cell' | 'content'
  emptyIcon?: Component
  loadingIcon: Component
}

export const tablePresetConfigs: Record<ThemePresetName, TablePresetConfig> = {
  antdv: {
    sortAscIcon: CaretUpIcon,
    sortDescIcon: CaretDownIcon,
    filterIcon: FilterFilledIcon,
    filterSingleSelectMode: 'radio',
    showSorterTooltip: true,
    headerTitleCenter: 'cell',
    emptyIcon: AntdvEmptyIcon,
    loadingIcon: AntdvSpinIndicator,
  },
  'element-plus': {
    sortAscIcon: ElCaretTopIcon,
    sortDescIcon: ElCaretBottomIcon,
    filterIcon: ElArrowDownIcon,
    filterSingleSelectMode: 'highlight',
    showSorterTooltip: false,
    headerTitleCenter: 'content',
    loadingIcon: ElLoadingIcon,
  },
}

export function resolveTablePresetConfig(name: ThemePresetName = 'antdv'): TablePresetConfig {
  return tablePresetConfigs[name] ?? tablePresetConfigs.antdv
}
