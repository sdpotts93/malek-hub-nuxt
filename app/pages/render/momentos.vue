<script setup lang="ts">
/**
 * Server-side Render Page for Momentos
 *
 * This page is NOT for users - it's for Browserless to screenshot.
 * It loads a design config from S3 and renders it full-screen.
 *
 * Usage: /render/momentos?configUrl=https://...
 */

import { IMAGE_FILTERS, type CanvasCell, type MomentosState } from '~/stores/momentos'

// Get config URL from query params
const route = useRoute()
const configUrl = route.query.configUrl as string

// State
const config = ref<MomentosState | null>(null)
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

// Compute aspect ratio class based on format (SAME logic as Canvas.vue)
const aspectClass = computed(() => {
  if (!config.value) return ''
  switch (config.value.format) {
    case 'square':
      return 'render-canvas--square'
    case 'horizontal':
      return 'render-canvas--horizontal'
    case 'vertical':
      return 'render-canvas--vertical'
  }
})

// Compute gap class based on format and image count (SAME logic as Canvas.vue)
const gapClass = computed(() => {
  if (!config.value) return null
  const count = config.value.imageCount
  const format = config.value.format

  if (format === 'square') {
    if (count === 4) return 'render-canvas--gap-small'
    if (count === 25) return 'render-canvas--gap-medium'
    if (count === 64) return 'render-canvas--gap-large'
  } else {
    // Horizontal and vertical formats
    if (count === 12) return 'render-canvas--gap-small'
    if (count === 35) return 'render-canvas--gap-medium'
    if (count === 88) return 'render-canvas--gap-large'
  }
  return null
})

// Get grid dimensions (SAME logic as Canvas.vue store)
const gridDimensions = computed(() => {
  if (!config.value) return { cols: 1, rows: 1 }

  const count = config.value.imageCount
  const format = config.value.format

  if (format === 'square') {
    const sqrt = Math.sqrt(count)
    return { cols: sqrt, rows: sqrt }
  }

  if (format === 'horizontal') {
    switch (count) {
      case 12: return { cols: 4, rows: 3 }
      case 35: return { cols: 7, rows: 5 }
      case 88: return { cols: 11, rows: 8 }
      default: return { cols: 4, rows: 3 }
    }
  }

  // Vertical
  switch (count) {
    case 12: return { cols: 3, rows: 4 }
    case 35: return { cols: 5, rows: 7 }
    case 88: return { cols: 8, rows: 11 }
    default: return { cols: 3, rows: 4 }
  }
})

// Get image URL for a cell (using S3 URLs from config)
function getCellImageUrl(cell: CanvasCell): string | null {
  if (!cell.imageId || !config.value) return null
  const img = config.value.uploadedImages.find(i => i.id === cell.imageId)
  // Use high-res S3 URL for final render
  return img?.highResUrl || img?.s3HighResUrl || img?.mediumResUrl || img?.s3MediumResUrl || null
}

// Get CSS filter for a cell (SAME as Canvas.vue)
function getCellFilter(cell: CanvasCell): string {
  return IMAGE_FILTERS[cell.filter].cssFilter
}

// Get object-position style for a cell's image (SAME as Canvas.vue)
function getCellObjectPosition(cell: CanvasCell): string {
  return `${cell.panX}% ${cell.panY}%`
}

// Disable any layout/scroll
definePageMeta({
  layout: false,
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
      :class="[
        'render-canvas',
        aspectClass,
        gapClass,
        { 'render-canvas--has-margin': config.hasMargin }
      ]"
      :style="config.hasMargin ? { backgroundColor: config.marginColor } : {}"
    >
      <!-- Main canvas content -->
      <div class="render-canvas__content">
        <!-- Image grid -->
        <div
          class="render-canvas__grid"
          :style="{
            gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
            gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
          }"
        >
          <div
            v-for="cell in config.canvasCells"
            :key="cell.id"
            :class="[
              'render-canvas__cell',
              { 'render-canvas__cell--empty': !cell.imageId }
            ]"
          >
            <!-- Empty cell placeholder -->
            <div v-if="!cell.imageId" class="render-canvas__placeholder" />

            <!-- Image with transformations -->
            <div
              v-else-if="getCellImageUrl(cell)"
              class="render-canvas__cell-image-wrapper"
              :style="{
                transform: `rotate(${cell.rotation}deg) scale(${cell.zoom})`,
                filter: getCellFilter(cell),
              }"
            >
              <img
                :src="getCellImageUrl(cell)!"
                alt=""
                class="render-canvas__cell-image"
                crossorigin="anonymous"
                :style="{ objectPosition: getCellObjectPosition(cell) }"
              >
            </div>
          </div>
        </div>
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

  // ==========================================================================
  // Content Layout - using vmin for consistent sizing across all formats
  // vmin = smaller of viewport width or height, works for any aspect ratio
  // ==========================================================================
  $padding-base: 5vmin;

  &__content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
  }

  // Margin padding (same for all formats using vmin)
  &--has-margin &__content {
    padding: $padding-base;
  }

  // ==========================================================================
  // Image Grid
  // ==========================================================================
  &__grid {
    flex: 1;
    display: grid;
    gap: 0;
    width: 100%;
    height: 100%;
  }

  // Base gap when margin is enabled
  &--has-margin &__grid {
    gap: 1.5vmin;
  }

  // ==========================================================================
  // Dynamic gap based on image count (using vmin for all formats)
  // ==========================================================================
  &--gap-small .render-canvas__grid {
    gap: 3.5vmin;
  }

  &--gap-medium .render-canvas__grid {
    gap: 2.5vmin;
  }

  &--gap-large .render-canvas__grid {
    gap: 1.75vmin;
  }

  // ==========================================================================
  // Cell Styles
  // ==========================================================================
  &__cell {
    position: relative;
    background: transparent;
    overflow: hidden;

    &--empty {
      background: #ffffff; // White for print
    }
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    background: #ffffff;
  }

  &__cell-image-wrapper {
    position: absolute;
    inset: 0;
    overflow: hidden; // Clip zoomed/rotated images
  }

  &__cell-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>

<style lang="scss">
// Global reset only for this page (html/body)
// This won't affect other pages because it only loads on /render/momentos
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
