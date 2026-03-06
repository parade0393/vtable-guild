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
import { Checkbox, Button, Input } from '@vtable-guild/core'
import type { ColumnFilterItem } from '../types'
import { TABLE_CONTEXT_KEY } from '../context'

/**
 * 筛选下拉菜单。
 *
 * - Teleport to body 避免 overflow 裁切
 * - 通过 anchorRect 定位（由 TableHeaderCell 传入）
 * - 多选使用 Checkbox，单选使用 radio 逻辑
 * - OK 确认，Reset 重置
 * - 点击外部关闭
 * - 右侧溢出时改用 right 定位
 * - filterSearch: 搜索框过滤筛选项
 * - filterMode: 'tree' 支持树形嵌套渲染
 */
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
    const tableContext = inject(TABLE_CONTEXT_KEY, {})
    const localSelectedKeys = ref<(string | number | boolean)[]>([...props.selectedKeys])
    const dropdownRef = ref<HTMLElement | null>(null)
    const searchText = ref('')

    // 同步外部 selectedKeys 到本地
    watch(
      () => props.selectedKeys,
      (keys) => {
        localSelectedKeys.value = [...keys]
      },
    )

    // ---- 搜索过滤 ----
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

    // ---- 选中逻辑 ----
    function isSelected(value: string | number | boolean): boolean {
      return localSelectedKeys.value.includes(value)
    }

    function toggleItem(value: string | number | boolean) {
      if (props.multiple) {
        const idx = localSelectedKeys.value.indexOf(value)
        if (idx > -1) {
          localSelectedKeys.value.splice(idx, 1)
        } else {
          localSelectedKeys.value.push(value)
        }
      } else {
        // 单选模式
        localSelectedKeys.value = isSelected(value) ? [] : [value]
      }
    }

    function handleConfirm() {
      emit('confirm', [...localSelectedKeys.value])
    }

    function handleReset() {
      localSelectedKeys.value = []
      emit('reset')
    }

    // 点击外部关闭
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

    // ---- 渲染筛选项（支持树形递归） ----
    function renderFilterItem(item: ColumnFilterItem, level: number = 0) {
      const indentStyle = level > 0 ? { paddingLeft: `${level * 20 + 12}px` } : undefined

      return (
        <li
          key={String(item.value)}
          class={[
            tableContext.subThemeSlots?.value.filterDropdownItem ??
              'flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm',
            isSelected(item.value)
              ? (tableContext.subThemeSlots?.value.filterDropdownItemSelected ??
                'bg-[color:var(--color-control-item-active-bg)] hover:bg-[color:var(--color-control-item-active-hover-bg)]')
              : (tableContext.subThemeSlots?.value.filterDropdownItemHover ??
                'hover:bg-[color:var(--color-control-item-hover-bg)]'),
          ]}
          style={indentStyle}
          onClick={() => toggleItem(item.value)}
        >
          <Checkbox checked={isSelected(item.value)} />
          <span class="text-[color:var(--color-on-surface)]">{item.text}</span>
        </li>
      )
    }

    function renderFilterItems(items: ColumnFilterItem[], level: number = 0) {
      const result: VNode[] = []
      for (const item of items) {
        result.push(renderFilterItem(item, level))
        if (props.filterMode === 'tree' && item.children?.length) {
          result.push(...renderFilterItems(item.children, level + 1))
        }
      }
      return result
    }

    return () => {
      const { anchorRect } = props
      const viewportWidth = window.innerWidth
      const dropdownMinWidth = 150
      const overflowRight = anchorRect.left + dropdownMinWidth > viewportWidth

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
            class={
              tableContext.subThemeSlots?.value.filterDropdown ??
              'rounded-lg bg-[color:var(--color-surface)] shadow-lg text-sm'
            }
            style={style}
          >
            {/* Search input */}
            {props.filterSearch && (
              <div
                class={tableContext.subThemeSlots?.value.filterDropdownSearch ?? 'px-2 pt-2 pb-1'}
              >
                <Input
                  value={searchText.value}
                  placeholder="Search filters"
                  onUpdate:value={(val: string) => {
                    searchText.value = val
                  }}
                />
              </div>
            )}

            {/* Filter items list */}
            <ul
              class={
                tableContext.subThemeSlots?.value.filterDropdownList ??
                'max-h-64 overflow-auto p-1 m-0 list-none min-w-[120px]'
              }
            >
              {renderFilterItems(filteredFilters.value)}
            </ul>

            {/* Action buttons */}
            <div
              class={
                tableContext.subThemeSlots?.value.filterDropdownActions ??
                'flex items-center justify-between gap-2 px-2 py-2 border-t border-[color:var(--color-default)]'
              }
            >
              <Button
                type="link"
                size="sm"
                disabled={localSelectedKeys.value.length === 0}
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button type="primary" size="sm" onClick={handleConfirm}>
                OK
              </Button>
            </div>
          </div>
        </Teleport>
      )
    }
  },
})
