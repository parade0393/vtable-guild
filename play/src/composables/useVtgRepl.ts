import {
  computed,
  effectScope,
  onScopeDispose,
  ref,
  shallowRef,
  watch,
  watchEffect,
  type ComputedRef,
} from 'vue'
import {
  mergeImportMap,
  useStore,
  useVueImportMap,
  type ImportMap,
  type ReplStore,
} from '@vue/repl'
import {
  LATEST,
  MIN_SUPPORTED_VTG_VERSION,
  MIN_SUPPORTED_VUE_VERSION,
  VERSION_LOAD_TIMEOUT,
  VERSION_REQUEST_TIMEOUT,
  VTG_PKG,
  type ThemePreset,
  type VersionSelection,
} from '@/constants'
import { CDN_SOURCES, cdnFileUrl, fetchVersions, type CdnSource } from '@/utils/cdn'
import { takeDemoSourceFromUrl } from '@/utils/share'
import { resolveStaleSelection, resolveVersion, toVersionSelection } from '@/utils/versionSelection'
import { NEW_SFC, WELCOME_SFC } from '@/templates'

const STORAGE_KEY = 'vtg-play-settings'

export interface UseVtgReplOptions {
  /**
   * 每个版本源请求的超时（毫秒），默认 VERSION_REQUEST_TIMEOUT。
   *
   * 暴露出来只为了测试：要把超时压到比启动兜底更短，才能单独走到「拉取失败」那条分支。
   */
  versionRequestTimeout?: number
}

interface PersistedSettings {
  cdn?: CdnSource
  preset?: ThemePreset
  /** 'latest' 或具体版本号；历史数据里的 null 按「跟随最新」读 */
  vtgVersion?: VersionSelection | null
  vueVersion?: VersionSelection | null
}

function loadSettings(): PersistedSettings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as PersistedSettings
  } catch {
    return {}
  }
}

export function useVtgRepl(options: UseVtgReplOptions = {}) {
  const saved = loadSettings()
  const versionRequestTimeout = options.versionRequestTimeout ?? VERSION_REQUEST_TIMEOUT

  // 存过的值可能已经不再是合法选项（比如 dev 下选过 'local'，或者以后某个源被移除），
  // 校验一遍，避免用户被卡在一个永远加载不出来的状态里。
  const availableCdns = CDN_SOURCES.map((item) => item.value) as CdnSource[]
  const cdn = ref<CdnSource>(
    saved.cdn && availableCdns.includes(saved.cdn) ? saved.cdn : 'jsdelivr',
  )
  const preset = ref<ThemePreset>(saved.preset ?? 'antdv')

  // 下拉 v-model 的是「选择」而不是「版本号」：'latest' 是选择，'2.7.1' 也是选择。
  // 真正拼进 CDN 地址的版本号由下面的 computed 解析，所以发新版本不用回来改默认值。
  const vtgSelection = ref<VersionSelection>(toVersionSelection(saved.vtgVersion))
  const vueSelection = ref<VersionSelection>(toVersionSelection(saved.vueVersion))

  const vtgVersions = ref<string[]>([])
  const vueVersions = ref<string[]>([])
  const versionError = ref('')

  const { vueVersion: replVueVersion, productionMode, defaultVersion } = useVueImportMap()

  /**
   * 「跟随最新」时不给 repl 具体版本号：null 会让它直接用打包进来的 compiler-sfc，
   * 不会为了一个版本号再去 CDN 拉一份。运行时版本仍然是最新的（见 effectiveVueVersion）。
   * 只有用户主动钉了具体版本，才按那个版本去拉编译器。
   */
  watch(
    vueSelection,
    (selection) => {
      replVueVersion.value = selection === LATEST ? null : selection
    },
    { immediate: true },
  )

  const vtgVersion = computed(() =>
    resolveVersion(vtgSelection.value, vtgVersions.value, MIN_SUPPORTED_VTG_VERSION),
  )
  const effectiveVueVersion = computed(() =>
    resolveVersion(vueSelection.value, vueVersions.value, defaultVersion),
  )

  const vtgFile = (file: string) => cdnFileUrl(cdn.value, VTG_PKG, vtgVersion.value, file)

  /**
   * 完全自己拼 import map，而不是复用 useVueImportMap().importMap：
   * 后者只有在 vueVersion 为 null 时才认 defaults，一旦选了具体 Vue 版本就写死 jsDelivr，
   * 那样「CDN 源」这个开关就名存实亡了（对国内用户等于没有）。
   */
  const builtinImportMap: ComputedRef<ImportMap> = computed(() =>
    mergeImportMap(
      {
        imports: {
          vue: cdnFileUrl(
            cdn.value,
            '@vue/runtime-dom',
            effectiveVueVersion.value,
            `dist/runtime-dom.esm-browser${productionMode.value ? '.prod' : ''}.js`,
          ),
          'vue/server-renderer': cdnFileUrl(
            cdn.value,
            '@vue/server-renderer',
            effectiveVueVersion.value,
            'dist/server-renderer.esm-browser.js',
          ),
        },
      },
      {
        // 单文件浏览器产物：只 external vue，tailwind-variants 已内联，一条映射就够
        imports: { [VTG_PKG]: vtgFile('dist/index.full.mjs') },
      },
    ),
  )

  // 编译器和 es-module-shims 也跟着 CDN 开关走，否则切到 npmmirror 仍然会卡在 jsDelivr
  const resourceLinks = computed(() => ({
    vueCompilerUrl: (version: string) =>
      cdnFileUrl(cdn.value, '@vue/compiler-sfc', version, 'dist/compiler-sfc.esm-browser.js'),
    esModuleShims: cdnFileUrl(
      cdn.value,
      'es-module-shims',
      '1.5.18',
      'dist/es-module-shims.wasm.js',
    ),
  }))

  // 预览 iframe：CSS 用 link 注入，插件安装用 customCode 注入，
  // 这样用户写的示例里只需要 <VTable>，不用每次手写 app.use(...)
  const previewOptions = computed(() => ({
    headHTML: [
      `<link rel="stylesheet" href="${vtgFile('css/style.css')}">`,
      `<style>body{margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif}</style>`,
    ].join('\n'),
    customCode: {
      importCode: `import { createVTableGuild } from '${VTG_PKG}'`,
      useCode: `app.use(createVTableGuild({ themePreset: '${preset.value}' }))`,
    },
  }))

  /**
   * 版本列表落地后才创建 store。
   *
   * 否则首屏会先按兜底版本把预览 iframe 的产物拉一遍、等列表回来再换一次，
   * 表现出来就是「Playground 打开时选中的是旧版本，然后跳成新版」——
   * awesome-vue review 时被指出的正是这个。宁可先显示 Loading，也不演这一下。
   *
   * 放进独立 effectScope：这些 watch 依然挂在组件作用域下，卸载时跟着一起停掉。
   */
  const storeScope = effectScope()
  const store = shallowRef<ReplStore | null>(null)

  /**
   * 启动兜底计时器。
   *
   * 从设置起一直有效，直到编辑器真正开起来（createStore）或 composable 被卸载才清。
   * 早先它在 loadVersions 的第一行就被清掉，于是版本请求一旦挂住就永远等不到它——
   * 那 3 秒等于没写。
   */
  let bootTimer: ReturnType<typeof setTimeout> | undefined

  function clearBootTimer() {
    if (bootTimer === undefined) return
    clearTimeout(bootTimer)
    bootTimer = undefined
  }

  function createStore() {
    // 先清兜底：编辑器要开起来了，兜底不再需要（兜底路径自己进来时它已经触发完）
    clearBootTimer()

    // 兜底路径和「版本列表回来了」都会走到这里。store 已经建过就直接返回：
    // useStore 会挂一串 watch、按 import map 拉产物，建两遍等于把编辑器启动两遍。
    if (store.value) return

    // 只能消费一次：读到 ?demo= 的同时会把它从地址栏抹掉
    const incomingDemo = takeDemoSourceFromUrl()

    storeScope.run(() => {
      const created = useStore(
        {
          builtinImportMap,
          vueVersion: replVueVersion,
          resourceLinks,
          template: ref({ welcomeSFC: WELCOME_SFC, newSFC: NEW_SFC }),
        },
        // 文档站带过来的 ?demo= 优先；否则用分享链接里的 hash
        incomingDemo ? undefined : location.hash,
      )
      store.value = created
      if (incomingDemo) {
        void created.setFiles({ 'src/App.vue': incomingDemo }, 'src/App.vue')
      }
    })
  }

  // 分享链接：repl 自己的 serialize 写进 hash
  watchEffect(() => {
    if (!store.value) return
    history.replaceState({}, '', store.value.serialize())
  })

  watchEffect(() => {
    const settings: PersistedSettings = {
      cdn: cdn.value,
      preset: preset.value,
      vtgVersion: vtgSelection.value,
      vueVersion: vueSelection.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // 隐私模式下 localStorage 不可写，忽略即可
    }
  })

  // 请求慢到离谱时不等它：先把编辑器开起来，版本稍后自己切过去。
  // 这里只负责「设置」——清它的时机在 createStore（编辑器开起来）和卸载收尾里，
  // 不能因为 loadVersions 跑起来了就提前清，那正是兜底失效的原因
  bootTimer = setTimeout(createStore, VERSION_LOAD_TIMEOUT)

  /**
   * 版本请求的取消句柄。
   *
   * 卸载时掐掉在途请求；切换 CDN 重拉时掐掉上一次的——否则慢源迟到的响应会把新源的结果覆盖掉。
   */
  let versionController: AbortController | null = null

  async function loadVersions() {
    versionController?.abort()
    const controller = new AbortController()
    versionController = controller

    versionError.value = ''
    const [vtg, vue] = await Promise.allSettled([
      fetchVersions(VTG_PKG, {
        minVersion: MIN_SUPPORTED_VTG_VERSION,
        signal: controller.signal,
        timeout: versionRequestTimeout,
      }),
      fetchVersions('vue', {
        minVersion: MIN_SUPPORTED_VUE_VERSION,
        signal: controller.signal,
        timeout: versionRequestTimeout,
      }),
    ])

    // 请求期间被卸载、或被新一轮重拉取代：结果已经没有意义，别再往状态里写
    if (controller.signal.aborted) return

    const vtgList = vtg.status === 'fulfilled' ? vtg.value : null
    const latestVtg = vtgList?.[0]
    if (vtgList && latestVtg) {
      vtgVersions.value = vtgList
      // 钉的版本已经不在列表里时退回跟随最新，免得用户被卡在一个永远加载不出来的版本上
      vtgSelection.value = resolveStaleSelection(vtgSelection.value, vtgList)
    } else if (vtgList) {
      // 请求成功但过滤后为空：npm 上还没有任何带浏览器单文件产物的版本。
      // 和「网络拉不到」是两回事，不要混为一谈。
      versionError.value =
        `npm 上还没有 >= ${MIN_SUPPORTED_VTG_VERSION} 的版本（浏览器单文件产物随该版本首次发布）。` +
        (import.meta.env.DEV ? '本地调试请把 CDN 切到「本地构建产物」。' : '')
    } else {
      versionError.value = '版本列表拉取失败，可尝试切换 CDN 源'
    }

    if (vue.status === 'fulfilled') {
      vueVersions.value = vue.value
      vueSelection.value = resolveStaleSelection(vueSelection.value, vue.value)
    }

    // 列表落地（或确认拉不到）后才真正开编辑器；兜底计时器已经先开过时这里是空操作
    createStore()
  }

  // 卸载（或所在 effectScope 被停掉）时收尾：timer 和在途请求都不能留着去写已经卸载的 ref
  onScopeDispose(() => {
    clearBootTimer()
    versionController?.abort()
    versionController = null
  })

  void loadVersions()

  return {
    store,
    previewOptions,
    cdn,
    preset,
    // 下拉 v-model 的是「选择」
    vtgSelection,
    vueSelection,
    // 真正被拼进 CDN 地址的版本号
    vtgVersion,
    vtgVersions,
    vueVersions,
    productionMode,
    versionError,
    reloadVersions: loadVersions,
  }
}
