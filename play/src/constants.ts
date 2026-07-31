/** npm 包名——Playground 唯一需要解析的第三方运行时 */
export const VTG_PKG = '@vtable-guild/vtable-guild'

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
