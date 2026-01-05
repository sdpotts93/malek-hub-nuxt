<script setup lang="ts">
const store = usePersonalizaStore()

// Get the correct frame image based on orientation
const currentFrameImage = computed(() => {
  if (!store.frameStyle) return null
  // Use horizontal frame for horizontal orientation, vertical for others
  return store.orientation === 'horizontal'
    ? store.frameStyle.frameImageHorizontal
    : store.frameStyle.frameImage
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
</script>

<template>
  <div
    :class="[
      'personaliza-canvas',
      aspectClass,
      textStyleClass,
      { 'personaliza-canvas--has-frame': store.frameStyle }
    ]"
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

    <!-- Main canvas content -->
    <div class="personaliza-canvas__content">
      <!-- Image area with optional margin -->
      <div
        class="personaliza-canvas__image-wrapper"
        :class="{ 'personaliza-canvas__image-wrapper--with-margin': store.hasMargin }"
        :style="store.hasMargin ? { backgroundColor: store.marginColor } : {}"
      >
        <!-- Placeholder when no image -->
        <div v-if="!store.croppedImageUrl" class="personaliza-canvas__placeholder">
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

      <!-- Text area (only shown if title or subtitle exists) -->
      <div
        v-if="store.title || store.subtitle"
        class="personaliza-canvas__text-area"
        :style="store.hasMargin ? { backgroundColor: store.marginColor } : {}"
      >
        <p v-if="store.title" class="personaliza-canvas__title">
          {{ store.title }}
        </p>
        <p v-if="store.subtitle" class="personaliza-canvas__subtitle">
          {{ store.subtitle }}
        </p>
      </div>
    </div>

    <!-- Watermark signature -->
    <div class="personaliza-canvas__watermark">
      <img
        src="/watermark-dark.png"
        alt="Studio Malek"
        class="personaliza-canvas__watermark-img"
        crossorigin="anonymous"
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.personaliza-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 20px -5px #adadad;
  container-type: inline-size;

  // When frame is active, allow overflow and remove shadow
  &--has-frame {
    overflow: visible;
    box-shadow: none;
  }

  // Frame extends outside the canvas
  &__frame {
    position: absolute;
    inset: -21%;
    z-index: 10;
    pointer-events: none;
    transform: translate(3px, 5px);
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
      inset: -30%;
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
      width: 75%;
    }
  }

  // ==========================================================================
  // Content Layout
  // ==========================================================================
  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__image-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;

    &--with-margin {
      padding: 6%;
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
  // Text Area
  // ==========================================================================
  &__text-area {
    flex-shrink: 0;
    text-align: center;
    padding: 3% 6%;
    display: flex;
    flex-direction: column;
    gap: 0.5cqi;
  }

  &__title {
    margin: 0;
    font-size: 3cqi;
    line-height: 1.3;
    color: #1a1a1a;
  }

  &__subtitle {
    margin: 0;
    font-size: 2cqi;
    line-height: 1.3;
    color: #666666;
  }

  // ==========================================================================
  // Text Style Variants
  // ==========================================================================

  // Moderno - clean sans-serif
  &--text-moderno {
    .personaliza-canvas__title {
      font-family: $font-primary;
      font-weight: $font-weight-bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    .personaliza-canvas__subtitle {
      font-family: $font-primary;
      font-weight: $font-weight-normal;
      letter-spacing: 0.1em;
    }
  }

  // Clasico - elegant serif
  &--text-clasico {
    .personaliza-canvas__title {
      font-family: $font-secondary;
      font-weight: $font-weight-semibold;
      font-style: italic;
      letter-spacing: 0.05em;
    }

    .personaliza-canvas__subtitle {
      font-family: $font-secondary;
      font-weight: $font-weight-normal;
      letter-spacing: 0.08em;
    }
  }

  // Minimalista - light and subtle
  &--text-minimalista {
    .personaliza-canvas__title {
      font-family: $font-primary;
      font-weight: $font-weight-light;
      font-size: 2.5cqi;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .personaliza-canvas__subtitle {
      font-family: $font-primary;
      font-weight: $font-weight-light;
      font-size: 1.5cqi;
      letter-spacing: 0.15em;
    }
  }

  // ==========================================================================
  // Watermark
  // ==========================================================================
  &__watermark {
    position: absolute;
    bottom: 2%;
    right: 2%;
    z-index: 5;
  }

  &__watermark-img {
    width: 3cqi;
    height: auto;
    opacity: 0.6;
  }
}
</style>
