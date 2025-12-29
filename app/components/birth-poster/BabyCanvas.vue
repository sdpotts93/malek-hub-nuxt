<script setup lang="ts">
import { getStyleById } from '~/types'

const store = useBirthPosterStore()

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
// For grayscale images with WHITE background (not transparent)
// Black (0) → target color, White (1) → stays white, Gray → tinted
const getColorMatrix = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  // Formula: newColor = gray * (1 - targetColor) + targetColor
  // This is essentially a "screen" blend that colorizes dark areas
  return `
    ${1 - r} 0 0 0 ${r}
    0 ${1 - g} 0 0 ${g}
    0 0 ${1 - b} 0 ${b}
    0 0 0 1 0
  `
}

// Format baby names for title (1-2 babies share header with &)
const combinedNames = computed(() => {
  if (store.babyCount === 1) {
    return store.babies[0]?.nombre || ''
  }
  if (store.babyCount === 2) {
    const name1 = store.babies[0]?.nombre || ''
    const name2 = store.babies[1]?.nombre || ''
    if (name1 && name2) return `${name1} & ${name2}`
    return name1 || name2 || ''
  }
  return ''
})

// Maximum height in the illustration area (in cm)
// The illustration area is 58.75cm on a 70cm poster (1:1 scale)
const MAX_ILLUSTRATION_HEIGHT = 58.75

// Calculate height scale as a percentage based on baby's altura
const getHeightScale = (altura: number): string => {
  const scale = (altura / MAX_ILLUSTRATION_HEIGHT) * 100
  return `${Math.min(scale, 100)}%`
}

// Format height display (in cm)
const formatHeight = (altura: number) => {
  return `${altura} CM`
}

// Format weight display (in grams)
const formatWeight = (peso: number) => {
  return `${peso} GRAMOS`
}

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
const buildDataLine = (baby: typeof store.babies[0]) => {
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
</script>

<template>
  <div :class="['baby-canvas', `baby-canvas--count-${store.babyCount}`, { 'baby-canvas--has-frame': store.frameStyle }]">
    <!-- Frame overlay when selected -->
    <div v-if="store.frameStyle" class="baby-canvas__frame">
      <NuxtImg
        :src="store.frameStyle.frameImage"
        :alt="`Marco ${store.frameStyle.name}`"
        class="baby-canvas__frame-image"
      />
    </div>

    <!-- SVG Filters for colorizing -->
    <svg class="baby-canvas__svg-defs" aria-hidden="true">
      <defs>
        <filter
          v-for="(baby, index) in store.babies"
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
      class="baby-canvas__illustration-area"
      :style="{ backgroundColor: store.backgroundColor }"
    >
      <!-- Baby illustrations -->
      <div class="baby-canvas__babies">
        <div
          v-for="(baby, index) in store.babies"
          :key="index"
          class="baby-canvas__baby"
          :style="{ height: getHeightScale(baby.altura) }"
        >
          <NuxtImg
            v-if="getStyleById(baby.styleId)"
            :src="getStyleById(baby.styleId)!.image"
            :alt="`Baby ${index + 1}`"
            class="baby-canvas__illustration"
            :style="{
              transform: baby.orientation === 'derecha' ? 'scaleX(-1)' : 'none',
              filter: `url(#${getFilterId(index)})`,
            }"
          />
        </div>
      </div>

      <!-- Watermark signature -->
      <div class="baby-canvas__watermark">
        <NuxtImg
          src="/watermark-dark.png"
          alt="Studio Malek"
          class="baby-canvas__watermark-img"
        />
      </div>
    </div>

    <!-- Text area - different layouts based on baby count -->
    <div class="baby-canvas__text-area">
      <!-- 1-2 babies: Combined title, stacked data lines -->
      <template v-if="store.babyCount <= 2">
        <p v-if="store.showScale" class="baby-canvas__title">
          ESCALA 1:1 DE{{ combinedNames ? ' ' + combinedNames.toUpperCase() : '' }}
        </p>
        <p v-else-if="combinedNames" class="baby-canvas__title">
          {{ combinedNames.toUpperCase() }}
        </p>
        <div class="baby-canvas__data-lines">
          <p
            v-for="(baby, index) in store.babies"
            :key="index"
            class="baby-canvas__data"
          >
            {{ buildDataLine(baby) }}
          </p>
        </div>
      </template>

      <!-- 3-4 babies: Individual columns -->
      <template v-else>
        <div class="baby-canvas__columns">
          <div
            v-for="(baby, index) in store.babies"
            :key="index"
            class="baby-canvas__column"
          >
            <p v-if="store.showScale" class="baby-canvas__title">
              ESCALA 1:1 DE{{ baby.nombre ? ' ' + baby.nombre.toUpperCase() : '' }}
            </p>
            <p v-else-if="baby.nombre" class="baby-canvas__title">
              {{ baby.nombre.toUpperCase() }}
            </p>
            <p class="baby-canvas__data">
              {{ buildDataLine(baby) }}
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.baby-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 20px -5px #adadad;
  container-type: inline-size; // Make this element the container for cqi units

  // When frame is active, allow overflow and remove shadow (frame has its own shadow)
  &--has-frame {
    overflow: visible;
    box-shadow: none;
  }

  // Frame wraps AROUND the canvas (extends outside)
  // The frame image has ~6% padding/shadow on each side before the wooden frame
  // and the wooden frame itself is ~3% thick
  // So the inner "window" of the frame is roughly 82% of the total frame image
  // To make the canvas fill that inner window, the frame needs to extend ~11% beyond canvas on each side
  &__frame {
    position: absolute;
    inset: -21%;
    z-index: 10;
    pointer-events: none;
    transform: translate(3px, 4px);
  }

  &__frame-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  // Hidden SVG for filter definitions
  &__svg-defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  // Vertical poster (1-2 babies) - fit within container maintaining 5:7 ratio
  &--count-1,
  &--count-2 {
    aspect-ratio: 5 / 7;
    // Use the smaller of: full container height OR width-based height (to fit width)
    height: min(100cqh, calc(100cqw * 7 / 5));
    width: auto;
  }

  // Horizontal poster (3-4 babies) - fit within container maintaining 7:5 ratio
  &--count-3,
  &--count-4 {
    aspect-ratio: 7 / 5;
    // Use the smaller of: full container width OR height-based width (to fit height)
    width: min(100cqw, calc(100cqh * 7 / 5));
    height: auto;
  }

  // ==========================================================================
  // Illustration Area (takes remaining space after text area)
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
    // Height is set dynamically based on baby's altura (1:1 scale)
    // Default height: 100% is overridden by inline style
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
    .baby-canvas__baby {
      max-width: 65%;
    }
  }

  // 2 babies layout
  &--count-2 {
    .baby-canvas__babies {
      gap: 24px;
      justify-content: space-evenly;
    }
    .baby-canvas__baby {
      max-width: 45%;
    }
  }

  // 3 babies layout
  &--count-3 {
    .baby-canvas__babies {
      gap: 20px;
      justify-content: space-evenly;
    }
    .baby-canvas__baby {
      max-width: 30%;
    }
  }

  // 4 babies layout
  &--count-4 {
    .baby-canvas__babies {
      gap: 25px;
      justify-content: space-evenly;
    }
    .baby-canvas__baby {
      max-width: 20%;
    }
  }

  // ==========================================================================
  // Watermark
  // ==========================================================================
  &__watermark {
    position: absolute;
    bottom: 12px;
    right: 12px;
  }

  &__watermark-img {
    width: 14px;
    height: auto;
  }

  // ==========================================================================
  // Text Area (11% of poster height)
  // ==========================================================================
  &__text-area {
    flex: 0 0 10%;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 5%;
  }

  &__title {
    font-family: $font-secondary;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: #1a1a1a;
    line-height: 2;
    font-size: 2.4cqi;
  }

  &__data-lines {
    display: flex;
    flex-direction: column;
  }

  &__data {
    font-family: $font-secondary;
    font-weight: 400;
    letter-spacing: 0.12em;
    color: #666666;
    margin: 0;
    line-height: 1.7;
    font-size: 1.8cqi;
  }

  // ==========================================================================
  // Columns (3-4 babies)
  // ==========================================================================
  &__columns {
    display: flex;
    justify-content: space-between;
    gap: 32px;
    padding-inline: 7cqi;
  }

  &__column {
    text-align: center;
  }

  &--count-2 {
    .baby-canvas__title {
      font-size: 2cqi;
    }
    .baby-canvas__data {
      font-size: 1.5cqi;
    }
  }

  // ==========================================================================
  // Horizontal adjustments
  // ==========================================================================
  &--count-3,
  &--count-4 {


    .baby-canvas__illustration-area {
      margin: 4% 4% 0;
    }

    .baby-canvas__watermark {
      bottom: 10px;
      right: 10px;
    }

    .baby-canvas__watermark-img {
      width: 24px;
    }
  }

  &--count-3 {
    .baby-canvas__title {
      font-size: 1.4cqi;
    }
    .baby-canvas__data {
      font-size: 1cqi;
    }
  }

  &--count-4 {
    .baby-canvas__title {
      font-size: 1.2cqi;
    }
    .baby-canvas__data {
      font-size: 0.8cqi;
    }
  }

}
</style>
