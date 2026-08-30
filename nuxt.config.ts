export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Find a Part',
      meta: [
        { name: 'description', content: 'Find automotive parts from suppliers around the world.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  supabase: {
    redirect: false
  },
  compatibilityDate: '2026-08-30'
})
