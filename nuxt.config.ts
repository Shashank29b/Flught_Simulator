// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', 'nuxt-auth-utils', '@nuxt/eslint'],
  typescript: { strict: true },
  postcss: { plugins: { 'tailwindcss/nesting': false } },
  app: {
    head: { title: 'SkyNav Sim', htmlAttrs: { lang: 'en' } },
  },
})
