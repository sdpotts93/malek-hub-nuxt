<script setup lang="ts">
import { getStyleById, ILLUSTRATION_COLORS } from '~/types'

const store = useBirthPosterStore()

// Get CSS filter for a baby's illustration color
const getIllustrationFilter = (baby: typeof store.babies[0]) => {
  const colorConfig = ILLUSTRATION_COLORS.find(c => c.hex === baby.illustrationColor)
  return colorConfig?.filter || 'none'
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

// Format height display (cm to inches)
const formatHeight = (altura: number) => {
  const inches = (altura / 2.54).toFixed(2)
  return `${inches} INCHES`
}

// Format weight display (grams to pounds/ounces)
const formatWeight = (peso: number) => {
  const totalOunces = peso / 28.3495
  const pounds = Math.floor(totalOunces / 16)
  const ounces = Math.round(totalOunces % 16)
  return `${pounds} POUNDS ${ounces} OUNCES`
}

// Format date display
const formatDate = (fecha: Date | string | null) => {
  if (!fecha) return null
  const date = new Date(fecha)
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  const day = date.getDate()
  const year = date.getFullYear()
  const hours = date.getHours()
  const mins = date.getMinutes()
  return `${month} ${day}, ${year} ${hours}:${mins}`
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
  <div :class="['baby-canvas', `baby-canvas--count-${store.babyCount}`]">
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
        >
          <NuxtImg
            v-if="getStyleById(baby.styleId)"
            :src="getStyleById(baby.styleId)!.image"
            :alt="`Baby ${index + 1}`"
            class="baby-canvas__illustration"
            :style="{
              transform: baby.orientation === 'derecha' ? 'scaleX(-1)' : 'none',
              filter: getIllustrationFilter(baby),
            }"
          />
        </div>
      </div>

      <!-- Watermark signature -->
      <div class="baby-canvas__watermark">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4C12 4 8 8 8 14C8 22 14 28 16 28C18 28 24 22 24 14C24 8 20 4 16 4Z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M12 16C12 12 14 10 16 10" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </div>
    </div>

    <!-- Text area - different layouts based on baby count -->
    <div class="baby-canvas__text-area">
      <!-- 1-2 babies: Combined title, stacked data lines -->
      <template v-if="store.babyCount <= 2">
        <p class="baby-canvas__title">
          SCALE 1:1 OF{{ combinedNames ? ' ' + combinedNames.toUpperCase() : '' }}
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
            <p class="baby-canvas__title">
              SCALE 1:1 OF{{ baby.nombre ? ' ' + baby.nombre.toUpperCase() : '' }}
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
    margin: 8.4% 9% 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // ==========================================================================
  // Baby Illustrations Container
  // ==========================================================================
  &__babies {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 10%;    
    gap: 16px;
  }

  &__baby {
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  &__illustration {
    height: 100%;
    width: auto;
    object-fit: contain;
    mix-blend-mode: multiply;
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
      justify-content: space-between;
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
      padding: 10% 0;
    }
    .baby-canvas__baby {
      max-width: 30%;
    }
  }

  // 4 babies layout
  &--count-4 {
    .baby-canvas__babies {
      gap: 16px;
      justify-content: space-evenly;
      padding: 10% 0;

    }
    .baby-canvas__baby {
      max-width: 23%;
    }
  }

  // ==========================================================================
  // Watermark
  // ==========================================================================
  &__watermark {
    position: absolute;
    bottom: 12px;
    right: 12px;

    svg {
      width: 28px;
      height: 28px;
      color: rgba(0, 0, 0, 0.25);
    }
  }

  // ==========================================================================
  // Text Area (11% of poster height)
  // ==========================================================================
  &__text-area {
    flex: 0 0 11%;
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
    line-height: 1.7;
    font-size: 1.3cqi;
  }

  &__data-lines {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__data {
    font-family: $font-secondary;
    font-weight: 400;
    letter-spacing: 0.12em;
    color: #666666;
    margin: 0;
    line-height: 1.7;
    font-size: 1cqi;
  }

  // ==========================================================================
  // Columns (3-4 babies)
  // ==========================================================================
  &__columns {
    display: flex;
    justify-content: center;
    gap: 32px;
  }

  &__column {
    text-align: center;

    .baby-canvas__title {
      font-size: 13px;
      margin-bottom: 6px;
    }

    .baby-canvas__data {
      font-size: 8px;
    }
  }

  // ==========================================================================
  // Horizontal adjustments
  // ==========================================================================
  &--count-3,
  &--count-4 {
    .baby-canvas__illustration-area {
      margin: 2.5% 2.5% 0;
    }

    .baby-canvas__text-area {
      padding: 14px 20px 20px;
    }

    .baby-canvas__watermark {
      bottom: 10px;
      right: 10px;

      svg {
        width: 24px;
        height: 24px;
      }
    }
  }
}
</style>
