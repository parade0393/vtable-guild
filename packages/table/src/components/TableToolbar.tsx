import {
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type PropType,
  type SlotsType,
} from 'vue'
import { Input, Tooltip, useTheme, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/core'
import {
  FullscreenExitOutlinedIcon,
  FullscreenOutlinedIcon,
  ReloadOutlinedIcon,
  SearchIcon,
} from '@vtable-guild/icons'
import {
  resolveBuiltInLocale,
  resolveTableThemePreset,
  resolveToolbarThemePreset,
  toolbarZhCN,
} from '@vtable-guild/theme'
import TableColumnSettings from './TableColumnSettings'
import type { ColumnsType } from '../types'
import type { TableColumnSettingsSize } from '../types/column-settings'
import type { TableToolbarProps, TableToolbarSlots, TableToolbarSlotProps } from '../types/toolbar'

type Row = Record<string, unknown>

export default defineComponent({
  name: 'TableToolbar',
  props: {
    title: { type: null as unknown as PropType<TableToolbarProps['title']> },
    columns: Array as PropType<ColumnsType<Row>>,
    size: String as PropType<TableColumnSettingsSize>,
    options: {
      type: [Boolean, Object] as PropType<TableToolbarProps['options']>,
      default: undefined,
    },
    loading: Boolean,
    search: { type: [Boolean, Object] as PropType<TableToolbarProps['search']>, default: false },
    searchValue: { type: String, default: '' },
    multipleLine: Boolean,
    disabled: Boolean,
    fullscreenTarget: Function as PropType<TableToolbarProps['fullscreenTarget']>,
    columnSettings: Object as PropType<TableToolbarProps['columnSettings']>,
    locale: Object as PropType<TableToolbarProps['locale']>,
    ui: Object as PropType<TableToolbarProps['ui']>,
    class: String,
  },
  emits: {
    'update:columns': (_columns: ColumnsType<Row>) => true,
    'update:size': (_size: TableColumnSettingsSize) => true,
    reset: () => true,
    reload: () => true,
    'update:searchValue': (_value: string) => true,
    search: (_value: string) => true,
    clearSearch: () => true,
    fullscreenChange: (_active: boolean) => true,
    fullscreenError: (_error: unknown) => true,
  },
  slots: Object as SlotsType<TableToolbarSlots>,
  setup(props, { emit, slots }) {
    const context = inject(VTABLE_GUILD_INJECTION_KEY, null)
    const preset = computed(() => context?.themePreset ?? 'antdv')
    const { slots: styles } = useTheme(
      'toolbar',
      computed(() => resolveToolbarThemePreset(preset.value)),
      props,
    )
    const size = computed<TableColumnSettingsSize>(() => {
      if (props.size) return props.size
      const configured = context?.theme.table?.defaultVariants?.size
      if (configured === 'large' || configured === 'middle' || configured === 'small')
        return configured
      return resolveTableThemePreset(preset.value).defaultVariants.size
    })
    const locale = computed(() => ({
      ...toolbarZhCN,
      ...resolveBuiltInLocale(preset.value, context?.locale)?.toolbar,
      ...context?.locales[context.locale]?.toolbar,
      ...context?.localeOverrides.toolbar,
      ...props.locale,
    }))
    const options = computed(() => {
      const enabled = props.options !== false
      const configured = props.options === false ? undefined : props.options
      return {
        reload: enabled && configured?.reload !== false,
        density: enabled && configured?.density !== false,
        setting: enabled && configured?.setting !== false,
        fixed: enabled && configured?.fixed !== false,
        draggable: enabled && configured?.draggable !== false,
        fullScreen: enabled && configured?.fullScreen === true,
      }
    })
    const mounted = ref(false)
    const fullscreenElement = shallowRef<Element | null>(null)
    const fullscreenPending = ref(false)
    const fullscreen = computed(
      () => !!fullscreenElement.value && fullscreenElement.value === props.fullscreenTarget?.(),
    )
    const fullscreenAvailable = computed(
      () =>
        mounted.value &&
        typeof props.fullscreenTarget?.()?.requestFullscreen === 'function' &&
        typeof document.exitFullscreen === 'function',
    )
    function bodyPopupContainer() {
      return document.body
    }
    function fullscreenPopupContainer() {
      return props.fullscreenTarget?.() ?? document.body
    }
    const popupContainer = computed(
      () =>
        props.columnSettings?.getPopupContainer ??
        (fullscreen.value ? fullscreenPopupContainer : bodyPopupContainer),
    )
    function syncFullscreen() {
      fullscreenElement.value = document.fullscreenElement
    }
    onMounted(() => {
      mounted.value = true
      syncFullscreen()
      document.addEventListener('fullscreenchange', syncFullscreen)
    })
    onBeforeUnmount(() => {
      if (mounted.value) document.removeEventListener('fullscreenchange', syncFullscreen)
    })
    // Only report state confirmed by the browser, including Escape and external exits.
    watch(fullscreen, (active) => emit('fullscreenChange', active))
    function reload() {
      if (!props.disabled && !props.loading) emit('reload')
    }
    function updateSearchValue(value: string) {
      if (!props.disabled) emit('update:searchValue', value)
    }
    function submitSearch(value = props.searchValue) {
      if (!props.disabled && !props.loading) emit('search', value)
    }
    function clearSearch() {
      if (props.disabled || props.loading) return
      emit('update:searchValue', '')
      emit('clearSearch')
    }
    function renderSearch(scope: TableToolbarSlotProps) {
      if (slots.search) return slots.search(scope)
      if (!props.search) return null
      const config = typeof props.search === 'object' ? props.search : undefined
      return (
        <div class={styles.searchGroup()} data-vtg-search-group="">
          <span class={styles.searchField()} data-disabled={props.disabled ? '' : undefined}>
            <Input
              bare
              value={props.searchValue}
              placeholder={config?.placeholder ?? locale.value.searchPlaceholder}
              aria-label={config?.placeholder ?? locale.value.searchPlaceholder}
              disabled={props.disabled}
              ui={{ root: styles.searchInput() }}
              onUpdate:value={updateSearchValue}
              onPressEnter={(event: KeyboardEvent) => {
                if (!event.isComposing) {
                  event.preventDefault()
                  submitSearch()
                }
              }}
            />
            {config?.clearable !== false && props.searchValue && (
              <button
                type="button"
                class={styles.searchClear()}
                aria-label={locale.value.clearSearch}
                title={locale.value.clearSearch}
                disabled={props.disabled || props.loading}
                onClick={clearSearch}
              >
                <svg
                  class={styles.searchIcon()}
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-2.1 4.2-.7.7L7.3 8l-2.1 2.1.7.7L8 8.7l2.1 2.1.7-.7L8.7 8l2.1-2.1-.7-.7L8 7.3 5.9 5.2Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            )}
          </span>
          <button
            type="button"
            class={styles.searchSubmit()}
            aria-label={locale.value.search}
            title={locale.value.search}
            disabled={props.disabled || props.loading}
            onClick={() => submitSearch()}
          >
            <SearchIcon class={styles.searchIcon()} aria-hidden="true" />
          </button>
        </div>
      )
    }
    async function toggleFullscreen() {
      if (props.disabled || fullscreenPending.value || !fullscreenAvailable.value) return
      const target = props.fullscreenTarget?.()
      if (!target) return
      fullscreenPending.value = true
      try {
        if (document.fullscreenElement === target) await document.exitFullscreen()
        else await target.requestFullscreen()
        syncFullscreen()
      } catch (error) {
        emit('fullscreenError', error)
      } finally {
        fullscreenPending.value = false
      }
    }
    function renderSettings() {
      const showColumns = options.value.setting && props.columns !== undefined
      const showDensity = options.value.density
      return (
        <>
          {options.value.reload && (
            <Tooltip title={locale.value.reload}>
              <button
                type="button"
                class={styles.action()}
                disabled={props.disabled || props.loading}
                aria-label={locale.value.reload}
                aria-busy={props.loading}
                onClick={reload}
              >
                <ReloadOutlinedIcon class={props.loading ? styles.loadingIcon() : styles.icon()} />
              </button>
            </Tooltip>
          )}
          {(showColumns || showDensity) && (
            <TableColumnSettings
              {...props.columnSettings}
              getPopupContainer={popupContainer.value}
              columns={props.columns ?? []}
              size={size.value}
              options={{
                density: showDensity,
                setting: showColumns,
                fixed: options.value.fixed,
                draggable: options.value.draggable,
              }}
              disabled={props.disabled}
              onUpdate:columns={(columns) => emit('update:columns', columns)}
              onUpdate:size={(value) => emit('update:size', value)}
              onReset={() => emit('reset')}
              v-slots={{ columnLabel: slots.columnLabel }}
            />
          )}
          {options.value.fullScreen && (
            <Tooltip
              title={fullscreen.value ? locale.value.exitFullScreen : locale.value.fullScreen}
            >
              <button
                type="button"
                class={styles.action()}
                disabled={props.disabled || !fullscreenAvailable.value || fullscreenPending.value}
                aria-label={
                  fullscreen.value ? locale.value.exitFullScreen : locale.value.fullScreen
                }
                aria-pressed={fullscreen.value}
                onClick={() => void toggleFullscreen()}
              >
                {fullscreen.value ? (
                  <FullscreenExitOutlinedIcon class={styles.icon()} />
                ) : (
                  <FullscreenOutlinedIcon class={styles.icon()} />
                )}
              </button>
            </Tooltip>
          )}
        </>
      )
    }
    return () => {
      const scope: TableToolbarSlotProps = {
        columns: props.columns ?? [],
        size: size.value,
        loading: props.loading,
        disabled: props.disabled,
        fullscreen: fullscreen.value,
        fullscreenAvailable: fullscreenAvailable.value,
        reload,
        toggleFullscreen,
        searchValue: props.searchValue,
        updateSearchValue,
        submitSearch,
        clearSearch,
      }
      const showSettings =
        slots.settings ||
        options.value.reload ||
        options.value.density ||
        (options.value.setting && props.columns !== undefined) ||
        options.value.fullScreen
      return (
        <div
          role="group"
          aria-label={locale.value.label}
          class={styles.root()}
          data-vtg-preset={preset.value}
        >
          {(slots.title || props.title != null) && (
            <div class={styles.title()}>{slots.title ? slots.title(scope) : props.title}</div>
          )}
          <div class={styles.right()}>
            {(slots.search || props.search) && (
              <div class={styles.search()}>{renderSearch(scope)}</div>
            )}
            {slots.filter && !props.multipleLine && (
              <div class={styles.filter()}>{slots.filter(scope)}</div>
            )}
            {slots.actions && <div class={styles.actions()}>{slots.actions(scope)}</div>}
            {showSettings && (
              <div class={styles.settings()}>
                {slots.settings ? slots.settings(scope) : renderSettings()}
              </div>
            )}
          </div>
          {slots.filter && props.multipleLine && (
            <div class={styles.extra()}>{slots.filter(scope)}</div>
          )}
          {slots.extra && <div class={styles.extra()}>{slots.extra(scope)}</div>}
        </div>
      )
    }
  },
})
