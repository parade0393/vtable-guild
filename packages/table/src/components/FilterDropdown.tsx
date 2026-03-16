import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  Teleport,
  nextTick,
  inject,
  type PropType,
  type VNode,
} from 'vue'
import { Checkbox, Radio, Button, Input } from '@vtable-guild/core'
import { SearchIcon, CaretDownIcon } from '@vtable-guild/icons'
import type { ColumnFilterItem } from '../types'
import { TABLE_CONTEXT_KEY, type TableContext } from '../context'

/** Recursively collect all values (parent + leaf), matching antdv flattenKeys */
function flattenValues(items: ColumnFilterItem[]): (string | number | boolean)[] {
  const result: (string | number | boolean)[] = []
  for (const item of items) {
    result.push(item.value)
    if (item.children?.length) {
      result.push(...flattenValues(item.children))
    }
  }
  return result
}

/** Bottom-up reconciliation: if all children selected → add parent; otherwise → remove parent */
function reconcileParents(items: ColumnFilterItem[], keySet: Set<string | number | boolean>): void {
  for (const item of items) {
    if (item.children?.length) {
      reconcileParents(item.children, keySet)
      const allChildrenSelected = item.children.every((child) => keySet.has(child.value))
      if (allChildrenSelected) {
        keySet.add(item.value)
      } else {
        keySet.delete(item.value)
      }
    }
  }
}

export default defineComponent({
  name: 'FilterDropdown',
  props: {
    filters: { type: Array as PropType<ColumnFilterItem[]>, required: true },
    selectedKeys: { type: Array as PropType<(string | number | boolean)[]>, default: () => [] },
    multiple: { type: Boolean, default: true },
    anchorRect: {
      type: Object as PropType<{ top: number; left: number; right: number; bottom: number }>,
      required: true,
    },
    filterSearch: {
      type: [Boolean, Function] as PropType<
        boolean | ((input: string, filter: ColumnFilterItem) => boolean)
      >,
      default: false,
    },
    filterMode: {
      type: String as PropType<'menu' | 'tree'>,
      default: 'menu',
    },
  },
  emits: ['confirm', 'reset', 'close'],
  setup(props, { emit }) {
    const tableContext = inject(TABLE_CONTEXT_KEY, {} as TableContext)
    const localSelectedKeys = ref<(string | number | boolean)[]>([...props.selectedKeys])
    const dropdownRef = ref<HTMLElement | null>(null)
    const searchText = ref('')

    // 展开/折叠状态（默认全部展开）
    const expandedKeys = ref<Set<string | number | boolean>>(new Set())

    // 初始化：收集所有父节点值
    onMounted(() => {
      function collectParentKeys(items: ColumnFilterItem[]): (string | number | boolean)[] {
        const keys: (string | number | boolean)[] = []
        for (const item of items) {
          if (item.children?.length) {
            keys.push(item.value)
            keys.push(...collectParentKeys(item.children))
          }
        }
        return keys
      }
      expandedKeys.value = new Set(collectParentKeys(props.filters))
    })

    function toggleExpand(value: string | number | boolean) {
      if (expandedKeys.value.has(value)) {
        expandedKeys.value.delete(value)
      } else {
        expandedKeys.value.add(value)
      }
    }

    function isExpanded(value: string | number | boolean): boolean {
      return expandedKeys.value.has(value)
    }

    watch(
      () => props.selectedKeys,
      (keys) => {
        localSelectedKeys.value = [...keys]
      },
    )

    function matchesSearch(filter: ColumnFilterItem, input: string): boolean {
      if (typeof props.filterSearch === 'function') {
        return props.filterSearch(input, filter)
      }
      return filter.text.toLowerCase().includes(input.toLowerCase())
    }

    function filterItemsFlat(items: ColumnFilterItem[], input: string): ColumnFilterItem[] {
      return items.filter((item) => matchesSearch(item, input))
    }

    function filterItemsTree(items: ColumnFilterItem[], input: string): ColumnFilterItem[] {
      const result: ColumnFilterItem[] = []
      for (const item of items) {
        if (item.children?.length) {
          const filteredChildren = filterItemsTree(item.children, input)
          if (filteredChildren.length > 0 || matchesSearch(item, input)) {
            result.push({
              ...item,
              children: filteredChildren.length > 0 ? filteredChildren : item.children,
            })
          }
        } else if (matchesSearch(item, input)) {
          result.push(item)
        }
      }
      return result
    }

    const filteredFilters = computed(() => {
      if (!props.filterSearch || !searchText.value) return props.filters
      if (props.filterMode === 'tree') {
        return filterItemsTree(props.filters, searchText.value)
      }
      return filterItemsFlat(props.filters, searchText.value)
    })

    const isHighlightMode = computed(
      () => tableContext.presetConfig?.value.filterSingleSelectMode === 'highlight',
    )
    const filterDropdownLocale = computed(() => tableContext.locale?.value.filterDropdown)
    const hasFilteredResults = computed(() => filteredFilters.value.length > 0)
    const showSearchEmptyState = computed(
      () =>
        Boolean(props.filterSearch) &&
        searchText.value.trim().length > 0 &&
        !hasFilteredResults.value,
    )

    function isSelected(value: string | number | boolean): boolean {
      return localSelectedKeys.value.includes(value)
    }

    function toggleItem(value: string | number | boolean, item?: ColumnFilterItem) {
      if (props.multiple) {
        if (props.filterMode === 'tree' && item) {
          const keySet = new Set(localSelectedKeys.value)
          const isTreeParent = Boolean(item.children?.length)

          if (isTreeParent) {
            const allDescendants = flattenValues([item])
            const allSelected = allDescendants.every((v) => keySet.has(v))
            if (allSelected) {
              allDescendants.forEach((v) => keySet.delete(v))
            } else {
              allDescendants.forEach((v) => keySet.add(v))
            }
          } else {
            if (keySet.has(value)) {
              keySet.delete(value)
            } else {
              keySet.add(value)
            }
          }

          reconcileParents(props.filters, keySet)
          localSelectedKeys.value = Array.from(keySet)
        } else {
          const idx = localSelectedKeys.value.indexOf(value)
          if (idx > -1) {
            localSelectedKeys.value.splice(idx, 1)
          } else {
            localSelectedKeys.value.push(value)
          }
        }
        return
      }

      if (!isSelected(value)) {
        localSelectedKeys.value = [value]
      }
    }

    function handleConfirm() {
      emit('confirm', [...localSelectedKeys.value])
    }

    function handleReset() {
      localSelectedKeys.value = []
      emit('reset')
    }

    const isTreeMultiple = computed(() => props.filterMode === 'tree' && props.multiple)

    const allFlatValues = computed(() =>
      isTreeMultiple.value ? flattenValues(filteredFilters.value) : [],
    )

    const selectAllState = computed(() => {
      const total = allFlatValues.value.length
      if (total === 0) return 'none' as const
      const count = allFlatValues.value.filter((v) => localSelectedKeys.value.includes(v)).length
      if (count === 0) return 'none' as const
      if (count === total) return 'all' as const
      return 'partial' as const
    })

    function toggleSelectAll() {
      if (selectAllState.value === 'all') {
        localSelectedKeys.value = []
      } else {
        localSelectedKeys.value = [...allFlatValues.value]
      }
    }

    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        emit('close')
      }
    }

    onMounted(() => {
      nextTick(() => {
        document.addEventListener('mousedown', handleMouseDown)
      })
    })

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleMouseDown)
    })

    function renderFilterIndicator(selected: boolean, indeterminate?: boolean) {
      if (props.multiple) {
        return <Checkbox checked={selected} indeterminate={indeterminate} />
      }

      if (!isHighlightMode.value) {
        return <Radio checked={selected} />
      }

      return null
    }

    function renderFilterItem(item: ColumnFilterItem, level: number = 0) {
      const selected = isSelected(item.value)
      const isTreeParent = Boolean(item.children?.length)
      const expanded = isExpanded(item.value)
      const useListRadioSemantics = !props.multiple && isHighlightMode.value

      let indeterminate = false
      if (isTreeMultiple.value && isTreeParent) {
        const descendants = flattenValues(item.children!)
        const anySelected = descendants.some((v) => localSelectedKeys.value.includes(v))
        indeterminate = !selected && anySelected
      }

      const SwitcherIcon = () => {
        if (!isTreeParent) {
          return (
            <span
              class={[
                tableContext.subThemeSlots?.value.filterDropdownSwitcher,
                tableContext.subThemeSlots?.value.filterDropdownSwitcherNoop,
              ]}
              aria-hidden="true"
            />
          )
        }

        return (
          <span
            class={[
              tableContext.subThemeSlots?.value.filterDropdownSwitcher,
              expanded
                ? tableContext.subThemeSlots?.value.filterDropdownSwitcherExpanded
                : tableContext.subThemeSlots?.value.filterDropdownSwitcherCollapsed,
            ]}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              toggleExpand(item.value)
            }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <CaretDownIcon />
          </span>
        )
      }

      const isTree = props.filterMode === 'tree'
      const itemClass = isTree
        ? tableContext.subThemeSlots?.value.filterDropdownTreeItem
        : tableContext.subThemeSlots?.value.filterDropdownItem
      const contentWrapperClass = isTree
        ? tableContext.subThemeSlots?.value.filterDropdownTreeContentWrapper
        : tableContext.subThemeSlots?.value.filterDropdownContentWrapper
      const itemPadding = isTree
        ? {
            paddingLeft: `calc(var(--vtg-table-filter-tree-indent-size, 24px) * ${level})`,
          }
        : undefined

      return (
        <li
          key={String(item.value)}
          role={useListRadioSemantics ? 'radio' : undefined}
          aria-checked={useListRadioSemantics ? selected : undefined}
          class={[itemClass, !props.multiple && isHighlightMode.value && 'gap-0']}
          style={itemPadding}
        >
          {isTree && <SwitcherIcon />}

          <div
            class={[
              contentWrapperClass,
              selected
                ? tableContext.subThemeSlots?.value.filterDropdownItemSelected
                : tableContext.subThemeSlots?.value.filterDropdownItemHover,
            ]}
            onClick={() => toggleItem(item.value, item)}
          >
            {renderFilterIndicator(selected, indeterminate)}
            <span class="text-[color:var(--color-on-surface)]">{item.text}</span>
          </div>
        </li>
      )
    }

    function renderFilterItems(items: ColumnFilterItem[], level: number = 0) {
      const result: VNode[] = []
      for (const item of items) {
        result.push(renderFilterItem(item, level))
        if (item.children?.length) {
          if (props.filterMode === 'tree') {
            if (isExpanded(item.value)) {
              result.push(...renderFilterItems(item.children, level + 1))
            }
          } else {
            result.push(...renderFilterItems(item.children, level + 1))
          }
        }
      }
      return result
    }

    return () => {
      const { anchorRect } = props
      const viewportWidth = window.innerWidth
      const dropdownMinWidth = 150
      const overflowRight = anchorRect.left + dropdownMinWidth > viewportWidth
      const isTree = props.filterMode === 'tree'
      const listClass = isTree
        ? tableContext.subThemeSlots?.value.filterDropdownTreeList
        : tableContext.subThemeSlots?.value.filterDropdownList
      const contentWrapperClass = isTree
        ? tableContext.subThemeSlots?.value.filterDropdownTreeContentWrapper
        : tableContext.subThemeSlots?.value.filterDropdownContentWrapper

      const style: Record<string, string> = {
        position: 'fixed',
        top: `${anchorRect.bottom + 4}px`,
        zIndex: '1050',
      }
      if (overflowRight) {
        style.right = `${viewportWidth - anchorRect.right}px`
      } else {
        style.left = `${anchorRect.left}px`
      }

      return (
        <Teleport to="body">
          <div
            ref={dropdownRef}
            class={tableContext.subThemeSlots?.value.filterDropdown}
            style={style}
          >
            {props.filterSearch && (
              <div class={tableContext.subThemeSlots?.value.filterDropdownSearch}>
                <div class={tableContext.subThemeSlots?.value.filterDropdownSearchField}>
                  <span
                    class={tableContext.subThemeSlots?.value.filterDropdownSearchIcon}
                    aria-hidden="true"
                  >
                    <SearchIcon />
                  </span>
                  <Input
                    bare
                    value={searchText.value}
                    placeholder={filterDropdownLocale.value?.searchPlaceholder ?? '在筛选项中搜索'}
                    inputClass={tableContext.subThemeSlots?.value.filterDropdownSearchInput}
                    onUpdate:value={(val: string) => {
                      searchText.value = val
                    }}
                  />
                </div>
              </div>
            )}

            <ul
              role={!props.multiple && isHighlightMode.value ? 'radiogroup' : undefined}
              class={listClass}
            >
              {isTreeMultiple.value && (
                <li
                  key="__vtg_select_all__"
                  class={tableContext.subThemeSlots?.value.filterDropdownTreeCheckAll}
                >
                  <div
                    class={[
                      contentWrapperClass,
                      selectAllState.value === 'all'
                        ? tableContext.subThemeSlots?.value.filterDropdownItemSelected
                        : tableContext.subThemeSlots?.value.filterDropdownItemHover,
                    ]}
                    onClick={toggleSelectAll}
                  >
                    <Checkbox
                      checked={selectAllState.value === 'all'}
                      indeterminate={selectAllState.value === 'partial'}
                    />
                    <span class="text-[color:var(--color-on-surface)]">
                      {filterDropdownLocale.value?.selectAllText ?? '全选'}
                    </span>
                  </div>
                </li>
              )}
              {renderFilterItems(filteredFilters.value)}
              {showSearchEmptyState.value && (
                <li class={tableContext.subThemeSlots?.value.filterDropdownListEmpty}>
                  {filterDropdownLocale.value?.emptyText ?? 'Not Found'}
                </li>
              )}
            </ul>

            <div class={tableContext.subThemeSlots?.value.filterDropdownActions}>
              <Button
                type="link"
                size="sm"
                disabled={localSelectedKeys.value.length === 0}
                onClick={handleReset}
              >
                {filterDropdownLocale.value?.resetText ?? '重置'}
              </Button>
              <Button type="primary" size="sm" onClick={handleConfirm}>
                {filterDropdownLocale.value?.confirmText ?? '确 定'}
              </Button>
            </div>
          </div>
        </Teleport>
      )
    }
  },
})
