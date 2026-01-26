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
    url: 'https://creaciones.studiomalek.com',
    name: 'Studio Malek Creaciones'
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
    domains: ['birth-poster.s3.us-west-1.amazonaws.com', 'custom-prints.s3.us-west-1.amazonaws.com', 'momentos-malek.s3.us-west-1.amazonaws.com']
  },

  // App configuration
  app: {
    head: {
      title: 'Studio Malek - Herramientas de Diseno',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Herramientas de diseno faciles de usar para crear posters unicos y memorables' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Studio Malek' },
        { property: 'og:locale', content: 'es_MX' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@studiomalek' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})