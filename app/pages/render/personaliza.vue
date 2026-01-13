<script setup lang="ts">
/**
 * Server-side Render Page for Personaliza
 *
 * This page is NOT for users - it's for Browserless to screenshot.
 * It loads a design config from S3 and renders it full-screen.
 *
 * Usage: /render/personaliza?configUrl=https://...
 */

import type { PersonalizaState, ImageFormat, TextStyle } from '~/stores/personaliza'

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
      <!-- Main canvas content -->
      <div class="render-canvas__content">
        <!-- Image wrapper -->
        <div class="render-canvas__image-wrapper">
          <!-- Cropped image from S3 -->
          <img
            v-if="config.croppedImageS3Url"
            :src="config.croppedImageS3Url"
            alt=""
            class="render-canvas__image"
            crossorigin="anonymous"
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  overflow: hidden;

  &__loading,
  &__error {
    font-family: system-ui, sans-serif;
    font-size: 24px;
    color: #666;
  }

  &__error {
    color: #dc2626;
  }
}

// =============================================================================
// Canvas Styles - Matching personaliza/Canvas.vue
// =============================================================================
$padding-side: 5%;
$padding-bottom-with-text: 12.143%;

.render-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  container-type: size;

  // ==========================================================================
  // Aspect Ratio Variants
  // ==========================================================================

  // Square (1:1)
  &--square {
    aspect-ratio: 1;
    height: min(100cqh, 100cqw);
    width: auto;
  }

  // Horizontal (7:5)
  &--horizontal {
    aspect-ratio: 7 / 5;
    width: min(100cqw, calc(100cqh * 7 / 5));
    height: auto;
  }

  // Vertical (5:7)
  &--vertical {
    aspect-ratio: 5 / 7;
    height: min(100cqh, calc(100cqw * 7 / 5));
    width: auto;
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
  // Margin/Padding System
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

  // Orientation-specific padding multipliers
  &--padding-height.render-canvas--has-margin.render-canvas--has-text {
    .render-canvas__content {
      padding-bottom: calc(100cqh * 0.12143);
    }

    .render-canvas__text-container {
      height: calc(100cqh * 0.12143);
    }
  }

  &--padding-width.render-canvas--has-margin.render-canvas--has-text {
    .render-canvas__content {
      padding-bottom: calc(100cqw * 0.12143);
    }

    .render-canvas__text-container {
      height: calc(100cqw * 0.12143);
    }
  }

  &--padding-width-scaled.render-canvas--has-margin.render-canvas--has-text {
    .render-canvas__content {
      padding-bottom: calc(92cqw * 1.4 * 0.12143);
    }

    .render-canvas__text-container {
      height: calc(100cqw * 1.4 * 0.12143);
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
    font-size: 3cqi;
    line-height: 1.5;
    letter-spacing: 0.12em;
    color: #1a1a1a;
    text-transform: uppercase;
    white-space: nowrap;
  }

  &__subtitle {
    margin: 0;
    font-size: 2cqi;
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
  // Orientation-specific font sizes
  // ==========================================================================
  &--square {
    .render-canvas__title {
      font-size: 2.14cqi;
    }

    .render-canvas__subtitle {
      font-size: 1.42cqi;
    }
  }

  &--horizontal {
    .render-canvas__title {
      font-size: 1.75cqi;
      line-height: 1.75;
    }

    .render-canvas__subtitle {
      font-size: 1.25cqi;
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
