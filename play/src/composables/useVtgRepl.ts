import { computed, ref, watchEffect, type ComputedRef } from 'vue'
import { mergeImportMap, useStore, useVueImportMap, type ImportMap } from '@vue/repl'
import {
  MIN_SUPPORTED_VTG_VERSION,
  MIN_SUPPORTED_VUE_VERSION,
  VTG_PKG,
  type ThemePreset,
} from '@/constants'
import { CDN_SOURCES, cdnFileUrl, fetchVersions, type CdnSource } from '@/utils/cdn'
import { takeDemoSourceFromUrl } from '@/utils/share'
import { NEW_SFC, WELCOME_SFC } from '@/templates'

const STORAGE_KEY = 'vtg-play-settings'

interface PersistedSettings {
  cdn?: CdnSource
  preset?: ThemePreset
  vtgVersion?: string
  vueVersion?: string | null
}

function loadSettings(): PersistedSettings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as PersistedSettings
  } catch {
    return {}
  }
}

export function useVtgRepl() {
  const saved = loadSettings()

  // 存过的值可能已经不再是合法选项（比如 dev 下选过 'local'，或者以后某个源被移除），
  // 校验一遍，避免用户被卡在一个永远加载不出来的状态里。
  const availableCdns = CDN_SOURCES.map((item) => item.value) as CdnSource[]
  const cdn = ref<CdnSource>(
    saved.cdn && availableCdns.includes(saved.cdn) ? saved.cdn : 'jsdelivr',
  )
  const preset = ref<ThemePreset>(saved.preset ?? 'antdv')
  // null / 'latest' 表示「跟随最新」，等版本列表拉回来后再定住具体版本号
  const vtgVersion = ref<string>(saved.vtgVersion ?? MIN_SUPPORTED_VTG_VERSION)

  const vtgVersions = ref<string[]>([])
  const vueVersions = ref<string[]>([])
  const versionError = ref('')

  const { vueVersion, productionMode, defaultVersion } = useVueImportMap()
  if (saved.vueVersion !== undefined) vueVersion.value = saved.vueVersion

  const effectiveVueVersion = computed(() => vueVersion.value || defaultVersion)

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

  // 只能消费一次：读到 ?demo= 的同时会把它从地址栏抹掉
  const incomingDemo = takeDemoSourceFromUrl()

  const store = useStore(
    {
      builtinImportMap,
      vueVersion,
      resourceLinks,
      template: ref({ welcomeSFC: WELCOME_SFC, newSFC: NEW_SFC }),
    },
    // 文档站带过来的 ?demo= 优先；否则用分享链接里的 hash
    incomingDemo ? undefined : location.hash,
  )

  if (incomingDemo) {
    void store.setFiles({ 'src/App.vue': incomingDemo }, 'src/App.vue')
  }

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

  // 分享链接：repl 自己的 serialize 写进 hash
  watchEffect(() => {
    history.replaceState({}, '', store.serialize())
  })

  watchEffect(() => {
    const settings: PersistedSettings = {
      cdn: cdn.value,
      preset: preset.value,
      vtgVersion: vtgVersion.value,
      vueVersion: vueVersion.value,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // 隐私模式下 localStorage 不可写，忽略即可
    }
  })

  async function loadVersions() {
    versionError.value = ''
    const [vtg, vue] = await Promise.allSettled([
      fetchVersions(VTG_PKG, { minVersion: MIN_SUPPORTED_VTG_VERSION }),
      fetchVersions('vue', { minVersion: MIN_SUPPORTED_VUE_VERSION }),
    ])

    const vtgList = vtg.status === 'fulfilled' ? vtg.value : null
    const latestVtg = vtgList?.[0]
    if (vtgList && latestVtg) {
      vtgVersions.value = vtgList
      // 没有存过选择、或存的版本已经不存在时，落到最新
      if (!vtgList.includes(vtgVersion.value)) vtgVersion.value = latestVtg
    } else if (vtgList) {
      // 请求成功但过滤后为空：npm 上还没有任何带浏览器单文件产物的版本。
      // 和「网络拉不到」是两回事，不要混为一谈。
      versionError.value =
        `npm 上还没有 >= ${MIN_SUPPORTED_VTG_VERSION} 的版本（浏览器单文件产物随该版本首次发布）。` +
        (import.meta.env.DEV ? '本地调试请把 CDN 切到「本地构建产物」。' : '')
    } else {
      versionError.value = '版本列表拉取失败，可尝试切换 CDN 源'
    }

    if (vue.status === 'fulfilled') vueVersions.value = vue.value
  }

  void loadVersions()

  return {
    store,
    previewOptions,
    cdn,
    preset,
    vtgVersion,
    vtgVersions,
    vueVersion,
    vueVersions,
    defaultVueVersion: defaultVersion,
    productionMode,
    versionError,
    reloadVersions: loadVersions,
  }
}
