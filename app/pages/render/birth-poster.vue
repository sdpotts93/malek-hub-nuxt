<script setup lang="ts">
/**
 * Server-side Render Page for Birth Poster
 *
 * This page is NOT for users - it's for Browserless to screenshot.
 * It loads a design config from S3 and renders it full-screen.
 *
 * Usage: /render/birth-poster?configUrl=https://...
 */

import { getStyleById } from '~/types'
import type { BirthPosterState } from '~/types'

// Get config URL from query params
const route = useRoute()
const configUrl = route.query.configUrl as string

// State
const config = ref<BirthPosterState | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)

// Fetch config on mount
onMounted(async () => {
  if (!configUrl) {
    error.value = 'Missing configUrl parameter'
    isLoading.value = false
    return
  }

  try {
    const response = await fetch(configUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`)
    }
    config.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load config'
  } finally {
    isLoading.value = false
  }
})

// Convert hex to RGB values (0-1 range)
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(result[1] || '0', 16) / 255,
    g: parseInt(result[2] || '0', 16) / 255,
    b: parseInt(result[3] || '0', 16) / 255,
  }
}

// Generate unique filter ID for each baby
const getFilterId = (index: number) => `colorize-baby-${index}`

// Get color matrix values for SVG filter
const getColorMatrix = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  return `
    ${1 - r} 0 0 0 ${r}
    0 ${1 - g} 0 0 ${g}
    0 0 ${1 - b} 0 ${b}
    0 0 0 1 0
  `
}

// Format baby names for title (1-2 babies share header with &)
const combinedNames = computed(() => {
  if (!config.value) return ''
  if (config.value.babyCount === 1) {
    return config.value.babies[0]?.nombre || ''
  }
  if (config.value.babyCount === 2) {
    const name1 = config.value.babies[0]?.nombre || ''
    const name2 = config.value.babies[1]?.nombre || ''
    if (name1 && name2) return `${name1} & ${name2}`
    return name1 || name2 || ''
  }
  return ''
})

// Maximum height in the illustration area (in cm)
const MAX_ILLUSTRATION_HEIGHT = 58.75

// Calculate height scale as a percentage based on baby's altura
const getHeightScale = (altura: number): string => {
  const scale = (altura / MAX_ILLUSTRATION_HEIGHT) * 100
  return `${Math.min(scale, 100)}%`
}

// Format height display (in cm)
const formatHeight = (altura: number) => `${altura} CM`

// Format weight display (in grams)
const formatWeight = (peso: number) => `${peso} GRAMOS`

// Format date display (Spanish)
const formatDate = (fecha: Date | string | null) => {
  if (!fecha) return null
  const date = new Date(fecha)
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()
  const year = date.getFullYear()
  return `${day} DE ${month} DE ${year}`
}

// Build data line for a baby
const buildDataLine = (baby: BirthPosterState['babies'][0]) => {
  const parts: string[] = []
  parts.push(formatHeight(baby.altura))
  if (baby.peso) {
    parts.push(formatWeight(baby.peso))
  }
  const formattedDate = formatDate(baby.fechaNacimiento)
  if (formattedDate) {
    parts.push(formattedDate)
  }
  if (baby.lugarNacimiento) {
    parts.push(baby.lugarNacimiento.toUpperCase())
  }
  return parts.join(' / ')
}

// Disable any layout/scroll
definePageMeta({
  layout: false,
})

// Load fonts for Browserless (since layout: false skips normal font loading)
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap',
    },
  ],
})
</script>

<template>
  <div class="render-page">
    <!-- Loading state -->
    <div v-if="isLoading" class="render-page__loading">
      Loading config...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="render-page__error">
      {{ error }}
    </div>

    <!-- Canvas render -->
    <div
      v-else-if="config"
      :class="['render-canvas', `render-canvas--count-${config.babyCount}`]"
    >
      <!-- SVG Filters for colorizing -->
      <svg class="render-canvas__svg-defs" aria-hidden="true">
        <defs>
          <filter
            v-for="(baby, index) in config.babies"
            :id="getFilterId(index)"
            :key="`filter-${index}`"
            color-interpolation-filters="sRGB"
          >
            <feColorMatrix
              type="matrix"
              :values="getColorMatrix(baby.illustrationColor)"
            />
          </filter>
        </defs>
      </svg>

      <!-- Colored illustration area -->
      <div
        class="render-canvas__illustration-area"
        :style="{ backgroundColor: config.backgroundColor }"
      >
        <!-- Baby illustrations -->
        <div class="render-canvas__babies">
          <div
            v-for="(baby, index) in config.babies"
            :key="index"
            class="render-canvas__baby"
            :style="{ height: getHeightScale(baby.altura) }"
          >
            <img
              v-if="getStyleById(baby.styleId)"
              :src="getStyleById(baby.styleId)!.image"
              :alt="`Baby ${index + 1}`"
              class="render-canvas__illustration"
              crossorigin="anonymous"
              :style="{
                transform: baby.orientation === 'derecha' ? 'scaleX(-1)' : 'none',
                filter: `url(#${getFilterId(index)})`,
              }"
            >
          </div>
        </div>

        <!-- Watermark signature -->
        <div class="render-canvas__watermark">
          <img
            src="/watermark-dark.png"
            alt="Studio Malek"
            class="render-canvas__watermark-img"
            crossorigin="anonymous"
          >
        </div>
      </div>

      <!-- Text area -->
      <div class="render-canvas__text-area">
        <!-- 1-2 babies: Combined title, stacked data lines -->
        <template v-if="config.babyCount <= 2">
          <p v-if="config.babies[0]?.showScale" class="render-canvas__title">
            ESCALA 1:1 DE{{ combinedNames ? ' ' + combinedNames.toUpperCase() : '' }}
          </p>
          <p v-else-if="combinedNames" class="render-canvas__title">
            {{ combinedNames.toUpperCase() }}
          </p>
          <div class="render-canvas__data-lines">
            <p
              v-for="(baby, index) in config.babies"
              :key="index"
              class="render-canvas__data"
            >
              {{ buildDataLine(baby) }}
            </p>
          </div>
        </template>

        <!-- 3-4 babies: Individual columns -->
        <template v-else>
          <div class="render-canvas__columns">
            <div
              v-for="(baby, index) in config.babies"
              :key="index"
              class="render-canvas__column"
            >
              <p v-if="baby.showScale" class="render-canvas__title">
                ESCALA 1:1 DE{{ baby.nombre ? ' ' + baby.nombre.toUpperCase() : '' }}
              </p>
              <p v-else-if="baby.nombre" class="render-canvas__title">
                {{ baby.nombre.toUpperCase() }}
              </p>
              <p class="render-canvas__data">
                {{ buildDataLine(baby) }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// =============================================================================
// Render Page Container
// =============================================================================
.render-page {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background: #ffffff;
  overflow: hidden;

  &__loading,
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-family: system-ui, sans-serif;
    font-size: 24px;
    color: #666;
  }

  &__error {
    color: #dc2626;
  }
}

// =============================================================================
// Canvas Styles - Simplified for server-side rendering
// Browserless sets viewport to exact aspect ratio, so we just fill it
// =============================================================================
.render-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  // Fill the entire viewport (Browserless sets correct aspect ratio)
  width: 100vw;
  height: 100vh;
  container-type: inline-size;

  // Hidden SVG for filter definitions
  &__svg-defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  // ==========================================================================
  // Illustration Area
  // ==========================================================================
  &__illustration-area {
    position: relative;
    flex: 1 1 0;
    min-height: 0;
    margin: 8.5% 8.5% 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // ==========================================================================
  // Baby Illustrations Container
  // ==========================================================================
  &__babies {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    gap: 16px;
  }

  &__baby {
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  &__illustration {
    height: 100%;
    width: auto;
    object-fit: contain;
  }

  // 1 baby layout
  &--count-1 {
    .render-canvas__baby {
      max-width: 65%;
    }
  }

  // 2 babies layout
  &--count-2 {
    .render-canvas__babies {
      justify-content: space-evenly;
      padding-inline: 5cqi;
    }
  }

  // 3-4 babies layout
  &--count-3,
  &--count-4 {
    .render-canvas__babies {
      justify-content: space-evenly;
    }

    .render-canvas__illustration-area {
      margin: 4.25% 4.25% 0;
    }
  }

  // ==========================================================================
  // Watermark - using cqi units for consistent positioning at any render size
  // ==========================================================================
  &__watermark {
    position: absolute;
    bottom: 2cqi;
    right: 2cqi;
  }

  &__watermark-img {
    width: 3cqi;
    height: auto;
  }

  &--count-3 &__watermark,
  &--count-4 &__watermark {
    bottom: 1.5cqi;
    right: 1.5cqi;
  }

  &--count-3 &__watermark-img,
  &--count-4 &__watermark-img {
    width: 1.5cqi;
  }

  // ==========================================================================
  // Text Area
  // ==========================================================================
  &__text-area {
    flex: 0 0 10%;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 4.25%;
  }

  &__title {
    font-family: 'Lexend', sans-serif;
    font-size: 2.4cqi;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #1a1a1a;
    line-height: 2;
  }

  &__data-lines {
    display: flex;
    flex-direction: column;
  }

  &__data {
    font-family: 'Lexend', sans-serif;
    font-size: 1.8cqi;
    font-weight: 400;
    letter-spacing: 0.12em;
    color: #666666;
    margin: 0;
    line-height: 1.7;
  }

  // ==========================================================================
  // Columns (3-4 babies)
  // ==========================================================================
  &__columns {
    display: flex;
    justify-content: space-evenly;
    gap: 5%;
  }

  &__column {
    text-align: center;
  }

  &--count-2 {
    .render-canvas__title {
      font-size: 2cqi;
    }
    .render-canvas__data {
      font-size: 1.5cqi;
    }
  }

  &--count-3 {
    .render-canvas__title {
      font-size: 1.2cqi;
    }
    .render-canvas__data {
      font-size: 0.8cqi;
    }
  }

  &--count-4 {
    .render-canvas__title {
      font-size: 0.9cqi;
    }
    .render-canvas__data {
      font-size: 0.8cqi;
    }
  }
}
</style>

<style lang="scss">
// Global reset only for this page
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
