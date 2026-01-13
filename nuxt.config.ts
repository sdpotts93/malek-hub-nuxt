// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Runtime config for environment variables
  runtimeConfig: {
    // Server-only (private)
    shopifyStorefrontToken: process.env.SHOPIFY_STOREFRONT_TOKEN || '',
    // Public (exposed to client)
    public: {
      shopifyStoreDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
      birthPosterProductId: process.env.BIRTH_POSTER_PRODUCT_ID || '',
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],

  // Global CSS
  css: ['~/assets/scss/main.scss'],

  // Vite configuration for SCSS
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "~/assets/scss/_variables.scss" as *;
            @use "~/assets/scss/_mixins.scss" as *;
          `
        }
      }
    }
  },
  site: {
    url: 'https://hub.studiomalek.com',
    name: 'Studio Malek Hub'
  },

  // Fonts configuration
  fonts: {
    families: [
      {
        name: 'DM Sans',
        provider: 'google',
        weights: [400, 500, 600, 700]
      },
      {
        name: 'Lexend',
        provider: 'google',
        weights: [400, 500, 600, 700]
      },
      {
        name: 'Merriweather',
        provider: 'google',
        weights: [400]
      },
      {
        name: 'Nunito Sans',
        provider: 'google',
        weights: [300]
      }
    ]
  },

  // Image configuration
  image: {
    provider: 'netlify',
  },

  // App configuration
  app: {
    head: {
      title: 'Studio Malek - Design Tools',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Create personalized posters and designs with Studio Malek' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})