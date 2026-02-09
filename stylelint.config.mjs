export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  overrides: [
    {
      files: ['**/*.vue', '**/*.html'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // 允许 BEM（Element Plus 等三方组件类名，如 el-table__header / el-table-v2__row-cell）
    'selector-class-pattern': [
      '^(?:(?:o|c|u|t|s|is|has|_|js|qa)-)?[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:[.+])?$',
      {
        message:
          'Expected class selector to be kebab-case or BEM (block__element--modifier) in lowercase.',
      },
    ],
    // 允许 Vue 的 deep 选择器
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global'],
      },
    ],
    // 允许 Vue 的 v-bind 函数
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['v-bind'],
      },
    ],
    // 颜色使用完整格式
    'color-hex-length': 'long',
    // 禁止空块
    'block-no-empty': true,
    // 禁止重复选择器
    'no-duplicate-selectors': true,
  },
}
