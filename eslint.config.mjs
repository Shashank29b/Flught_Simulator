// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['docs/**', 'prisma/migrations/**'],
}, {
  rules: {
    'vue/multi-word-component-names': 'off',
  },
})
