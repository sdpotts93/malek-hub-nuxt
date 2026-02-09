<script setup lang="ts">
import { isColorDark } from '~/stores/personaliza'

interface Props {
  mobilePanelOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mobilePanelOpen: false,
})

const store = usePersonalizaStore()

// Check if image is loading (has source but no cropped preview yet)
const isImageLoading = computed(() => {
  return store.hasImage && !store.croppedImageUrl
})

// Get the correct frame image based on orientation
const currentFrameImage = computed(() => {
  if (!store.frameStyle) return null
  // Use appropriate frame based on orientation
  switch (store.orientation) {
    case 'horizontal':
      return store.frameStyle.frameImageHorizontal
    case 'square':
      return store.frameStyle.frameImageSquare
    case 'vertical':
    default:
      return store.frameStyle.frameImage
  }
})

// Compute aspect ratio class based on format
const aspectClass = computed(() => {
  switch (store.orientation) {
    case 'square':
      return 'personaliza-canvas--square'
    case 'horizontal':
      return 'personaliza-canvas--horizontal'
    case 'vertical':
      return 'personaliza-canvas--vertical'
  }
})

// Text style classes
const textStyleClass = computed(() => {
  return `personaliza-canvas--text-${store.textStyle}`
})

// Check if text exists
const hasText = computed(() => {
  return !!(store.title || store.subtitle)
})

// Check if margin color is dark (for text contrast)
const isDarkMargin = computed(() => {
  return store.hasMargin && isColorDark(store.marginColor)
})
const frameLabel = computed(() => store.frameStyle?.name || 'Sin marco')

// Calculate padding multiplier based on orientation (matching malekcustomposter logic)
// This is the base value used for calculating padding percentages
const paddingMultiplierType = computed(() => {
  switch (store.orientation) {
    case 'horizontal':
      return 'width'
    case 'square':
      return 'width-scaled' // width * 1.4
    case 'vertical':
    default:
      return 'height'
  }
})
</script>

<template>
  <div
    :class="[
      'personaliza-canvas',
      aspectClass,
      textStyleClass,
      { 'personaliza-canvas--mobile-panel-open': props.mobilePanelOpen },
      {
        'personaliza-canvas--has-frame': store.frameStyle,
        'personaliza-canvas--has-text': hasText,
        'personaliza-canvas--has-margin': store.hasMargin,
        'personaliza-canvas--dark-margin': isDarkMargin,
        [`personaliza-canvas--padding-${paddingMultiplierType}`]: store.hasMargin
      }
    ]"
    :style="store.hasMargin ? { backgroundColor: store.marginColor } : {}"
  >
    <!-- Frame overlay when selected (ignored in image export) -->
    <div v-if="store.frameStyle && currentFrameImage" class="personaliza-canvas__frame" data-html2canvas-ignore>
      <img
        :src="currentFrameImage"
        :alt="`Marco ${store.frameStyle.name}`"
        class="personaliza-canvas__frame-image"
        crossorigin="anonymous"
      >
    </div>

    <!-- Main canvas content - this is the "pic" equivalent -->
    <div class="personaliza-canvas__content">
      <!-- Image wrapper - contains the actual image -->
      <div class="personaliza-canvas__image-wrapper">
        <!-- Skeleton loading state -->
        <div v-if="isImageLoading" class="personaliza-canvas__skeleton">
          <div class="personaliza-canvas__skeleton-shimmer" />
        </div>

        <!-- Placeholder when no image -->
        <div v-else-if="!store.croppedImageUrl" class="personaliza-canvas__placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <span>Sube una imagen</span>
        </div>

        <!-- Cropped image (blob URL - no crossorigin needed) -->
        <img
          v-else
          :src="store.croppedImageUrl"
          alt="Tu imagen"
          class="personaliza-canvas__image"
        >
      </div>

      <!-- Text container - positioned absolutely in bottom margin area (like malekcustomposter) -->
      <div
        v-if="hasText"
        class="personaliza-canvas__text-container"
      >
        <p v-if="store.title" class="personaliza-canvas__title">
          {{ store.title }}
        </p>
        <p v-if="store.subtitle" class="personaliza-canvas__subtitle">
          {{ store.subtitle }}
        </p>
      </div>
    </div>

    <div class="personaliza-canvas__data" data-html2canvas-ignore>
      <span>{{ store.orientation }}</span> - {{ store.posterSize }} - {{ frameLabel }}
    </div>

  </div>
</template>

<style lang="scss" scoped>
// ==========================================================================
// Padding values matching malekcustomposter
// 5% on top/left/right, 12.143% on bottom when text exists
// ==========================================================================
$padding-side: 5%;
$padding-bottom-with-text: 12.143%;

.personaliza-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px -5px #adadad;
  container-type: size; // Use size for both width and height queries
  transition: transform 0.25s ease, width 0.25s ease;

  &__data {
    position: absolute;
    bottom: calc(0% - $space-10xl);
    left: 50%;
    transform: translateX(-50%);
    font-family: $font-primary;
    font-size: 13px;
    color: #181d27;
    background-color: #fff;
    border: 1px solid #d6d4d4;
    padding: $space-sm $space-2xl;
    border-radius: $space-4xl;
    white-space: nowrap;
    z-index: 20;

    span {
      text-transform: capitalize;
    }
    @include mobile {
      bottom: calc(0% - $space-7xl);
    }
  }

  &--mobile-panel-open {
    @include mobile {
      transform: translateY(-50px);
    }
  }

  &--mobile-panel-open.personaliza-canvas--vertical {
    @include mobile {
      width: 60%;
    }
  }

  // When frame is active, allow overflow and remove shadow
  &--has-frame {
    overflow: visible;
    box-shadow: none;
  }

  // Frame extends outside the canvas
  &__frame {
    position: absolute;
    inset: -21.1%;
    z-index: 10;
    pointer-events: none;
    transform: translate(0.1%, 0.7%);
  }

  &__frame-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  // ==========================================================================
  // Aspect Ratio Variants
  // ==========================================================================

  // Square (1:1)
  &--square {
    aspect-ratio: 1;
    height: min(100cqh, 100cqw);
    width: auto;

    @include mobile {
      height: auto;
      width: 70%;
    }

    .personaliza-canvas__frame {
      inset: -31%;
      transform: translate(0.3%, 0%);    
    }
  }

  // Horizontal (7:5)
  &--horizontal {
    aspect-ratio: 7 / 5;
    width: min(100cqw, calc(100cqh * 7 / 5));
    height: auto;

    @include mobile {
      height: auto;
      width: 90%;
    }

    .personaliza-canvas__frame {
      inset: -40.5%;
      transform: translate(0.3%, 0.8%);
    }
  }

  // Vertical (5:7)
  &--vertical {
    aspect-ratio: 5 / 7;
    height: min(100cqh, calc(100cqw * 7 / 5));
    width: auto;

    @include mobile {
      height: auto;
      width: 68%;
    }
  }

  // ==========================================================================
  // Content Layout - matching malekcustomposter's ".pic" structure
  // ==========================================================================
  &__content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    // Animate padding changes when margin is toggled
    transition: padding 0.3s ease-out;
  }

  // ==========================================================================
  // Margin/Padding System - matching malekcustomposter
  // When margin is enabled:
  // - Without text: 5% uniform padding
  // - With text: 5% top/left/right, 12.143% bottom (text sits in bottom margin)
  // ==========================================================================
  &--has-margin {
    .personaliza-canvas__content {
      // Default: uniform 5% padding when no text
      padding: $padding-side;
    }

    // When text exists, use larger bottom padding
    &.personaliza-canvas--has-text {
      .personaliza-canvas__content {
        padding: $padding-side $padding-side $padding-bottom-with-text $padding-side;
      }
    }
  }

  // ==========================================================================
  // Orientation-specific padding multipliers
  // malekcustomposter uses different base values:
  // - Vertical: height-based
  // - Horizontal: width-based
  // - Square: width * 1.4
  // We approximate this with CSS using cqh/cqw units
  // ==========================================================================

  // For vertical orientation, use height-based calculation
  &--padding-height.personaliza-canvas--has-margin.personaliza-canvas--has-text {
    .personaliza-canvas__content {
      // 12.143% of height for bottom padding
      padding-bottom: calc(100cqh * 0.12143);
    }

    .personaliza-canvas__text-container {
      height: calc(100cqh * 0.12143);
    }
  }

  // For horizontal orientation, use width-based calculation
  &--padding-width.personaliza-canvas--has-margin.personaliza-canvas--has-text {
    .personaliza-canvas__content {
      // 12.143% of width for bottom padding
      padding-bottom: calc(100cqw * 0.12143);
    }

    .personaliza-canvas__text-container {
      height: calc(100cqw * 0.12143);
    }
  }

  // For square orientation, use width * 1.4 calculation
  &--padding-width-scaled.personaliza-canvas--has-margin.personaliza-canvas--has-text {
    .personaliza-canvas__content {
      // 12.143% of (width * 1.4) for bottom padding
      padding-bottom: calc(92cqw * 1.4 * 0.12143);
    }

    .personaliza-canvas__text-container {
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

  &__skeleton {
    width: 100%;
    height: 100%;
    background: #e0e0e0;
    position: relative;
    overflow: hidden;
  }

  &__skeleton-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.6) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  &__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #a0a4ab;
    text-align: center;

    svg {
      opacity: 0.5;
    }

    span {
      font-family: $font-primary;
      font-size: 2.5cqi;
      font-weight: $font-weight-medium;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // ==========================================================================
  // Text Container - positioned absolutely in bottom margin (like malekcustomposter)
  // The text sits within the bottom padding area
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
    // Default height when no orientation-specific override
    height: $padding-bottom-with-text;
    // Animate height changes
    transition: height 0.3s ease-out, padding 0.3s ease-out;
  }

  &__title {
    margin: 0;
    font-size: 3cqi;
    line-height: 1.5;
    letter-spacing: 0.12em;
    color: #1a1a1a;
    text-transform: uppercase;
    white-space: nowrap; // Prevent text wrapping in high-res export
  }

  &__subtitle {
    margin: 0;
    font-size: 2cqi;
    line-height: 2.1em;
    color: #000;
    // Subtitle is ALWAYS Avenir 300 uppercase (matching malekcustomposter)
    font-family: $font-minimal;
    font-weight: $font-weight-light;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    white-space: nowrap; // Prevent text wrapping in high-res export
  }

  // ==========================================================================
  // Dark margin - white text for contrast
  // ==========================================================================
  &--dark-margin {
    .personaliza-canvas__title,
    .personaliza-canvas__subtitle {
      color: #ffffff;
    }
  }

  // ==========================================================================
  // Text without margin - white text on image (like malekcustomposter "Sin Fondo")
  // ==========================================================================
  &:not(.personaliza-canvas--has-margin) {
    .personaliza-canvas__text-container {
      // No extra height/padding when no margin - text floats at bottom of image
      height: auto;
      padding: 5% $padding-side;
    }

    .personaliza-canvas__title,
    .personaliza-canvas__subtitle {
      color: #ffffff;
    }

    // Square orientation - adjusted padding
    &.personaliza-canvas--square {
      .personaliza-canvas__text-container {
        padding-bottom: 3.5%;
      }
    }

    // Horizontal orientation - adjusted padding
    &.personaliza-canvas--horizontal {
      .personaliza-canvas__text-container {
        padding-bottom: 2.5%;
      }
    }
  }

  // ==========================================================================
  // Orientation-specific font sizes (applies with or without margin)
  // ==========================================================================

  // Square orientation - font sizes
  &--square {
    .personaliza-canvas__title {
      font-size: 2.14cqi;
    }

    .personaliza-canvas__subtitle {
      font-size: 1.42cqi;
    }
  }

  // Horizontal orientation - font sizes
  &--horizontal {
    .personaliza-canvas__title {
      font-size: 1.75cqi;
      line-height: 1.75;
    }

    .personaliza-canvas__subtitle {
      font-size: 1.25cqi;
    }
  }

  // ==========================================================================
  // Text Style Variants (only affects title - subtitle is always Avenir 300)
  // ==========================================================================

  // Moderno - DM Sans, font-weight 600
  &--text-moderno {
    .personaliza-canvas__title {
      font-family: $font-primary;
      font-weight: $font-weight-semibold;
    }
  }

  // Clasico - Merriweather, font-weight 400
  &--text-clasico {
    .personaliza-canvas__title {
      font-family: $font-serif;
      font-weight: $font-weight-normal;
    }
  }

  // Minimalista - Avenir, font-weight 300
  &--text-minimalista {
    .personaliza-canvas__title {
      font-family: $font-minimal;
      font-weight: $font-weight-light;
    }
  }

}
</style>
