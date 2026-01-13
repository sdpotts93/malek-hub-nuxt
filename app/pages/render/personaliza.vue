<script setup lang="ts">
/**
 * Server-side Render Page for Personaliza
 *
 * This page is NOT for users - it's for Browserless to screenshot.
 * It loads a design config from S3 and renders it full-screen.
 *
 * Usage: /render/personaliza?configUrl=https://...
 */

import type { PersonalizaState, ImageFormat } from '~/stores/personaliza'

// Extended state with cropped image URL from S3
interface PersonalizaRenderConfig extends Omit<PersonalizaState, 'imageFile' | 'croppedBlob' | 'croppedImageUrl' | 'isUploadingToS3'> {
  croppedImageS3Url?: string
}

// Get config URL from query params
const route = useRoute()
const configUrl = route.query.configUrl as string

// State
const config = ref<PersonalizaRenderConfig | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)
const imageLoaded = ref(false)

// Track if page is ready for screenshot (config loaded + image loaded)
const isReady = computed(() => {
  if (!config.value) return false
  // If no image URL, we're ready (will show placeholder)
  if (!config.value.croppedImageS3Url) return true
  // Otherwise, wait for image to load
  return imageLoaded.value
})

// Handle image load event
function onImageLoad() {
  console.log('[Personaliza Render] Image loaded successfully')
  imageLoaded.value = true
}

// Handle image error event
function onImageError(e: Event) {
  console.error('[Personaliza Render] Image failed to load:', e)
  // Mark as ready anyway to not block forever
  imageLoaded.value = true
}

// Fallback timeout to ensure page becomes ready even if image events don't fire
function startFallbackTimeout() {
  setTimeout(() => {
    if (!imageLoaded.value) {
      console.warn('[Personaliza Render] Fallback timeout reached, marking as ready')
      imageLoaded.value = true
    }
  }, 15000) // 15 second fallback
}

// Fetch config on mount
onMounted(async () => {
  if (!configUrl) {
    error.value = 'Missing configUrl parameter'
    isLoading.value = false
    return
  }

  try {
    console.log('[Personaliza Render] Fetching config from:', configUrl)
    const response = await fetch(configUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`)
    }
    config.value = await response.json()
    console.log('[Personaliza Render] Config loaded, croppedImageS3Url:', config.value?.croppedImageS3Url)

    // Start fallback timeout if there's an image to load
    if (config.value?.croppedImageS3Url) {
      startFallbackTimeout()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load config'
    console.error('[Personaliza Render] Error:', err)
  } finally {
    isLoading.value = false
  }
})

// Helper to get orientation from format
const getOrientation = (format: ImageFormat): 'square' | 'horizontal' | 'vertical' => {
  switch (format) {
    case '1:1':
      return 'square'
    case '7:5':
      return 'horizontal'
    case '5:7':
    default:
      return 'vertical'
  }
}

// Compute aspect ratio class based on format
const aspectClass = computed(() => {
  if (!config.value) return ''
  const orientation = getOrientation(config.value.imageFormat)
  return `render-canvas--${orientation}`
})

// Text style class
const textStyleClass = computed(() => {
  if (!config.value) return ''
  return `render-canvas--text-${config.value.textStyle}`
})

// Check if text exists
const hasText = computed(() => {
  if (!config.value) return false
  return !!(config.value.title || config.value.subtitle)
})

// Check if margin color is dark (for text contrast)
const isColorDark = (hex: string): boolean => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return false
  const r = parseInt(result[1] || '0', 16)
  const g = parseInt(result[2] || '0', 16)
  const b = parseInt(result[3] || '0', 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

const isDarkMargin = computed(() => {
  if (!config.value) return false
  return config.value.hasMargin && isColorDark(config.value.marginColor)
})

// Calculate padding multiplier based on orientation
const paddingMultiplierType = computed(() => {
  if (!config.value) return 'height'
  const orientation = getOrientation(config.value.imageFormat)
  switch (orientation) {
    case 'horizontal':
      return 'width'
    case 'square':
      return 'width-scaled'
    case 'vertical':
    default:
      return 'height'
  }
})

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
        textStyleClass,
        {
          'render-canvas--has-text': hasText,
          'render-canvas--has-margin': config.hasMargin,
          'render-canvas--dark-margin': isDarkMargin,
          [`render-canvas--padding-${paddingMultiplierType}`]: config.hasMargin
        }
      ]"
      :style="config.hasMargin ? { backgroundColor: config.marginColor } : {}"
    >
      <!-- Ready marker for Browserless to wait for (hidden) -->
      <div v-if="isReady" id="render-ready" class="render-canvas__ready-marker" />
      <!-- Main canvas content -->
      <div class="render-canvas__content">
        <!-- Image wrapper -->
        <div class="render-canvas__image-wrapper">
          <!-- Cropped image from S3 (no crossorigin needed - just displaying) -->
          <img
            v-if="config.croppedImageS3Url"
            :src="config.croppedImageS3Url"
            alt=""
            class="render-canvas__image"
            @load="onImageLoad"
            @error="onImageError"
          >
          <!-- Fallback placeholder -->
          <div v-else class="render-canvas__placeholder">
            No image available
          </div>
        </div>

        <!-- Text container -->
        <div
          v-if="hasText"
          class="render-canvas__text-container"
        >
          <p v-if="config.title" class="render-canvas__title">
            {{ config.title }}
          </p>
          <p v-if="config.subtitle" class="render-canvas__subtitle">
            {{ config.subtitle }}
          </p>
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
$padding-side: 5%;
$padding-bottom-with-text: 12.143%;

.render-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  // Fill the entire viewport (Browserless sets correct aspect ratio)
  width: 100vw;
  height: 100vh;

  // Hidden marker for Browserless to detect when ready
  &__ready-marker {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  // ==========================================================================
  // Content Layout
  // ==========================================================================
  &__content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  // ==========================================================================
  // Margin/Padding System - using viewport units for consistency
  // ==========================================================================
  &--has-margin {
    .render-canvas__content {
      padding: $padding-side;
    }

    &.render-canvas--has-text {
      .render-canvas__content {
        padding: $padding-side $padding-side $padding-bottom-with-text $padding-side;
      }
    }
  }

  // Orientation-specific padding multipliers using viewport units
  // Vertical: use vh (height is the larger dimension)
  &--padding-height.render-canvas--has-margin.render-canvas--has-text {
    .render-canvas__content {
      padding-bottom: calc(100vh * 0.12143);
    }

    .render-canvas__text-container {
      height: calc(100vh * 0.12143);
    }
  }

  // Horizontal: use vw (width is the larger dimension)
  &--padding-width.render-canvas--has-margin.render-canvas--has-text {
    .render-canvas__content {
      padding-bottom: calc(100vw * 0.12143);
    }

    .render-canvas__text-container {
      height: calc(100vw * 0.12143);
    }
  }

  // Square: use vw with scale factor
  &--padding-width-scaled.render-canvas--has-margin.render-canvas--has-text {
    .render-canvas__content {
      padding-bottom: calc(92vw * 1.4 * 0.12143);
    }

    .render-canvas__text-container {
      height: calc(100vw * 1.4 * 0.12143);
    }
  }

  // ==========================================================================
  // Image Wrapper
  // ==========================================================================
  &__image-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-family: system-ui, sans-serif;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // ==========================================================================
  // Text Container
  // ==========================================================================
  &__text-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 $padding-side;
    height: $padding-bottom-with-text;
  }

  &__title {
    margin: 0;
    // Use vmin for consistent sizing across orientations (3% of smaller dimension)
    font-size: 3vmin;
    line-height: 1.5;
    letter-spacing: 0.12em;
    color: #1a1a1a;
    text-transform: uppercase;
    white-space: nowrap;
  }

  &__subtitle {
    margin: 0;
    // Use vmin for consistent sizing across orientations (2% of smaller dimension)
    font-size: 2vmin;
    line-height: 2.1em;
    color: #000;
    font-family: 'Avenir', sans-serif;
    font-weight: 300;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  // ==========================================================================
  // Dark margin - white text for contrast
  // ==========================================================================
  &--dark-margin {
    .render-canvas__title,
    .render-canvas__subtitle {
      color: #ffffff;
    }
  }

  // ==========================================================================
  // Text without margin - white text on image
  // ==========================================================================
  &:not(.render-canvas--has-margin) {
    .render-canvas__text-container {
      height: auto;
      padding: 5% $padding-side;
    }

    .render-canvas__title,
    .render-canvas__subtitle {
      color: #ffffff;
    }

    &.render-canvas--square {
      .render-canvas__text-container {
        padding-bottom: 3.5%;
      }
    }

    &.render-canvas--horizontal {
      .render-canvas__text-container {
        padding-bottom: 2.5%;
      }
    }
  }

  // ==========================================================================
  // Orientation-specific font sizes (using vmin for consistent sizing)
  // ==========================================================================
  &--square {
    .render-canvas__title {
      font-size: 2.14vmin;
    }

    .render-canvas__subtitle {
      font-size: 1.42vmin;
    }
  }

  &--horizontal {
    .render-canvas__title {
      font-size: 1.75vmin;
      line-height: 1.75;
    }

    .render-canvas__subtitle {
      font-size: 1.25vmin;
    }
  }

  // ==========================================================================
  // Text Style Variants
  // ==========================================================================

  // Moderno - DM Sans, font-weight 600
  &--text-moderno {
    .render-canvas__title {
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
    }
  }

  // Clasico - Merriweather, font-weight 400
  &--text-clasico {
    .render-canvas__title {
      font-family: 'Merriweather', serif;
      font-weight: 400;
    }
  }

  // Minimalista - Avenir, font-weight 300
  &--text-minimalista {
    .render-canvas__title {
      font-family: 'Avenir', sans-serif;
      font-weight: 300;
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
