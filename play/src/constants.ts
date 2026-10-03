/** npm 包名——Playground 唯一需要解析的第三方运行时 */
export const VTG_PKG = '@vtable-guild/vtable-guild'

/**
 * 版本下拉里的「跟随最新」占位值。
 *
 * 不能拿一个具体版本号当默认值：那等于每次发版都要回来改常量，而没人改的时候，
 * Playground 一打开就停在旧版本上——awesome-vue review 时被指出的「打开时选中的
 * 是旧版本」，根因就是默认值取了 `MIN_SUPPORTED_VTG_VERSION` 而不是最新版。
 *
 * 选它永远解析成版本列表的第一项（列表按从新到旧排），列表没回来时落到兜底版本。
 */
export const LATEST = 'latest'

/** 版本下拉的两种状态：跟随最新，或钉死在某个具体版本 */
export type VersionSelection = typeof LATEST | string

/**
 * 首个带 `dist/index.full.mjs` 浏览器单文件产物的版本。
 *
 * 更早的版本只有 preserveModules 产物（几百个相对导入 + external 的
 * tailwind-variants），无法直接被 import map 指向，选了必然白屏。
 * 所以版本下拉只列出 >= 这个版本的版本号，而不是假装能选全部历史版本。
 */
export const MIN_SUPPORTED_VTG_VERSION = '2.4.0'

/** 可选 Vue 版本下限（低于此版本没有测过） */
export const MIN_SUPPORTED_VUE_VERSION = '3.5.0'

export const REPO_URL = 'https://github.com/parade0393/vtable-guild'
export const DOCS_URL = 'https://parade0393.github.io/vtable-guild/'

export const THEME_PRESETS = [
  { value: 'antdv', label: 'ant-design-vue' },
  { value: 'element-plus', label: 'element-plus' },
] as const

export type ThemePreset = (typeof THEME_PRESETS)[number]['value']
